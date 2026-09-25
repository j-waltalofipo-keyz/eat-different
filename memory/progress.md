# Progress — what was done, errors hit, tests run, results

## 2026-09-22
- **Phase B:** Blueprint discovery done (5 questions + follow-ups). Plan approved by owner.
  Changes during review: brand is "Eat. Different." (not "Eat Difference"); goal $42,000;
  direct donations added; menu image received and transcribed; combo/add-on rules confirmed.
- **Protocol 0:** created CLAUDE.md, memory/*, architecture/, execution/, reference/, .tmp/,
  .gitignore, .env.example, .env (empty values), `architecture/menu-seed.json`; `git init`.
- **Phase L:** probe scripts written (`execution/probes/`: lib, probe-square, probe-supabase,
  probe-resend, probe-all) + schema `execution/db/001_init.sql` (RLS on, no policies, kitchen
  starts closed). Deps: square 46.0.0, @supabase/supabase-js 2.117, resend 6.28, tsx, dotenv.
  - `npx tsc --noEmit` → exit 0.
  - Dry run `npm run probe:all` with empty .env → all ❌ "missing in .env: …" (names only, no
    values printed), exit 1. Expected — confirms fail-closed behavior.
  - Note: npm 11 skipped esbuild's postinstall (allow-scripts); tsx still runs fine.
  - Waiting on owner to create API keys.

## 2026-09-23
- **Phase L — Square ✅** `npm run probe:square` → `sandbox · location "Default Test Account"
  (ACTIVE) · 0 catalog items`, exit 0. Catalog empty as expected (seeded in Phase A).
- **Phase L — Supabase (partial):**
  - Error 1: `SUPABASE_URL` held the dashboard page URL
    (`https://supabase.com/dashboard/project/<ref>`), not the API URL. Fixed that one line to
    `https://vrmdkvvydasazvcswdca.supabase.co` (not a secret). → lesson for supabase SOP.
  - Error 2: `SUPABASE_SERVICE_ROLE_KEY` empty. Anon key is a legacy JWT (`eyJ…`). Waiting on owner.
  - Project "E.D." (ref vrmdkvvydasazvcswdca, ca-central-1, Postgres 17) found via connector.
  - Applied migration `001_init` via connector → 6 tables, RLS on all, settings row 1 present.
  - Security advisor: only INFO `rls_enabled_no_policy` ×6 — intentional (deny-all to anon;
    server uses service role).
  - Patched probe-supabase to reject non-API URLs with a clear message (self-annealing).
- **Phase L — Supabase ✅** owner added service_role key → `npm run probe:supabase` →
  `schema ok · kitchen closed · RLS blocks anon`, exit 0.
- **Phase L — Resend (key ✅):** `npm run probe:resend` → `key accepted`, but process then
  crashed: `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c`,
  exit -1073740791.
  - Analyze: libuv/Windows crash from `process.exit()` while fetch sockets close; not a Resend issue.
  - Patch: probe-all uses `process.exitCode` instead of `process.exit()`.
  - Test: `tsc` clean; `npm run probe:all` ×3 → all ✅, exit 0 each time.
  - Architecture: lesson written to new SOP `architecture/link-probes.md`.
  - Owner said yes → `npm run probe:resend:send` → ❌ 403 `validation_error`: test sender only
    delivers to the Resend account's own address (jared.key87@gmail.com); OWNER_EMAIL is a
    different address. Nothing sent. Blueprint impact: alerts to anyone other than the Resend
    account holder need a verified domain → decision pending with owner.
  - Decision: test with jared.key87@gmail.com now; permanent alert inbox decided in Phase T.
    Set `OWNER_EMAIL` line only → `probe:resend:send` ✅ sent, id
    01a0d0de-61d9-7339-93c0-b16e4fd5883e, exit 0.
- **Phase L — Resend ✅** owner confirmed the test email arrived in the inbox.
- **Phase L — Vercel ✅** (owner approved a public placeholder)
  - Connector `create_deployment` (inline `index.html` from `execution/probes/vercel-hello/`,
    target production) → project `eat-different` (prj_HiF5uwrB1hFWbwXwxCvPxvd8ZWDV),
    deployment dpl_H8eSwmxYqiusqBEtQQXnnJNYhmmT, READY, region iad1.
  - `https://eat-different.vercel.app` → 200, title "Eat. Different. — Coming soon";
    screenshot in browser pane renders black/gold/cream placeholder correctly.
  - Team + per-deployment URLs → 302 to vercel.com/sso-api (Deployment Protection, expected).
  - Added `probe-vercel.ts` + `SITE_URL` (in .env.example and appended to .env).
- **PHASE L COMPLETE ✅** `npm run probe:all` → square ✅ supabase ✅ resend ✅ vercel ✅, exit 0.
  Phase A unlocked.

### Phase A — session 1 (2026-09-23)
- Owner decisions D15–D19 (website-only fund, no tax, tips on food only, full refunds only,
  ASAP pickup); technical decisions D20–D23.
- SOPs written first: menu-sync, checkout, donations, square-webhook, truck-fund, reviews,
  notify-list, owner-alert-email.
- Next.js 16.3.6 / React 19.3 / Tailwind 4.3 / zod 4.6 / Vitest 5.0 scaffold → `next build` ✅.
- Tools in `execution/` (lib, schemas, settings, square/*, orders/*, fund/*, reviews/*,
  notify/*, email/*) + routes in `app/api/*`. `tsc` ✅.
- `npm run seed:catalog` → Sandbox catalog: 6 items, 3 modifier lists, 4 categories.
  - Bug 1: "-15 updated" — Square counts nested variations/modifiers in idMappings. Fixed:
    count top-level objects by temp id. Bug 2: modifier list order lost. Fixed: `ordinal`.
  - Re-runs → `0 created, 13 updated`, still 6 items (idempotent ✅).
- Migration `002_fund_total` (security-invoker view, anon/authenticated revoked) → advisors: only
  the expected INFO lint.
- `npm test` → **47/47 ✅** (priceCart rules incl. $20.00 case, fund math, refunds, webhook
  signature, event parsing, reviews matching, kitchen gate, pickup guard, emails, links).
  `tsc` caught `LinkRequest` possibly-undefined in tests → `NonNullable<…>` fix.
- Live routes on `next dev` against sandbox: menu 200; checkout closed 409; bad input 400;
  donation $0.50 422; fund 0%; reviews empty; bad review 422; bad token 404; forged unsub 400.
- Opened kitchen via SQL → real sandbox checkout ($32.00, PICKUP/ASAP, metadata FOOD, tips on)
  + $10 donation link; order view → PENDING, `pickup: null` ✅. Kitchen closed again.
- Pending: admin auth decision; one hosted-checkout sandbox payment (owner enters test card) to
  verify buyer_email/receipt_number, payment recording, ledger, owner alert.
- Owner chose **password admin login** (D24). SOP `architecture/admin.md` written first.
  Tools: `execution/admin/{session,adminData,settingsForm}.ts`; Navigation: `app/admin/{auth,actions}.ts`,
  `forms.tsx`, `page.tsx`, `login/page.tsx` (functional, unstyled until Phase S).
  `ADMIN_PASSWORD` added to env schema (optional, ≥12) + empty line in `.env` for the owner.
- `npm test` → **53/53 ✅** (+ admin session expiry/tamper/password-change, settings form parsing).
- Live: `/admin` without or with forged cookie → 307 to `/admin/login`; login page renders.
- **Bug found by `next build`:** `/admin` + `/admin/login` prerendered ○ static — with the password
  unset, `isAdmin()` returned before touching cookies, so a redirect got baked in.
  Analyze → Patch (read cookie first + `dynamic = "force-dynamic"`) → Test (`next build`: all
  admin/api routes ƒ) → Architecture (lesson added to admin.md).

### Phase A — sandbox payment test (2026-09-23)
- Owner paid both sandbox links (hosted checkout, test card entered by owner).
- Ran the real completion path (`.tmp/confirm-payments.ts`): both payments COMPLETED; receipts
  `nlTZ` (food $32.00) / `PPiZ` (donation $10.00). getOrderView(token) self-healed → food PAID,
  pickup section returned; wrong token → null. completePayment(donation) → recorded. Replays →
  `firstTime:false` (no double count, no duplicate alert). Ledger: ORDER +500, DONATION +1000.
  Public fund: 0% ($15 / $42,000 = 0.036% → floors to 0.0).
- **Error: `buyer_email` MISSING on both payments** → reviews impossible.
  - Analyze (`.tmp/find-email.ts`): hosted checkout leaves `payment.buyer_email_address` empty;
    email + phone live on the order's PICKUP `recipient`. Donations: no email anywhere.
  - Architecture first: square-webhook.md + reviews.md updated.
  - Patch: pure `recipientEmail(order)`; recordPayment falls back to it for FOOD; plan repairs a
    PAID row missing its email. Test: 56/56 ✅ (+3), tsc ✅.
  - Live (`.tmp/verify-reviews.ts`): replay repaired `buyer_email` with no new alert; reviews:
    wrong email NOT_FOUND, donation receipt NOT_FOUND, real buyer ✅ (+ Google link),
    second → ALREADY_REVIEWED; public list exposes only displayName/rating/body/createdAt.
- Test data now in Supabase: 2 PAID orders, 2 ledger rows, 1 review → wipe in Phase T.
- Owner confirmed both owner alerts arrived in Gmail ("🔥 New order #nlTZ: $32.00",
  "🚚 Truck fund donation: $10.00") → alert delivery ✅ end to end.
- Stale-server incident: TaskStop left the first `next dev` node process (PID 44188) on :3000;
  new server hit EADDRINUSE while the old one answered. Verified PID command line → stopped it →
  fresh server "Ready". (Tooling lesson, not app logic.)
- **Admin login ✅** — owner set `ADMIN_PASSWORD` (13 chars; value never read) and logged in via
  the browser pane. Dashboard (read-only check): kitchen CLOSED; fund "$15.00 of $42,000.00 —
  public 0%"; notify list 0; 1 review with Hide button; settings prefilled $5.00 / $42,000.00 /
  $1.00–$1,000.00 / presets 5,10,25,50; pickup address, instructions, Google link empty.
- **Admin buttons ✅** (owner said "go ahead"): Open the kitchen → button flips, public
  `/api/menu` kitchenOpen true; Close the kitchen → kitchenOpen false, `POST /api/checkout` 409.
  Settings with preset $2,000 (> $1,000 max) → rejected "presets must be within min..max";
  reload shows presets unchanged (5,10,25,50) and kitchen CLOSED — nothing saved.
- **PHASE A COMPLETE ✅** (2026-09-23). Open owner items carried forward: Square seller terms
  for support payments; fill pickup address/instructions + Google review link before launch.
- Admin: logged-in dashboard and button tests done (see above). Phase A closed.

### Phase S — session 1 (2026-09-23)
- Owner brief: very clean, very different, very interactive; E.D. = Eddie (wordplay); logo must
  accentuate the E and the D; Eddie is Samoan, lives in Kansas City — weave into interactions.
- Studied 6 inspiration sites in the browser pane (banhmiworld.ca, therebelbites.co.uk,
  fedupfoodtrucks.com, defoodtruckclub.nl, nope.ee/ice-cream, pizza-amici.nl) → takeaways in
  `architecture/design-direction.md` §2.
- Wrote `architecture/design-direction.md` (DRAFT for sign-off): logo, palette, type, Samoa×KC,
  signature interactions, tracker decision, motion rules. Contrast measured with a script (my first
  guesses were wrong: ink/gold is 10.6:1, not 11.4) → ember restricted to large text/non-text.
- Fonts via next/font: Anton, Knewave, DM Sans (confirmed in Next's font data). GSAP 3.15 +
  @gsap/react 2.1.
- Built `/concept` (noindex): Logo reveal (E.D. → Eat. Different., "It's Eddie." wink), Hero
  (pointer-tilt waffle illustration in a gold arch, rotating TALOFA·KC sticker), ticker,
  siapo-inspired band, menu tabs + cards from menu-seed, Road to the Truck (option A demo slider,
  coin-drop chip-in), "From 685 to 816" pinned scroll route, SAMPLE-labeled polaroid reviews, footer.
- Issues found in the browser pane and fixed:
  - Everything animated looked invisible → the tab was in the background (rAF paused). Fronted
    the tab → animations run. (Not a bug; verification lesson.)
  - Gold arch sat behind body text on mobile (cream on gold ≈1.6:1, unreadable) → arch now frames
    only the dish.
  - Truck collided with the KC skyline at phone width → smaller skyline on mobile, truck clamped.
  - Duplicate SVG pattern ids from 3 siapo bands → unique `id` prop.
  - Copy said "get a text" but the notify list is email → fixed.
- Checks: tsc ✅, 56/56 ✅, `next build` ✅ (/concept static, admin/api dynamic).
- Open for production: mobile layout for the 685 story cards (show one at a time); reduced-motion
  verification; real dish photos (needs reference/menu.jpg); Eddie's story text.
- Owner asked for a shareable link to collect Eddie's input. Artifact `db`/`assets` would make the
  page organization-internal (outside viewers are view-only, can't write or upload) → built a
  capability-free review page instead: concept highlights (logo reveal, palette/type, menu cards,
  truck-road demo, 685→816 route) + 8-part questionnaire, draft kept in the viewer's browser,
  "Copy my answers" → Eddie texts/emails answers + photos to Jared.
  Published: https://claude.ai/artifact/BAFPKXgArVukrxKqC1D9GL (private until owner shares it).
- Owner: spell "Samoa"/"Samoan" plainly, no macron (D25) → fixed in review page, /concept,
  design-direction.md; removed the spelling question.

## 2026-09-24
- Owner shared the review page with Eddie. Waiting on his copied answers + photos (Phase S sign-off gate).
- **Eddie's answers received** (pasted by owner): Love it / Logo nailed it / Tracker A only / all 6
  cultural elements Keep / name "Eddie" / story in his words / no business details yet / sending
  menu image, dish photos, photo of Eddie, and an E.D. logo file. → D26–D30. **Phase S sign-off ✅.**
- Owner decisions: story = Eddie's words + only 2 spelling fixes (D29 confirmed); dad's quote gets
  its own band (D32); build production pages now, photos later (D33).
- **Error (mine):** first pass of the site copy made extra edits to Eddie's words (merged sentences,
  "MO"→"Missouri", added dashes/commas/caps). Owner approved only two fixes → restored Eddie's
  exact wording + the two fixes in design-direction.md §10 and /concept.

### Phase S — production pages (2026-09-24)
- SOP first: `architecture/site-pages.md` (sections, data, states, cart, confirmation, a11y).
- Pure helpers + tests: `execution/site/cart.ts` (merge/clamp/30-line cap/parse stored cart/
  CheckoutRequest), `execution/site/milestones.ts` (D27 parts + progress to next part). Seed
  `image` → null until the file exists, guarded by a test (D33). Tests 65/65 ✅.
- Components in `app/_components/`: Logo, Bands, Hero (live kitchen pill), Nav (cart count),
  Sheet (native <dialog>), Menu + PlateSheet (rules via the server's pure priceCart), CartProvider
  + CartDrawer (checkout → /api/checkout → Square), DadQuote (D32), TruckRoad (live %, parts only,
  chip-in → /api/donate), Story685 (Eddie's exact words, one beat at a time), Reviews (real only,
  form, Google button only if set), Footer (notify form). Pages: `/`, `/order/[token]` (+poller,
  clears cart when PAID), `/donate/thanks`. `next.config` headers: /order/* no-referrer + noindex.
- Live checks (kitchen opened via SQL for the test, closed after):
  - Home renders live data: kitchen pill flips open/closed; 4 tabs; fund 0% (correct); sections in order.
  - Sweet Heat sheet: add blocked until waffle chosen; Classic + 1 bacon → "Add to order — $13.50";
    cart drawer shows line + total, persisted to localStorage, nav "Your order · 1".
  - Exact cart payload → POST /api/checkout → 200 sandbox link (form not submitted in-browser).
  - /order/<bogus> → 404 with Referrer-Policy no-referrer + X-Robots-Tag noindex.
  - /order/<paid token> → "Fa'afetai, Phase A Test!", receipt nlTZ, $32.00, "Eddie will share
    pickup details" (no address set yet), review prompt. (First probe missed the greeting because
    of React's <!-- --> text markers — probe issue, not a page bug.)
- Fixed from the checks: card aria-label "Build your The Sweet Heat" → "Build The Sweet Heat";
  required-choice button now says "Choose your waffle first"; chip-in error contrast (ember text on
  cream 4.1:1) → ink text on ember tint; footer copy "One email…" → "We'll email you when…".
- Removed /concept (D34). `next build` ✅, all app routes dynamic.
- NOT yet verified visually: the browser pane was hidden/throttled (rAF paused), so screenshots
  stalled mid-animation. Pending: desktop + 375px + reduced-motion screenshots with the window in
  front; mobile pinned story single-slot check. Test data (1 review, test orders) still in Supabase.
