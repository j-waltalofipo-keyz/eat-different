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

### To verify in Phase L (open)
- [ ] Does `payment.updated` carry `buyer_email_address` and `receipt_number`? (reviews depend on it)
- [ ] Sold-out status location: `item_variation_data.location_overrides[].sold_out`?
- [ ] Does `order.metadata.kind` survive to the webhook / RetrieveOrder?
- [ ] Square seller terms: OK for a for-profit seller to take "support the business" payments?
- [ ] Current `square` npm SDK major version + client API shape.

## Resend
- Free tier ~3,000 emails/month. Before a sending domain is verified, the test sender can only
  deliver to the account owner's own address → fine for owner alerts in v1. (verify in Phase L)

## Menu (from owner's menu image, 2026-09-22)
- Full transcription → `architecture/menu-seed.json`. Rules → CLAUDE.md "Menu Rules".
- The menu art itself writes "EAT DIFFERENT"; the owner's stated brand is **"Eat. Different."**
  → use the owner's form in all site copy.
- Menu graphic dishes are small; v1 photos are crops from it (owner's choice), replace later.

## Business-logic notes
- $5/order toward $42,000 = 8,400 orders with no donations. Donations were added to speed this up.
- Review gating (only sending happy customers to Google / hiding low ratings) is prohibited by
  the FTC consumer-reviews rule and Google policy → Invariant 7.
- Donations to a for-profit business are not tax-deductible → must be stated in copy (Invariant 6).
