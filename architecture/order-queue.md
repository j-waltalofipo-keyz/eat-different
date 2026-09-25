# SOP: Tonight's orders (Orders tab in /admin)

## Goal
A kitchen queue on Eddie's phone (D45):
- The next plate to hand over is always at the **top**.
- One tap marks it **Done**. It slides to the bottom, greyed out.
- One tap on **Undo** brings it back if he tapped by mistake.

## Which orders
- **Waiting:** `kind = FOOD`, `status = PAID`, `fulfilled_at` null. **Any date**, so nothing
  gets lost overnight. Oldest `paid_at` first; the top one is "Next up".
- **Done:** `kind = FOOD`, `status = PAID`, `fulfilled_at` within the last 18 h. Newest done
  first, greyed, each with **Undo**.
- **Refunded:** `status = REFUNDED` with `paid_at` in the last 18 h. Shown greyed with a
  "Refunded" tag and no buttons.
- Donations are never listed. They aren't plates.

## What each card shows
- Receipt #, customer name, and time since payment ("12 min ago")
- Line items × qty with their options, and the customer note
- Total (includes tip)

Line items come from Square (`orders.batchGet` on the listed ids, what was actually paid for).
This is the same mapping as the owner alert email (`toAlertLines`). If Square can't be reached,
cards still show receipt, name and total, with "Items unavailable — check Square".

## Done / Undo
- Tool `setFulfilled(orderId, done)`: `orders.fulfilled_at = now()` or `null`.
  - Only FOOD + PAID rows.
  - Idempotent.
  - The session is re-checked in the action.
- **Website-only.** Square order completion is terminal and can't be undone, so we never touch
  the Square order. Eddie can still complete it in Square → Orders if he uses that.
- The UI is optimistic: the card moves instantly, and a failure moves it back with a message.

## Freshness
The Orders tab refreshes itself every 20 s while it's open (server re-render), shows "Updated
just now", and has a manual ↻ button. There is no sound, no push, and no new services.

## Edge cases
- A PENDING order (checkout opened but not paid) never shows.
- A refund after Done still shows as Refunded; the fund rules are unchanged (`truck-fund.md`).
- Old test orders stay under Waiting until tapped Done or wiped in Phase T.
