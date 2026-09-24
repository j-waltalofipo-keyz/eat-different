# SOP — Verified Reviews

## Goal
Real customers leave honest reviews; nobody else can; bad ratings are never hidden.

## Input — `ReviewSubmit`
`{ receiptNumber, email, rating 1–5 int, displayName 1–40, body 10–1000 }` (trimmed).

## Flow — `POST /api/reviews`
1. zod-validate → 400.
2. Load every `orders` row with that exact `receipt_number` (trimmed; Square receipt numbers are
   case-sensitive), plus whether each already has a review.
3. Pure `matchBuyerOrder(rows, { email })` → the order, or error → **422**:
   | code | when |
   |---|---|
   | `NOT_FOUND` | no row with that receipt + email (case-insensitive), or it's a `DONATION`, or not `PAID` |
   | `ALREADY_REVIEWED` | matching paid food order already has a review |
   If several rows match (same buyer, same receipt prefix) → newest unreviewed one.
   `NOT_FOUND` deliberately doesn't say which part was wrong.
4. Insert into `reviews` (`hidden = false`, live immediately). Unique violation →
   `ALREADY_REVIEWED`.
5. Respond `{ ok: true, googleReviewUrl }` — the Google link is returned to **every** successful
   reviewer regardless of rating (no review gating — Invariant 7).

## Public list — `GET /api/reviews`
Non-hidden reviews, newest first: `displayName, rating, body, createdAt` + average rating and
count. Never order ids, emails, or receipt numbers.

## Moderation (admin)
Owner may set `hidden = true` for spam/abuse only. **Rating is never a reason.** Hidden reviews
are excluded from the public list and the average.
