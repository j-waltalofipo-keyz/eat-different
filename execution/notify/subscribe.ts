// SOP: architecture/notify-list.md.
import { db } from "../lib/clients";
import { getEnv } from "../lib/env";
import { AppError } from "../lib/errors";
import { sign, verifySig } from "../lib/token";

export async function subscribe(email: string): Promise<{ ok: true }> {
  const { error } = await db()
    .from("notify_signups")
    .upsert({ email, unsubscribed_at: null }, { onConflict: "email" });
  if (error) throw new Error(`notify_signups upsert: ${error.message}`);
  return { ok: true };
}

/** Pure given the secret. */
export function unsubscribeUrl(email: string, siteUrl: string, secret: string): string {
  const q = new URLSearchParams({ e: email, s: sign(email, secret) });
  return `${siteUrl}/api/notify/unsubscribe?${q}`;
}

export async function unsubscribe(email: string, sig: string): Promise<{ ok: true }> {
  if (!email || !sig || !verifySig(email, sig, getEnv().APP_SECRET)) {
    throw new AppError("BAD_LINK", 400, "That unsubscribe link isn't valid.");
  }
  const { error } = await db()
    .from("notify_signups")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email);
  if (error) throw new Error(`notify_signups update: ${error.message}`);
  return { ok: true };
}
