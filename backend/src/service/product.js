const {sql} = require("../db");
const {v4: uuidv4} = require("uuid");
const {removeFiles} = require("../helpers/util");
const CustomError = require("../model/CustomError");
const fs = require("fs/promises");
const path = require("path");
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

exports.upsertProduct = async ({payload}) => {
    const [savedProduct] = await sql`
        insert into products ${sql(payload)} on conflict(id)
        do
        update set ${sql(payload)}
            returning *`;
    return savedProduct;
};

exports.reduceStock = async ({productId}) => {
    const [updatedProduct] = await sql`
        UPDATE products
        SET available_stock = available_stock - 1,
            updated_at      = NOW()
        WHERE id = ${productId}
          AND available_stock > 0 RETURNING *;
    `;
    return updatedProduct; // will be undefined if stock was 0
};

exports.save = async ({payload, files}) => {
    const newProduct = {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        userId: payload.userId,
    };
    if (payload.id) {
        newProduct.id = payload.id;
        newProduct.updatedAt = new Date().toISOString();
    } else {
        newProduct.uuid = uuidv4();
        newProduct.createdAt = new Date().toISOString();
    }
    const savedProduct = await exports.upsertProduct({payload: newProduct});

    const productIdentities = JSON.parse(payload.productIdentities || "[]");

    let identitiesToInsert = [];
    let identitiesToUpdate = [];
    let insertedIdentities = [];
    let updatedIdentities = [];

    if (productIdentities?.length > 0) {
        productIdentities.forEach((identity) => {
            const newIdentity = {
                identityNo: identity.identityNo,
                identityType: identity.identityType,
                productId: savedProduct.id,
                uuid: uuidv4(),
                isAvailable: true,
            };
            if (identity.id) {
                newIdentity.id = identity.id;
                newIdentity.updatedAt = new Date().toISOString();
                identitiesToUpdate.push(newIdentity);
            } else {
                newIdentity.createdAt = new Date().toISOString();
                identitiesToInsert.push(newIdentity);
            }
        });
        identitiesToUpdate = identitiesToUpdate.map((p) => [
            p.id,
            p.identityNo,
            p.identityType,
            p.updatedAt,
        ]);
    }
    if (identitiesToInsert?.length > 0) {
        try {
            insertedIdentities = await sql`
                insert into product_identities ${sql(identitiesToInsert)} returning *`;
        } catch (err) {
            if (err.code === "23505") {
                throw new CustomError("Serial already used!", 409);
            }
        }

        // Update products.available_stock by adding the count of newly inserted identities
        await sql`
            UPDATE products
            SET "available_stock" = "available_stock" + ${identitiesToInsert.length}
            WHERE id = ${savedProduct.id};
        `;
    }
    if (identitiesToUpdate?.length > 0) {
        updatedIdentities = await sql`
            update product_identities
            set identity_no   = update_data.identity_no,
                identity_type = (update_data.identity_type)::int,
    updated_at = (update_data.updated_at)::timestamp
            from (
                values ${sql(identitiesToUpdate)}
                ) as update_data (id, identity_no, identity_type, updated_at)
            where product_identities.id = (update_data.id):: int
                returning product_identities.*;
        `;
    }
    const savedProductIdentities = insertedIdentities.concat(updatedIdentities);

    let newProductImages = [];
    if (files.productImages?.length > 0) {
        newProductImages = files.productImages.map((image, index) => ({
            filename: image.filename,
            sortOrder: index + 1,
            productId: savedProduct.id,
        }));
        const savedProductImages = await sql`
            insert
            into product_images
                ${sql(newProductImages)} returning * `;
    }

    let newProductCertificates = [];
    if (files.productCertificates?.length > 0) {
        newProductCertificates = files.productCertificates.map((certificate) => ({
            filename: certificate.filename,
            fileType: 10,
            productId: savedProduct.id,
        }));
    }
    let newProductManuals = [];
    if (files.productManuals?.length > 0) {
        newProductManuals = files.productManuals.map((manual) => ({
            filename: manual.filename,
            fileType: 11,
            productId: savedProduct.id,
        }));
    }
    const newProductFiles = newProductCertificates.concat(newProductManuals);
    if (newProductFiles.length > 0) {
        const savedProductFiles = await sql`
            insert
            into product_files
                ${sql(newProductFiles)} returning * `;
    }
    const filesToRemove = JSON.parse(payload.removeFiles || "{}");

    if (filesToRemove.productImages?.length > 0) {
        const deletedImages = await sql`
            delete
            from product_images
            where id in ${sql(filesToRemove.productImages.map((i) => i.id))} returning *`;
        await removeFiles(filesToRemove.productImages.map((i) => i.filename));
    }
    if (filesToRemove.productFiles?.length > 0) {
        const deletedFiles = await sql`
            delete
            from product_files
            where id in ${sql(filesToRemove.productFiles.map((i) => i.id))} returning *`;
        await removeFiles(filesToRemove.productFiles.map((i) => i.filename));
    }

    return {savedProduct, savedProductIdentities};
};

