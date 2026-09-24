// SOP: architecture/square-webhook.md steps 2–4. Event parsing + exactly-once bookkeeping.
import { z } from "zod";
import { db, UNIQUE_VIOLATION } from "../lib/clients";
import { factsFromWebhook } from "../orders/paymentFacts";
import type { PaymentFacts } from "../schemas";

const EventSchema = z.object({
  event_id: z.string(),
  type: z.string(),
  data: z.object({ object: z.record(z.string(), z.unknown()).nullish() }).nullish(),
});

const RefundSchema = z.object({
  id: z.string(),
  status: z.string(),
  payment_id: z.string(),
  order_id: z.string().nullish(),
});

export type SquareEvent =
  | { eventId: string; type: string; kind: "payment"; payment: PaymentFacts }
  | { eventId: string; type: string; kind: "refund"; refund: { status: string; paymentId: string; orderId: string | null } }
  | { eventId: string; type: string; kind: "other" };

/** Pure. */
export function parseSquareEvent(raw: string): SquareEvent {
  const e = EventSchema.parse(JSON.parse(raw));
  const object = e.data?.object ?? {};
  if (e.type.startsWith("payment.") && object.payment) {
    return { eventId: e.event_id, type: e.type, kind: "payment", payment: factsFromWebhook(object.payment) };
  }
  if (e.type.startsWith("refund.") && object.refund) {
    const r = RefundSchema.parse(object.refund);
    return {
      eventId: e.event_id,
      type: e.type,
      kind: "refund",
      refund: { status: r.status, paymentId: r.payment_id, orderId: r.order_id ?? null },
    };
  }
  return { eventId: e.event_id, type: e.type, kind: "other" };
}

export async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await db().from("webhook_events").select("event_id").eq("event_id", eventId).maybeSingle();
  if (error) throw new Error(`webhook_events select: ${error.message}`);
  return data !== null;
}

export async function markProcessed(eventId: string, type: string): Promise<void> {
  const { error } = await db().from("webhook_events").insert({ event_id: eventId, type });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(`webhook_events insert: ${error.message}`);
}
