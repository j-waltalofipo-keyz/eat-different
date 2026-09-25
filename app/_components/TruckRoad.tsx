"use client";
// SOPs: truck-fund.md, donations.md, design-direction.md §8 (D27: truck parts only). Live percent,
// never dollars. Chip in → POST /api/donate → Square's hosted page. Always open (Invariant 4).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { formatUsd } from "@/execution/lib/money";
import { MILESTONES, truckProgress } from "@/execution/site/milestones";
import { KC_FRAME, KcArt, ToonFilter } from "./StoryArt";

gsap.registerPlugin(useGSAP);

function Truck({ reached }: { reached: number[] }) {
  const part = (at: number) => `transition-opacity duration-500 ${reached.includes(at) ? "opacity-100" : "opacity-15"}`;
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full overflow-visible" aria-hidden>
      <g className={part(75)}>
        <path d="M58 6 L66 18 L74 4 L82 18 L90 6 L88 24 L60 24 Z" fill="#f5b21a" />
      </g>
      <rect x="8" y="26" width="120" height="56" rx="10" fill="#0b0b0b" />
      <rect x="128" y="44" width="26" height="38" rx="6" fill="#0b0b0b" />
      <rect x="134" y="50" width="16" height="14" rx="3" fill="#f3ead8" opacity="0.8" />
      <rect x="22" y="38" width="70" height="30" rx="4" fill="#f5b21a" />
      <text x="57" y="60" textAnchor="middle" fontFamily="var(--font-knewave)" fontSize="20" fill="#0b0b0b">
        E.D.
      </text>
      <g className={part(50)}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${18 + i * 13} 30 h13 v8 a6.5 6.5 0 0 1 -13 0 z`} fill={i % 2 ? "#f3ead8" : "#d7263d"} />
        ))}
      </g>
      <g className={part(25)}>
        <path d="M100 48 q4 -8 0 -14 M108 48 q4 -8 0 -14 M116 48 q4 -8 0 -14" stroke="#d7263d" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g className={part(10)}>
        <circle cx="38" cy="86" r="13" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="4" />
        <circle cx="130" cy="86" r="13" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="4" />
      </g>
      {reached.includes(100) && (
        <text x="80" y="18" textAnchor="middle" fontFamily="var(--font-knewave)" fontSize="16" fill="#d7263d">
          🔑
        </text>
      )}
    </svg>
  );
}

/** The same KC skyline as Eddie's story (StoryArt, D39): ink outline on cream + a lit sign. */
function Skyline() {
  return (
    <svg viewBox={KC_FRAME} className="h-auto w-full overflow-visible" aria-hidden>
      <defs>
        <ToonFilter id="truck-toon" />
      </defs>
      <KcArt line="#0b0b0b" filterId="truck-toon" road={false} sign />
    </svg>
  );
}

export type DonationLimits = { presetsCents: number[]; minCents: number; maxCents: number };

export function TruckRoad({ percent, donations, showChipIn = true }: { percent: number | null; donations: DonationLimits; showChipIn?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const p = percent ?? 0;
  const { reached, next, toNextPct } = truckProgress(p);

  const { contextSafe } = useGSAP({ scope: root });
  const dropCoin = contextSafe((label: string) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
    const coin = document.createElement("span");
    coin.textContent = label;
    coin.className = "pointer-events-none absolute z-20 rounded-full bg-gold px-3 py-1 font-brush text-xl text-ink shadow-lg";
    root.current?.querySelector("[data-coin-layer]")?.appendChild(coin);
    return new Promise<void>((done) =>
      gsap.fromTo(
        coin,
        { left: "50%", top: -10, xPercent: -50, rotate: -20, autoAlpha: 1 },
        { left: `${Math.max(12, Math.min(p, 66))}%`, top: 140, rotate: 360, autoAlpha: 0, duration: 0.7, ease: "power2.in", onComplete: () => (coin.remove(), done()) },
      ),
    );
  });

  const chipIn = async (amountCents: number) => {
    setError(null);
    if (!Number.isInteger(amountCents) || amountCents < donations.minCents || amountCents > donations.maxCents) {
      setError(`Chip in anywhere from ${formatUsd(donations.minCents)} to ${formatUsd(donations.maxCents)}.`);
      return;
    }
    setBusy(amountCents);
    const [res] = await Promise.all([
      fetch("/api/donate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amountCents }) })
        .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
        .catch(() => ({ ok: false, data: {} as Record<string, string> })),
      dropCoin(formatUsd(amountCents).replace(".00", "")),
    ]);
    if (res.ok && res.data.checkoutUrl) {
      window.location.href = res.data.checkoutUrl;
      return;
    }
    setError(res.data.message ?? "Couldn't reach checkout. Try again.");
    setBusy(null);
  };

  return (
    <section ref={root} id="truck" className="scroll-mt-16 bg-cream px-4 py-20 text-ink sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-brush text-2xl text-ember">every plate moves us</p>
          <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">The road to the truck</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-8xl leading-none tabular-nums sm:text-9xl">
            {percent === null ? "—" : p}
            <span className="text-5xl">%</span>
          </p>
          <p className="text-sm uppercase tracking-widest">of the way to Eddie&rsquo;s truck</p>
        </div>
      </div>

      <div className="relative mt-12 h-56 sm:h-64" data-coin-layer>
        <div className="absolute inset-x-0 bottom-8 h-3 rounded-full bg-ink/15" />
        <div className="absolute bottom-8 left-0 h-3 rounded-full bg-gold transition-all duration-700" style={{ width: `${p}%` }} />
        {MILESTONES.map((m) => (
          <div key={m.at} className="absolute bottom-0 -translate-x-1/2 text-center" style={{ left: `${m.at === 100 ? 96 : m.at}%` }}>
            <div className={`mx-auto mb-1 h-6 w-1 ${reached.includes(m.at) ? "bg-ember" : "bg-ink/25"}`} />
            <span className={`font-display text-xs uppercase tracking-wider ${reached.includes(m.at) ? "" : "opacity-40"}`}>{m.label}</span>
          </div>
        ))}
        <div className="absolute bottom-10 right-0 w-48 sm:w-[24rem]">
          <Skyline />
        </div>
        <div className="absolute bottom-10 h-24 w-36 -translate-x-1/2 transition-[left] duration-700 ease-out sm:h-28 sm:w-44" style={{ left: `${Math.max(12, Math.min(p, 66))}%` }}>
          <Truck reached={reached} />
        </div>
      </div>

      <div className="mt-6 max-w-md">
        {next ? (
          <>
            <p className="text-sm">
              Next part: <strong>{next.label}</strong>
            </p>
            <div className="mt-2 h-2 rounded-full bg-ink/15" aria-hidden>
              <div className="h-2 rounded-full bg-ember transition-all duration-700" style={{ width: `${toNextPct}%` }} />
            </div>
          </>
        ) : (
          <p className="font-display text-2xl uppercase">We got the truck. Fa&rsquo;afetai, KC!</p>
        )}
      </div>

      {showChipIn && (
        <div className="mt-10 grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-xl uppercase">Chip in:</span>
            {donations.presetsCents.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy !== null}
                onClick={() => chipIn(c)}
                className="min-h-12 rounded-full bg-ink px-6 py-3 font-brush text-2xl text-gold transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {busy === c ? "…" : formatUsd(c).replace(".00", "")}
              </button>
            ))}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                chipIn(Math.round(Number(custom.replace(/[$,\s]/g, "")) * 100));
              }}
            >
              <label className="sr-only" htmlFor="chip-custom">
                Other amount in dollars
              </label>
              <input
                id="chip-custom"
                inputMode="decimal"
                placeholder="Other $"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="min-h-12 w-28 rounded-full border-2 border-ink/30 bg-transparent px-4 font-display text-lg placeholder:text-ink/40"
              />
              <button type="submit" disabled={busy !== null || !custom.trim()} className="min-h-12 rounded-full border-2 border-ink px-5 font-display uppercase tracking-wider disabled:opacity-40">
                Go
              </button>
            </form>
          </div>
          {error && (
            <p role="alert" className="rounded-xl border-2 border-ember bg-ember/10 p-3 text-sm font-medium text-ink">
              {error}
            </p>
          )}
          <p className="text-xs opacity-70">Support for a small business, not tax-deductible. You pay on Square&rsquo;s secure page.</p>
        </div>
      )}
    </section>
  );
}
