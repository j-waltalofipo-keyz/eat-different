# SOP — Truck Fund Tracker

## Goal
One public number: percent of the way to the truck. Deterministic, replay-safe, never dollars.

## Ledger rules (`fund_ledger`, append-only)
| Event | reason | amount_cents |
|---|---|---|
| Website food order paid | `ORDER` | `+settings.fund_per_order_cents` at payment time (default 500) |
| Website donation paid | `DONATION` | `+payment.amountMoney` (100%, tip excluded) |
| Full refund of either | `REFUND` | `−` the original row's amount |
| Partial refund, in-person sale, tip | — | nothing |

`UNIQUE(square_order_id, reason)` → replays can never double-count. Changing
`fund_per_order_cents` later never rewrites history.

## Total
SQL view `fund_total` (`security_invoker`, select revoked from `anon`/`authenticated`) returns
`sum(amount_cents)`. Only the server (service role) reads it.

## Tool — `execution/fund/computeProgress.ts`
Pure `computeProgress(totalCents, goalCents, now)` →
`{ percent: clamp(floor(total × 1000 / goal) / 10, 0, 100), updatedAt: now ISO }`.
- Goal ≤ 0 → error (DB check prevents it).
- Negative total (more refunds than credits) → 0.
- Over goal → 100.

## Public output — `GET /api/fund`
`FundProgress { percent, updatedAt }`. **Never** total or goal dollars (Invariant 5).
