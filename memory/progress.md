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
