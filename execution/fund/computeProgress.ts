// SOP: architecture/truck-fund.md. Public output is a percent — never dollars.
import { db } from "../lib/clients";

export type FundProgress = { percent: number; updatedAt: string };

/** Pure. */
export function computeProgress(totalCents: number, goalCents: number, now: Date): FundProgress {
  if (!(goalCents > 0)) throw new Error("fund goal must be positive");
  const raw = Math.floor((totalCents * 1000) / goalCents) / 10;
  return { percent: Math.min(100, Math.max(0, raw)), updatedAt: now.toISOString() };
}

/** IO. Reads the security-invoker `fund_total` view with the service role. */
export async function getFundProgress(goalCents: number): Promise<FundProgress> {
  const { data, error } = await db().from("fund_total").select("total_cents").single();
  if (error) throw new Error(`fund_total: ${error.message}`);
  return computeProgress(Number(data.total_cents ?? 0), goalCents, new Date());
}
