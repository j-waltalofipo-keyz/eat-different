// Pure (browser-safe). SOP: architecture/order-queue.md → Which orders. Shared by the server list and the optimistic UI.
import type { AlertLine } from "../email/alertLines";

export type QueueOrder = {
  orderId: string;
  receiptNumber: string | null;
  customerName: string | null;
  totalCents: number;
  status: "PAID" | "REFUNDED";
  paidAt: string;
  fulfilledAt: string | null;
  /** null = Square couldn't be reached; the card says "check Square". */
  lines: AlertLine[] | null;
  note: string | null;
};

/** Done and refunded cards stay visible this long, then drop off. */
export const DONE_WINDOW_MS = 18 * 60 * 60 * 1000;

/** Pure. Waiting: oldest paid first (top = next up). Done: newest done first, then refunded. */
export function sortQueue(orders: QueueOrder[], now: Date): { waiting: QueueOrder[]; done: QueueOrder[] } {
  const since = now.getTime() - DONE_WINDOW_MS;
  const waiting = orders.filter((o) => o.status === "PAID" && !o.fulfilledAt).sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  const done = orders
    .filter((o) => (o.status === "PAID" && o.fulfilledAt && Date.parse(o.fulfilledAt) >= since) || (o.status === "REFUNDED" && Date.parse(o.paidAt) >= since))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "PAID" ? -1 : 1;
      return (b.fulfilledAt ?? b.paidAt).localeCompare(a.fulfilledAt ?? a.paidAt);
    });
  return { waiting, done };
}
