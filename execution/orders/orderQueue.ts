// SOP: architecture/order-queue.md. Tonight's paid food orders for the /admin Orders tab (D45).
export { DONE_WINDOW_MS, sortQueue, type QueueOrder };
import { toAlertLines, type AlertLine } from "../email/sendOwnerAlert";
import { DONE_WINDOW_MS, sortQueue, type QueueOrder } from "./queueSort";
import { db, square } from "../lib/clients";
import { getEnv } from "../lib/env";

/** IO. Supabase rows + their line items from Square (one batch call). */
export async function listOrderQueue(now = new Date()): Promise<{ waiting: QueueOrder[]; done: QueueOrder[] }> {
  const since = new Date(now.getTime() - DONE_WINDOW_MS).toISOString();
  const { data, error } = await db()
    .from("orders")
    .select("square_order_id, receipt_number, customer_name, total_cents, status, paid_at, fulfilled_at")
    .eq("kind", "FOOD")
    .or(`and(status.eq.PAID,fulfilled_at.is.null),and(status.eq.PAID,fulfilled_at.gte."${since}"),and(status.eq.REFUNDED,paid_at.gte."${since}")`)
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(`order queue: ${error.message}`);

  const details = new Map<string, { lines: AlertLine[]; note: string | null }>();
  if (data.length) {
    try {
      const res = await square().orders.batchGet({ locationId: getEnv().SQUARE_LOCATION_ID, orderIds: data.map((o) => o.square_order_id) });
      for (const o of res.orders ?? []) if (o.id) details.set(o.id, toAlertLines(o));
    } catch (e) {
      console.error("order queue: Square batchGet failed (cards show totals only)", e);
    }
  }

  return sortQueue(
    data.map((o) => ({
      orderId: o.square_order_id,
      receiptNumber: o.receipt_number,
      customerName: o.customer_name,
      totalCents: o.total_cents,
      status: o.status as "PAID" | "REFUNDED",
      paidAt: o.paid_at as string,
      fulfilledAt: o.fulfilled_at,
      lines: details.get(o.square_order_id)?.lines ?? null,
      note: details.get(o.square_order_id)?.note ?? null,
    })),
    now,
  );
}

/** IO. Website-only Done/Undo — never touches the Square order (completion there is terminal). */
export async function setFulfilled(orderId: string, done: boolean): Promise<void> {
  let q = db().from("orders").update({ fulfilled_at: done ? new Date().toISOString() : null }).eq("square_order_id", orderId).eq("kind", "FOOD").eq("status", "PAID");
  if (done) q = q.is("fulfilled_at", null); // keep the first "done" time on double taps
  const { error } = await q;
  if (error) throw new Error(`set fulfilled: ${error.message}`);
}
