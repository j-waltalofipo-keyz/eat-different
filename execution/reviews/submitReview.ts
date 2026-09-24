// SOP: architecture/reviews.md. Verified food buyers only; one review per order.
import { db, UNIQUE_VIOLATION } from "../lib/clients";
import { AppError } from "../lib/errors";
import { OrderRowSchema, type OrderRow, type ReviewSubmit } from "../schemas";

export type Candidate = { order: OrderRow; reviewed: boolean };

/** Pure. `rows` = every order with the submitted receipt number. */
export function matchBuyerOrder(rows: Candidate[], email: string): OrderRow {
  const mine = rows
    .filter((r) => r.order.kind === "FOOD" && r.order.status === "PAID")
    .filter((r) => (r.order.buyer_email ?? "").toLowerCase() === email.toLowerCase());
  if (mine.length === 0) {
    throw new AppError("NOT_FOUND", 422, "We couldn't find a paid order with that receipt number and email.");
  }
  const open = mine.filter((r) => !r.reviewed).sort((a, b) => b.order.created_at.localeCompare(a.order.created_at));
  if (open.length === 0) throw new AppError("ALREADY_REVIEWED", 422, "That order already has a review. Thank you!");
  return open[0]!.order;
}

/** IO. Returns the Google review link for every successful reviewer (no gating). */
export async function submitReview(
  input: ReviewSubmit,
  googleReviewUrl: string | null,
): Promise<{ ok: true; googleReviewUrl: string | null }> {
  const { data, error } = await db()
    .from("orders")
    .select("*, reviews(id)")
    .eq("receipt_number", input.receiptNumber);
  if (error) throw new Error(`orders select: ${error.message}`);

  const candidates: Candidate[] = (data ?? []).map((row) => ({
    order: OrderRowSchema.parse(row),
    reviewed: Array.isArray(row.reviews) ? row.reviews.length > 0 : Boolean(row.reviews),
  }));
  const order = matchBuyerOrder(candidates, input.email);

  const { error: insErr } = await db().from("reviews").insert({
    square_order_id: order.square_order_id,
    display_name: input.displayName,
    rating: input.rating,
    body: input.body,
  });
  if (insErr?.code === UNIQUE_VIOLATION) throw new AppError("ALREADY_REVIEWED", 422, "That order already has a review. Thank you!");
  if (insErr) throw new Error(`reviews insert: ${insErr.message}`);
  return { ok: true, googleReviewUrl };
}
