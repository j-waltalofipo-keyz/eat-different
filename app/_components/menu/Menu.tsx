"use client";
// SOP: architecture/site-pages.md → Menu. Tabs + dish cards; a card opens "Build your plate".
import Image from "next/image";
import { useState } from "react";
import { formatUsd } from "@/execution/lib/money";
import type { MenuItem } from "@/execution/schemas";
import { PlateSheet } from "./PlateSheet";

function Steam() {
  return (
    <svg viewBox="0 0 60 40" className="pointer-events-none absolute left-1/2 top-2 z-10 h-10 w-16 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
      {[10, 30, 50].map((x, i) => (
        <path key={x} d={`M${x} 38 C${x - 6} 28 ${x + 6} 20 ${x} 10 S${x + 4} 2 ${x} 0`} stroke="#f3ead8" strokeWidth="3" strokeLinecap="round" fill="none" className="motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </svg>
  );
}

export function Menu({ items, kitchenOpen }: { items: MenuItem[] | null; kitchenOpen: boolean }) {
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
            ? "Tap a plate to build it your way. Pickup only, and your pickup spot shows up after you pay."
            : "The kitchen's closed right now. Look around, and we'll email you when it opens."}
        </p>
      </div>

      {!items ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-cream/30 p-6 text-cream/80">
          The menu is taking a break. Refresh in a minute.
        </p>
      ) : (
        <>
          <div role="tablist" aria-label="Menu categories" className="mt-10 flex flex-wrap gap-2">
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
              <article
                key={item.variationId}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-[#141414] transition-transform duration-300 ${
                  item.soldOut ? "border-cream/20 opacity-60" : "border-gold/80 hover:-translate-y-2 motion-safe:hover:rotate-[-1deg]"
                }`}
              >
                <div
                  className={`relative h-60 overflow-hidden ${
                    item.imageUrl
                      ? "bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,178,26,0.16),transparent_62%),#0b0b0b]"
                      : "bg-[repeating-linear-gradient(135deg,#1c1c1c_0_12px,#161616_12px_24px)]"
                  }`}
                >
                  {!item.soldOut && <Steam />}
                  {item.imageUrl ? (
                    // Photos fade to transparent at the edges (crop-menu.md), so they sit on the glow.
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw"
                      className="object-contain p-1 transition-transform duration-500 motion-safe:group-hover:scale-105"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-display text-sm uppercase tracking-[0.3em] text-cream/35">Photo coming soon</span>
                  )}
                  <span className="absolute bottom-3 right-3 rotate-[-6deg] rounded-md bg-gold px-3 py-1 font-brush text-2xl text-ink shadow-md">
                    {formatUsd(item.priceCents).replace(".00", "")}
                  </span>
                  {item.soldOut && (
                    <span className="absolute left-3 top-3 rotate-[-4deg] rounded bg-ember px-3 py-1 font-display uppercase tracking-widest text-cream">Sold out</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-3xl uppercase leading-tight text-gold">{item.name}</h3>
                  {item.subtitle && <p className="font-brush text-lg text-cream">{item.subtitle}</p>}
                  <p className="mt-3 text-sm text-cream/70">{item.description}</p>
                  <span className="mt-5 self-start rounded-full bg-cream px-5 py-2 font-display uppercase tracking-wider text-ink transition-colors group-hover:bg-gold">
                    {item.soldOut ? "Sold out" : "Build your plate +"}
                  </span>
                </div>
                {!item.soldOut && (
                  <button type="button" onClick={() => setActive(item)} className="absolute inset-0 z-20 rounded-2xl" aria-label={`Build ${item.name}`} />
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {active && <PlateSheet key={active.variationId} item={active} kitchenOpen={kitchenOpen} onClose={() => setActive(null)} />}
    </section>
  );
}
