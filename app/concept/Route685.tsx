"use client";
// Concept — design-direction.md §6: "From 685 to 816" — scroll draws the route Samoa → Kansas City
// and the E.D. truck drives it. Story text is a placeholder for Eddie's own words.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

const ROUTE = "M120 400 C 260 380, 330 250, 470 260 S 700 330, 760 220 S 850 120, 880 110";

const BEATS = [
  { at: "Samoa · +685", text: "Talofa! [Eddie's roots — his family, his island, the food he grew up on. In his words.]" },
  { at: "Across the Pacific", text: "[How Eddie ended up in Kansas City.]" },
  { at: "Kansas City · 816", text: "Cooking from home, saving every dollar for a truck. Every plate you order moves him closer." },
];

export function Route685() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const path = root.current!.querySelector<SVGPathElement>("[data-route]")!;
      const len = path.getTotalLength();
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=180%", scrub: 0.6, pin: true },
        });
        tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 3 }, 0)
          .to("[data-truck]", { motionPath: { path, align: path, alignOrigin: [0.5, 0.8], autoRotate: false }, ease: "none", duration: 3 }, 0)
          .from("[data-beat='0']", { autoAlpha: 0, y: 30, duration: 0.4 }, 0.1)
          .from("[data-beat='1']", { autoAlpha: 0, y: 30, duration: 0.4 }, 1.3)
          .from("[data-beat='2']", { autoAlpha: 0, y: 30, duration: 0.4 }, 2.4);
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-truck]", { motionPath: { path, align: path, alignOrigin: [0.5, 0.8], end: 1 } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="eddie" className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-pacific px-4 py-16 sm:px-8">
      <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl">
        From <span className="font-brush text-gold">685</span> to <span className="font-brush text-gold">816</span>
      </h2>
      <p className="mt-3 max-w-xl text-cream/80">
        Samoa&rsquo;s country code is +685. Kansas City&rsquo;s area code is 816. E.D. is everything in between.
      </p>

      <svg viewBox="0 0 1000 480" className="mt-8 w-full" aria-hidden>
        {/* ocean dots */}
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 1000} cy={40 + ((i * 53) % 420)} r="1.6" fill="#f3ead8" opacity="0.18" />
        ))}
        {/* Samoa */}
        <ellipse cx="100" cy="408" rx="34" ry="11" fill="#f5b21a" />
        <ellipse cx="160" cy="418" rx="20" ry="7" fill="#f5b21a" />
        <text x="130" y="455" textAnchor="middle" fontFamily="var(--font-anton)" fontSize="18" fill="#f3ead8" letterSpacing="2">
          SAMOA · +685
        </text>
        {/* Kansas City */}
        {[0, 14, 24, 36, 48].map((dx, i) => (
          <rect key={dx} x={862 + dx} y={70 + (i % 2) * 14 - i * 3} width="10" height={40 - (i % 2) * 14 + i * 3} fill="#f5b21a" />
        ))}
        <text x="890" y="138" textAnchor="middle" fontFamily="var(--font-anton)" fontSize="18" fill="#f3ead8" letterSpacing="2">
          KANSAS CITY · 816
        </text>
        {/* dashed route (always) + drawn route (scroll) */}
        <path d={ROUTE} fill="none" stroke="#f3ead8" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" opacity="0.5" />
        <path data-route d={ROUTE} fill="none" stroke="#f5b21a" strokeWidth="5" strokeLinecap="round" />
        <g data-truck>
          <rect x="-26" y="-22" width="44" height="22" rx="5" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="2" />
          <rect x="18" y="-14" width="10" height="14" rx="3" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="2" />
          <text x="-4" y="-6" textAnchor="middle" fontFamily="var(--font-knewave)" fontSize="11" fill="#f5b21a">E.D.</text>
          <circle cx="-14" cy="2" r="5" fill="#f5b21a" />
          <circle cx="16" cy="2" r="5" fill="#f5b21a" />
        </g>
      </svg>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {BEATS.map((b, i) => (
          <div key={b.at} data-beat={i} className="rounded-2xl bg-ink/40 p-5 backdrop-blur">
            <p className="font-display uppercase tracking-widest text-gold">{b.at}</p>
            <p className="mt-2 text-cream/90">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
