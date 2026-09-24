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
