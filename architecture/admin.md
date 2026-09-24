# SOP — Owner Admin (`/admin`)

## Goal
One private page where the owner runs the business side of the site. Replaces the planned
`kitchen-toggle.md` (D24).

## Login
- `ADMIN_PASSWORD` (owner-set, ≥ 12 chars) lives in `.env` / Vercel env. Not set → login
  disabled with a clear message.
- `POST` login form → pure `checkPassword(given, expected)`: SHA-256 both, `timingSafeEqual`.
  Wrong → 1 s delay, generic "Wrong password."
- Session cookie `ed_admin` = `<expiresAtMs>.<sig>`; `sig = HMAC(key, expiresAtMs)` where
  `key = HMAC(APP_SECRET, "admin:" + ADMIN_PASSWORD)`. httpOnly, `sameSite=strict`, `secure` on
  https, path `/`, 30 days. **Changing the password invalidates every session.**
- Pure `verifySession(token, nowMs, key)`: well-formed, not expired, signature matches.
- Every admin page render and **every server action re-checks the session** (never trust the UI).
- Logout clears the cookie.

## Actions (Navigation: `app/admin/actions.ts` → tools in `execution/admin/`)
| Action | Tool | Rules |
|---|---|---|
| Open / close kitchen | `setKitchenOpen(open)` | Closed → food checkout 409, donations unaffected. |
| Save settings | `updateSettings(patch)` | zod `SettingsUpdateSchema`: per-order ≥ 0; goal > 0; donation min ≥ 100 (Square minimum $1) and ≤ max; presets within min..max; text fields trimmed, empty → null; Google URL must be https. |
| Hide / unhide review | `setReviewHidden(id, hidden)` | **Spam/abuse only — never because of a low rating** (Invariant 7). The tool takes no rating input. |
| Send "we're open" alert | `sendOpenAlert()` | Owner click only. Shows sent/failed counts. D14 constraint applies until a domain is verified. |

## What the owner sees
Kitchen state · fund **percent and dollars** (private page — dollars never leave `/admin`) ·
settings form · all reviews incl. hidden, newest first · notify-list size · alert button.

## Edge cases
- Pickup address is only ever rendered on `/admin` and on a PAID food order's `/order/<token>`.
- Changing `fund_per_order_cents` affects future orders only (ledger stores the amount at
  payment time).
- `/admin` responses are never cached (they read cookies → dynamic).

## Lessons
- **2026-09-23 — static /admin:** with `ADMIN_PASSWORD` empty, `isAdmin()` returned before
  reading the cookie, so Next prerendered `/admin` as a static redirect (would lock the owner out
  even after setting a password). Fix: read the cookie first + `export const dynamic =
  "force-dynamic"` on admin pages. Verify with `next build`: admin routes must show `ƒ`.
