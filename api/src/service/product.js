const { sql } = require("../db");
const { v4: uuidv4 } = require("uuid");

exports.save = async ({ payload, files }) => {
  console.log(1, payload, files);
  const newProduct = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    userId: payload.userId,
    uuid: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  if (payload.id) {
    newProduct.updatedAt = new Date().toISOString();
  } else {
  }
  const [savedProduct] = await sql`
        insert into products ${sql(newProduct)} on conflict(id)
        do
        update set ${sql(newProduct)} returning *`;

  const productIdentities = JSON.parse(payload.productIdentities || "[]");

  let newProductIdentities = [];
  let savedProductIdentities = [];
  if (productIdentities?.length > 0) {
    newProductIdentities = productIdentities.map((identity) => ({
      identityNo: identity.identityNo,
      identityType: identity.identityType,
      productId: savedProduct.id,
      createdAt: new Date().toISOString(),
    }));
    savedProductIdentities = await sql`
            insert into product_identities ${sql(newProductIdentities)} returning *`;
  }

  let newProductImages = [];
  if (files.productImages?.length > 0) {
    newProductImages = files.productImages.map((image, index) => ({
      filename: image.filename,
      sortOrder: index + 1,
      productId: savedProduct.id,
    }));
    const savedProductImages = await sql`
            insert into product_images ${sql(newProductImages)} returning *`;
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
            insert into product_files ${sql(newProductFiles)} returning *`;
  }

  return { savedProduct, savedProductIdentities };
};

exports.getProductsByUserId = async ({
  query: { offset, limit, fetchTotalCount, userId },
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
            'pi_id', pi.id,
            'identity_type', pi.identity_type,
            'identity_no', pi.identity_no
        )
      ) as product_identities
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
