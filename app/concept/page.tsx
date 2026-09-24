// Design concept for owner sign-off (architecture/design-direction.md). Not the production site.
import type { Metadata } from "next";
import { loadSeed } from "@/execution/square/seed";
import { SiapoBand, Ticker } from "./Bands";
import { Hero } from "./Hero";
import { MenuTeaser, type TeaserItem } from "./MenuTeaser";
import { Footer, Reviews } from "./Reviews";
import { Route685 } from "./Route685";
import { TruckRoad } from "./TruckRoad";

export const metadata: Metadata = { title: "E.D. — design concept", robots: { index: false, follow: false } };

export default function ConceptPage() {
  const seed = loadSeed();
  const categoryName = new Map(seed.categories.map((c) => [c.key, c.name]));
  const items: TeaserItem[] = seed.items.map((i) => ({
    name: i.name,
    subtitle: i.subtitle,
    category: categoryName.get(i.category) ?? i.category,
    priceCents: i.priceCents,
    ingredients: i.ingredients,
  }));

  return (
    <>
      <p className="bg-ember py-1.5 text-center font-display text-xs uppercase tracking-[0.3em] text-cream">
        Design concept for sign-off — not the live site
      </p>
      <main>
        <Hero />
        <Ticker />
        <SiapoBand id="siapo-1" />
        <MenuTeaser items={items} categories={seed.categories.map((c) => c.name)} />
        <SiapoBand id="siapo-2" />
        <TruckRoad />
        <Route685 />
        <SiapoBand id="siapo-3" />
        <Reviews />
      </main>
      <Footer />
    </>
  );
}
