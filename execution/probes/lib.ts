// Shared helpers for Phase L handshake probes. Loads .env, never prints secret values.
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";

config({ quiet: true });

export type ProbeResult = { service: string; ok: boolean; detail: string };

/** Returns the values, or throws listing every missing name (names only — never values). */
export function requireEnv<const K extends string>(...names: K[]): Record<K, string> {
  const missing = names.filter((n) => !process.env[n]?.trim());
  if (missing.length) throw new Error(`missing in .env: ${missing.join(", ")}`);
  return Object.fromEntries(names.map((n) => [n, process.env[n]!.trim()])) as Record<K, string>;
}

export function print(r: ProbeResult): void {
  console.log(`${r.ok ? "✅" : "❌"} ${r.service.padEnd(9)} ${r.detail}`);
}

export function saveResults(results: ProbeResult[]): void {
  mkdirSync(".tmp", { recursive: true });
  const file = ".tmp/probe-results.json";
  writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
}

/** Runs a probe, converting any thrown error into a failed result. */
export async function run(service: string, fn: () => Promise<string>): Promise<ProbeResult> {
  try {
    return { service, ok: true, detail: await fn() };
  } catch (e) {
    return { service, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}
