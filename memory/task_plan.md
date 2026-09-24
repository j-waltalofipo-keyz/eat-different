# Task Plan — Eat. Different. (E.D.)

**Blueprint status: ✅ APPROVED 2026-09-22.** Schemas, invariants and menu rules live in
`CLAUDE.md` (single source — don't duplicate them here).

**North Star:** Get E.D. its truck — paid online pickup orders + direct donations, both moving
the truck-fund tracker ($5/order, 100% of donations, $42,000 goal, public % only).

---

## Protocol 0 — Initialization ✅
- [x] Folder structure: memory/, architecture/, execution/, reference/, .tmp/
- [x] CLAUDE.md constitution
- [x] memory/ files seeded
- [x] .gitignore, .env.example, .env (empty)
- [x] `git init`

## Phase B — Blueprint ✅
- [x] 5 discovery questions answered (see CLAUDE.md → Phase B)
- [x] Data schema defined in CLAUDE.md
- [x] Menu transcribed → `architecture/menu-seed.json`
- [x] Research logged → `memory/findings.md`
- [ ] Owner saves `reference/menu.jpg` (for photo crops — needed by Phase S, not blocking L)
- [ ] Owner shares website inspiration → `reference/` (needed by Phase S, not blocking L)

## Phase L — Link ✅ (completed 2026-09-23)
- [ ] Owner creates keys and pastes into `.env`:
  - [x] Square Sandbox: `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`
  - [x] Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - [x] Resend: `RESEND_API_KEY`
  - [x] `OWNER_EMAIL`
  - [ ] (later, once a webhook URL exists) `SQUARE_WEBHOOK_SIGNATURE_KEY`
- [x] `npm run probe:square` ✅ (2026-09-23)
- [x] Supabase schema migration applied, `npm run probe:supabase` ✅ (2026-09-23)
- [x] `npm run probe:resend` ✅ + `probe:resend:send` ✅ sent + arrival confirmed (2026-09-23)
- [ ] **Phase T blocker:** pick permanent alert inbox (verified domain vs owner's Resend account) — D14.
      Owner wants `OWNER_EMAIL` switched back to the address originally entered (owner will supply
      it); keep jared.key87@gmail.com until that address can actually receive Resend mail.
- [x] Vercel: `https://eat-different.vercel.app` returns 200 → `npm run probe:vercel` ✅
- [x] All results logged in progress.md → Phase A unlocked

## Phase A — Architect 🔨 (in progress)
- [x] Money-rule decisions D15–D19 from owner (fund scope, tax, tips, refunds, pickup)
- [x] SOPs: menu-sync, checkout, donations, square-webhook, truck-fund, reviews, notify-list,
      owner-alert-email (crop-menu moves to Phase S — needs `reference/menu.jpg`)
- [x] SOP: admin.md (password login D24; kitchen toggle, settings, hide review, open alert)
- [x] Next.js 16 scaffold + Tailwind 4 + Vitest 5 + zod 4; `next build` ✅
- [x] Tools: seedCatalog, getMenu, priceCart, createCheckout, createDonationCheckout,
      verifyWebhook, parseSquareEvent, recordPayment, recordRefund, completePayment,
      getOrderView, computeProgress, submitReview, listReviews, subscribe/unsubscribe,
      sendOwnerAlert, sendOpenAlert
- [x] Navigation: /api/menu, /api/checkout, /api/donate, /api/webhooks/square, /api/fund,
      /api/reviews, /api/notify, /api/notify/unsubscribe, /api/order/[token]
- [x] Navigation: /admin + /admin/login + server actions (functional; styled in Phase S)
- [ ] Live admin login test — needs owner to set ADMIN_PASSWORD in .env
- [x] `npm test` 53/53 ✅; `next build` ✅ (all admin/api routes dynamic); sandbox catalog seeded (idempotent); live route checks ✅
- [x] Verified in sandbox: sold_out location, metadata survives, PICKUP/ASAP accepted, totals match
- [ ] **One hosted-checkout sandbox payment** (owner enters Square's test card) → verify
      buyer_email + receipt_number arrive, order PAID, ledger +500, fund %, owner alert email,
      pickup shown only after payment. Then a $10 donation payment → ledger +1000.
- [ ] Square seller terms re: "support the business" payments (owner to confirm)

## Phase S — Stylize 🔒
- [ ] `architecture/design-direction.md` from menu art + inspiration → owner sign-off
- [ ] Pages: /, /menu, /order/[token] (`Referrer-Policy: no-referrer`), /donate/thanks, /reviews, /admin
- [ ] SOP + tool: crop-menu (needs `reference/menu.jpg`)
- [ ] Interactive: tracker (smoker gauge or rolling truck), sizzling menu cards, flame burst, smoke parallax
- [ ] Branded owner-alert emails
- [ ] Screenshots desktop + 375px mobile + reduced-motion → owner sign-off

## Phase T — Trigger 🔒
- [ ] Deploy to Vercel (owner enters env vars in dashboard)
- [ ] Register Square webhook (payment.updated, refund.updated)
- [ ] Sandbox E2E: food order + $10 donation (owner enters test card)
- [ ] **Wipe test data** from Supabase (orders, fund_ledger, reviews, notify_signups,
      webhook_events; reset settings) — dev and prod share one project
- [ ] Owner sign-off → production keys → seed production catalog
- [ ] First real order + donation land → **Complete**
- [ ] Finalize Triggers + Maintenance Log in CLAUDE.md

## Verification checklist (npm test)
- Fund math: ORDER=$5, DONATION=full, refund reverses original, replay idempotent, clamp/round
- Donation bounds
- priceCart: ignores client prices; rejects sold-out; Sweet Heat w/o waffle rejected; combo on
  Teriyaki rejected; 4th bacon rejected; Burger + combo + 2× bacon = $20.00
- Webhook signature (Square documented sample)
- Reviews: wrong email, duplicate, unpaid, donation receipt → all rejected
- Kitchen closed → checkout 409, donations still succeed
