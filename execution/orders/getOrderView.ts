// SOP: architecture/square-webhook.md → getOrderView. Guards the pickup address (Invariant 3).
import { db, square } from "../lib/clients";
import { hashToken } from "../lib/token";
import { OrderRowSchema, type OrderRow, type Settings } from "../schemas";
import { getSettings } from "../settings";
import { completePayment } from "./completePayment";
import { factsFromSdk } from "./paymentFacts";

export type OrderView = {
  status: OrderRow["status"];
  kind: OrderRow["kind"];
  totalCents: number;
  customerName: string | null;
  receiptNumber: string | null;
  pickup: { address: string | null; instructions: string | null } | null;
};

/** Pure. Pickup details only for a PAID food order. */
export function toOrderView(
  order: OrderRow,
  settings: Pick<Settings, "pickup_address" | "pickup_instructions"> | null,
): OrderView {
  const showPickup = order.status === "PAID" && order.kind === "FOOD" && settings !== null;
  return {
    status: order.status,
    kind: order.kind,
    totalCents: order.total_cents,
    customerName: order.customer_name,
    receiptNumber: order.receipt_number,
    pickup: showPickup ? { address: settings.pickup_address, instructions: settings.pickup_instructions } : null,
  };
}

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** IO. Returns null for unknown/malformed tokens. Self-heals a late webhook by asking Square. */
export async function getOrderView(token: string): Promise<OrderView | null> {
  if (!TOKEN.test(token)) return null;
  const { data, error } = await db().from("orders").select("*").eq("view_token_hash", hashToken(token)).maybeSingle();
  if (error) throw new Error(`orders select: ${error.message}`);
  if (!data) return null;
  let order = OrderRowSchema.parse(data);

  if (order.status === "PENDING") {
    const { order: sq } = await square().orders.get({ orderId: order.square_order_id });
    const paymentId = sq?.tenders?.find((t) => t.paymentId)?.paymentId;
    if (paymentId) {
      const { payment } = await square().payments.get({ paymentId });
      if (payment?.status === "COMPLETED") {
        const rec = await completePayment(factsFromSdk(payment));
        if (rec.order) order = rec.order;
      }
    }
  }

  const needsSettings = order.status === "PAID" && order.kind === "FOOD";
  return toOrderView(order, needsSettings ? await getSettings() : null);
}
