// Navigation — SOP: architecture/square-webhook.md
import { getEnv } from "@/execution/lib/env";
import { respond } from "@/execution/lib/http";
import { completePayment } from "@/execution/orders/completePayment";
import { recordRefund } from "@/execution/orders/recordRefund";
import { alreadyProcessed, markProcessed, parseSquareEvent } from "@/execution/square/squareEvent";
import { verifyWebhook } from "@/execution/square/verifyWebhook";

export async function POST(req: Request) {
  const env = getEnv();
  const rawBody = await req.text();
  const valid = await verifyWebhook({
    rawBody,
    signature: req.headers.get("x-square-hmacsha256-signature"),
    signatureKey: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    notificationUrl: `${env.SITE_URL}/api/webhooks/square`,
  });
  if (!valid) return Response.json({ error: "BAD_SIGNATURE" }, { status: 401 });

  return respond(async () => {
    const event = parseSquareEvent(rawBody);
    if (await alreadyProcessed(event.eventId)) return { result: "duplicate" };

    let result = "ignored";
    if (event.kind === "payment" && event.payment.status === "COMPLETED") {
      result = (await completePayment(event.payment)).result;
    } else if (event.kind === "refund" && event.refund.status === "COMPLETED") {
      result = (await recordRefund(event.refund)).result;
    }

    await markProcessed(event.eventId, event.type); // after success, so failures get retried
    return { result };
  });
}
