# SOP — Square Webhook + Order View

## Goal
Turn Square payment/refund events into order status, fund ledger rows, and one owner alert —
exactly once, no matter how many times Square retries.

## Endpoint — `POST /api/webhooks/square`
Subscribed events: `payment.updated`, `refund.updated` (+ `refund.created`).

1. Read the **raw** body text. Verify `x-square-hmacsha256-signature` with the SDK's
   `WebhooksHelper.verifySignature({ requestBody, signatureHeader, signatureKey,
   notificationUrl: SITE_URL + "/api/webhooks/square" })`. Invalid → **401**, do nothing.
   (The URL must match the subscription URL exactly.)
2. Parse JSON. If `event_id` already in `webhook_events` → **200** `duplicate`.
3. Route by type:
   - `payment.*` with `payment.status === "COMPLETED"` → `recordPayment(payment)`.
   - `refund.*` with `refund.status === "COMPLETED"` → `recordRefund(refund)`.
   - Anything else → ignore.
4. Insert `event_id` into `webhook_events` **after** processing succeeds (so a failed attempt is
   retried by Square, and processing itself is idempotent).
5. Any thrown error → **500** so Square retries.

## Tool — `execution/orders/recordPayment.ts`
1. Load the `orders` row for `payment.orderId`. **None → ignore** (in-person/POS sale, D15).
2. Pure `planPaymentRecord(order, payment, settings)`:
   - order `PENDING` → update to `PAID` with `square_payment_id`, `receipt_number`,
     `buyer_email` (lower-cased), `paid_at`.
   - ledger: `FOOD` → `ORDER`, `+fund_per_order_cents`; `DONATION` → `DONATION`,
     `+payment.amountMoney` (tip excluded).
   - order already `REFUNDED` → no ledger row.
3. Update only rows still `PENDING`. Insert ledger row; unique violation (`23505`) = already
   recorded → not an error.
4. Returns `{ firstTime: boolean }`. **Owner alert is sent only when `firstTime`** (no duplicate
   emails on retries). Alert failure is logged, never fails the webhook.

## Tool — `execution/orders/recordRefund.ts`
1. Load the `orders` row for `refund.orderId`. None → ignore.
2. Fetch the payment from Square (`payments.get`) for `refundedMoney` / `amountMoney`.
3. Pure `planRefund(order, payment, originalLedgerRow)`:
   - **Full** refund = `refundedMoney ≥ amountMoney` (tip excluded, D18) → order `REFUNDED` +
     ledger `REFUND` row = `−original.amount_cents` (none if there was no original row).
   - Partial → nothing.

## Tool — `execution/orders/getOrderView.ts` (confirmation page)
Input: view token from `/order/<token>`. Hash it, load the order by `view_token_hash`.
- Not found → 404.
- `PENDING` → ask Square directly (`orders.get` → tender payment → `payments.get`). If the
  payment is `COMPLETED`, run `recordPayment` right now (self-healing if the webhook is late).
- Returns status + items summary. **`pickup_address` and `pickup_instructions` are included only
  when the order is `PAID` and `kind = FOOD`.**
- The token is a bearer secret. It appears in request logs (Vercel logs are private to the
  account — acceptable). The `/order/<token>` **page must send `Referrer-Policy: no-referrer`**
  so outbound links never leak it (Phase S). (Lesson 2026-09-23.)