exports.getProductsByUserId = async ({
                                         payload: {offset, limit, fetchTotalCount, userId},
                                     }) => {
    const offsetValue = offset || 0; // Default offset
    const limitValue = limit || 10; // Default limit
    fetchTotalCount = fetchTotalCount || true;

    // @formatter:off
  const result = await sql`
    SELECT
      p.*,
      p.id AS p_id,    
      p.created_at AS created_at,
      json_agg(
        json_build_object(
            'id', pi.id,
            'identity_type', pi.identity_type,
            'identity_no', pi.identity_no,
            'uuid', pi.uuid
        )
      ) FILTER (WHERE pi.id IS NOT NULL) as product_identities
    FROM
      products p
        LEFT JOIN product_identities pi ON p.id = pi.product_id
    WHERE
      p.user_id = ${userId}
    GROUP BY
      p.id
    ORDER BY
      p.id DESC
      LIMIT ${limitValue}
    OFFSET ${offsetValue}`;

  if (!fetchTotalCount) return { list: result };

  const [count] = await sql`
        SELECT COUNT(DISTINCT p.id) AS total
        FROM
          products p
                LEFT JOIN product_identities pi ON p.id = pi.product_id
        WHERE
          p.user_id = ${userId}
    `;
  // @formatter:on
    return {list: result, totalCount: count.total || 0};
};

exports.getProductOnly = async ({payload: {productId}}) => {
    const [result] = await sql`
        SELECT *
        FROM products p
        WHERE p.id = ${productId}
    `;
    // @formatter:on

    return result;
};
exports.getProduct = async ({payload: {productId}}) => {
    // @formatter:off
  const [result] = await sql`
    SELECT p.*,
           p.id                          AS p_id,
           p.created_at                  AS created_at,
           (SELECT json_agg(json_build_object(
               'id', pi.id,
               'identity_type', pi.identity_type,
               'identity_no', pi.identity_no,
               'uuid', pi.uuid
                            ))
            FROM product_identities pi
            WHERE pi.product_id = p.id)  AS product_identities,
           (SELECT json_agg(json_build_object(
               'id', pf.id,
               'file_type', pf.file_type,
               'filename', pf.filename
                            ))
            FROM product_files pf
            WHERE pf.product_id = p.id)  AS product_files,
           (SELECT json_agg(json_build_object(
               'id', pim.id,
               'sort_order', pim.sort_order,
               'filename', pim.filename
                            ))
            FROM product_images pim
            WHERE pim.product_id = p.id) AS product_images
    FROM products p
    WHERE p.id = ${productId}
  `;
  // @formatter:on

    return result;
};

exports.removeProduct = async ({payload: {productId}}) => {
    // @formatter:off
    const existingProduct = await exports.getProduct({ payload: { productId } });
    const [result] = await sql`
        DELETE 
        FROM products p
            WHERE p.id = ${productId} returning *
    `;
    // @formatter:on
    let filesToRemove = [];
    if (existingProduct.productFiles?.length > 0) {
        filesToRemove = filesToRemove.concat(existingProduct.productFiles);
    }
    if (existingProduct.productImages?.length > 0) {
        filesToRemove = filesToRemove.concat(existingProduct.productImages);
    }
    if (filesToRemove.length > 0) {
        await removeFiles(filesToRemove);
    }

    // delete qr code images
    await fs.rm(path.join(PUBLIC_DIR, "qr", String(productId)), {
        recursive: true,
        force: true,
    });

    return result;
};

exports.getProductIdentities = async ({payload: {ids}}) => {
    const result = await sql`
        SELECT *
        FROM product_identities
        WHERE identity_no = ANY (${ids})`;
    return result;
};

exports.getPublicProduct = async ({payload: {productId, uuid}}) => {
    // @formatter:off
  const condProductId = productId ? sql` p.id = ${productId}` : sql``;
  const condUuid = uuid ? sql` uuid = ${uuid}` : sql``;

  const cond =
    productId && uuid
      ? sql` where ${condProductId} and ${condUuid}`
      : productId
        ? sql` where ${condProductId}`
        : uuid
          ? sql` where ${condUuid}`
          : sql``;

  const [result] = await sql`
    SELECT p.*,
           p.id                          AS id,
           p.created_at                  AS created_at,
           (SELECT json_agg(json_build_object(
               'id', pf.id,
               'file_type', pf.file_type,
               'filename', pf.filename
                            ))
            FROM product_files pf
            WHERE pf.product_id = p.id AND file_type = 11)  AS files,
           (SELECT json_agg(json_build_object(
               'id', pim.id,
               'sort_order', pim.sort_order,
               'filename', pim.filename
                            ))
            FROM product_images pim
            WHERE pim.product_id = p.id) AS images
    FROM products p
    ${cond}
  `;
  // @formatter:on

    return result;
};

