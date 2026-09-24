// Phase L runner. Usage: tsx execution/probes/probe-all.ts [square|supabase|resend ...] [--send]
// Prints ✅/❌ per service, saves .tmp/probe-results.json, exits 1 if any link is broken.
import { print, run, saveResults } from "./lib";
import { probeResend } from "./probe-resend";
import { probeSquare } from "./probe-square";
import { probeSupabase } from "./probe-supabase";

const probes = {
  square: () => probeSquare(),
  supabase: () => probeSupabase(),
  resend: () => probeResend(process.argv.includes("--send")),
};
type Name = keyof typeof probes;

const picked = process.argv.slice(2).filter((a): a is Name => a in probes);
const names = picked.length ? picked : (Object.keys(probes) as Name[]);

const results = [];
for (const name of names) {
  const r = await run(name, probes[name]);
  print(r);
  results.push(r);
}
saveResults(results);
// exitCode, not process.exit(): exiting while fetch sockets are still closing crashes Node on
// Windows (libuv assertion in src\win\async.c).
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
