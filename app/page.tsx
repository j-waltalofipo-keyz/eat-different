// Navigation — SOP: architecture/site-pages.md → "/". Server reads tools; islands call /api/*.
import { getFundProgress } from "@/execution/fund/computeProgress";
import { listReviews } from "@/execution/reviews/listReviews";
import { getSettings } from "@/execution/settings";
import { groupHours, nextOpening } from "@/execution/site/hours";
import { getMenu } from "@/execution/square/getMenu";
import { AnnouncementBar } from "./_components/AnnouncementBar";
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
      {settings.announcement_on && settings.announcement_text && <AnnouncementBar text={settings.announcement_text} />}
      <Nav />
      <main>
        <Hero kitchenOpen={settings.kitchen_open} nextOpen={settings.kitchen_open ? null : nextOpening(settings.hours, new Date())} />
        <Ticker />
        <SiapoBand id="siapo-1" />
        <Menu items={menu} kitchenOpen={settings.kitchen_open} pickupArea={settings.pickup_area} drink={settings.drink_of_the_day} />
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
      <Footer
        kitchenOpen={settings.kitchen_open}
        info={{
          hours: groupHours(settings.hours),
          hoursNote: settings.hours_note,
          pickupArea: settings.pickup_area,
          socials: { instagram: settings.instagram_url, tiktok: settings.tiktok_url, facebook: settings.facebook_url },
        }}
      />
      <CartDrawer kitchenOpen={settings.kitchen_open} />
    </CartProvider>
  );
}