exports.saveWarranty = async ({payload: {newWarranty}}) => {
    if (newWarranty.id) {
        newWarranty.updatedAt = new Date().toISOString();
    } else {
        newWarranty.createdAt = new Date().toISOString();
    }
    const [savedWarranty] = await sql`
        insert into product_warranties ${sql(newWarranty)} on conflict(id)
        do
        update set ${sql(newWarranty, [
            "warrantyStartDate",
            "warrantyExpirationDate",
            "authenticityConfirmation",
            "warrantyConditions",
            "voidConditions",
            "supportContact",
            "usageAdvice",
        ])}
            returning *`;
    return {savedWarranty};
};

exports.getProductIdentity = async ({payload: {identityNo}}) => {
    const [result] = await sql`
        SELECT *
        FROM product_identities
        where identity_no = ${identityNo}
    `;

    return result;
};

exports.getWarranty = async ({payload: {productIdentitiesId}}) => {
    const [result] = await sql`
        SELECT *
        FROM product_warranties
        WHERE product_identities_id = ${productIdentitiesId}
    `;
    return result;
};

exports.getWarrantyWIdentity = async ({
                                          payload: {productIdentitiesId, identityNo, uuid},
                                      }) => {
    const condArr = [];
    // @formatter:off
      const condProductIdentitiesId = productIdentitiesId
        ? condArr.push(sql`pi.id = ${productIdentitiesId}`)
        : null;
      const condIdentityNo = identityNo
        ? condArr.push(sql`pi.identity_no = ${identityNo}`)
        : null;
      const condUuid = uuid ? condArr.push(sql`pi.uuid = ${uuid}`) : null;

      let cond = sql``;
      if (condArr.length > 0) {
        cond = sql` WHERE ${condArr[0]}`;
        for (let i = 1; i < condArr.length; i++) {
          cond = sql` ${cond} AND ${condArr[i]}`;
        }
      }

      const [result] = await sql`
        SELECT *
                FROM product_warranties pw join product_identities pi 
                  on pw.product_identities_id = pi.id
                ${cond}
      `;
      // @formatter:on

    return result;
};

exports.getProductWIdentity = async ({
                                         payload: {productId, productIdentitiesId, uuid},
                                     }) => {
    // @formatter:off
  const condProductIdentitiesId = productIdentitiesId
    ? sql` pi.id =
    ${productIdentitiesId}`
    : sql``;
  const condUuid = uuid
    ? sql` pi.uuid =
    ${uuid}`
    : sql``;

  const condProductIdentity =
    productIdentitiesId && uuid
      ? sql` WHERE
      ${condProductIdentitiesId}
      AND
      ${condUuid}`
      : productIdentitiesId
        ? sql` WHERE
        ${condProductIdentitiesId}`
        : uuid
          ? sql` WHERE ${condUuid}`
          : sql``;

  const condProductId = productId
    ? sql` WHERE p.id =
    ${productId}`
    : sql``;

  const [result] = await sql`
    SELECT p.*,
           p.id                          AS p_id,
           p.created_at                  AS created_at,
           (SELECT json_build_object(
               'id', pi.id,
               'identity_type', pi.identity_type,
               'identity_no', pi.identity_no,
               'uuid', pi.uuid
                            )
            FROM product_identities pi
            ${condProductIdentity})  AS product_identity,
           (SELECT json_agg(json_build_object(
               'id', pf.id,
               'file_type', pf.file_type,
               'filename', pf.filename
                            ))
            FROM product_files pf
            WHERE pf.product_id = p.id)  AS files,
           (SELECT json_agg(json_build_object(
               'id', pim.id,
               'sort_order', pim.sort_order,
               'filename', pim.filename
                            ))
            FROM product_images pim
            WHERE pim.product_id = p.id) AS images
    FROM products p
    ${condProductId}
  `;
  // @formatter:on

    return result;
};

exports.saveScan = async ({payload: {newScan}}) => {
    const [savedScan] = await sql`
        insert into qr_code_scans ${sql(newScan)} on conflict(id)
        do
        update set ${sql(newScan)}
            returning *`;

    return savedScan;
};