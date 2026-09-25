"use client";
// SOP: architecture/site-pages.md §7 + design-direction.md §10. Eddie's exact words (D29).
// Art: StoryArt.tsx (D36). Motion: pinned scroll draws Samoa → KC and shows ONE beat at a time in a shared slot (fits phones).
// Phones: a viewBox camera zooms in and follows the truck, Samoa → KC (art ~2× bigger).
// No JS / reduced motion: whole scene, route fully drawn, all beats stacked.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { CAMERA, KcArt, ROUTE, SamoaArt, ToonFilter } from "./StoryArt";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

export const BEATS = [
  {
    at: "Samoa · +685",
    text: "Surprisingly I grew up in a very small Samoan household. I’ve always been the one to “experiment” with food while my family tells me “nope” or “oh yaaaa”.",
  },
  {
    at: "Samoa → California → Missouri",
    text: "Parents moved from Samoa to California. Sought after better opportunities in MO, and we’ve been living the good ol Missouri way ever since.",
  },
  {
    at: "Kansas City · 816",
    text: "Growing up my dad always said, “there’s only 2 things that speak to the soul. Food, Or Music”. I’m not no singer so here we are cooking! I’m excited to stage different flavors and show that you can always put your own twist on what you love!",
  },
] as const;

export function Story685() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const path = root.current!.querySelector<SVGPathElement>("[data-route]")!;
      const slot = root.current!.querySelector<HTMLElement>("[data-slot]")!;
      const art = root.current!.querySelector<SVGSVGElement>("[data-art]")!;
      const len = path.getTotalLength();
      const mm = gsap.matchMedia();

      mm.add({ motion: "(prefers-reduced-motion: no-preference)", phone: "(max-width: 639px)" }, (ctx) => {
        const { motion, phone } = ctx.conditions as { motion: boolean; phone: boolean };
        if (!motion) {
          gsap.set("[data-truck]", { motionPath: { path, align: path, alignOrigin: [0.5, 0.8], end: 1 } });
          return;
        }
        slot.classList.add("grid-stack");
        // Camera first, so the pin measures the final layout.
        if (phone) {
          art.classList.add("camera");
          art.setAttribute("viewBox", CAMERA.samoa);
        }
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.set("[data-beat='1'], [data-beat='2']", { autoAlpha: 0, y: 24 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=220%", scrub: 0.6, pin: true },
        });
        tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 3 }, 0)
          .to("[data-truck]", { motionPath: { path, align: path, alignOrigin: [0.5, 0.8] }, ease: "none", duration: 3 }, 0)
          .to("[data-beat='0']", { autoAlpha: 0, y: -24, duration: 0.25 }, 0.9)
          .to("[data-beat='1']", { autoAlpha: 1, y: 0, duration: 0.25 }, 1.05)
          .to("[data-beat='1']", { autoAlpha: 0, y: -24, duration: 0.25 }, 1.9)
          .to("[data-beat='2']", { autoAlpha: 1, y: 0, duration: 0.25 }, 2.05);
        if (phone) tl.to(art, { attr: { viewBox: CAMERA.kc }, ease: "none", duration: 3 }, 0);
        return () => {
          slot.classList.remove("grid-stack");
          art.classList.remove("camera");
          art.setAttribute("viewBox", CAMERA.full);
        };
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="eddie" className="relative flex min-h-dvh scroll-mt-16 flex-col justify-center overflow-hidden bg-pacific px-4 pb-8 pt-[4.75rem] sm:px-8 sm:pb-12">
      <h2 className="font-display text-5xl uppercase leading-none short-phone:text-[min(2.75rem,12vw)] sm:text-8xl">
        From <span className="font-brush text-gold">685</span> to <span className="font-brush text-gold">816</span>
      </h2>
      <p className="mt-3 max-w-xl text-cream/80 tiny-phone:mt-2 tiny-phone:text-sm">
        Samoa&rsquo;s country code is +685. Kansas City&rsquo;s area code is 816. Eddie is everything in between.
      </p>

      <svg
        data-art
        viewBox={CAMERA.full}
        className="mt-4 max-h-[36vh] w-full sm:mt-6 [&.camera]:-mx-4 [&.camera]:max-h-[27svh] short-phone:[&.camera]:max-h-[20svh] tiny-phone:mt-3 tiny-phone:[&.camera]:max-h-[18svh] [&.camera]:w-[calc(100%+2rem)] [&.camera]:max-w-none"
        aria-hidden
      >
        {Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 1000} cy={40 + ((i * 53) % 420)} r="1.6" fill="#f3ead8" opacity="0.18" />
        ))}
        <defs>
          <ToonFilter />
        </defs>
        <SamoaArt />
        <KcArt />
        <text x="205" y="470" textAnchor="middle" fontFamily="var(--font-anton)" fontSize="20" fill="#f3ead8" letterSpacing="2">
          SAMOA · +685
        </text>
        <text x="790" y="206" textAnchor="middle" fontFamily="var(--font-anton)" fontSize="20" fill="#f3ead8" letterSpacing="2">
          KANSAS CITY · 816
        </text>
        <path d={ROUTE} fill="none" stroke="#f3ead8" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" opacity="0.5" />
        <path data-route d={ROUTE} fill="none" stroke="#f5b21a" strokeWidth="5" strokeLinecap="round" />
        <g data-truck>
          <rect x="-26" y="-22" width="44" height="22" rx="5" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="2" />
          <rect x="18" y="-14" width="10" height="14" rx="3" fill="#0b0b0b" stroke="#f5b21a" strokeWidth="2" />
          <text x="-4" y="-6" textAnchor="middle" fontFamily="var(--font-knewave)" fontSize="11" fill="#f5b21a">
            E.D.
          </text>
          <circle cx="-14" cy="2" r="5" fill="#f5b21a" />
          <circle cx="16" cy="2" r="5" fill="#f5b21a" />
        </g>
      </svg>

      <div data-slot className="mt-4 grid gap-4 tiny-phone:mt-3 sm:mt-6 [&.grid-stack>*]:[grid-area:1/1]">
        {BEATS.map((b, i) => (
          <figure key={b.at} data-beat={i} className="m-0 max-w-2xl rounded-2xl bg-ink/40 p-5 backdrop-blur tiny-phone:p-4">
            <p className="font-display uppercase tracking-widest text-gold">{b.at}</p>
            <blockquote className="m-0 mt-2 text-cream/90 tiny-phone:mt-1 tiny-phone:text-[15px] sm:text-lg">{b.text}</blockquote>
            <figcaption className="mt-2 text-sm text-cream/60 tiny-phone:mt-1">— Eddie</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
