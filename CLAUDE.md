# Eat. Different. (E.D.) — Project Constitution

Website for **Eat. Different.** ("E.D."), a comfort-food business cooking from home and saving
for a food truck. Tagline: *"Comfort food. Different rules."*

Built under the **B.L.A.S.T.** protocol (Blueprint → Link → Architect → Stylize → Trigger) with the
**A.N.T.** 3-layer build. Reliability over speed. Never guess at business logic — ask.

## Current State
| Phase | Status |
|---|---|
| Protocol 0 — Init | ✅ Done 2026-09-22 |
| B — Blueprint | ✅ Approved 2026-09-22 |
| L — Link | ✅ All 4 links green 2026-09-23 (`npm run probe:all`) |
| A — Architect | 🔨 Nearly done — 56 tests ✅, build ✅, sandbox payment + reviews verified; admin login test pending |
| S — Stylize | 🔒 |
| T — Trigger | 🔒 |

**HALT RULE:** no business logic in `execution/` until every Phase L probe is ✅.

## Layout
```
CLAUDE.md          this file — schemas, rules, invariants, triggers
.env               secrets (git-ignored). .env.example lists every key.
memory/            task_plan · findings · progress · decisions
architecture/      Layer A — SOPs (the how-to), menu-seed.json, design-direction.md
execution/         Layer T — deterministic tools, probes/, __tests__/
app/               Layer N — Next.js routes/server actions: validate → call tools → respond
reference/         owner-supplied inputs (menu.jpg, inspiration). Read-only.
.tmp/              ephemeral scratch, probe output, logs (git-ignored)
```

## Stack
Next.js (App Router, TypeScript) on Vercel · Tailwind + GSAP · Supabase (Postgres) ·
Square (Catalog, Checkout payment links, Orders, webhooks) · Resend (email) · Vitest · zod.
Admin login: one owner-set password + signed cookie (D24).
Square **Sandbox** for all development; production keys only in Phase T.

## Phase B — Blueprint (approved)
1. **North Star:** Get E.D. its truck — measured by paid online pickup orders + direct donations,
   both of which move the truck-fund tracker.
2. **Integrations:** Square, Supabase, Vercel, Resend.
3. **Source of Truth:** Menu = Square Catalog. Orders/donations/payments = Square.
   Mirror + fund ledger + reviews + settings = Supabase.
4. **Delivery Payload:** paid order → Square Orders tab (PICKUP) + owner email; donation → owner
   email; site live at `*.vercel.app`.
5. **Behavioral Rules:** the invariants below.

## Invariants (never violate)
1. **Brand:** always "Eat. Different." (both periods) or "E.D." — never "Eat Difference".
2. **Server re-prices every cart** from the Square Catalog. Client-sent prices are ignored.
3. **Home pickup address is never public.** Stored only in `settings` (service-role only). Shown
   only on `/order/<token>` (unguessable 32-byte token; only its SHA-256 hash is stored) after
   the server confirms with Square the payment is COMPLETED.
4. **Kitchen Open toggle** off → food checkout returns HTTP 409, menu is view-only, notify-me
   signup shown. **Donations stay open either way.**
5. **Truck fund:**
   - **Only orders created by this website count.** Payments for any other Square order
     (in-person/POS) are ignored.
   - Paid food order → ledger `+fund_per_order_cents` as of payment time (default 500).
   - Paid donation → ledger `+100%` of the donated amount.
   - Tips never count.
   - **Only a full refund** (`refunded_money ≥ amount_money`, tip excluded) adds a row
     subtracting exactly what the original row added. Partial refunds change nothing.
   - `UNIQUE(square_order_id, reason)` — webhook replays never double-count.
   - Public progress = `floor(sum / goal × 1000) / 10` %, clamped 0–100. Goal = 4,200,000 cents
     ($42,000), stored privately.
   - **Dollar amounts are never exposed publicly.**
6. **Donations:** presets $5/$10/$25/$50 or custom $1–$1,000 (owner-editable). Copy states it is
   support for a small business and **not tax-deductible**. No donor names/amounts shown publicly.
7. **Reviews:** verified **food** buyers only (Square receipt number + checkout email must match
   a PAID food order). One per order, published immediately. Owner may hide spam/abuse only —
   **never hide for a low rating**. The Google review link is shown to **every** reviewer
   (no review gating — FTC rule + Google policy).
7b. **Checkout money:** no sales tax (for now). Tips allowed on food checkout only, never on
    donations. Pickup is ASAP — no time slots.
8. **Square webhooks:** verify `x-square-hmacsha256-signature` before any processing; store
   `event_id` uniquely (idempotent).
