# SOP — Owner Dashboard (`/admin`)

## Goal
One private, phone-first dashboard where Eddie runs the website without help.
- Every task is **one screen, big tap targets, plain words**. Each card has its own **Save**, and
  "Saved ✓" feedback follows every change.
- It looks premium, like the site: ink background, cream text, gold accents, Anton headings.
- Replaces the planned `kitchen-toggle.md` (D24). Dashboard layout: D41.

## Login (unchanged)
- `ADMIN_PASSWORD` (owner-set, ≥ 12 chars) lives in `.env` / Vercel env. When it isn't set,
  login is disabled with a clear message.
- The `POST` login form calls pure `checkPassword(given, expected)`: SHA-256 both, then
  `timingSafeEqual`. A wrong password waits 1 s, then shows a generic "Wrong password."
- Session cookie `ed_admin` = `<expiresAtMs>.<sig>`:
  - `sig = HMAC(key, expiresAtMs)`, where `key = HMAC(APP_SECRET, "admin:" + ADMIN_PASSWORD)`
  - httpOnly, `sameSite=strict`, `secure` on https, path `/`, 30 days
  - **Changing the password invalidates every session.**
- Pure `verifySession(token, nowMs, key)` checks the token is well formed, not expired, and
  that the signature matches.
- Every admin page render and **every server action re-checks the session** (never trust the UI).
- Logout clears the cookie.

## Layout
**Top bar (always visible):**
- E.D. mark, "View site ↗", Log out
- The **Kitchen switch**: one big Open/Closed toggle
- After Eddie opens the kitchen, a one-tap prompt appears: "Email the N people waiting?" It is
  never sent automatically.

**Tabs:** `?tab=` so the browser back button works. Default tab is **Orders** when the kitchen
is open, **Menu** when it's closed.

| Tab | What Eddie does there | SOP |
|---|---|---|
| Orders | Tonight's queue. Tap **Done** when a plate is picked up, **Undo** to bring it back. The list refreshes itself. | `order-queue.md` |
| Menu | See every item. Sold-out-tonight and show/hide switches. **Add a menu item** or **Edit** one with a photo drop, a live card preview, and Save. | `menu-admin.md` |
| Site | Announcement banner, drink of the day, weekly hours, pickup (public area + private address + instructions), links (Google review, Instagram, TikTok, Facebook). | this file |
| Fund | Private dollars + percent, $ per order, goal, donation min/max/presets. | `truck-fund.md`, `donations.md` |
| Reviews | Hide spam/abuse only. | `reviews.md` |

## Actions (Navigation: `app/admin/actions.ts` → tools in `execution/admin/`)
Each settings card saves only its own fields. Every card is its own zod section schema, parsed
by a pure form parser.

| Action | Tool | Rules |
|---|---|---|
| Open / close kitchen | `setKitchenOpen(open)` | Closed → food checkout 409; donations unaffected (Invariant 4). Hours never change this (D42). |
| Save announcement | `updateSettings(Announcement)` | `announcement_on` bool; text ≤ 140 chars. Turning it on with empty text is refused. |
| Save drink of the day | `updateSettings(Drink)` | ≤ 60 chars; empty → null (the menu falls back to "drink of the day"). |
| Save hours | `updateSettings(Hours)` | 7 days, Mon→Sun. Each day is `null` (closed) or `{open, close}` "HH:MM" 24 h, close > open (no overnight). Note ≤ 80 chars. Display only (D42). |
| Save pickup | `updateSettings(Pickup)` | `pickup_area` is **public**, ≤ 60 chars, a neighborhood/area only (D43). `pickup_address` and `pickup_instructions` are **private** until payment (Invariant 3), ≤ 500 chars each. |
| Save links | `updateSettings(Links)` | Every link must be `https://`; empty → null (hidden on the site). |
| Save fund | `updateSettings(Fund)` | per-order ≥ 0; goal > 0; donation min ≥ 100 (Square minimum $1) and ≤ max; presets within min..max, at most 6. |
| Hide / unhide review | `setReviewHidden(id, hidden)` | **Spam/abuse only, never because of a low rating** (Invariant 7). The tool takes no rating input. |
| Send "we're open" alert | `sendOpenAlert()` | Owner click only. Shows sent/failed counts. The D14 constraint applies until a domain is verified. |
| Menu actions | see `menu-admin.md` | |
| Mark done / undo | see `order-queue.md` | |

## What the owner sees that the public never does
- Fund **dollars** (dollars never leave `/admin`)
- The pickup address
- Hidden reviews
- The notify-list size
- Customer names on orders

## Edge cases
- Changing `fund_per_order_cents` affects future orders only (the ledger stores the amount at
  payment time).
- `/admin` is never cached: it reads cookies, so it is dynamic, and it is also force-dynamic.
- A save failure shows the zod message in plain words next to that card. Nothing else on the
  page changes.

## Lessons
- **2026-09-23 — static /admin:** with `ADMIN_PASSWORD` empty, `isAdmin()` returned before
  reading the cookie, so Next prerendered `/admin` as a static redirect. That would have locked
  the owner out even after setting a password.
  - Fix: read the cookie first, and add `export const dynamic = "force-dynamic"` to admin pages.
  - Verify with `next build`: admin routes must show `ƒ`.
- **2026-09-24 — form reset desync:** React resets a `<form action>` after every action. That
  un-ticked a controlled switch (the Friday hours switch showed off while its times stayed on
  screen), so the next Save sent the wrong thing. It would also wipe a chosen photo when a dish
  save failed validation.
  - Fix: dashboard forms submit through `submitKeepingValues` (`preventDefault`, then
    `dispatch(FormData)` in a transition), so no automatic reset happens.
  - Verified by saving hours twice in a row in the browser.
