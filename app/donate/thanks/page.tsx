// Navigation — SOP: architecture/site-pages.md → /donate/thanks.
import type { Metadata } from "next";
import { getFundProgress } from "@/execution/fund/computeProgress";
import { getSettings } from "@/execution/settings";
import { TruckRoad } from "../../_components/TruckRoad";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fa'afetai! — E.D.", robots: { index: false } };

export default async function DonateThanks() {
  const settings = await getSettings();
  const fund = await getFundProgress(settings.fund_goal_cents).catch(() => null);
  return (
    <main>
      <section className="mx-auto grid max-w-3xl gap-4 px-4 pb-10 pt-16 sm:px-8">
        <a href="/" className="font-brush text-4xl text-gold">
          E.D.
        </a>
        <p className="font-brush text-7xl leading-none text-gold">Fa&rsquo;afetai!</p>
        <h1 className="font-display text-5xl uppercase leading-none">You just moved the truck.</h1>
        <p className="text-cream/80">Your chip-in shows up on the road within a minute. Thank you for backing Eddie.</p>
        <a href="/" className="justify-self-start rounded-full bg-gold px-6 py-3 font-display uppercase tracking-wider text-ink">
          Back to E.D.
        </a>
      </section>
      <TruckRoad
        percent={fund?.percent ?? null}
        showChipIn={false}
        donations={{ presetsCents: settings.donation_presets_cents, minCents: settings.donation_min_cents, maxCents: settings.donation_max_cents }}
      />
    </main>
  );
}
