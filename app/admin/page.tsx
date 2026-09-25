// Navigation — SOP: architecture/admin.md. The owner dashboard: loads only what the open tab needs.
import { getAdminStats, listAllReviews } from "@/execution/admin/adminData";
import { computeProgress } from "@/execution/fund/computeProgress";
import { listOrderQueue } from "@/execution/orders/orderQueue";
import type { Settings } from "@/execution/schemas";
import { getSettings } from "@/execution/settings";
import { getAdminMenu } from "@/execution/square/getMenu";
import { requireAdmin } from "./auth";
import { Shell } from "./Shell";
import { asTab } from "./tabs";
import { FundTab, ReviewsTab } from "./tabs/FundReviewsTabs";
import { MenuTab } from "./tabs/MenuTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { SiteTab } from "./tabs/SiteTab";

export const metadata = { title: "E.D. Kitchen Office", robots: { index: false } };
export const dynamic = "force-dynamic"; // per-request session check; never prerender

function Trouble({ what }: { what: string }) {
  return (
    <p role="alert" className="rounded-3xl border border-ember/40 bg-ember/10 px-5 py-4">
      Couldn&rsquo;t load {what} just now. Refresh in a minute — if it keeps happening, Square or the database may be having a moment.
    </p>
  );
}

type Stats = Awaited<ReturnType<typeof getAdminStats>>;

async function TabContent({ tab, saved, settings, stats }: { tab: ReturnType<typeof asTab>; saved?: string; settings: Settings; stats: Stats }) {
  try {
    switch (tab) {
      case "orders": {
        const { waiting, done } = await listOrderQueue();
        return <OrdersTab waiting={waiting} done={done} kitchenOpen={settings.kitchen_open} renderedAt={Date.now()} />;
      }
      case "menu":
        return <MenuTab items={await getAdminMenu()} saved={saved} />;
      case "site":
        return <SiteTab settings={settings} subscribers={stats.subscribers} />;
      case "fund":
        return (
          <FundTab settings={settings} totalCents={stats.fundTotalCents} percent={computeProgress(stats.fundTotalCents, settings.fund_goal_cents, new Date()).percent} />
        );
      case "reviews":
        return <ReviewsTab reviews={await listAllReviews()} />;
    }
  } catch (e) {
    console.error(`admin ${tab} tab failed`, e);
    return <Trouble what={tab === "menu" ? "the menu from Square" : `the ${tab}`} />;
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string }> }) {
  await requireAdmin();
  const [{ tab: raw, saved }, settings, stats] = await Promise.all([searchParams, getSettings(), getAdminStats()]);
  const tab = asTab(raw, settings.kitchen_open);
  return (
    <Shell tab={tab} kitchenOpen={settings.kitchen_open} subscribers={stats.subscribers} waiting={stats.waiting}>
      <TabContent tab={tab} saved={saved} settings={settings} stats={stats} />
    </Shell>
  );
}
