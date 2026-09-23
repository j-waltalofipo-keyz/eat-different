// Phase L handshake: Supabase responds, the service role key works, and the schema is applied.
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib";

export async function probeSupabase(): Promise<string> {
  const env = requireEnv("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin
    .from("settings")
    .select("kitchen_open, fund_goal_cents, fund_per_order_cents")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    throw new Error(missing ? "connected, but schema not applied — run execution/db/001_init.sql" : `${error.code}: ${error.message}`);
  }
  if (!data) throw new Error("settings table exists but row id=1 is missing");

  // RLS check: the public anon key must NOT be able to read settings (pickup address lives there).
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const leak = await anon.from("settings").select("id");
  if (leak.data?.length) throw new Error("RLS FAILURE: anon key can read settings");

  return `schema ok · kitchen ${data.kitchen_open ? "OPEN" : "closed"} · RLS blocks anon`;
}
