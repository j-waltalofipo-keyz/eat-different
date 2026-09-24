"use client";
// Concept — design-direction.md §7 Hero: logo reveal, pointer-tilt dish, rotating sticker, kitchen pill.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Logo } from "./Logo";

gsap.registerPlugin(useGSAP);

function Sticker() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full motion-safe:animate-[spin_18s_linear_infinite]" aria-hidden>
      <defs>
        <path id="ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="98" fill="#0b0b0b" />
      <text fill="#f5b21a" fontSize="17" letterSpacing="3.2" fontFamily="var(--font-anton)">
        <textPath href="#ring">TALOFA • KANSAS CITY • EDDIE&apos;S KITCHEN • 816 •</textPath>
      </text>
      <text x="100" y="118" textAnchor="middle" fill="#f3ead8" fontSize="46" fontFamily="var(--font-knewave)">
        E.D.
      </text>
    </svg>
  );
}

/** Illustrated stand-in until the dish photos are cropped from the menu. */
function Waffle() {
  const cells = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push(<rect key={`${r}${c}`} x={62 + c * 30} y={62 + r * 30} width="22" height="22" rx="4" fill="#b8741f" />);
  return (
    <svg viewBox="0 0 280 280" className="h-full w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" aria-hidden>
      <circle cx="140" cy="140" r="118" fill="#e7a445" />
      <circle cx="140" cy="140" r="118" fill="none" stroke="#c98a2e" strokeWidth="10" />
      {cells}
      <path d="M40 110 C90 90 120 170 170 130 S240 150 250 120" stroke="#f5b21a" strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.95" />
      <path d="M60 190 C110 170 150 220 210 185" stroke="#d7263d" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const dish = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const rx = gsap.quickTo(dish.current, "rotationY", { duration: 0.6, ease: "power3" });
        const ry = gsap.quickTo(dish.current, "rotationX", { duration: 0.6, ease: "power3" });
        const x = gsap.quickTo(dish.current, "x", { duration: 0.8, ease: "power3" });
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          rx(nx * 30);
          ry(-ny * 24);
          x(nx * 30);
        };
        window.addEventListener("pointermove", move);
        return () => window.removeEventListener("pointermove", move);
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(dish.current, { y: 120, rotate: -25, autoAlpha: 0, duration: 1.1, ease: "power4.out", delay: 1.4 });
        gsap.from("[data-hero-copy]", { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.1, delay: 2.1 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-ink px-4 pb-20 pt-6 sm:px-8">
      <nav className="relative z-10 flex items-center justify-between">
        <span className="font-brush text-3xl text-gold">E.D.</span>
        <div className="hidden gap-6 font-display text-sm uppercase tracking-widest sm:flex">
          <a href="#menu">Menu</a>
          <a href="#truck">The Truck</a>
          <a href="#eddie">Eddie</a>
          <a href="#reviews">Reviews</a>
        </div>
        <a href="#menu" className="rounded-full bg-gold px-5 py-2 font-display uppercase tracking-wider text-ink">
          Order
        </a>
      </nav>

      <div className="relative z-10 mt-20 grid items-center gap-14 sm:mt-28 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p data-hero-copy className="mb-6 font-display text-lg uppercase tracking-[0.3em] text-gold">Talofa, Kansas City 👋</p>
          <Logo />
          <p data-hero-copy className="mt-8 max-w-md text-lg text-cream/85">
            Comfort food. Different rules. Hot honey chicken on birthday-cake waffles, smashed burgers, and
            teriyaki after dark — cooked by Eddie.
          </p>
          <div data-hero-copy className="mt-8 flex flex-wrap gap-3">
            <a href="#menu" className="rounded-full bg-gold px-7 py-3 font-display text-lg uppercase tracking-wider text-ink">
              See the menu
            </a>
            <a href="#truck" className="rounded-full border-2 border-cream px-7 py-3 font-display text-lg uppercase tracking-wider">
              Chip in for the truck
            </a>
          </div>
          <p data-hero-copy className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-ember" /> Kitchen closed right now — <u>get an email when it opens</u>
          </p>
        </div>

        {/* The gold arch — the one bold color field — frames only the dish, never the text. */}
        <div className="relative mx-auto grid h-[25rem] w-[19rem] place-items-center rounded-t-full bg-gold sm:h-[32rem] sm:w-[25rem]">
          <div className="h-64 w-64 [perspective:900px] sm:h-80 sm:w-80">
            <div ref={dish} className="h-full w-full [transform-style:preserve-3d]">
              <Waffle />
            </div>
          </div>
          <div className="absolute -bottom-8 -left-8 h-28 w-28 sm:h-36 sm:w-36">
            <Sticker />
          </div>
          <span className="absolute -right-3 top-16 rotate-6 rounded-md bg-ink px-3 py-1 font-brush text-2xl text-gold">$12</span>
          <span className="absolute bottom-4 right-6 max-w-[9rem] rotate-[-4deg] text-right font-display text-sm uppercase leading-tight text-ink">
            The Sweet Heat · hot honey chicken + waffle
          </span>
        </div>
      </div>
    </section>
  );
}
