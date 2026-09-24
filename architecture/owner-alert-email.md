# SOP — Owner Alert Emails

## Goal
The owner hears about every paid order and donation immediately, once.

## Trigger
`recordPayment` returned `firstTime: true` (see `square-webhook.md`). Never on retries.

## Tool — `execution/email/sendOwnerAlert.ts`
Pure `buildOwnerAlertEmail(input)` → `{ subject, text, html }`:
- **Food:** subject `🔥 New order #<receipt>: $<total>`; body = customer name, each line
  `qty × name` with modifiers (`+ 2× Bacon`), customer note, "Open Square → Orders to mark it
  complete when picked up."
- **Donation:** subject `🚚 Truck fund donation: $<amount>`.
- Money formatted from cents as `$12.00`. All user text HTML-escaped.
- No links to Square URLs (their dashboard paths aren't a stable contract).

IO: food line items come from Square `orders.get` (source of truth for what was paid).
Send via Resend from `Eat. Different. <onboarding@resend.dev>` to `OWNER_EMAIL`.

## Failure
Logged, never thrown to the webhook — the money is already recorded; an alert is best-effort.
Branded HTML design comes in Phase S.
