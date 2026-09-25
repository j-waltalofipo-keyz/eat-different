// Navigation — SOP: architecture/site-pages.md → "/". Server reads tools; islands call /api/*.
import { getFundProgress } from "@/execution/fund/computeProgress";
import { listReviews } from "@/execution/reviews/listReviews";
import { getSettings } from "@/execution/settings";
import { getMenu } from "@/execution/square/getMenu";
import { SiapoBand, Ticker } from "./_components/Bands";
import { CartDrawer } from "./_components/cart/CartDrawer";
import { CartProvider } from "./_components/cart/CartProvider";
import { DadQuote } from "./_components/DadQuote";
import { Footer } from "./_components/Footer";
import { Hero } from "./_components/Hero";
import { Menu } from "./_components/menu/Menu";
import { Nav } from "./_components/Nav";
import { Reviews } from "./_components/Reviews";
import { Story685 } from "./_components/Story685";
import { TruckRoad } from "./_components/TruckRoad";

export const dynamic = "force-dynamic"; // kitchen status, menu, fund and reviews are live

const settled = async <T,>(p: Promise<T>, what: string): Promise<T | null> =>
  p.catch((e) => {
    console.error(`home: ${what} failed`, e);
    return null;
  });

export default async function Home() {
  const settings = await getSettings();
  const [menu, fund, reviews] = await Promise.all([
    settled(getMenu(), "menu"),
    settled(getFundProgress(settings.fund_goal_cents), "fund"),
    settled(listReviews(6), "reviews"),
  ]);

  return (
    <CartProvider>
      <Nav />
      <main>
        <Hero kitchenOpen={settings.kitchen_open} />
        <Ticker />
        <SiapoBand id="siapo-1" />
        <Menu items={menu} kitchenOpen={settings.kitchen_open} />
        <SiapoBand id="siapo-2" />
        <DadQuote />
        <TruckRoad
          percent={fund?.percent ?? null}
          donations={{
            presetsCents: settings.donation_presets_cents,
            minCents: settings.donation_min_cents,
            maxCents: settings.donation_max_cents,
          }}
        />
        <Story685 />
        <SiapoBand id="siapo-3" />
        <Reviews
          reviews={reviews?.reviews ?? []}
          summary={reviews?.summary ?? { average: null, count: 0 }}
          googleReviewUrl={settings.google_review_url}
        />
      </main>
      <Footer kitchenOpen={settings.kitchen_open} />
      <CartDrawer kitchenOpen={settings.kitchen_open} />
    </CartProvider>
  );
}
