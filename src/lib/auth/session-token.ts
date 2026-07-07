import type { OfficerUser } from "./officer";

export const COOKIE_NAME = "hosxp_session";
export const MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionData = OfficerUser & {
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }
  return "hosxp-dev-secret";
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await importKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(payload: string, signature: string): Promise<boolean> {
  const key = await importKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signature) as BufferSource,
    new TextEncoder().encode(payload),
  );
}

export async function encodeSession(session: SessionData): Promise<string> {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload)}`;
}

export async function decodeSession(token: string): Promise<SessionData | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!(await verify(payload, signature))) return null;

  try {
    const json = new TextDecoder().decode(base64UrlDecode(payload));
    const session = JSON.parse(json) as SessionData;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSessionFromToken(
  token: string | undefined,
): Promise<SessionData | null> {
  if (!token) return null;
  return decodeSession(token);
}
