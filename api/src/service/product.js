const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");
const unzipper = require("unzipper");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const QRCode = require("qrcode");
const archiver = require("archiver");
const { PassThrough } = require("stream");
const {
  removeFiles,
  VUE_BASE_URL,
  generateImportedFileName,
} = require("../helpers/util");
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

exports.upsertProduct = async ({ payload }) => {
  const cols4Update = Object.keys(payload).filter((key) => key !== "id");
  const [savedProduct] = await sql`
    insert into products ${sql(payload)} on conflict(id)
        do
    update set ${sql(payload, cols4Update)}
      returning *`;
  return savedProduct;
};

exports.reduceStock = async ({ productId }) => {
  const [updatedProduct] = await sql`
    UPDATE products
    SET available_stock = available_stock - 1,
        updated_at      = NOW()
    WHERE id = ${productId}
      AND available_stock > 0 RETURNING *;
  `;
  return updatedProduct; // will be undefined if stock was 0
};

exports.save = async ({ payload, files }) => {
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
  const [savedProduct] = await exports.upsertProduct({ payload: newProduct });

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
    insertedIdentities = await sql`
      insert into product_identities ${sql(identitiesToInsert)} returning *`;

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

  return { savedProduct, savedProductIdentities };
};

exports.getProductsByUserId = async ({
  payload: { offset, limit, fetchTotalCount, userId },
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
  return { list: result, totalCount: count.total || 0 };
};

exports.getProductOnly = async ({ payload: { productId } }) => {
  const [result] = await sql`
    SELECT *
    FROM products p
    WHERE p.id = ${productId}
  `;
  // @formatter:on

  return result;
};
exports.getProduct = async ({ payload: { productId } }) => {
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

exports.removeProduct = async ({ payload: { productId } }) => {
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
  return result;
};

exports.getPublicProduct = async ({ payload: { productId, uuid } }) => {
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

exports.saveWarranty = async ({ payload: { newWarranty } }) => {
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
  return { savedWarranty };
};

exports.getProductIdentity = async ({ payload: { identityNo } }) => {
  const [result] = await sql`
    SELECT *
    FROM product_identities
    where identity_no = ${identityNo}
  `;

  return result;
};

exports.getWarranty = async ({
  payload: { productIdentitiesId, identityNo, uuid },
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
  payload: { productId, productIdentitiesId, uuid },
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
            WHERE pf.product_id = p.id)  AS product_files,
           (SELECT json_agg(json_build_object(
               'id', pim.id,
               'sort_order', pim.sort_order,
               'filename', pim.filename
                            ))
            FROM product_images pim
            WHERE pim.product_id = p.id) AS product_images
    FROM products p
    ${condProductId}
  `;
  // @formatter:on

  return result;
};

exports.saveScan = async ({ payload: { newScan } }) => {
  const [savedScan] = await sql`
    insert into qr_code_scans ${sql(newScan)} on conflict(id)
        do
    update set ${sql(newScan)}
      returning *`;

  return savedScan;
};

exports.bulkImport = async ({ zipFile, userId }) => {
  const currTime = Date.now();
  const extractTo = path.join(PUBLIC_DIR, "tmp", uuidv4());
  await fs.mkdir(extractTo, { recursive: true });

  // Extract ZIP
  await fsSync
    .createReadStream(zipFile.path)
    .pipe(unzipper.Extract({ path: extractTo }))
    .promise();

  // Copy files and annotate each file with foldersrc
  const folderPrefixMap = {
    "product-images": "productImages",
    "product-certificates": "productCertificates",
    "product-manuals": "productManuals",
  };

  for (const [folderName, prefix] of Object.entries(folderPrefixMap)) {
    const source = path.join(extractTo, folderName);
    const target = path.join(PUBLIC_DIR, folderName);

    try {
      const files = await fs.readdir(source);

      for (const [index, file] of files.entries()) {
        const src = path.join(source, file);
        const ext = path.extname(file);
        const baseFilename = path.basename(file, ext);

        const newFileName = generateImportedFileName({
          prefix,
          currTime,
          userId,
          baseFilename,
          ext,
        });
        const dest = path.join(target, newFileName);

        await fs.copyFile(src, dest);
      }
    } catch {
      // Folder doesn't exist, skip silently
    }
  }

  // Parse products.xlsx
  const sheetPath = path.join(extractTo, "products.xlsx");
  const workbook = xlsx.readFile(sheetPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const now = new Date().toISOString();
  const productValues = [];
  const identityValues = [];
  const imageValues = [];
  const fileValues = [];

  for (const row of rows) {
    const {
      name,
      description,
      price,
      identities,
      images,
      manuals,
      certificates,
    } = row;

    const identityList = (identities || "")
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    if (identityList.length === 0) continue; // skip products with no identity numbers

    // Check which identityNos already exist
    const existingRows = await sql`
      SELECT identity_no
      FROM product_identities
      WHERE identity_no = ANY (${identityList})`;

    const existingIdentityNos = new Set(
      existingRows.map((r) => r.identityNo).filter(Boolean),
    );
    const newIdentityNos = identityList.filter(
      (id) => !existingIdentityNos.has(id),
    );

    if (newIdentityNos.length === 0) {
      continue; // All identities exist → skip this product
    }

    // At least one identity is new → insert product
    const productUuid = uuidv4();

    productValues.push({
      uuid: productUuid,
      name,
      description,
      price: parseFloat(price || 0),
      userId,
      createdAt: now,
      availableStock: newIdentityNos.length,
    });

    // Prepare new identity inserts only
    newIdentityNos.forEach((identity) => {
      identityValues.push({
        uuid: uuidv4(),
        identityNo: identity,
        identityType: 10,
        isAvailable: true,
        createdAt: now,
        productUuid,
      });
    });

    // Images
    (images || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .forEach((filename, i) => {
        imageValues.push({
          filename: generateImportedFileName({
            prefix: "productImages",
            currTime,
            userId,
            baseFilename: filename,
          }),
          sortOrder: i + 1,
          productUuid,
        });
      });

    // Certificates
    (certificates || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .forEach((filename, i) => {
        fileValues.push({
          filename: generateImportedFileName({
            prefix: "productCertificates",
            currTime,
            userId,
            baseFilename: filename,
          }),
          fileType: 10,
          productUuid,
        });
      });

    // Manuals
    (manuals || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .forEach((filename, i) => {
        fileValues.push({
          filename: generateImportedFileName({
            prefix: "productManuals",
            currTime,
            userId,
            baseFilename: filename,
          }),
          fileType: 11,
          productUuid,
        });
      });
  }

  // Bulk insert products
  const savedProducts =
    productValues.length > 0
      ? await exports.upsertProduct({ payload: productValues })
      : [];

  const uuidToId = Object.fromEntries(savedProducts.map((p) => [p.uuid, p.id]));

  // Insert identities
  const identitiesFinal = identityValues.map((i) => ({
    uuid: i.uuid,
    identityNo: i.identityNo,
    identityType: i.identityType,
    isAvailable: i.isAvailable,
    createdAt: i.createdAt,
    productId: uuidToId[i.productUuid],
  }));

  if (identitiesFinal.length > 0) {
    await sql`insert into product_identities ${sql(identitiesFinal)}`;
  }

  // Insert images
  const imagesFinal = imageValues.map((i) => ({
    filename: i.filename,
    sortOrder: i.sortOrder,
    productId: uuidToId[i.productUuid],
  }));

  if (imagesFinal.length > 0) {
    await sql`insert into product_images ${sql(imagesFinal)}`;
  }

  // Insert product files
  const filesFinal = fileValues.map((f) => ({
    filename: f.filename,
    fileType: f.fileType,
    productId: uuidToId[f.productUuid],
  }));

  if (filesFinal.length > 0) {
    await sql`insert into product_files ${sql(filesFinal)}`;
  }

  // Cleanup
  await fs.rm(extractTo, { recursive: true, force: true });
  await fs.unlink(zipFile.path);

  return { productCount: savedProducts.length };
};

exports.bulkExport = async ({ userId }) => {
  const products = await sql`
    SELECT p.id,
           p.uuid,
           p.name,
           p.description,
           p.price,
           COALESCE(array_agg(distinct pi.filename) FILTER(WHERE pi.filename IS NOT NULL), '{}')                        AS images,
           COALESCE(array_agg(distinct pf.filename || '|' || pf.file_type) FILTER(WHERE pf.filename IS NOT NULL), '{}') AS files,
           COALESCE(array_agg(distinct id.identity_no || '::' || id.id) FILTER(WHERE id.id IS NOT NULL), '{}')          AS identities
    FROM products p
           LEFT JOIN product_images pi ON pi.product_id = p.id
           LEFT JOIN product_files pf ON pf.product_id = p.id
           LEFT JOIN product_identities id ON id.product_id = p.id
    WHERE p.user_id = ${userId}
    GROUP BY p.id;`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.columns = [
    { header: "ID", key: "id", width: 25 },
    { header: "Name", key: "name", width: 25 },
    { header: "Description", key: "description", width: 40 },
    { header: "Price", key: "price", width: 10 },
    { header: "Product QR", key: "product_qr", width: 20 },
    { header: "Serial", key: "serial", width: 20 },
    { header: "Identity QR", key: "identity_qr", width: 20 },
    { header: "Images", key: "images", width: 30 },
    { header: "Manuals", key: "manuals", width: 30 },
    { header: "Certificates", key: "certificates", width: 30 },
  ];

  const fileCollection = {
    "product-images": new Set(),
    "product-manuals": new Set(),
    "product-certificates": new Set(),
  };

  for (const p of products) {
    const imageList = p.images || [];
    const fileList = p.files || [];

    const manuals = fileList
      .filter((f) => f.endsWith("|11"))
      .map((f) => f.split("|")[0]);

    const certificates = fileList
      .filter((f) => f.endsWith("|10"))
      .map((f) => f.split("|")[0]);

    imageList.forEach((img) => fileCollection["product-images"].add(img));
    manuals.forEach((m) => fileCollection["product-manuals"].add(m));
    certificates.forEach((c) => fileCollection["product-certificates"].add(c));

    const productQrUrl = `${VUE_BASE_URL}/products/${p.id}?uuid=${p.uuid}&scanned=1`;
    const productQrDataUrl = await QRCode.toDataURL(productQrUrl);
    const productQrId = workbook.addImage({
      base64: productQrDataUrl.replace(/^data:image\/png;base64,/, ""),
      extension: "png",
    });

    const productRow = sheet.addRow({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      images: imageList.join(", "),
      manuals: manuals.join(", "),
      certificates: certificates.join(", "),
    });

    sheet.addImage(productQrId, {
      tl: { col: 4, row: productRow.number - 1 },
      ext: { width: 100, height: 100 },
    });
    sheet.getRow(productRow.number).height = 80;

    for (const identityRaw of p.identities || []) {
      const [serial, identityId] = identityRaw.split("::");
      const identityQrUrl = `${VUE_BASE_URL}/products/${p.id}/${identityId}?uuid=${p.uuid}&scanned=1`;
      const identityQrDataUrl = await QRCode.toDataURL(identityQrUrl);
      const identityQrId = workbook.addImage({
        base64: identityQrDataUrl.replace(/^data:image\/png;base64,/, ""),
        extension: "png",
      });

      const row = sheet.addRow({ serial });
      sheet.addImage(identityQrId, {
        tl: { col: 6, row: row.number - 1 },
        ext: { width: 100, height: 100 },
      });
      sheet.getRow(row.number).height = 80;
    }
  }

  // Save workbook to temp buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  // Create ZIP
  const archiveStream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(archiveStream);

  // Add Excel to ZIP
  archive.append(excelBuffer, { name: "products.xlsx" });

  // Add files to subfolders
  for (const [folder, files] of Object.entries(fileCollection)) {
    for (const filename of files) {
      const filePath = path.join(PUBLIC_DIR, folder, filename);
      if (fsSync.existsSync(filePath)) {
        archive.file(filePath, { name: `${folder}/${filename}` });
      }
    }
  }

  await archive.finalize();

  return archiveStream;
};