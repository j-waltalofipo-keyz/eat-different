"use client";
// SOP: menu-admin.md. Every dish at a glance: photo, price, "on the menu" + "sold out tonight" switches, Edit.
import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { formatUsd } from "@/execution/lib/money";
import type { AdminMenuItem } from "@/execution/square/getMenu";
import { setDishFlag } from "../actions";
import { Chip, Switch } from "../ui";

const SAVED: Record<string, string> = {
  added: "Added to the menu ✓ It's live on the site.",
  updated: "Changes saved ✓ They're live on the site.",
  "photo-failed": "Saved — but the photo didn't upload. Open the dish and try the photo again.",
};

type Flags = { hidden: boolean; siteSoldOut: boolean };

function DishRow({ item }: { item: AdminMenuItem }) {
  const [flags, setFlags] = useOptimistic<Flags, Partial<Flags>>({ hidden: item.hidden, siteSoldOut: item.siteSoldOut }, (f, p) => ({ ...f, ...p }));
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const flip = (flag: "hidden" | "sold_out", value: boolean) =>
    start(async () => {
      setError(null);
      setFlags(flag === "hidden" ? { hidden: value } : { siteSoldOut: value });
      const res = await setDishFlag(item.itemId, flag, value).catch(() => ({ error: "Couldn't save — check your connection and try again." }));
      if (res.error) setError(res.error);
    });
  const soldOut = flags.siteSoldOut || item.squareSoldOut;

  return (
    <li className={`rounded-3xl border border-cream/10 bg-[#131313] p-4 transition-opacity sm:p-5 ${flags.hidden ? "opacity-60" : ""}`}>
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,178,26,0.18),transparent_65%),#0b0b0b] sm:h-24 sm:w-24">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="" fill sizes="96px" className={item.imageUrl.startsWith("/images/") ? "object-contain" : "object-cover"} />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-center text-[10px] uppercase tracking-widest text-cream/35">No photo</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-2xl uppercase leading-tight">{item.name}</p>
              {item.subtitle && <p className="truncate font-brush text-cream/80">{item.subtitle}</p>}
            </div>
            <p className="font-brush text-2xl text-gold">{formatUsd(item.priceCents).replace(".00", "")}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {flags.hidden && <Chip>Hidden</Chip>}
            {soldOut && <Chip tone="ember">Sold out{item.squareSoldOut ? " in Square" : ""}</Chip>}
            {item.modifierLists.map((l) => (
              <Chip key={l.id}>{l.name}</Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-cream/10 pt-4">
        <span className="flex items-center gap-3 text-sm">
          <Switch checked={!flags.hidden} onChange={(on) => flip("hidden", !on)} label={`Show ${item.name} on the menu`} />
          On the menu
        </span>
        <span className="flex items-center gap-3 text-sm">
          <Switch checked={flags.siteSoldOut} onChange={(on) => flip("sold_out", on)} label={`${item.name} sold out tonight`} />
          Sold out tonight
        </span>
        <Link href={`/admin/menu/${encodeURIComponent(item.itemId)}`} className="ml-auto min-h-11 rounded-full border border-cream/25 px-5 py-2.5 text-sm font-semibold hover:bg-cream/10">
          Edit
        </Link>
      </div>
      {item.squareSoldOut && <p className="mt-2 text-xs text-cream/50">Marked sold out in your Square app — change it there.</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#ffb3bd]">
          {error}
        </p>
      )}
    </li>
  );
}

export function MenuTab({ items, saved }: { items: AdminMenuItem[]; saved?: string }) {
  const categories = [...new Set(items.map((i) => i.category))];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase leading-none">Your menu</h1>
          <p className="mt-1 text-sm text-cream/60">Prices, photos and dishes save straight to Square, so your Square app matches.</p>
        </div>
        <Link href="/admin/menu/new" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-6 font-display text-lg uppercase tracking-wider text-ink hover:brightness-110">
          <span className="text-2xl leading-none">+</span> Add a dish
        </Link>
      </div>
      {saved && SAVED[saved] && (
        <p role="status" className={`rounded-2xl px-4 py-3 text-sm ${saved === "photo-failed" ? "bg-ember/15 text-[#ffb3bd]" : "bg-[#1f3d2a] text-[#8fe3a8]"}`}>
          {SAVED[saved]}
        </p>
      )}
      {categories.map((c) => (
        <section key={c} className="grid gap-3">
          <h2 className="font-display text-lg uppercase tracking-widest text-gold">{c}</h2>
          <ul className="grid gap-3">
            {items
              .filter((i) => i.category === c)
              .map((i) => (
                <DishRow key={i.itemId} item={i} />
              ))}
          </ul>
        </section>
      ))}
      {items.length === 0 && <p className="text-cream/60">No dishes yet — add your first one.</p>}
    </>
  );
}
