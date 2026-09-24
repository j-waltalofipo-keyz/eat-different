// SOPs: checkout.md, donations.md. The single settings row + the kitchen gate.
import { db } from "./lib/clients";
import { SettingsSchema, type Settings } from "./schemas";

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db().from("settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`settings: ${error.message}`);
  return SettingsSchema.parse(data);
}

/** Pure. Food needs the kitchen open; donations are always accepted (Invariant 4). */
export function canCheckout(kind: "FOOD" | "DONATION", settings: Pick<Settings, "kitchen_open">): boolean {
  return kind === "DONATION" || settings.kitchen_open;
}
