import { cookies } from "next/headers";

import type { OfficerUser } from "./officer";
import {
  COOKIE_NAME,
  decodeSession,
  encodeSession,
  MAX_AGE_SECONDS,
  type SessionData,
} from "./session-token";

export type { SessionData } from "./session-token";
export { COOKIE_NAME } from "./session-token";

export async function createSession(user: OfficerUser): Promise<void> {
  const session: SessionData = {
    ...user,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, await encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
