// SOP: architecture/admin.md → Login. Pure helpers; the cookie itself is set in app/admin.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "ed_admin";
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

/** Changing the password changes the key → every existing session stops verifying. */
export function sessionKey(appSecret: string, adminPassword: string): string {
  return createHmac("sha256", appSecret).update(`admin:${adminPassword}`).digest("base64url");
}

const mac = (key: string, value: string) => createHmac("sha256", key).update(value).digest("base64url");

const sameBytes = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(given: string, expected: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest("base64url");
  return expected.length > 0 && sameBytes(digest(given), digest(expected));
}

export function issueSession(nowMs: number, key: string): string {
  const expires = String(nowMs + SESSION_MS);
  return `${expires}.${mac(key, expires)}`;
}

export function verifySession(token: string | undefined, nowMs: number, key: string): boolean {
  const [expires, sig, extra] = (token ?? "").split(".");
  if (!expires || !sig || extra !== undefined || !/^\d+$/.test(expires)) return false;
  return Number(expires) > nowMs && sameBytes(sig, mac(key, expires));
}
