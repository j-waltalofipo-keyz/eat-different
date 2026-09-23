# Decisions — architectural choices and why

| # | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-09-22 | **Next.js (App Router, TS) on Vercel** | Server routes hold secrets + receive webhooks without a separate backend; Vercel free tier; owner chose Vercel. |
| D2 | 2026-09-22 | **Square hosted checkout** (`CreatePaymentLink` with full `order`) | Card data never touches our site (no PCI scope); orders land natively in Square Order Manager; owner chose Square. |
| D3 | 2026-09-22 | **Square Catalog is the menu source of truth** | Owner edits items/prices/sold-out in the Square app; checkout uses the same IDs so site and checkout can't drift. |
| D4 | 2026-09-22 | **Supabase** for mirror, ledger, reviews, settings, owner auth | Owner chose it; Postgres constraints (UNIQUE) give idempotency for free; magic-link auth for one owner. |
| D5 | 2026-09-22 | **Append-only fund ledger**, `UNIQUE(square_order_id, reason)` | Deterministic, replay-safe totals; refunds are reversing rows; settings changes never rewrite history. |
| D6 | 2026-09-22 | **Public fund = % only** | Owner wants dollar amounts private. |
| D7 | 2026-09-22 | **Resend** for owner email alerts | Built for app email, free tier, one API key; better deliverability than Gmail app password. |
| D8 | 2026-09-22 | **Square Sandbox for all dev**; prod keys only in Phase T | No real money moves until owner signs off on sandbox E2E. |
| D9 | 2026-09-22 | **Owner enters all secrets and test card numbers** | Claude never types credentials or card numbers, even test ones. |
| D10 | 2026-09-22 | **Tailwind + GSAP** | Fast styling to match menu art; GSAP for the "very interactive" motion; reduced-motion respected. |
| D11 | 2026-09-22 | **Vitest + zod** | Every tool validated at its boundary and unit-tested; fast. |
| D12 | 2026-09-22 | **Combo = single optional modifier (+$5)**, drink of the day, no drink choice | Owner's choice; keeps checkout simple for a home kitchen. |
| D13 | 2026-09-22 | **v1 photos cropped from menu graphic** | Owner's choice; replace with real photos later. |
