// Navigation — SOP: architecture/truck-fund.md (percent only, never dollars)
import { getFundProgress } from "@/execution/fund/computeProgress";
import { respond } from "@/execution/lib/http";
import { getSettings } from "@/execution/settings";

export async function GET() {
  return respond(async () => getFundProgress((await getSettings()).fund_goal_cents));
}
