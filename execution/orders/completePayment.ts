// SOP: architecture/square-webhook.md. Shared by the webhook and the confirmation page.
import { sendOwnerAlert } from "../email/sendOwnerAlert";
import type { PaymentFacts } from "../schemas";
import { getSettings } from "../settings";
import { recordPayment } from "./recordPayment";

export async function completePayment(payment: PaymentFacts) {
  const rec = await recordPayment(payment, await getSettings());
  if (rec.firstTime && rec.order) {
    try {
      await sendOwnerAlert(rec.order, payment);
    } catch (e) {
      console.error("owner alert failed (payment is recorded):", e);
    }
  }
  return rec;
}
