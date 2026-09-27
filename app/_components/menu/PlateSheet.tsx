"use client";
// SOP: architecture/site-pages.md → Build your plate. Validation reuses the server's pure priceCart.
import { useState } from "react";
import Image from "next/image";
import { AppError } from "@/execution/lib/errors";
import { formatUsd } from "@/execution/lib/money";
import type { MenuItem, ModifierList } from "@/execution/schemas";
import { priceCart } from "@/execution/square/priceCart";
import { MAX_QTY } from "@/execution/site/cart";
import { useCart } from "../cart/CartProvider";
import { Sheet } from "../Sheet";

type Selection = Record<string, number>; // option id → qty

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const btn =
    "grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border-2 border-cream/30 text-xl font-bold active:scale-95 disabled:opacity-30 transition-transform";
  return (
    <div className="flex items-center gap-2 sm:gap-3" role="group" aria-label={label}>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Fewer ${label}`}
      >
        −
      </button>
      <span className="w-6 text-center font-display text-lg sm:text-xl tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`More ${label}`}
      >
        +
      </button>
    </div>
  );
}

function SingleList({
  list,
  sel,
  setSel,
}: {
  list: ModifierList;
  sel: Selection;
  setSel: (s: Selection) => void;
}) {
  const choose = (id: string) => {
    const next = { ...sel };
    const already = next[id] === 1;
    for (const o of list.options) delete next[o.id];
    if (!(already && !list.required)) next[id] = 1; // optional lists can be un-picked
    setSel(next);
  };
  return (
    <div className="flex flex-wrap gap-2" role={list.required ? "radiogroup" : "group"} aria-label={list.name}>
      {list.options.map((o) => {
        const on = sel[o.id] === 1;
        return (
          <button
            key={o.id}
            type="button"
            role={list.required ? "radio" : undefined}
            aria-checked={list.required ? on : undefined}
            aria-pressed={list.required ? undefined : on}
            onClick={() => choose(o.id)}
            className={`min-h-11 rounded-full border-2 px-4 py-2 text-left text-sm sm:text-base font-medium transition-all ${
              on
                ? "border-gold bg-gold text-ink font-bold shadow-md scale-102"
                : "border-cream/30 text-cream hover:border-gold"
            }`}
          >
            {o.name}
            {o.priceCents > 0 && <span className="ml-2 font-brush text-sm sm:text-base">+{formatUsd(o.priceCents)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function PlateSheet({
  item,
  kitchenOpen,
  drink = null,
  onClose,
}: {
  item: MenuItem;
  kitchenOpen: boolean;
  drink?: string | null;
  onClose: () => void;
}) {
  const { dispatch, setDrawerOpen } = useCart();
  const [sel, setSel] = useState<Selection>({});
  const [qty, setQty] = useState(1);

  const allOptions = item.modifierLists.flatMap((l) => l.options);
  const modifiers = Object.entries(sel)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ id, qty: q }));
  const unitCents =
    item.priceCents +
    modifiers.reduce((sum, m) => sum + (allOptions.find((o) => o.id === m.id)?.priceCents ?? 0) * m.qty, 0);

  // Friendly label for the common case; other rule breaks show priceCart's message.
  const unmet = item.modifierLists.find((l) => l.required && !l.options.some((o) => (sel[o.id] ?? 0) > 0));
  let problem: string | null = unmet ? `${unmet.name} first` : null;
  if (!problem)
    try {
      priceCart({ items: [{ variationId: item.variationId, qty, modifiers }] }, [item]);
    } catch (e) {
      problem = e instanceof AppError ? e.message : "Something's off with this plate.";
    }

  const add = () => {
    dispatch({
      type: "add",
      line: {
        variationId: item.variationId,
        name: item.name,
        qty,
        unitCents,
        modifiers: modifiers.map((m) => ({
          ...m,
          name: allOptions.find((o) => o.id === m.id)?.name ?? "Option",
        })),
      },
    });
    onClose();
    setDrawerOpen(true);
  };

  return (
    <Sheet open onClose={onClose} label={`Build ${item.name}`}>
      <div className="flex flex-col min-h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 pb-24">
          {/* Header with Compact Food Thumbnail */}
          <div className="flex items-start gap-4 pr-10 border-b border-cream/10 pb-4">
            {item.imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gold/40 bg-ink shadow-md">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-brush text-base text-gold leading-none">build your plate</p>
              <h3 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-cream mt-1">{item.name}</h3>
              {item.subtitle && <p className="font-brush text-sm text-cream/80 mt-0.5">{item.subtitle}</p>}
              <p className="font-display text-lg text-gold mt-1">
                Base: {formatUsd(item.priceCents)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-cream/70 leading-relaxed">{item.description}</p>

          {/* Modifier Sections */}
          <div className="mt-5 grid gap-5">
            {item.modifierLists.map((list) => (
              <section key={list.id} className="rounded-2xl bg-cream/5 border border-cream/10 p-4 grid gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <h4 className="font-display text-lg sm:text-xl uppercase tracking-wide text-cream">
                    {list.name}
                  </h4>
                  <span className="font-sans text-xs uppercase tracking-wider text-gold font-semibold">
                    {list.required ? "• Required" : list.selection === "SINGLE" ? "• Optional" : `• Up to ${list.maxQtyPerOption} each`}
                  </span>
                </div>

                {drink && list.options.some((o) => /drink of the day/i.test(o.name)) && (
                  <p className="-mt-1 text-xs text-cream/70">
                    Today&rsquo;s drink: <strong className="text-gold">{drink}</strong>
                  </p>
                )}

                {list.selection === "SINGLE" ? (
                  <SingleList list={list} sel={sel} setSel={setSel} />
                ) : (
                  <ul className="grid gap-2">
                    {list.options.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-ink/60 border border-cream/10 px-3.5 py-2"
                      >
                        <span className="text-sm sm:text-base text-cream">
                          {o.name}{" "}
                          <span className="font-brush text-gold text-sm sm:text-base">
                            +{formatUsd(o.priceCents)}
                          </span>
                        </span>
                        <Stepper
                          label={o.name}
                          value={sel[o.id] ?? 0}
                          min={0}
                          max={list.maxQtyPerOption}
                          onChange={(n) => setSel({ ...sel, [o.id]: n })}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Fixed Sticky Action Bar at Bottom */}
        <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 z-30 flex items-center justify-between gap-3 border-t border-gold/30 bg-ink/98 px-5 py-3.5 sm:px-7 sm:py-4 backdrop-blur-xl shadow-[0_-15px_30px_rgba(0,0,0,0.8)]">
          <Stepper label="plates" value={qty} min={1} max={MAX_QTY} onChange={setQty} />
          <button
            type="button"
            disabled={!kitchenOpen || problem !== null}
            onClick={add}
            className="min-h-12 flex-1 rounded-full bg-gold px-4 sm:px-6 py-3 font-display text-base sm:text-lg uppercase tracking-wider text-ink font-bold shadow-lg active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            {!kitchenOpen ? "Kitchen's closed" : problem ?? `Add to order — ${formatUsd(unitCents * qty)}`}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
