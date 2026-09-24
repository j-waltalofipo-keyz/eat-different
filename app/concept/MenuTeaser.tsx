"use client";
// Concept — design-direction.md §7 Menu: category tabs + bold dish cards with a "sizzle" hover.
import { useState } from "react";

export type TeaserItem = { name: string; subtitle: string | null; category: string; priceCents: number; ingredients: string[] };

function Steam() {
  return (
    <svg viewBox="0 0 60 40" className="pointer-events-none absolute left-1/2 top-2 h-10 w-16 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
      {[10, 30, 50].map((x, i) => (
        <path
          key={x}
          d={`M${x} 38 C${x - 6} 28 ${x + 6} 20 ${x} 10 S${x + 4} 2 ${x} 0`}
          stroke="#f3ead8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className="motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </svg>
  );
}

export function MenuTeaser({ items, categories }: { items: TeaserItem[]; categories: string[] }) {
  const [tab, setTab] = useState(categories[0]!);
  const shown = items.filter((i) => i.category === tab);

  return (
    <section id="menu" className="bg-ink px-4 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">
          The <span className="font-brush text-gold">menu</span>
        </h2>
        <p className="max-w-xs text-cream/70">Tap a plate to build it your way — waffle flavor, make it a combo, pile on add-ons.</p>
      </div>

      <div role="tablist" className="mt-10 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={tab === c}
            onClick={() => setTab(c)}
            className={`rounded-full border-2 px-5 py-2 font-display uppercase tracking-wider transition-colors ${
              tab === c ? "border-gold bg-gold text-ink" : "border-cream/30 text-cream hover:border-gold"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => (
          <article
            key={item.name}
            className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-gold/80 bg-[#141414] transition-transform duration-300 hover:-translate-y-2 motion-safe:hover:rotate-[-1deg]"
            style={{ transitionDelay: `${i * 20}ms` }}
          >
            <div className="relative grid h-52 place-items-center bg-[repeating-linear-gradient(135deg,#1c1c1c_0_12px,#161616_12px_24px)]">
              <Steam />
              <span className="font-display text-sm uppercase tracking-[0.3em] text-cream/40">Dish photo</span>
              <span className="absolute bottom-3 right-3 rotate-[-6deg] rounded-md bg-gold px-3 py-1 font-brush text-2xl text-ink shadow-md">
                ${(item.priceCents / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-3xl uppercase leading-tight text-gold">{item.name}</h3>
              {item.subtitle && <p className="font-brush text-lg text-cream">{item.subtitle}</p>}
              <p className="mt-3 text-sm text-cream/70">{item.ingredients.join(" · ")}</p>
              <button className="mt-5 self-start rounded-full bg-cream px-5 py-2 font-display uppercase tracking-wider text-ink transition-colors group-hover:bg-gold">
                Build your plate +
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
