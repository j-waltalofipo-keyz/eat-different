"use client";
// D32: Eddie's dad's line, exactly as Eddie wrote it (CSS sets it in caps). Words rise on scroll.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LINE = "there’s only 2 things that speak to the soul.";
const PUNCH = "Food, Or Music";

export function DadQuote() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-word]", {
          yPercent: 110,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.05,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
      });
    },
    { scope: root },
  );

  const words = (text: string) =>
    text.split(" ").map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom">
        <span data-word className="inline-block pr-[0.25em]">
          {w}
        </span>
      </span>
    ));

  return (
    <section ref={root} aria-label="A word from Eddie's dad" className="bg-ink px-4 py-24 text-center sm:px-8">
      <blockquote className="mx-auto max-w-5xl">
        <p className="font-display text-[clamp(2.2rem,7vw,5.5rem)] uppercase leading-[1.02]">
          <span className="text-gold">“</span>
          {words(LINE)}
        </p>
        <p className="mt-2 font-brush text-[clamp(3rem,11vw,8rem)] leading-none text-gold">
          {words(PUNCH)}
          <span>”</span>
        </p>
        <footer className="mt-6 font-display text-lg uppercase tracking-[0.3em] text-cream/70">— Eddie&rsquo;s dad</footer>
      </blockquote>
    </section>
  );
}
