# SOP — "Notify me" List + We're-Open Alert

## Goal
When the kitchen is closed, visitors can leave an email; the owner can tell them it's open.

## Subscribe — `POST /api/notify`
`{ email }` → zod email, lower-cased → upsert into `notify_signups`; re-subscribing clears
`unsubscribed_at`. Always responds `{ ok: true }` (doesn't reveal whether the email existed).

## Unsubscribe — `GET /api/notify/unsubscribe?e=<email>&s=<sig>`
`sig = base64url(HMAC-SHA256(APP_SECRET, email))`. Timing-safe compare. Valid → set
`unsubscribed_at = now()`. Invalid → 400. Every alert email contains this link.

## We're-open alert — `execution/email/sendOpenAlert.ts`
- Triggered **only** by the owner clicking the admin button. Never automatic.
- Recipients: signups with `unsubscribed_at is null`. Resend batch send, ≤100 per call.
- Each email: short "E.D. kitchen is open" + link to `SITE_URL/menu` + unsubscribe link.

## Constraint (D14)
Until a domain is verified in Resend, only the Resend account holder's address can receive
mail. Alerts to other subscribers will fail until then — resolve before launch (Phase T).
