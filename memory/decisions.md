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
| D14 | 2026-09-23 | **Dev alerts go to jared.key87@gmail.com**; permanent E.D.-owner inbox decided in Phase T (buy + verify a domain, or owner's own Resend account) | Resend test sender only delivers to the account holder until a domain is verified. |
| D15 | 2026-09-23 | **Only website-created orders move the fund.** Webhook payments whose `order_id` has no row in `orders` are ignored (in-person/POS sales). | Owner's choice; every counted sale is traceable to a site order record. |
| D16 | 2026-09-23 | **No sales tax for now** — charge menu price exactly. | Owner will confirm local tax rules later; tax can be added in Square. |
| D17 | 2026-09-23 | **Tips allowed on food checkout only** (not donations). Tips never count toward the fund. | Owner's choice; a tip on a donation makes no sense. |
| D18 | 2026-09-23 | **Only a full refund reverses the fund.** Full = payment `refunded_money ≥ amount_money` (tip excluded). Partial refunds leave the fund unchanged. | Owner's choice; one REFUND row per order fits `UNIQUE(order, reason)`. |
| D19 | 2026-09-23 | **Pickup = ASAP.** PICKUP fulfillment with `schedule_type: ASAP`, no time slots. | Blueprint: kitchen open/closed toggle, no slots. |
| D20 | 2026-09-23 | **Confirmation URL = `/order/<token>`** (was `/order/[id]?t=token`) | Square assigns the order id only after the payment link is created, but `redirectUrl` must be set at creation. A random token alone is unguessable; only its hash is stored. |
| D21 | 2026-09-23 | **`MenuItem.category` = Square category name (string)**, not a fixed enum | Owner can add categories in the Square app without a code change. |
| D22 | 2026-09-23 | **Subtitle, image, add-on max qty come from `menu-seed.json`, matched by name** | Square has no field for them; prices/availability/modifiers still come only from Square. |
| D23 | 2026-09-23 | **`APP_SECRET`** (random 32 bytes, server-only) signs unsubscribe links | Prevents anyone unsubscribing someone else's email. |
| D24 | 2026-09-23 | **Admin login = one password** (`ADMIN_PASSWORD`, owner-set) + signed httpOnly cookie, 30 days. Replaces the planned Supabase magic link. Cookie key = HMAC(`APP_SECRET`, password) so changing the password logs everyone out. | Owner's choice: simplest, no Supabase Auth config, no extra package, no email dependency. Trade-off: shared password. |
| D25 | 2026-09-23 | **Spell "Samoa" / "Samoan" plainly — no macron or other marks** (owner) | Owner's instruction; applies to all copy, SVG labels, and docs. The spelling question was removed from Eddie's review. |
| D26 | 2026-09-24 | **Design direction APPROVED by Eddie** — overall look "Love it"; logo "Nailed it" ("Clever with the wink") | Phase S sign-off gate passed; production pages may be built. |
| D27 | 2026-09-24 | **Tracker = option A: truck parts only** (wheels 10%, grill 25%, awning 50%, crown 75%, keys 100%) + progress-to-next-part bar. **No public count** of plates/chip-ins. | Eddie's choice. |
| D28 | 2026-09-24 | **All Samoa × KC elements kept:** "Talofa!", "Fa'afetai!", "Made with alofa in KC", siapo-inspired bands, Samoan-flag red + blue, "From 685 to 816" | Eddie approved each one individually. |
| D29 | 2026-09-24 | **Name on the site: "Eddie."** Story copy comes from Eddie's own words (light typo fixes only, pending owner OK) | Eddie's answers. |
| D30 | 2026-09-24 | **No socials, hours, or Google profile yet** → footer/social links and the "Review us on Google" button stay hidden until provided; live Open/Closed covers hours | Eddie skipped section 6. |
| D31 | 2026-09-24 | **Real photos from Eddie replace menu crops** (dish photos, photo of Eddie, his E.D. logo file) — supersedes D13; menu crops only as fallback | Eddie is sending them. |
| D32 | 2026-09-24 | **Dad's quote gets its own full-width band** between Menu and Road to the Truck: "There's only 2 things that speak to the soul. Food, or music." — Eddie's dad | Owner's choice. |
| D33 | 2026-09-24 | **Build production pages now; photos drop in later** (image slots fall back to illustration/placeholder until files exist) | Owner's choice — no time lost waiting on photos. |
| D34 | 2026-09-24 | **Removed `/concept`** once the production home page replaced it; shared pieces moved to `app/_components/` | One copy of each component; the approved prototype stays in git history (632745d). |
| D35 | 2026-09-24 | **Interim dish photos = crops of the menu graphic** (`reference/menu.jpg` → `npm run assets:menu-crops` → `public/images/*.webp`), fixed coordinates in `architecture/menu-crops.json`. Edges fade to transparent; hero shows Sweet Heat in an ink porthole inside the gold arch. | Owner asked to use the menu photos for now. Eddie's real photos still replace them one-for-one (D31). |
| D36 | 2026-09-24 | **Story route endpoints = matching cartoony line art** (`app/_components/StoryArt.tsx`): real Savai'i + Upolu coastlines (simplified from the official map) with twin leaning palms + coconuts like the owner's reference, and a detailed KC skyline traced from the owner's reference silhouette. Shared style: cream outline, flat fills, hard ink offset shadow; Samoa by day, KC by night with lit gold windows. Route now runs Apia → the road at the skyline's base. | Owner request with three reference images (palm clip-art, Samoa map, KC skyline). |
| D37 | 2026-09-24 | **Eddie's dad is Karl David** → dad's quote credited "— Karl David, Eddie's dad" | Owner supplied the name. Kept "Eddie's dad" so visitors know who he is — owner can drop it. |
| D38 | 2026-09-24 | **Story art on phones = zoomed camera following the truck.** Below 640 px with motion on, the SVG goes edge to edge and its viewBox pans from a Samoa frame to a KC frame (`CAMERA` in StoryArt.tsx), making the art about 2× bigger (≈1.9× at 375×812). Reduced motion or no JS still shows the whole scene. | Owner asked for bigger art on phones. Phone height is the limit, so zooming and panning beats scaling the whole scene (only about 1.3× fit). |
