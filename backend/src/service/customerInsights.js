const { sql } = require("../db");

exports.getQrCodes = async ({
  payload: { fetchTotalCount = false, offset = 0, limit = 20, userId },
}) => {
  const items = await sql`
    SELECT *
    from customer_qr_codes
    where user_id = ${userId}
    order by id desc limit ${limit}
    offset ${offset}`;

  if (fetchTotalCount) {
    const [result] = await sql`
      select count(id)
      from customer_qr_codes
      where user_id = ${userId}`;
    return { items, total: result.count };
  }

  return { items };
};

exports.saveQrCode = async ({ payload }) => {
  const [savedQrCode] = await sql`
    insert into customer_qr_codes ${sql(payload)} on conflict(id)
        do
    update set ${sql(payload)}
      returning *`;

  return savedQrCode;
};

exports.getStats = async ({ userId }) => {
  //@formatter:off
  const [result] = await sql`
    SELECT
      -- Total purchases (only paid)
      SUM(DISTINCT pur.purchased_price) FILTER (WHERE pur.payment_status = 1) AS total_purchase,

    -- Active warranties (linked to purchased identity, and not expired)
      COUNT(DISTINCT w.id) FILTER (
        WHERE pur.payment_status = 1
            AND w.warranty_expiration_date >= CURRENT_DATE
        )                                                                   AS active_warranties,

    -- Total QR codes created by user
        (SELECT COUNT(*) FROM customer_qr_codes WHERE user_id = $1)             AS total_qr,

      -- Total QR code scans on purchased product identities
      (SELECT COUNT(*)
       FROM qr_code_scans s
              JOIN purchases p ON p.product_identities_id = s.product_identities_id
       WHERE p.user_id = ${userId}
         AND p.payment_status = 1)                                            AS total_scans

    FROM purchases pur
           LEFT JOIN product_warranties w
                     ON w.product_identities_id = pur.product_identities_id
    WHERE pur.user_id = ${userId};
  `;
  //@formatter:on
  return result;
};

exports.getRecentPurchases = async ({
  payload: { fetchTotalCount = false, offset = 0, limit = 20, userId },
}) => {
  const iems = await sql`
    SELECT p.id                      AS product_id,
           p.name                    AS product_name,
           pi.identity_no            AS identity_no,
           pi.uuid                   AS uuid,
           pur.purchased_price       AS purchased_price,
           pur.purchase_date         AS purchase_date,
           pur.product_identities_id AS product_identities_id,
           CASE
             WHEN w.warranty_expiration_date >= CURRENT_DATE THEN 1
             WHEN w.warranty_expiration_date < CURRENT_DATE THEN 0
             ELSE 2
             END                     AS warranty_status
    FROM purchases pur
           JOIN products p ON p.id = pur.product_id
           JOIN product_identities pi ON pi.id = pur.product_identities_id
           LEFT JOIN product_warranties w ON w.product_identities_id = pur.product_identities_id
    WHERE pur.user_id = ${userId}
    ORDER BY pur.purchase_date DESC
      LIMIT ${limit}
    OFFSET ${offset};
  `;
  if (fetchTotalCount) {
    const [result] = await sql`
      SELECT COUNT(p.id)
      FROM purchases pur
             JOIN products p ON p.id = pur.product_id
      WHERE pur.user_id = ${userId};
    `;
    return { items, total: result.count };
  }
  return { items };
};
