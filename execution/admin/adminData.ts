// SOP: architecture/admin.md → Actions. Every caller must have verified the admin session first.
import { z } from "zod";
import { db } from "../lib/clients";

const text = z.string().trim().max(500).transform((s) => s || null);

export const SettingsUpdateSchema = z
  .object({
    fund_per_order_cents: z.number().int().min(0),
    fund_goal_cents: z.number().int().positive(),
    donation_min_cents: z.number().int().min(100),
    donation_max_cents: z.number().int().positive(),
    donation_presets_cents: z.array(z.number().int()).max(6),
    pickup_address: text,
    pickup_instructions: text,
    google_review_url: z
      .string()
      .trim()
      .transform((s) => s || null)
      .refine((s) => s === null || /^https:\/\/\S+$/.test(s), "must be an https link"),
  })
  .refine((s) => s.donation_min_cents <= s.donation_max_cents, { path: ["donation_max_cents"], message: "max must be ≥ min" })
  .refine((s) => s.donation_presets_cents.every((p) => p >= s.donation_min_cents && p <= s.donation_max_cents), {
    path: ["donation_presets_cents"],
    message: "presets must be within min..max",
  });
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

export async function setKitchenOpen(open: boolean): Promise<void> {
  const { error } = await db().from("settings").update({ kitchen_open: open, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) throw new Error(`settings update: ${error.message}`);
}

export async function updateSettings(patch: SettingsUpdate): Promise<void> {
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

/** Private to /admin: dollars never leave this page. */
export async function getAdminStats(): Promise<{ fundTotalCents: number; subscribers: number }> {
  const [fund, subs] = await Promise.all([
    db().from("fund_total").select("total_cents").single(),
    db().from("notify_signups").select("email", { count: "exact", head: true }).is("unsubscribed_at", null),
  ]);
  if (fund.error) throw new Error(`fund_total: ${fund.error.message}`);
  if (subs.error) throw new Error(`notify_signups count: ${subs.error.message}`);
  return { fundTotalCents: Number(fund.data.total_cents ?? 0), subscribers: subs.count ?? 0 };
}
