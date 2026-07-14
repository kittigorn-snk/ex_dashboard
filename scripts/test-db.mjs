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

loadEnv();

const config = {
  host: process.env.HOSXP_HOST ?? "localhost",
  port: Number(process.env.HOSXP_PORT ?? 3306),
  database: process.env.HOSXP_NAME ?? "",
  user: process.env.HOSXP_USER ?? "",
  password: process.env.HOSXP_PASS ?? "",
};

async function main() {
  console.log("=== HosXP Database Test ===");
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log("");

  let conn;
  try {
    conn = await mysql.createConnection(config);
    await conn.query("SELECT 1 AS ok");
    console.log("✓ Connection: OK");

    const queries = [
      ["ผู้ป่วย OPD วันนี้", "SELECT COUNT(*) AS count FROM ovst WHERE vstdate = CURDATE()"],
      ["นัดหมายวันนี้", "SELECT COUNT(*) AS count FROM oapp WHERE nextdate = CURDATE()"],
      ["ผู้ป่วยใน (Admit)", "SELECT COUNT(*) AS count FROM ipt WHERE dchdate IS NULL"],
      ["บุคลากร", "SELECT COUNT(*) AS count FROM officer WHERE officer_active = 'Y'"],
    ];

    console.log("\n--- สถิติปัจจุบัน ---");
    for (const [label, sql] of queries) {
      const [rows] = await conn.query(sql);
      console.log(`${label}: ${Number(rows[0].count).toLocaleString("th-TH")}`);
    }

    const [weekly] = await conn.query(
      `SELECT DATE(vstdate) AS day, COUNT(*) AS count
       FROM ovst
       WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(vstdate)
       ORDER BY day`,
    );
    console.log("\n--- OPD 7 วันล่าสุด ---");
    for (const row of weekly) {
      const day = row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day);
      console.log(`${day}: ${Number(row.count).toLocaleString("th-TH")} ราย`);
    }

    const [recent] = await conn.query(
      `SELECT o.vsttime AS time, o.hn, p.fname, p.lname
       FROM ovst o
       JOIN patient p ON p.hn = o.hn
       WHERE o.vstdate = CURDATE()
       ORDER BY o.vsttime DESC
       LIMIT 5`,
    );
    console.log("\n--- กิจกรรมล่าสุด (5 ราย) ---");
    if (recent.length === 0) {
      console.log("ไม่พบผู้ป่วย OPD วันนี้");
    } else {
      for (const row of recent) {
        console.log(`${row.time} — HN ${row.hn} ${row.fname} ${row.lname}`);
      }
    }
  } catch (err) {
    console.error("✗ Connection failed:", err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
