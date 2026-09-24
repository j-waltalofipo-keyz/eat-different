# SOP — Food Checkout

## Goal
Turn a cart into a Square-hosted payment page for a PICKUP order, with prices the server
computed from the live Square Catalog.

## Input — `CheckoutRequest` (CLAUDE.md)
`{ items: [{ variationId, qty 1–20, modifiers: [{ id, qty }] }] (1–30 lines), customerName 1–60, note 0–200|null }`

## Flow — `POST /api/checkout`
1. zod-validate the body → 400 on failure.
2. Load `settings`. `canCheckout("FOOD", settings)` false (kitchen closed) → **409**.
3. `getMenu({ fresh: true })`.
4. Pure `priceCart(request, menu)` → priced lines + `totalCents`, or `CartError` → **422**:
   | code | when |
   |---|---|
   | `UNKNOWN_ITEM` | variationId not on the menu |
   | `SOLD_OUT` | item sold out |
   | `UNKNOWN_MODIFIER` | modifier id not in one of this item's lists |
   | `DUPLICATE_MODIFIER` | same modifier id twice on one line |
   | `MISSING_REQUIRED` | a required list has no choice |
   | `TOO_MANY_CHOICES` | more than one option chosen in a SINGLE list |
   | `MODIFIER_QTY` | modifier qty < 1 or > the list's `maxQtyPerOption` |
   Math: line = `(base + Σ modifierPrice × modifierQty) × qty`; total = Σ lines.
   Client-sent prices do not exist in the schema — nothing to trust.
5. Generate a view token (32 random bytes, base64url). Store only its SHA-256 hash.
6. Pure `buildFoodPaymentLink(...)` → `CreatePaymentLink` request:
   - `order.locationId`, `order.metadata.kind = "FOOD"`
   - line items by `catalogObjectId` (variation) + modifiers by `catalogObjectId` with quantity
   - one fulfillment: `PICKUP`, `state PROPOSED`, `scheduleType ASAP`,
     `recipient.displayName = customerName`, `note = customer note`
   - `checkoutOptions.allowTipping = true` (D17), `redirectUrl = SITE_URL/order/<token>`
   - `idempotencyKey` = random UUID per request
7. Call Square. Insert `orders` row: `kind FOOD`, `status PENDING`, Square's order id,
   `total_cents` = **Square's** order total, `customer_name`, `view_token_hash`.
8. Respond `{ checkoutUrl, orderId }`.

## Edge cases
- Square's total ≠ our `totalCents` → Square charged what its catalog says; we store Square's
  number and log the mismatch (means a price changed mid-request).
- Payment-link orders **stay OPEN** after payment; the owner completes them in Square Order
  Manager (findings.md).
- No tax (D16). Tips are Square's to collect and never touch the fund (D17).
- The pickup address is never in this response — see `order-view` in `square-webhook.md`.
