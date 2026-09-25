# Findings — research, discoveries, constraints

## Environment (2026-09-22)
- Node v24.19.0, npm 11.17.0, git 2.55.0. **No** Vercel CLI, **no** Supabase CLI installed →
  use `npx vercel` and the Supabase / Vercel connectors available to Claude.
- Project folder was empty at start — greenfield, nothing to reuse.

## Square
- **Order checkout:** `CreatePaymentLink` accepts a full Orders-API `order` (catalog line items,
  modifiers, taxes, fulfillments). Square creates the order + link in one call.
  https://developer.squareup.com/docs/checkout-api/square-order-checkout
- **PICKUP fulfillment** is supported on payment-link orders; after payment the order shows in
  Square Dashboard → Order Manager.
  https://developer.squareup.com/docs/checkout-api/quick-pay-checkout
- ⚠️ **Gotcha:** orders with fulfillments created via payment links **stay OPEN** after payment
  and never auto-complete. Owner marks them complete in Order Manager. → document in
  `architecture/checkout.md`.
  https://developer.squareup.com/docs/checkout-api/common-pitfalls
- Only **one fulfillment per order**, all items at one location.
  https://developer.squareup.com/docs/orders-api/fulfillments
- `redirect_url` on the payment link sends the buyer to our page after paying instead of
  Square's default confirmation.

### Open questions (carried into Phase A)
- [x] Hosted-checkout payment: `receipt_number` ✅ present; `buyer_email_address` ❌ **empty**.
      The email (and phone) the buyer types is stored on the order's PICKUP
      `fulfillment.pickupDetails.recipient`. Donations carry no email. Fallback implemented (2026-09-23).
- [x] Sold-out status: `itemVariationData.locationOverrides[].soldOut` (SDK types, 2026-09-23).
- [x] `order.metadata.kind` survives on the Square order (RetrieveOrder, 2026-09-23). Routing
      doesn't depend on it anyway — the webhook looks the order up in our own `orders` table.
- [ ] Square seller terms: OK for a for-profit seller to take "support the business" payments?

### Verified in Phase A (2026-09-23, sandbox)
- Payment link with full `order` + PICKUP/ASAP fulfillment is accepted; Square's total matched
  `priceCart` exactly ($32.00 for Burger+combo+2×bacon + Sweet Heat/Classic).
- Order state is **DRAFT** until paid; `recipient.displayName` and pickup `note` are stored.
- **Square auto-adds a `DIGITAL` fulfillment** to payment-link orders sent without one
  (our donations). Documented in `architecture/donations.md`.
- `redirectUrl` + `allowTipping` are stored on the payment link as sent.
- Next dev/Vercel request logs include the full `/order/<token>` path → page needs
  `Referrer-Policy: no-referrer` (SOP updated).
- **All test data lives in the same Supabase project production will use.** Test orders, ledger
  rows, reviews, signups must be wiped before launch (Phase T checklist).
- [x] `square` npm SDK **46.0.0** (Square-Version 2026-09-16):
      `new SquareClient({ token, environment: SquareEnvironment.Sandbox })`;
      `client.locations.list()` → `{ locations }`; `client.catalog.list({ types })` → async Page.
- Sandbox default location is named "Default Test Account".

## Supabase
- Project **"E.D."**, ref `vrmdkvvydasazvcswdca`, region ca-central-1, Postgres 17.
- API URL is `https://<ref>.supabase.co` — NOT the dashboard URL
  (`supabase.com/dashboard/project/<ref>`). Easy mistake; the probe now catches it.
- Keys: new style `sb_publishable_…` / `sb_secret_…`, or legacy JWT anon / service_role
  (`eyJ…`). supabase-js 2.117 accepts either. Owner is using legacy keys.
- Advisor lint `0008_rls_enabled_no_policy` (INFO) is expected with our deny-all RLS design.

## Vercel
- Connector is authenticated as jared.key87@gmail.com, **Hobby** plan, team
  `jaredkey87-5672` (id team_orNp7TYLWYzgwTgW8GPAgthX). No projects yet (2026-09-23).
- No local Vercel CLI login needed for the probe: the connector's `create_deployment` accepts
  inline files. Git-based deploys (Phase T) will need a GitHub remote.
- **Verified 2026-09-23:** Deployment Protection is on by default. The production project
  domain `https://eat-different.vercel.app` → 200 (public). Team alias and per-deployment URLs
  → 302 to `vercel.com/sso-api`. Project id prj_HiF5uwrB1hFWbwXwxCvPxvd8ZWDV, region iad1.
- Inline-file `create_deployment` with `framework: null` serves a static `index.html` fine.

## Resend
- Free tier ~3,000 emails/month.
- **Confirmed 2026-09-23:** without a verified domain, Resend returns 403 `validation_error` for
  any recipient other than the Resend account's own address (currently jared.key87@gmail.com).
  → Alerts to the E.D. owner's inbox need either a verified domain (requires owning one) or
  the Resend account to be registered under the E.D. owner's email.

## Menu (from owner's menu image, 2026-09-22)
- Full transcription → `architecture/menu-seed.json`. Rules → CLAUDE.md "Menu Rules".
- The menu art itself writes "EAT DIFFERENT"; the owner's stated brand is **"Eat. Different."**
  → use the owner's form in all site copy.
- Menu graphic dishes are small; v1 photos are crops from it (owner's choice), replace later.
- `reference/menu.jpg` is really WebP (920×2000); dishes ≈ 220–270 px wide → crops are soft if
  blown up. Menu lettering touches the burger, teriyaki, fries and banger → cutouts in menu-crops.json.

## Business-logic notes
- $5/order toward $42,000 = 8,400 orders with no donations. Donations were added to speed this up.
- Review gating (only sending happy customers to Google / hiding low ratings) is prohibited by
  the FTC consumer-reviews rule and Google policy → Invariant 7.
- Donations to a for-profit business are not tax-deductible → must be stated in copy (Invariant 6).

### UX flag for Phase S
- Public fund shows one decimal: $15 raised = 0.036% → displays **0%**. It first shows 0.1% at
  $4,200. Decide in Phase S how to make early progress visible without exposing dollars.