9. **Look & feel:** follows the menu art — near-black, amber/gold brush strokes, cream brushed
   "E.D." wordmark, gold crown motif, condensed hand-lettered display type. Owner inspiration
   refines it (`architecture/design-direction.md`). Must stay readable and honor
   `prefers-reduced-motion`.
10. **Secrets** live only in `.env` / Vercel env vars. Never committed, never logged. The owner
    pastes all keys themselves.
11. **SOP before code:** if logic changes, update the `architecture/` SOP first, then the tool.

## Data Schemas (Input → Output)
```jsonc
// MenuItem (Square Catalog → site)
{ "variationId": "str", "itemId": "str", "name": "The Sweet Heat",
  "subtitle": "Hot Honey Chicken + Waffle", "description": "Crispy chicken · Hot honey · …",
  "priceCents": 1200, "imageUrl": "str|null",
  "category": "Waffles",              // Square category name (owner may add more)
  "soldOut": false,
  "modifierLists": [{ "id": "str", "name": "Choose your waffle",
                      "selection": "SINGLE|MULTIPLE", "required": true,
                      "maxQtyPerOption": 1,           // Add-ons list = 3
                      "options": [{ "id": "str", "name": "Classic", "priceCents": 0 }] }] }

// CheckoutRequest (browser → POST /api/checkout)
{ "items": [{ "variationId": "str", "qty": 1,         // qty 1–20, 1–30 lines
              "modifiers": [{ "id": "str", "qty": 1 }] }],
              // server enforces: option belongs to item, required lists filled,
              // SINGLE ≤ 1 option, qty ≤ maxQtyPerOption
  "customerName": "str(1–60)", "note": "str(0–200)|null" }

// DonationRequest (browser → POST /api/donate)
{ "amountCents": 1000 }                               // donation_min..donation_max

// CheckoutResponse (both)
{ "checkoutUrl": "https://square.link/…", "orderId": "str" }

// FundProgress (GET /api/fund) — never dollars
{ "percent": 12.3, "updatedAt": "iso" }

// ReviewSubmit (browser → POST /api/reviews)
{ "receiptNumber": "str", "email": "str", "rating": 5, "displayName": "str(≤40)",
  "body": "str(10–1000)" }

// OwnerAlertEmail → OWNER_EMAIL
//   food:     "🔥 New order #{receipt}: ${total}"  — customer, items × qty + modifiers, note, "Open Square → Orders" (no Square URLs)
//   donation: "🚚 Truck fund donation: ${amount}"
```

### Supabase tables
```
orders          square_order_id PK, kind FOOD|DONATION, square_payment_id, receipt_number,
                buyer_email, customer_name, total_cents, status PENDING|PAID|REFUNDED,
                view_token_hash, created_at, paid_at
fund_ledger     id, square_order_id, reason ORDER|DONATION|REFUND, amount_cents, created_at,
                UNIQUE(square_order_id, reason)
reviews         id, square_order_id UNIQUE, display_name(≤40), rating 1–5, body(10–1000),
                hidden bool, created_at
notify_signups  email UNIQUE, created_at, unsubscribed_at
webhook_events  event_id PK, type, received_at
settings (1 row) kitchen_open, fund_per_order_cents=500, fund_goal_cents=4200000,
                donation_presets_cents=[500,1000,2500,5000], donation_min_cents=100,
                donation_max_cents=100000, pickup_address, pickup_instructions, google_review_url
```

## Menu Rules (source: `architecture/menu-seed.json`)
- Categories: Waffles · Burgers · Bowls · Dirty Eats.
- **Choose your waffle** — SINGLE, required — Sweet Heat only.
- **Make it a combo** (+$5, fries + drink of the day, no drink choice) — SINGLE, optional —
  Sweet Heat, Birthday Banger, E.D. Burger only.
- **Add-ons** (Extra Sauce $0.50, Bacon $1.50, Cheese $1.00, Jalapeños $0.50) — MULTIPLE,
  optional, 1–3 of each — all six items.

## Triggers (Phase T — to be finalized)
| Trigger | Type | Fires |
|---|---|---|
| Square `payment.updated`, `refund.updated` → `/api/webhooks/square` | event | record payment/refund, ledger, owner email |
| `/admin` buttons (kitchen toggle, "we're open" alert, hide review) | manual | owner-initiated only |
| git push → Vercel | deploy | rebuild + redeploy |

## Self-Annealing Repair Loop
1. **Analyze** — read the actual error / stack trace / Vercel runtime log / `webhook_events`. No guessing.
2. **Patch** — fix the tool in `execution/`.
3. **Test** — `npm test` (and the relevant probe) must pass.
4. **Update Architecture** — write the lesson into the matching `architecture/` SOP.

## Maintenance Log
_Finalized in Phase T._

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
