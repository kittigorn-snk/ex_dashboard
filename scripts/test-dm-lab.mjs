import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolvePcu(tmbpart) {
  switch (tmbpart) {
    case "01":
      return "11249";
    case "02":
      return "07463";
    case "03":
      return "07464";
    case "04":
      return "07465";
    case "05":
      return "07466";
    default:
      return "out_area";
  }
}

function isNull(v) {
  return (
    v == null ||
    String(v).trim().toLowerCase() === "" ||
    String(v).trim().toLowerCase() === "null"
  );
}

function day90Bucket(v) {
  if (isNull(v)) return "null";
  const u = String(v).trim().toUpperCase();
  if (u === "Y") return "within90";
  if (u === "N") return "over90";
  return "null";
}

loadEnv();

// Inline minimal SQL (count + day90 + demographics) for smoke test
const sql = `
SELECT
  cm.hn,
  CONCAT(IFNULL(p.pname,''), IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS pt_name,
  p.tmbpart,
  (SELECT COUNT(lh.order_date)
   FROM lab_order lo
   LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
   LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
   WHERE lh.hn = cm.hn AND li.provis_labcode = 0531601
     AND lh.order_date BETWEEN '2025-10-01' AND '2026-09-30'
     AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
  ) AS hba1c_exam_count,
  (SELECT CASE
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0531601
          AND lh.order_date BETWEEN '2025-10-01' AND '2026-09-30'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN ('193','198','233','368')
          AND lh.order_date BETWEEN '2025-10-01' AND '2026-09-30'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) <= 90 THEN 'Y'
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0531601
          AND lh.order_date BETWEEN '2025-10-01' AND '2026-09-30'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN ('193','198','233','368')
          AND lh.order_date BETWEEN '2025-10-01' AND '2026-09-30'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) > 90 THEN 'N'
     ELSE 'Null'
   END) AS hba1c_day90
FROM clinicmember cm
LEFT JOIN patient p ON p.hn = cm.hn
WHERE p.chwpart = '64' AND p.amppart = '08'
  AND cm.clinic_member_status_id NOT IN (2,4,5,6,7,8,9,10,11)
  AND cm.clinic = '001' AND p.death = 'N'
  AND cm.begin_year BETWEEN '0000' AND '2568'
GROUP BY cm.clinicmember_id
`;

const conn = await mysql.createConnection({
  host: process.env.HOSXP_HOST,
  port: Number(process.env.HOSXP_PORT),
  database: process.env.HOSXP_NAME,
  user: process.env.HOSXP_USER,
  password: process.env.HOSXP_PASS,
  charset: "utf8mb4",
});

console.log("=== DM LAB SNK Extended ===");
const start = Date.now();
const [rows] = await conn.query(sql);
await conn.end();

const total = rows.length;
const hba1cGe2 = rows.filter((r) => Number(r.hba1c_exam_count) >= 2).length;
const within90 = rows.filter((r) => day90Bucket(r.hba1c_day90) === "within90").length;
const over90 = rows.filter((r) => day90Bucket(r.hba1c_day90) === "over90").length;
const null90 = rows.filter((r) => day90Bucket(r.hba1c_day90) === "null").length;
const pcuCount = {};
for (const r of rows) {
  const p = resolvePcu(r.tmbpart);
  pcuCount[p] = (pcuCount[p] || 0) + 1;
}

console.log(`Query time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
console.log(`Total: ${total}`);
console.log(`KPI HbA1c ≥2: ${((hba1cGe2 / total) * 100).toFixed(1)}% (target 80%)`);
console.log(`KPI HbA1c ≤90d: ${((within90 / total) * 100).toFixed(1)}% (target 70%)`);
console.log(`day90: null=${null90}, ≤90=${within90}, ≥90=${over90}`);
console.log("PCU counts:", pcuCount);
console.log("Sample name:", rows[0]?.pt_name);
