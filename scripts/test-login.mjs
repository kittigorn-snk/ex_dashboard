import fs from "fs";
import path from "path";
import crypto from "crypto";
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

function hashMd5(password) {
  return crypto.createHash("md5").update(password).digest("hex").toUpperCase();
}

loadEnv();

const loginName = process.argv[2] ?? "man";
const password = process.argv[3] ?? "Man2123@";

const config = {
  host: process.env.HOSXP_HOST ?? "localhost",
  port: Number(process.env.HOSXP_PORT ?? 3306),
  database: process.env.HOSXP_NAME ?? "",
  user: process.env.HOSXP_USER ?? "",
  password: process.env.HOSXP_PASS ?? "",
};

const conn = await mysql.createConnection(config);
const [rows] = await conn.query(
  `SELECT officer_id, officer_login_name, officer_login_password_md5,
          officer_login_password, officer_active, officer_name,
          officer_fname, officer_lname
   FROM officer
   WHERE officer_login_name = ?
   LIMIT 1`,
  [loginName],
);

const user = rows[0];
if (!user) {
  console.log(`User "${loginName}": NOT FOUND`);
  await conn.end();
  process.exit(1);
}

const md5Match =
  user.officer_login_password_md5 &&
  hashMd5(password) === String(user.officer_login_password_md5).toUpperCase();
const plainMatch =
  user.officer_login_password && password === user.officer_login_password;

console.log(`User "${loginName}": FOUND (active=${user.officer_active}, id=${user.officer_id})`);
console.log(
  "Display name:",
  user.officer_name?.trim() ||
    [user.officer_fname, user.officer_lname].filter(Boolean).join(" ") ||
    loginName,
);
console.log("MD5 password match:", md5Match ? "YES" : "NO");
console.log("Plain password match:", plainMatch ? "YES" : "NO");
console.log("Login allowed:", user.officer_active === "Y" && md5Match ? "YES" : "NO");

await conn.end();
process.exit(user.officer_active === "Y" && md5Match ? 0 : 1);
