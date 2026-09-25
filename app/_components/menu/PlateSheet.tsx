"use client";
// SOP: architecture/site-pages.md → Build your plate. Validation reuses the server's pure priceCart.
import { useState } from "react";
import { AppError } from "@/execution/lib/errors";
import { formatUsd } from "@/execution/lib/money";
import type { MenuItem, ModifierList } from "@/execution/schemas";
import { priceCart } from "@/execution/square/priceCart";
import { MAX_QTY } from "@/execution/site/cart";
import { useCart } from "../cart/CartProvider";
import { Sheet } from "../Sheet";

type Selection = Record<string, number>; // option id → qty

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const btn = "grid h-11 w-11 place-items-center rounded-full border-2 border-cream/30 text-xl disabled:opacity-30";
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
        −
      </button>
      <span className="w-6 text-center font-display text-xl tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

function SingleList({ list, sel, setSel }: { list: ModifierList; sel: Selection; setSel: (s: Selection) => void }) {
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
            className={`min-h-11 rounded-full border-2 px-4 py-2 text-left font-medium transition-colors ${on ? "border-gold bg-gold text-ink" : "border-cream/30 hover:border-gold"}`}
          >
            {o.name}
            {o.priceCents > 0 && <span className="ml-2 font-brush">+{formatUsd(o.priceCents)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function PlateSheet({ item, kitchenOpen, onClose }: { item: MenuItem; kitchenOpen: boolean; onClose: () => void }) {
  const { dispatch, setDrawerOpen } = useCart();
  const [sel, setSel] = useState<Selection>({});
  const [qty, setQty] = useState(1);

  const allOptions = item.modifierLists.flatMap((l) => l.options);
  const modifiers = Object.entries(sel)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ id, qty: q }));
  const unitCents = item.priceCents + modifiers.reduce((sum, m) => sum + (allOptions.find((o) => o.id === m.id)?.priceCents ?? 0) * m.qty, 0);

  // Friendly label for the common case; other rule breaks show priceCart's message.
  const unmet = item.modifierLists.find((l) => l.required && !l.options.some((o) => (sel[o.id] ?? 0) > 0));
  let problem: string | null = unmet ? `${unmet.name} first` : null;
  if (!problem) try {
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
        modifiers: modifiers.map((m) => ({ ...m, name: allOptions.find((o) => o.id === m.id)?.name ?? "Option" })),
      },
    });
    onClose();
    setDrawerOpen(true);
  };

  return (
    <Sheet open onClose={onClose} label={`Build ${item.name}`}>
      <p className="font-brush text-xl text-gold">build your plate</p>
      <h3 className="pr-12 font-display text-4xl uppercase leading-none">{item.name}</h3>
      {item.subtitle && <p className="mt-1 font-brush text-lg">{item.subtitle}</p>}
      <p className="mt-3 text-sm text-cream/70">{item.description}</p>

      <div className="mt-6 grid gap-6">
        {item.modifierLists.map((list) => (
          <section key={list.id} className="grid gap-3">
            <h4 className="font-display text-xl uppercase tracking-wide">
              {list.name}
              <span className="ml-2 font-sans text-xs normal-case tracking-normal text-cream/60">
                {list.required ? "pick one" : list.selection === "SINGLE" ? "optional" : `optional, up to ${list.maxQtyPerOption} each`}
              </span>
            </h4>
            {list.selection === "SINGLE" ? (
              <SingleList list={list} sel={sel} setSel={setSel} />
            ) : (
              <ul className="grid gap-2">
                {list.options.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/5 px-4 py-2">
                    <span>
                      {o.name} <span className="font-brush text-gold">+{formatUsd(o.priceCents)}</span>
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

      <div className="sticky bottom-0 -mx-5 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 bg-ink px-5 pt-4 sm:-mx-7 sm:px-7">
        <Stepper label="plates" value={qty} min={1} max={MAX_QTY} onChange={setQty} />
        <button
          type="button"
          disabled={!kitchenOpen || problem !== null}
          onClick={add}
          className="min-h-12 flex-1 rounded-full bg-gold px-6 py-3 font-display text-lg uppercase tracking-wider text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!kitchenOpen ? "Kitchen's closed" : problem ?? `Add to order — ${formatUsd(unitCents * qty)}`}
        </button>
      </div>
    </Sheet>
  );
}
