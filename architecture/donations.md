# SOP — Truck Fund Donations

## Goal
Let anyone chip in any amount toward the truck, even when the kitchen is closed.

## Input — `DonationRequest`
`{ amountCents }` — integer cents.

## Flow — `POST /api/donate`
1. zod-validate → 400.
2. Load `settings`. `canCheckout("DONATION", settings)` is **always true** (kitchen state ignored).
3. Pure `validateDonation(amountCents, settings)`: must be an integer within
   `donation_min_cents … donation_max_cents` (defaults $1 … $1,000) → else **422
   `DONATION_AMOUNT`**.
4. Pure `buildDonationPaymentLink(...)`:
   - ad-hoc line item `"E.D. Truck Fund Donation"`, qty 1, `basePriceMoney = amountCents`
   - `order.metadata.kind = "DONATION"`, **no fulfillment sent** (nothing to cook). ⚠️ Square
     auto-adds a `DIGITAL` fulfillment to payment-link orders that have none (verified
     2026-09-23), so donations may appear in Order Manager as digital orders — the owner can
     mark them complete; it has no effect on the fund.
   - `checkoutOptions.allowTipping = false` (D17), `redirectUrl = SITE_URL/donate/thanks`
   - `paymentNote = "Support for a small business — not tax-deductible"`
5. Call Square. Insert `orders` row: `kind DONATION`, `status PENDING`, `total_cents`.
6. Respond `{ checkoutUrl, orderId }`.

## Rules
- Copy on the site must say it is support for a small business and **not tax-deductible**.
- No donor names or amounts are ever shown publicly.
- Presets (`donation_presets_cents`) are display hints only; any in-range amount is accepted.
- Fund credit = 100% of the donated amount, added when the payment completes (`truck-fund.md`).
