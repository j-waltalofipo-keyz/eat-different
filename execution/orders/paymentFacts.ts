// Normalizes a payment from webhook JSON (snake_case, number cents) or the SDK (camelCase, bigint).
import type { Square } from "square";
import { z } from "zod";
import { toCents } from "../lib/money";
import type { PaymentFacts } from "../schemas";

const money = z.object({ amount: z.number() }).nullish();

const WebhookPayment = z.object({
  id: z.string(),
  order_id: z.string().nullish(),
  status: z.string(),
  receipt_number: z.string().nullish(),
  buyer_email_address: z.string().nullish(),
  amount_money: money,
  tip_money: money,
  total_money: money,
  refunded_money: money,
});

export function factsFromWebhook(payment: unknown): PaymentFacts {
  const p = WebhookPayment.parse(payment);
  return {
    id: p.id,
    orderId: p.order_id ?? null,
    status: p.status,
    receiptNumber: p.receipt_number ?? null,
    buyerEmail: p.buyer_email_address?.trim().toLowerCase() || null,
    amountCents: p.amount_money?.amount ?? 0,
    tipCents: p.tip_money?.amount ?? 0,
    totalCents: p.total_money?.amount ?? 0,
    refundedCents: p.refunded_money?.amount ?? 0,
  };
}

/** Pure. Hosted checkout stores the buyer's email on the PICKUP recipient, not the payment. */
export function recipientEmail(order: Square.Order | undefined): string | null {
  const pickup = order?.fulfillments?.find((f) => f.type === "PICKUP");
  return pickup?.pickupDetails?.recipient?.emailAddress?.trim().toLowerCase() || null;
}

export function factsFromSdk(p: Square.Payment): PaymentFacts {
  return {
    id: p.id ?? "",
    orderId: p.orderId ?? null,
    status: p.status ?? "",
    receiptNumber: p.receiptNumber ?? null,
    buyerEmail: p.buyerEmailAddress?.trim().toLowerCase() || null,
    amountCents: toCents(p.amountMoney),
    tipCents: toCents(p.tipMoney),
    totalCents: toCents(p.totalMoney),
    refundedCents: toCents(p.refundedMoney),
  };
}
