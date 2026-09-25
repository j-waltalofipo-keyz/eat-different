"use client";
// SOP: admin.md → Layout. Top bar (kitchen switch always visible) + tabs. Tabs are ?tab= links so Back works.
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { logout, sendOpenAlertAction, toggleKitchen } from "./actions";
import { TABS, type Tab } from "./tabs";
import { Switch } from "./ui";

const ICONS: Record<Tab, React.ReactNode> = {
  orders: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6M9 12h6M9 16h4" />,
  menu: <path d="M4 11h16a8 8 0 0 1-16 0zm2-3c0-2.5 2.7-4 6-4s6 1.5 6 4M3 15h18M12 4v2" />,
  site: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />,
  fund: <path d="M2 16V8h11v8M13 11h4l3 3v2h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  reviews: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
};
const LABELS: Record<Tab, string> = { orders: "Orders", menu: "Menu", site: "Site", fund: "Truck fund", reviews: "Reviews" };

function KitchenSwitch({ open, subscribers }: { open: boolean; subscribers: number }) {
  const [shown, setShown] = useOptimistic(open);
  const [pending, start] = useTransition();
  const [prompt, setPrompt] = useState<null | "ask" | "sending" | string>(null);

  const flip = (next: boolean) =>
    start(async () => {
      setShown(next);
      await toggleKitchen(next);
      setPrompt(next && subscribers > 0 ? "ask" : null);
    });
  const email = () =>
    start(async () => {
      setPrompt("sending");
      const { sent, failed } = await sendOpenAlertAction();
      setPrompt(failed ? `Sent to ${sent}. ${failed} didn't go through.` : `Sent to ${sent} ${sent === 1 ? "person" : "people"} ✓`);
    });

  return (
    <div className="grid gap-2">
      <div
        className={`flex items-center justify-between gap-4 rounded-3xl border px-5 py-4 transition-colors ${
          shown ? "border-gold/50 bg-gold/10" : "border-cream/10 bg-cream/[0.04]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`relative flex h-3 w-3`}>
            {shown && <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-60 motion-safe:animate-ping" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${shown ? "bg-gold" : "bg-ember"}`} />
          </span>
          <div>
            <p className="font-display text-xl uppercase tracking-wide">Kitchen {shown ? "open" : "closed"}</p>
            <p className="text-sm text-cream/60">{shown ? "Taking orders on the website" : "Menu is view-only; donations still work"}</p>
          </div>
        </div>
        <Switch size="lg" checked={shown} onChange={flip} disabled={pending} label={shown ? "Close the kitchen" : "Open the kitchen"} />
      </div>
      {prompt && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gold/40 bg-[#1a1608] px-5 py-3 text-sm">
          {prompt === "ask" ? (
            <>
              <span>
                You&rsquo;re open! Email the <strong>{subscribers}</strong> {subscribers === 1 ? "person" : "people"} waiting to hear?
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={email} className="min-h-11 rounded-full bg-gold px-5 font-display uppercase tracking-wider text-ink">
                  Email them
                </button>
                <button type="button" onClick={() => setPrompt(null)} className="min-h-11 rounded-full border border-cream/30 px-4">
                  Not now
                </button>
              </span>
            </>
          ) : (
            <>
              <span>{prompt === "sending" ? "Sending…" : prompt}</span>
              {prompt !== "sending" && (
                <button type="button" onClick={() => setPrompt(null)} className="min-h-11 px-3 text-cream/60" aria-label="Dismiss">
                  ×
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Shell({ tab, kitchenOpen, subscribers, waiting, children }: { tab: Tab; kitchenOpen: boolean; subscribers: number; waiting: number; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink pb-24 text-cream">
      <header className="mx-auto grid max-w-5xl gap-4 px-4 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-brush text-4xl text-gold">E.D.</span>
            <span className="hidden font-display text-sm uppercase tracking-[0.3em] text-cream/50 sm:inline">Kitchen office</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <a href="/" target="_blank" rel="noopener" className="min-h-11 whitespace-nowrap rounded-full px-3 py-2.5 text-cream/70 hover:bg-cream/10 hover:text-cream">
              View site ↗
            </a>
            <form action={logout}>
              <button className="min-h-11 whitespace-nowrap rounded-full px-3 text-cream/70 hover:bg-cream/10 hover:text-cream">Log out</button>
            </form>
          </div>
        </div>
        <KitchenSwitch open={kitchenOpen} subscribers={subscribers} />
      </header>

      <nav aria-label="Dashboard" className="sticky top-0 z-30 mt-4 border-b border-cream/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-2 sm:px-5 [scrollbar-width:none]">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/admin?tab=${t}`}
              aria-current={t === tab ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-display text-sm uppercase tracking-wider transition-colors ${
                t === tab ? "bg-cream text-ink" : "text-cream/70 hover:bg-cream/10 hover:text-cream"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONS[t]}
              </svg>
              {LABELS[t]}
              {t === "orders" && waiting > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ember px-1.5 text-xs text-cream">{waiting}</span>}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-4 sm:px-6">{children}</main>
    </div>
  );
}
