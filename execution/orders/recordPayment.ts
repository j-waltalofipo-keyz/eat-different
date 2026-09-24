// SOP: architecture/square-webhook.md → recordPayment. Idempotent.
import { db, square, UNIQUE_VIOLATION } from "../lib/clients";
import { OrderRowSchema, type LedgerRow, type OrderRow, type PaymentFacts, type Settings } from "../schemas";
import { recipientEmail } from "./paymentFacts";

export type PaymentPlan = {
  orderUpdate: Partial<OrderRow> | null;
  ledger: LedgerRow | null;
};

/** Pure. */
export function planPaymentRecord(
  order: OrderRow,
  payment: PaymentFacts,
  settings: Pick<Settings, "fund_per_order_cents">,
  nowIso: string,
): PaymentPlan {
  if (payment.status !== "COMPLETED") return { orderUpdate: null, ledger: null };
  const orderUpdate =
    order.status === "PENDING"
      ? {
          status: "PAID" as const,
          square_payment_id: payment.id,
          receipt_number: payment.receiptNumber,
          buyer_email: payment.buyerEmail,
          paid_at: nowIso,
        }
      : order.status === "PAID" && !order.buyer_email && payment.buyerEmail
        ? { buyer_email: payment.buyerEmail } // repair rows recorded before the email fallback
        : null;
  if (order.status === "REFUNDED") return { orderUpdate: null, ledger: null };
  const ledger: LedgerRow =
    order.kind === "FOOD"
      ? { square_order_id: order.square_order_id, reason: "ORDER", amount_cents: settings.fund_per_order_cents }
      : { square_order_id: order.square_order_id, reason: "DONATION", amount_cents: payment.amountCents };
  return { orderUpdate, ledger };
}

export async function loadOrder(squareOrderId: string): Promise<OrderRow | null> {
  const { data, error } = await db().from("orders").select("*").eq("square_order_id", squareOrderId).maybeSingle();
  if (error) throw new Error(`orders select: ${error.message}`);
  return data ? OrderRowSchema.parse(data) : null;
}

/** Inserts a ledger row; returns false if it was already there (replay). */
export async function insertLedger(row: LedgerRow): Promise<boolean> {
  const { error } = await db().from("fund_ledger").insert(row);
  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`fund_ledger insert: ${error.message}`);
}

/** IO. `firstTime` is true only the first time this payment is credited to the fund. */
export async function recordPayment(
  payment: PaymentFacts,
  settings: Pick<Settings, "fund_per_order_cents">,
): Promise<{ result: "ignored" | "recorded"; firstTime: boolean; order: OrderRow | null }> {
  const order = payment.orderId ? await loadOrder(payment.orderId) : null;
  if (!order) return { result: "ignored", firstTime: false, order: null }; // not a website order (D15)

  if (!payment.buyerEmail && order.kind === "FOOD") {
    const { order: sq } = await square().orders.get({ orderId: order.square_order_id });
    payment = { ...payment, buyerEmail: recipientEmail(sq) };
  }

  const plan = planPaymentRecord(order, payment, settings, new Date().toISOString());
  if (plan.orderUpdate) {
    const { error } = await db()
      .from("orders")
      .update(plan.orderUpdate)
      .eq("square_order_id", order.square_order_id)
      .eq("status", order.status); // only if nobody changed it meanwhile
    if (error) throw new Error(`orders update: ${error.message}`);
  }
  const firstTime = plan.ledger ? await insertLedger(plan.ledger) : false;
  return { result: "recorded", firstTime, order: { ...order, ...plan.orderUpdate } };
}
