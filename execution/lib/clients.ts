// Lazily-created service clients. Server-only: they hold secret keys.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SquareClient, SquareEnvironment } from "square";
import { getEnv } from "./env";

let sq: SquareClient | null = null;
let sb: SupabaseClient | null = null;
let rs: Resend | null = null;

export function square(): SquareClient {
  const env = getEnv();
  return (sq ??= new SquareClient({
    token: env.SQUARE_ACCESS_TOKEN,
    environment: env.SQUARE_ENVIRONMENT === "sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
  }));
}

/** Service-role client: bypasses RLS. Only ever used on the server. */
export function db(): SupabaseClient {
  const env = getEnv();
  return (sb ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

export function mailer(): Resend {
  return (rs ??= new Resend(getEnv().RESEND_API_KEY));
}

/** Postgres unique_violation — the ledger/review "already recorded" signal. */
export const UNIQUE_VIOLATION = "23505";
