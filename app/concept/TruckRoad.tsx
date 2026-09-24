"use client";
// Concept — design-direction.md §8 option A: the truck assembles along the road to the KC skyline.
// Demo slider + coin drop are preview-only (no money moves on /concept).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

const MILESTONES = [
  { at: 10, label: "Wheels" },
  { at: 25, label: "Grill" },
  { at: 50, label: "Awning" },
  { at: 75, label: "Crown" },
  { at: 100, label: "Keys!" },
];

function Truck({ pct }: { pct: number }) {
  const has = (at: number) => pct >= at;
  const part = (at: number) => `transition-all duration-500 ${has(at) ? "opacity-100" : "opacity-15"}`;
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full overflow-visible" aria-hidden>
      <g className={part(75)}>
        <path d="M58 6 L66 18 L74 4 L82 18 L90 6 L88 24 L60 24 Z" fill="#f5b21a" />
      </g>
      <rect x="8" y="26" width="120" height="56" rx="10" fill="#0b0b0b" />
      <rect x="128" y="44" width="26" height="38" rx="6" fill="#0b0b0b" />
      <rect x="134" y="50" width="16" height="14" rx="3" fill="#f3ead8" opacity="0.8" />
      <rect x="22" y="38" width="70" height="30" rx="4" fill="#f5b21a" />
      <text x="57" y="60" textAnchor="middle" fontFamily="var(--font-knewave)" fontSize="20" fill="#0b0b0b">E.D.</text>
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
    </svg>
  );
}

function Skyline() {
  const b = [
    [0, 50, 22], [24, 30, 18], [44, 64, 16], [62, 18, 24], [88, 40, 14], [104, 8, 12], [118, 36, 20], [140, 56, 26],
  ];
  return (
    <svg viewBox="0 0 170 110" className="h-full w-full" aria-hidden>
      {b.map(([x, y, w]) => (
        <rect key={x} x={x} y={y} width={w} height={110 - y!} fill="#0b0b0b" opacity="0.85" />
      ))}
      <text x="85" y="104" textAnchor="middle" fontFamily="var(--font-anton)" fontSize="12" fill="#f5b21a" letterSpacing="2">
        KANSAS CITY
      </text>
    </svg>
  );
}

export function TruckRoad() {
  const root = useRef<HTMLElement>(null);
  const [pct, setPct] = useState(3);
  const next = MILESTONES.find((m) => pct < m.at);
  const prevAt = [...MILESTONES].reverse().find((m) => pct >= m.at)?.at ?? 0;
  const toNext = next ? Math.round(((pct - prevAt) / (next.at - prevAt)) * 100) : 100;

  const { contextSafe } = useGSAP({ scope: root });
  const chipIn = contextSafe((amount: number) => {
    const coin = document.createElement("span");
    coin.textContent = `$${amount}`;
    coin.className = "pointer-events-none absolute z-20 rounded-full bg-gold px-3 py-1 font-brush text-xl text-ink shadow-lg";
    root.current?.querySelector("[data-coin-layer]")?.appendChild(coin);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.fromTo(
      coin,
      { left: "50%", top: -10, xPercent: -50, rotate: -20, autoAlpha: 1 },
      {
        left: `${Math.min(pct, 92)}%`,
        top: 150,
        rotate: 360,
        autoAlpha: 0,
        duration: reduce ? 0.01 : 0.9,
        ease: "power2.in",
        onComplete: () => coin.remove(),
      },
    );
    setPct((p) => Math.min(100, Math.round((p + amount / 10) * 10) / 10)); // demo only
  });

  return (
    <section ref={root} id="truck" className="bg-cream px-4 py-20 text-ink sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="font-brush text-2xl text-ember">every plate moves us</p>
          <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">The road to the truck</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-8xl leading-none sm:text-9xl">
            {pct}
            <span className="text-5xl">%</span>
          </p>
          <p className="text-sm uppercase tracking-widest">of the way to Eddie&rsquo;s truck</p>
        </div>
      </div>

      <div className="relative mt-12 h-56 sm:h-64" data-coin-layer>
        <div className="absolute inset-x-0 bottom-8 h-3 rounded-full bg-ink/15" />
        <div className="absolute bottom-8 left-0 h-3 rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
        {MILESTONES.map((m) => (
          <div key={m.at} className="absolute bottom-0 -translate-x-1/2 text-center" style={{ left: `${m.at === 100 ? 97 : m.at}%` }}>
            <div className={`mx-auto mb-1 h-6 w-1 ${pct >= m.at ? "bg-ember" : "bg-ink/25"}`} />
            <span className={`font-display text-xs uppercase tracking-wider ${pct >= m.at ? "" : "opacity-40"}`}>{m.label}</span>
          </div>
        ))}
        <div className="absolute bottom-10 right-0 h-20 w-28 sm:h-36 sm:w-52">
          <Skyline />
        </div>
        <div
          className="absolute bottom-10 h-24 w-36 -translate-x-1/2 transition-[left] duration-700 ease-out sm:h-28 sm:w-44"
          style={{ left: `${Math.max(12, Math.min(pct, 66))}%` }}
        >
          <Truck pct={pct} />
        </div>
      </div>

      <p className="mt-6 text-sm">
        {next ? (
          <>
            Next up: <strong>{next.label}</strong> — {toNext}% of the way there.
          </>
        ) : (
          <strong>We got the truck. Fa&rsquo;afetai, KC!</strong>
        )}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <span className="font-display text-xl uppercase">Chip in:</span>
        {[5, 10, 25, 50].map((a) => (
          <button key={a} onClick={() => chipIn(a)} className="rounded-full bg-ink px-6 py-3 font-brush text-2xl text-gold transition-transform hover:scale-105 active:scale-95">
            ${a}
          </button>
        ))}
        <span className="text-xs opacity-70">Support for a small business — not tax-deductible.</span>
      </div>

      <label className="mt-10 block rounded-xl border-2 border-dashed border-ink/30 p-4 text-sm">
        <span className="font-display uppercase tracking-wider">Concept demo — drag to preview the journey</span>
        <input type="range" min={0} max={100} step={0.5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[#d7263d]" />
      </label>
    </section>
  );
}
