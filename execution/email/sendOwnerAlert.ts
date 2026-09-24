// SOP: architecture/owner-alert-email.md. Sent once per payment (caller checks firstTime).
import { mailer, square } from "../lib/clients";
import { getEnv } from "../lib/env";
import { escapeHtml } from "../lib/html";
import { formatUsd } from "../lib/money";
import type { OrderRow, PaymentFacts } from "../schemas";

export const FROM = "Eat. Different. <onboarding@resend.dev>";

export type AlertLine = { qty: number; name: string; modifiers: { qty: number; name: string }[] };
export type OwnerAlertInput =
  | {
      kind: "FOOD";
      receiptNumber: string | null;
      totalCents: number;
      tipCents: number;
      customerName: string | null;
      lines: AlertLine[];
      note: string | null;
    }
  | { kind: "DONATION"; receiptNumber: string | null; amountCents: number };

export type Email = { subject: string; text: string; html: string };

/** Pure. */
export function buildOwnerAlertEmail(i: OwnerAlertInput): Email {
  if (i.kind === "DONATION") {
    const text = `Someone chipped in ${formatUsd(i.amountCents)} toward the E.D. truck. Receipt #${i.receiptNumber ?? "—"}.`;
    return {
      subject: `🚚 Truck fund donation: ${formatUsd(i.amountCents)}`,
      text,
      html: `<p>${escapeHtml(text)}</p>`,
    };
  }

  const lineText = i.lines.map((l) =>
    [`${l.qty} × ${l.name}`, ...l.modifiers.map((m) => `    + ${m.qty > 1 ? `${m.qty}× ` : ""}${m.name}`)].join("\n"),
  );
  const tip = i.tipCents > 0 ? ` (includes ${formatUsd(i.tipCents)} tip)` : "";
  const text = [
    `Customer: ${i.customerName ?? "—"}`,
    `Total: ${formatUsd(i.totalCents)}${tip}`,
    "",
    ...lineText,
    ...(i.note ? ["", `Note: ${i.note}`] : []),
    "",
    "Open Square → Orders to mark it complete when it's picked up.",
  ].join("\n");
  const html = [
    `<p><strong>Customer:</strong> ${escapeHtml(i.customerName ?? "—")}<br>`,
    `<strong>Total:</strong> ${escapeHtml(formatUsd(i.totalCents) + tip)}</p>`,
    "<ul>",
    ...i.lines.map(
      (l) =>
        `<li>${l.qty} × ${escapeHtml(l.name)}${l.modifiers
          .map((m) => `<br>&nbsp;&nbsp;+ ${m.qty > 1 ? `${m.qty}× ` : ""}${escapeHtml(m.name)}`)
          .join("")}</li>`,
    ),
    "</ul>",
    i.note ? `<p><strong>Note:</strong> ${escapeHtml(i.note)}</p>` : "",
    "<p>Open Square → Orders to mark it complete when it's picked up.</p>",
  ].join("");
  return { subject: `🔥 New order #${i.receiptNumber ?? "—"}: ${formatUsd(i.totalCents)}`, text, html };
}

/** IO. Food line items come from Square (what was actually paid for). */
export async function sendOwnerAlert(order: OrderRow, payment: PaymentFacts): Promise<void> {
  let input: OwnerAlertInput;
  if (order.kind === "DONATION") {
    input = { kind: "DONATION", receiptNumber: payment.receiptNumber, amountCents: payment.amountCents };
  } else {
    const { order: sq } = await square().orders.get({ orderId: order.square_order_id });
    input = {
      kind: "FOOD",
      receiptNumber: payment.receiptNumber,
      totalCents: payment.totalCents,
      tipCents: payment.tipCents,
      customerName: order.customer_name,
      note: sq?.fulfillments?.[0]?.pickupDetails?.note ?? null,
      lines: (sq?.lineItems ?? []).map((l) => ({
        qty: Number(l.quantity),
        name: l.name ?? "Item",
        modifiers: (l.modifiers ?? []).map((m) => ({ qty: Number(m.quantity ?? 1), name: m.name ?? "Option" })),
      })),
    };
  }
  const email = buildOwnerAlertEmail(input);
  const { error } = await mailer().emails.send({ from: FROM, to: getEnv().OWNER_EMAIL, ...email });
  if (error) throw new Error(`owner alert: ${error.name}: ${error.message}`);
}
