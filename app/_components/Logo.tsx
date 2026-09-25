"use client";
// design-direction.md §3 (approved D26): "E.D." reveals itself as "Eat. Different."; hover/tap → "It's Eddie."
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

export function Logo() {
  const root = useRef<HTMLDivElement>(null);
  const [wink, setWink] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ delay: 0.25 })
          .set("[data-rest]", { clipPath: "inset(0 100% 0 0)" })
          .set("[data-dot]", { width: "0.3em", autoAlpha: 1 })
          .from("[data-letter]", { scale: 0.2, rotate: -14, autoAlpha: 0, duration: 0.65, ease: "back.out(2.4)", stagger: 0.14 })
          .from("[data-dot]", { scale: 0, duration: 0.25, ease: "back.out(3)", stagger: 0.1 }, "-=0.25")
          .from("[data-crown]", { y: -60, rotate: -30, autoAlpha: 0, duration: 0.7, ease: "bounce.out" }, "-=0.1")
          .to("[data-dot]", { width: 0, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "+=0.55")
          .to("[data-rest]", { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out", stagger: 0.12 }, "<0.1");
      });
    },
    { scope: root },
  );

  const Row = ({ letter, rest }: { letter: string; rest: string }) => (
    <div className="flex items-end leading-none">
      <span data-letter className="inline-block origin-bottom font-brush text-[clamp(5.5rem,24vw,13rem)] leading-[0.8] text-gold">
        {letter}
      </span>
      <span data-dot aria-hidden className="inline-block w-0 overflow-hidden font-brush text-[clamp(5.5rem,24vw,13rem)] leading-[0.8] text-gold opacity-0">
        .
      </span>
      <span data-rest className="mb-[0.08em] font-display text-[clamp(2.6rem,11.5vw,6.2rem)] uppercase leading-none tracking-tight text-cream">
        {rest}
      </span>
    </div>
  );

  return (
    <div
      ref={root}
      className="relative inline-block cursor-default select-none"
      onPointerEnter={() => setWink(true)}
      onPointerLeave={() => setWink(false)}
      onClick={() => setWink((w) => !w)}
    >
      <h1 aria-label="Eat. Different. — E.D.">
        <span data-crown aria-hidden className="absolute -top-[0.55em] left-[0.25em] block text-[clamp(2rem,8vw,4.5rem)] text-gold">
          ♛
        </span>
        <Row letter="E" rest="at." />
        <Row letter="D" rest="ifferent." />
      </h1>
      <span
        aria-hidden
        className={`absolute -right-4 top-1/2 rotate-[-8deg] rounded-full bg-ember px-4 py-2 font-brush text-lg text-cream shadow-lg transition-all duration-300 sm:-right-10 ${
          wink ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        It&rsquo;s Eddie. 👋
      </span>
    </div>
  );
}
