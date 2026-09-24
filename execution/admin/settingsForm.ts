// Pure: admin settings form (dollars, comma lists) → SettingsUpdate (cents). SOP: admin.md.
import { SettingsUpdateSchema, type SettingsUpdate } from "./adminData";

const dollarsToCents = (v: unknown): number => {
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  return s === "" ? NaN : Math.round(Number(s) * 100);
};

export function parseSettingsForm(get: (name: string) => unknown): SettingsUpdate {
  return SettingsUpdateSchema.parse({
    fund_per_order_cents: dollarsToCents(get("fund_per_order")),
    fund_goal_cents: dollarsToCents(get("fund_goal")),
    donation_min_cents: dollarsToCents(get("donation_min")),
    donation_max_cents: dollarsToCents(get("donation_max")),
    donation_presets_cents: String(get("donation_presets") ?? "")
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(dollarsToCents),
    pickup_address: String(get("pickup_address") ?? ""),
    pickup_instructions: String(get("pickup_instructions") ?? ""),
    google_review_url: String(get("google_review_url") ?? ""),
  });
}
