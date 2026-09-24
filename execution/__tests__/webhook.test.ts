import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { recipientEmail } from "../orders/paymentFacts";
import { parseSquareEvent } from "../square/squareEvent";
import { verifyWebhook } from "../square/verifyWebhook";

const KEY = "test-signature-key";
const URL = "https://eat-different.vercel.app/api/webhooks/square";
const BODY = JSON.stringify({ event_id: "E1", type: "payment.updated", data: { object: {} } });
// Square's documented scheme: base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody))
const sig = (body: string, url = URL, key = KEY) => createHmac("sha256", key).update(url + body).digest("base64");

describe("verifyWebhook", () => {
  it("accepts a correctly signed body", async () => {
    expect(await verifyWebhook({ rawBody: BODY, signature: sig(BODY), signatureKey: KEY, notificationUrl: URL })).toBe(true);
  });
  it("rejects tampered body, wrong URL, wrong key, missing header or key", async () => {
    const good = sig(BODY);
    expect(await verifyWebhook({ rawBody: BODY + " ", signature: good, signatureKey: KEY, notificationUrl: URL })).toBe(false);
    expect(await verifyWebhook({ rawBody: BODY, signature: good, signatureKey: KEY, notificationUrl: URL + "/" })).toBe(false);
    expect(await verifyWebhook({ rawBody: BODY, signature: good, signatureKey: "other", notificationUrl: URL })).toBe(false);
    expect(await verifyWebhook({ rawBody: BODY, signature: null, signatureKey: KEY, notificationUrl: URL })).toBe(false);
    expect(await verifyWebhook({ rawBody: BODY, signature: good, signatureKey: undefined, notificationUrl: URL })).toBe(false);
  });
});

describe("parseSquareEvent", () => {
  it("normalizes a payment (snake_case, lower-cased email)", () => {
    const e = parseSquareEvent(
      JSON.stringify({
        event_id: "E2",
        type: "payment.updated",
        data: {
          object: {
            payment: {
              id: "PAY",
              order_id: "ORD",
              status: "COMPLETED",
              receipt_number: "Ab12",
              buyer_email_address: " Tay@Example.com ",
              amount_money: { amount: 2000, currency: "USD" },
              tip_money: { amount: 300, currency: "USD" },
              total_money: { amount: 2300, currency: "USD" },
            },
          },
        },
      }),
    );
    expect(e).toEqual({
      eventId: "E2",
      type: "payment.updated",
      kind: "payment",
      payment: {
        id: "PAY",
        orderId: "ORD",
        status: "COMPLETED",
        receiptNumber: "Ab12",
        buyerEmail: "tay@example.com",
        amountCents: 2000,
        tipCents: 300,
        totalCents: 2300,
        refundedCents: 0,
      },
    });
  });
  it("normalizes a refund and passes other events through", () => {
    const refund = parseSquareEvent(
      JSON.stringify({
        event_id: "E3",
        type: "refund.updated",
        data: { object: { refund: { id: "R", status: "COMPLETED", payment_id: "PAY", order_id: "ORD" } } },
      }),
    );
    expect(refund).toMatchObject({ kind: "refund", refund: { status: "COMPLETED", paymentId: "PAY", orderId: "ORD" } });
    expect(parseSquareEvent(JSON.stringify({ event_id: "E4", type: "order.created", data: {} })).kind).toBe("other");
  });
});

describe("recipientEmail (hosted checkout stores the buyer email on the pickup recipient)", () => {
  it("reads and lower-cases the PICKUP recipient email", () => {
    expect(
      recipientEmail({
        locationId: "L",
        fulfillments: [{ type: "PICKUP", pickupDetails: { recipient: { emailAddress: " Tay@Example.com " } } }],
      }),
    ).toBe("tay@example.com");
  });
  it("returns null when there is no pickup recipient email (e.g. donations)", () => {
    expect(recipientEmail({ locationId: "L", fulfillments: [{ type: "SHIPMENT" }] })).toBeNull();
    expect(recipientEmail(undefined)).toBeNull();
  });
});
