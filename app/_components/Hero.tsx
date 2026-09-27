"use client";
// design-direction.md §7 Hero (approved D26): logo reveal, pointer-tilt dish, rotating sticker, live kitchen pill.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useRef } from "react";
import { Logo, LOGO_REVEAL_AT } from "./Logo";
import { InteractiveEddie } from "./InteractiveEddie";

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

export function Hero({ kitchenOpen, nextOpen = null }: { kitchenOpen: boolean; nextOpen?: string | null }) {
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
        // Copy waits until E.D. opens up, so nothing competes with the E.D. moment (D40).
        gsap.from("[data-hero-copy]", { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.1, delay: LOGO_REVEAL_AT + 0.3 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative overflow-hidden bg-ink px-4 pb-20 pt-2 sm:px-8">
      <div className="relative z-10 mt-10 grid items-center gap-14 sm:mt-16 lg:grid-cols-[1.2fr_1fr]">
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
          {kitchenOpen ? (
            <p data-hero-copy className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Kitchen&rsquo;s open — <a href="#menu" className="underline">order for pickup</a>
            </p>
          ) : (
            <p data-hero-copy className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ember" />
              <span>
                Kitchen&rsquo;s closed{nextOpen && <> · usually back {nextOpen}</>} — <a href="#notify" className="underline">get an email when it opens</a>
              </span>
            </p>
          )}
        </div>

        {/* The gold arch — the one bold color field — frames the dish and Chef Eddie */}
        <div className="relative mx-auto grid h-[25rem] w-[19rem] place-items-center rounded-t-full bg-gold sm:h-[32rem] sm:w-[25rem]">
          <div className="h-64 w-64 [perspective:900px] sm:h-80 sm:w-80">
            {/* Porthole: the photo fades to transparent at its edges (crop-menu.md), so it melts into the ink plate. */}
            <div ref={dish} className="relative h-full w-full overflow-hidden rounded-full bg-ink shadow-[0_30px_40px_rgba(0,0,0,0.45)] ring-[6px] ring-ink">
              <Image src="/images/sweet-heat.webp" alt="The Sweet Heat: hot honey chicken on a waffle" fill sizes="(min-width:640px) 20rem, 16rem" loading="eager" fetchPriority="high" className="scale-110 object-cover" />
            </div>
          </div>

          {/* Interactive Chef Eddie Character Illustration */}
          <InteractiveEddie />

          <div className="absolute -bottom-8 -right-6 z-30 h-24 w-24 sm:-bottom-10 sm:-right-8 sm:h-32 sm:w-32">
            <Sticker />
          </div>
          <span className="absolute -right-3 top-16 z-30 rotate-6 rounded-md bg-ink px-3 py-1 font-brush text-2xl text-gold shadow-md">$12</span>
          <span className="absolute bottom-4 right-6 z-10 max-w-[9rem] rotate-[-4deg] text-right font-display text-sm uppercase leading-tight text-ink">
            The Sweet Heat · hot honey chicken + waffle
          </span>
        </div>
      </div>
    </section>
  );
}
