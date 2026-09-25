"use client";
// SOP: architecture/site-pages.md → Menu. Tabs + dish cards; a card opens "Build your plate".
import { useState } from "react";
import type { MenuItem } from "@/execution/schemas";
import { MenuCard } from "./MenuCard";
import { PlateSheet } from "./PlateSheet";

export function Menu({ items, kitchenOpen, pickupArea = null, drink = null }: { items: MenuItem[] | null; kitchenOpen: boolean; pickupArea?: string | null; drink?: string | null }) {
  const categories = items ? [...new Set(items.map((i) => i.category))] : [];
  const [tab, setTab] = useState(categories[0] ?? "");
  const [active, setActive] = useState<MenuItem | null>(null);
  const shown = (items ?? []).filter((i) => i.category === tab);

  return (
    <section id="menu" className="scroll-mt-16 bg-ink px-4 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">
          The <span className="font-brush text-gold">menu</span>
        </h2>
        <p className="max-w-xs text-cream/70">
          {kitchenOpen
            ? `Tap a plate to build it your way. Pickup only${pickupArea ? ` in ${pickupArea}` : ""}, and your exact spot shows up after you pay.`
            : "The kitchen's closed right now. Look around, and we'll email you when it opens."}
        </p>
      </div>

      {!items ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-cream/30 p-6 text-cream/80">
          The menu is taking a break. Refresh in a minute.
        </p>
      ) : (
        <>
          {drink && (
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm">
              <span aria-hidden>🥤</span> Drink of the day: <strong className="font-semibold text-gold">{drink}</strong>
            </p>
          )}
          <div role="tablist" aria-label="Menu categories" className={`${drink ? "mt-6" : "mt-10"} flex flex-wrap gap-2`}>
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={tab === c}
                onClick={() => setTab(c)}
                className={`min-h-11 rounded-full border-2 px-5 py-2 font-display uppercase tracking-wider transition-colors ${
                  tab === c ? "border-gold bg-gold text-ink" : "border-cream/30 text-cream hover:border-gold"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item) => (
              <MenuCard key={item.variationId} item={item}>
                {!item.soldOut && (
                  <button type="button" onClick={() => setActive(item)} className="absolute inset-0 z-20 rounded-2xl" aria-label={`Build ${item.name}`} />
                )}
              </MenuCard>
            ))}
          </div>
        </>
      )}

      {active && <PlateSheet key={active.variationId} item={active} kitchenOpen={kitchenOpen} drink={drink} onClose={() => setActive(null)} />}
    </section>
  );
}
