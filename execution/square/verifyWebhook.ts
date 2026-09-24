// SOP: architecture/square-webhook.md step 1. Delegates to Square's own helper.
import { WebhooksHelper } from "square";

export async function verifyWebhook(a: {
  rawBody: string;
  signature: string | null;
  signatureKey: string | undefined;
  notificationUrl: string;
}): Promise<boolean> {
  if (!a.signature || !a.signatureKey) return false;
  return WebhooksHelper.verifySignature({
    requestBody: a.rawBody,
    signatureHeader: a.signature,
    signatureKey: a.signatureKey,
    notificationUrl: a.notificationUrl,
  });
}
