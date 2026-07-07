import crypto from "crypto";

/** HosXP stores web passwords as MD5 in opduser.passweb (typically uppercase) */
export function hashMd5Password(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex").toUpperCase();
}

export function verifyMd5Password(
  password: string,
  storedHash: string | null | undefined,
): boolean {
  if (!storedHash) return false;
  return hashMd5Password(password) === storedHash.toUpperCase();
}