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

## Phase L — Link ⏳
- [ ] Owner creates keys and pastes into `.env`:
  - [x] Square Sandbox: `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`
  - [x] Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - [x] Resend: `RESEND_API_KEY`
  - [x] `OWNER_EMAIL`
  - [ ] (later, once a webhook URL exists) `SQUARE_WEBHOOK_SIGNATURE_KEY`
- [x] `npm run probe:square` ✅ (2026-09-23)
- [x] Supabase schema migration applied, `npm run probe:supabase` ✅ (2026-09-23)
- [x] `npm run probe:resend` ✅ + `probe:resend:send` ✅ sent (2026-09-23) — confirm it arrived
- [ ] **Phase T blocker:** pick permanent alert inbox (verified domain vs owner's Resend account) — D14
- [ ] Vercel hello-world preview returns 200 ✅
- [ ] Verify open questions from findings.md (buyer email + receipt_number on payment.updated,
      sold_out location, metadata survives, Square ToS on support payments)
- [ ] All results logged in progress.md → then unlock Phase A

## Phase A — Architect 🔒
- [ ] SOPs (write BEFORE each tool): menu-sync, checkout, donations, square-webhook, truck-fund,
      reviews, kitchen-toggle, notify-list, owner-alert-email, crop-menu
- [ ] Next.js scaffold + Tailwind + Vitest + zod
- [ ] Tools: seedCatalog, getMenu, priceCart, createCheckout, createDonationCheckout,
      verifyWebhook, recordPayment, recordRefund, computeProgress, verifyBuyer, submitReview,
      sendOwnerAlert, sendOpenAlert, cropMenu
- [ ] Navigation: /api/checkout, /api/donate, /api/webhooks/square, /api/fund, /api/reviews,
      /api/notify, /admin server actions
- [ ] `npm test` green (see Verification below)

## Phase S — Stylize 🔒
- [ ] `architecture/design-direction.md` from menu art + inspiration → owner sign-off
- [ ] Pages: /, /menu, /order/[id], /donate/thanks, /reviews, /admin
- [ ] Interactive: tracker (smoker gauge or rolling truck), sizzling menu cards, flame burst, smoke parallax
- [ ] Branded owner-alert emails
- [ ] Screenshots desktop + 375px mobile + reduced-motion → owner sign-off

## Phase T — Trigger 🔒
- [ ] Deploy to Vercel (owner enters env vars in dashboard)
- [ ] Register Square webhook (payment.updated, refund.updated)
- [ ] Sandbox E2E: food order + $10 donation (owner enters test card)
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
