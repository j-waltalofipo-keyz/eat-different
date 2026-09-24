// SOP: architecture/square-webhook.md → recordRefund. Only full refunds reverse the fund (D18).
import { db, square } from "../lib/clients";
import type { LedgerRow, OrderRow, PaymentFacts } from "../schemas";
import { factsFromSdk } from "./paymentFacts";
import { insertLedger, loadOrder } from "./recordPayment";

/** Pure. `original` is the ORDER/DONATION ledger row for this order, if any. */
export function planRefund(
  order: OrderRow,
  payment: PaymentFacts,
  original: Pick<LedgerRow, "amount_cents"> | null,
): { markRefunded: boolean; ledger: LedgerRow | null } {
  const full = payment.amountCents > 0 && payment.refundedCents >= payment.amountCents;
  if (!full) return { markRefunded: false, ledger: null };
  return {
    markRefunded: order.status !== "REFUNDED",
    ledger: original
      ? { square_order_id: order.square_order_id, reason: "REFUND", amount_cents: -original.amount_cents }
      : null,
  };
}

/** IO. */
export async function recordRefund(refund: {
  paymentId: string;
  orderId: string | null;
}): Promise<{ result: "ignored" | "partial" | "reversed" }> {
  const order = refund.orderId ? await loadOrder(refund.orderId) : null;
  if (!order) return { result: "ignored" };

  const { payment } = await square().payments.get({ paymentId: refund.paymentId });
  if (!payment) throw new Error(`payment ${refund.paymentId} not found`);

  const { data: original, error } = await db()
    .from("fund_ledger")
    .select("amount_cents")
    .eq("square_order_id", order.square_order_id)
    .in("reason", ["ORDER", "DONATION"])
    .maybeSingle();
  if (error) throw new Error(`fund_ledger select: ${error.message}`);

  const plan = planRefund(order, factsFromSdk(payment), original);
  if (!plan.markRefunded && !plan.ledger) return { result: "partial" };
  if (plan.markRefunded) {
    const { error: upErr } = await db()
      .from("orders")
      .update({ status: "REFUNDED" })
      .eq("square_order_id", order.square_order_id);
    if (upErr) throw new Error(`orders update: ${upErr.message}`);
  }
  if (plan.ledger) await insertLedger(plan.ledger);
  return { result: "reversed" };
}
