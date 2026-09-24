// SOP: architecture/reviews.md → public list. Never exposes order ids, emails, or receipts.
import { db } from "../lib/clients";

export type PublicReview = { displayName: string; rating: number; body: string; createdAt: string };
export type ReviewSummary = { average: number | null; count: number };

/** Pure. Average to one decimal over non-hidden ratings. */
export function summarize(ratings: number[]): ReviewSummary {
  if (ratings.length === 0) return { average: null, count: 0 };
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { average: Math.round(avg * 10) / 10, count: ratings.length };
}

export async function listReviews(limit = 50): Promise<{ reviews: PublicReview[]; summary: ReviewSummary }> {
  const [list, all] = await Promise.all([
    db()
      .from("reviews")
      .select("display_name, rating, body, created_at")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit),
    db().from("reviews").select("rating").eq("hidden", false),
  ]);
  if (list.error) throw new Error(`reviews select: ${list.error.message}`);
  if (all.error) throw new Error(`reviews select: ${all.error.message}`);
  return {
    reviews: list.data.map((r) => ({ displayName: r.display_name, rating: r.rating, body: r.body, createdAt: r.created_at })),
    summary: summarize(all.data.map((r) => r.rating)),
  };
}
