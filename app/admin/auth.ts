// Navigation — SOP: architecture/admin.md → Login. Session check used by every admin page/action.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionKey, verifySession } from "@/execution/admin/session";
import { getEnv } from "@/execution/lib/env";

/** null when ADMIN_PASSWORD isn't set (login disabled). */
export function adminKey(): string | null {
  const env = getEnv();
  return env.ADMIN_PASSWORD ? sessionKey(env.APP_SECRET, env.ADMIN_PASSWORD) : null;
}

export async function isAdmin(): Promise<boolean> {
  // Read the cookie FIRST: it marks the page dynamic even when login is disabled, so a
  // build-time redirect can never be baked into a static /admin (lesson 2026-09-23).
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const key = adminKey();
  return key !== null && verifySession(token, Date.now(), key);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
