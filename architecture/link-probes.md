# SOP — Link Probes (Phase L handshakes)

## Goal
Prove every external service answers with the credentials in `.env` before any business logic
runs. Broken link = halt.

## Inputs
`.env` keys listed in `.env.example`. Probes print key **names** only, never values.

## Tools
| Command | Checks | Side effects |
|---|---|---|
| `npm run probe:all` | all of the below | writes `.tmp/probe-results.json` |
| `npm run probe:square` | token works, `SQUARE_LOCATION_ID` exists, counts catalog items | none |
| `npm run probe:supabase` | API URL shape, service key reads `settings` row 1, anon key is blocked by RLS | none |
| `npm run probe:resend` | key accepted (`domains.list`; sending-only key also counts as valid) | none |
| `npm run probe:resend:send` | delivers ONE email to `OWNER_EMAIL` | **sends email — ask the owner first** |

Exit code 0 = all green, 1 = at least one ❌.

## Edge cases / lessons learned
- **Supabase URL:** must be `https://<ref>.supabase.co`. Owners often paste the dashboard page
  URL (`supabase.com/dashboard/project/<ref>`). The probe rejects it with a clear message; the
  ref at the end of the dashboard URL is the fix. (2026-09-23)
- **Supabase schema missing:** error code `PGRST205`/`42P01` → apply `execution/db/001_init.sql`.
- **Windows exit crash:** calling `process.exit()` while fetch sockets are closing triggers a
  libuv assertion (`src\win\async.c`, exit code -1073740791) even when every probe passed. Set
  `process.exitCode` and let Node exit naturally. (2026-09-23)
- **Resend test sender** (`onboarding@resend.dev`) only delivers to the Resend account owner's
  address until a domain is verified → `OWNER_EMAIL` must be that address.
