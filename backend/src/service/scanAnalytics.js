const { sql } = require("../db");

// Pass the userId as an argument
exports.getTotalScanCount = async ({ userId }) => {
  const [result] = await sql`
    SELECT COUNT(qcs.id)                                            AS total,
           COUNT(CASE WHEN qcs.scan_type = 'model' THEN qcs.id END) AS model,
           COUNT(CASE WHEN qcs.scan_type = 'unit' THEN qcs.id END)  AS unit
    FROM qr_code_scans qcs
           JOIN products p ON qcs.product_id = p.id -- Now a simple JOIN is sufficient
    WHERE p.user_id = ${userId}
    -- AND qcs.scanned_at BETWEEN :startDate AND :endDate; -- Keep your date range filter if needed
  `;
  return result;
};

exports.getMonthlyScanCount = async ({ userId }) => {
  const result = await sql`
    SELECT
      -- Format as "Mon 'YY" for chart labels (e.g., "Jul '24")
      TO_CHAR(gs.month_start, 'Mon ''YY') AS scan_month,
      -- Keep the actual date for internal ordering consistency
      gs.month_start AS month_start_date,
      -- Count model scans for the specific user, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} AND qcs.scan_type = 'model' THEN 1 ELSE 0 END), 0) AS model,
      -- Count unit scans for the specific user, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} AND qcs.scan_type = 'unit' THEN 1 ELSE 0 END), 0) AS unit,
      -- Count total scans for the specific user, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} THEN 1 ELSE 0 END), 0) AS total
    FROM
      -- Generate a series of month start dates for the last 12 months
      GENERATE_SERIES(
        DATE_TRUNC('month', NOW() - INTERVAL '11 months'), -- Start 11 months ago
        DATE_TRUNC('month', NOW()),                         -- End at the beginning of the current month
        INTERVAL '1 month'
      ) AS gs(month_start)
        LEFT JOIN
      qr_code_scans qcs ON DATE_TRUNC('month', qcs.scanned_at) = gs.month_start
        LEFT JOIN
      products p ON qcs.product_id = p.id
    GROUP BY
      gs.month_start -- Group by the generated month start date
    ORDER BY
      gs.month_start ASC; -- Order chronologically
  `;
  return result;
};

exports.getDailyScanCount = async ({ userId }) => {
  const result = await sql`
    SELECT
      gs.hour_of_day AS scan_hour, -- The hour (0-23)
      -- Count model scans for the specific user AND current date, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} AND DATE(qcs.scanned_at) = CURRENT_DATE AND qcs.scan_type = 'model' THEN 1 ELSE 0 END), 0) AS model,
      -- Count unit scans for the specific user AND current date, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} AND DATE(qcs.scanned_at) = CURRENT_DATE AND qcs.scan_type = 'unit' THEN 1 ELSE 0 END), 0) AS unit,
      -- Count total scans for the specific user AND current date, COALESCE to 0
      COALESCE(SUM(CASE WHEN p.user_id = ${userId} AND DATE(qcs.scanned_at) = CURRENT_DATE THEN 1 ELSE 0 END), 0) AS total
    FROM
      -- Generate a series of numbers from 0 to 23 (representing hours of the day)
      GENERATE_SERIES(0, 23) AS gs(hour_of_day)
        LEFT JOIN
      qr_code_scans qcs ON EXTRACT(HOUR FROM qcs.scanned_at) = gs.hour_of_day
        LEFT JOIN
      products p ON qcs.product_id = p.id
    GROUP BY
      gs.hour_of_day
    ORDER BY
      gs.hour_of_day ASC; -- Order from 0 to 23
  `;
  return result;
};

exports.getScanByLocation = async ({ userId }) => {
  // userId parameter is crucial for filtering
  const result = await sql`
    SELECT jsonb_extract_path_text(qcs.location, 'country')         AS country,
           jsonb_extract_path_text(qcs.location, 'city')            AS city,
           -- GROUPING() function helps identify the aggregation level
           -- Returns 1 for country totals (where city is NULL), 0 for city-level rows
           GROUPING(jsonb_extract_path_text(qcs.location, 'city'))  AS is_country_total,
           COUNT(CASE WHEN qcs.scan_type = 'model' THEN qcs.id END) AS model,
           COUNT(CASE WHEN qcs.scan_type = 'unit' THEN qcs.id END)  AS unit,
           COUNT(qcs.id)                                            AS total
    FROM qr_code_scans qcs -- Alias for qr_code_scans
           JOIN products p ON qcs.product_id = p.id -- Join products table to filter by owner
    WHERE p.user_id = ${userId}                                        -- Filter scans by the owner of the associated product
      AND jsonb_extract_path_text(qcs.location, 'country') IS NOT NULL -- Only include scans where country data is available
--    AND qcs.scanned_at BETWEEN :startDate AND :endDate -- Optional: Add your date range filter here
    GROUP BY GROUPING SETS ( (jsonb_extract_path_text(qcs.location, 'country'),
                              jsonb_extract_path_text(qcs.location, 'city')),   -- Group by Country and City
                             (jsonb_extract_path_text(qcs.location, 'country')) -- Also group by Country only (for country totals)
      )
    ORDER BY country ASC,
             is_country_total
                     ASC, -- This sorts country totals (is_country_total=1) before city details (is_country_total=0)
             total
                     DESC; -- Sorts cities/countries by their total scan count
  `;
  return result;
};
