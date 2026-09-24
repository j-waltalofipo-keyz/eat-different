// Navigation — SOP: architecture/menu-sync.md (display read, 60 s cache)
import { respond } from "@/execution/lib/http";
import { getSettings } from "@/execution/settings";
import { getMenu } from "@/execution/square/getMenu";

export async function GET() {
  return respond(async () => {
    const [items, settings] = await Promise.all([getMenu(), getSettings()]);
    return { kitchenOpen: settings.kitchen_open, items };
  });
}
