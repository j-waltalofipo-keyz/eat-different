// SOP: architecture/admin.md → Actions. Every caller must have verified the admin session first.
import { db } from "../lib/clients";
import type { SettingsPatch } from "./settingsForm";

export async function setKitchenOpen(open: boolean): Promise<void> {
  const { error } = await db().from("settings").update({ kitchen_open: open, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) throw new Error(`settings update: ${error.message}`);
}

/** One dashboard card's validated patch (settingsForm.ts). */
export async function updateSettings(patch: SettingsPatch): Promise<void> {
  const { error } = await db().from("settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) throw new Error(`settings update: ${error.message}`);
}

/** Spam/abuse moderation only — deliberately takes no rating (Invariant 7). */
export async function setReviewHidden(id: number, hidden: boolean): Promise<void> {
  const { error } = await db().from("reviews").update({ hidden }).eq("id", id);
  if (error) throw new Error(`reviews update: ${error.message}`);
}

export type AdminReview = { id: number; displayName: string; rating: number; body: string; hidden: boolean; createdAt: string };

export async function listAllReviews(): Promise<AdminReview[]> {
  const { data, error } = await db()
    .from("reviews")
    .select("id, display_name, rating, body, hidden, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`reviews select: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    rating: r.rating,
    body: r.body,
    hidden: r.hidden,
    createdAt: r.created_at,
  }));
}

/** Private to /admin: dollars never leave this page. `waiting` = paid food orders not yet Done (tab badge). */
export async function getAdminStats(): Promise<{ fundTotalCents: number; subscribers: number; waiting: number }> {
  const [fund, subs, waiting] = await Promise.all([
    db().from("fund_total").select("total_cents").single(),
    db().from("notify_signups").select("email", { count: "exact", head: true }).is("unsubscribed_at", null),
    db().from("orders").select("square_order_id", { count: "exact", head: true }).eq("kind", "FOOD").eq("status", "PAID").is("fulfilled_at", null),
  ]);
  if (fund.error) throw new Error(`fund_total: ${fund.error.message}`);
  if (subs.error) throw new Error(`notify_signups count: ${subs.error.message}`);
  if (waiting.error) throw new Error(`orders count: ${waiting.error.message}`);
  return { fundTotalCents: Number(fund.data.total_cents ?? 0), subscribers: subs.count ?? 0, waiting: waiting.count ?? 0 };
}
