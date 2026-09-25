# SOP — Production Pages (Phase S)

Look & feel: `design-direction.md` (approved D26). Money/data rules: the other SOPs. The pages
are Navigation: they read tools on the server and call `/api/*` from the browser — no business
logic lives in a component.

## `/` — home (dynamic, never cached)
Server loads in parallel: `getMenu()`, `getSettings()`, `getFundProgress(goal)`, `listReviews(6)`.
If the menu call fails, the page still renders with a "Menu is taking a break — refresh in a
minute" block; other sections render normally.

| Order | Section | Data | States |
|---|---|---|---|
| 1 | Nav | cart count (browser) | Cart button hidden when empty |
| 2 | Hero | `kitchen_open` | Open: gold dot "Kitchen's open — order for pickup". Closed: ember dot "Kitchen's closed — get an email when it opens" (jumps to notify form) |
| 3 | Ticker + siapo band | static | — |
| 4 | Menu | `MenuItem[]`, `kitchen_open` | Tabs by category. Card → "Build your plate" sheet. Closed kitchen → sheet opens read-only, add button disabled "Kitchen's closed". Sold out → card dimmed, "Sold out" tag, no sheet |
| 5 | Dad's quote band | static (D32) | — |
| 6 | Road to the Truck | `FundProgress.percent`, donation presets/min/max | Parts per D27; bar to next part; "Chip in" presets + custom amount → `POST /api/donate` → redirect to Square. Always available (Invariant 4) |
| 7 | From 685 to 816 | Eddie's beats (§10, verbatim) | Pinned scroll; ONE beat visible at a time in a shared slot (fits phones). Phones (<640 px, motion on): the art goes edge to edge and a camera (SVG viewBox) zooms in about 2× and follows the truck from Samoa to KC; height capped at 27svh (20svh on screens ≤ 740 px tall) so the pin fits. All sizes: top padding clears the sticky nav while pinned; desktop art capped at 36vh. Reduced motion or no JS: whole scene, no pin, route drawn, all beats stacked |
| 8 | Reviews | `listReviews` | Real reviews only (never samples). Empty: "Be the first to review E.D." "Leave a review" → form → `POST /api/reviews`; success "Fa'afetai!" + Google button only if `google_review_url` set (D30) |
| 9 | Footer | — | Notify form → `POST /api/notify`; "Made with alofa in KC"; no socials (D30) |

## Build your plate (sheet)
- Required SINGLE list (waffle): radio, must pick. Optional SINGLE (combo): toggle.
  MULTIPLE (add-ons): steppers 0…`maxQtyPerOption`. Plate qty 1–20.
- Live price uses the same pure `priceCart` the server uses (display only — the server re-prices).
- "Add to order — $X" adds a cart line. Same item + same options → quantities merge (max 20).

## Cart (drawer)
- Lives in the browser (localStorage, try/catch; empty if unavailable). Max 30 lines.
- Name (required, ≤ 60) + note (≤ 200). Checkout → `POST /api/checkout` → `location = checkoutUrl`.
- Error codes → plain messages: `KITCHEN_CLOSED` "Eddie just closed the kitchen — your cart is
  saved"; `SOLD_OUT`/`UNKNOWN_ITEM`/`UNKNOWN_MODIFIER` "Something on your order changed — please
  review it" (+ server message); network/500 "Couldn't reach checkout — try again".
- Cart clears only when the confirmation page shows PAID.

## `/order/[token]` — confirmation (dynamic)
- `getOrderView(token)`; unknown token → 404 page.
- PENDING: "Confirming your payment…" and refresh every 3 s (max ~60 s, then "Refresh in a
  moment").
- PAID food: "Fa'afetai, {name}!" · receipt # · pickup address + instructions (if the owner hasn't
  set them: "Eddie will share pickup details") · "Keep your receipt # to review your plate".
  Clears the cart.
- PAID donation (shouldn't land here) / REFUNDED: short matching message.
- Headers: `Referrer-Policy: no-referrer`, `robots: noindex` (token is a bearer secret).

## `/donate/thanks` — after a chip-in
"Fa'afetai!" + the live truck road (percent may lag until Square's webhook lands — say "your
chip-in shows up on the road within a minute") + back home.

## Accessibility & motion
- Every control keyboard-reachable; sheet/drawer trap focus and close on Esc; visible focus.
- `prefers-reduced-motion`: logo lands in final state, no pin, no marquee, no tilt.
- Images: `next/image`; missing photo → brand placeholder (D33), never a broken image. Dish photos
  fade to transparent at the edges (`crop-menu.md`): cards show them `object-contain` on an ink +
  gold-glow stage; the hero shows Sweet Heat in an ink porthole inside the gold arch.
