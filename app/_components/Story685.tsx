"use client";
import React, { useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { CAMERA, KcArt, ROUTE, SamoaArt, ToonFilter } from "./StoryArt";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

export const BEATS = [
  {
    step: "01",
    tag: "🌴 Samoa · +685",
    title: "Family Roots & Flavor Experiments",
    text: "Surprisingly I grew up in a very small Samoan household. I’ve always been the one to “experiment” with food while my family tells me “nope” or “oh yaaaa”.",
    badge: "Origin",
  },
  {
    step: "02",
    tag: "🛣️ Samoa ➔ CA ➔ MO",
    title: "The Journey to the Heartland",
    text: "Parents moved from Samoa to California. Sought after better opportunities in MO, and we’ve been living the good ol Missouri way ever since.",
    badge: "The Road",
  },
  {
    step: "03",
    tag: "👑 Kansas City · 816",
    title: "Comfort Food, Different Rules",
    text: "Growing up my dad always said, “there’s only 2 things that speak to the soul. Food, Or Music”. I’m not no singer so here we are cooking! I’m excited to stage different flavors and show that you can always put your own twist on what you love!",
    badge: "E.D. Kitchen",
  },
] as const;

export function Story685() {
  const root = useRef<HTMLElement>(null);
  const [activeBeat, setActiveBeat] = useState(0);

  useGSAP(
    () => {
      const path = root.current?.querySelector<SVGPathElement>("[data-route]");
      const truck = root.current?.querySelector<SVGGElement>("[data-truck]");
      if (!path || !truck) return;

      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      // Animate route and truck as the section scrolls into view
      gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
          end: "bottom 80%",
          scrub: 0.8,
        },
      })
        .to(path, { strokeDashoffset: 0, ease: "power1.inOut" }, 0)
        .to(truck, { motionPath: { path, align: path, alignOrigin: [0.5, 0.8] }, ease: "power1.inOut" }, 0);
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="eddie"
      className="relative overflow-hidden bg-gradient-to-b from-ink via-[#0d1c3a] to-ink py-16 px-4 sm:px-8 border-y border-gold/20"
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-pacific/30 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/40 px-4 py-1.5 font-display text-xs uppercase tracking-widest text-gold shadow-sm">
            <span>🏝️ Samoa to KC Roots 🏈</span>
          </div>
          <h2 className="mt-3 font-display text-3xl uppercase tracking-tight text-cream sm:text-5xl">
            From <span className="font-brush text-gold">685</span> to <span className="font-brush text-gold">816</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base text-cream/75">
            Samoa&rsquo;s country code is +685. Kansas City&rsquo;s area code is 816. Eddie is everything in between.
          </p>
        </div>

        {/* Compact Map & Story Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
          {/* Visual Route Art Card */}
          <div className="relative rounded-3xl bg-ink/80 border border-gold/30 p-4 sm:p-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 text-xs font-display uppercase tracking-widest text-gold/90">
              <span>Samoa (685)</span>
              <span className="text-cream/50">── The Journey ──</span>
              <span>Kansas City (816)</span>
            </div>

            <svg
              viewBox={CAMERA.full}
              className="mt-3 max-h-[220px] w-full"
              aria-hidden
            >
              {Array.from({ length: 40 }, (_, i) => (
                <circle key={i} cx={(i * 97) % 1000} cy={40 + ((i * 53) % 420)} r="1.5" fill="#f3ead8" opacity="0.15" />
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
              <path d={ROUTE} fill="none" stroke="#f3ead8" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" opacity="0.4" />
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
          </div>

          {/* Interactive Story Beats Card */}
          <div className="flex flex-col gap-3">
            {/* Step Navigation Tabs */}
            <div className="flex rounded-xl bg-ink/70 p-1 border border-gold/20">
              {BEATS.map((beat, idx) => (
                <button
                  key={beat.step}
                  onClick={() => setActiveBeat(idx)}
                  className={`flex-1 rounded-lg py-2 px-2 text-xs font-display uppercase tracking-wider transition-all ${
                    activeBeat === idx
                      ? "bg-gold text-ink shadow-md font-bold"
                      : "text-cream/70 hover:text-cream hover:bg-gold/10"
                  }`}
                >
                  {beat.step}. {beat.badge}
                </button>
              ))}
            </div>

            {/* Active Story Card */}
            <div className="relative rounded-2xl bg-ink/75 border border-gold/30 p-6 shadow-xl backdrop-blur-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs uppercase tracking-widest text-gold font-bold">
                  {BEATS[activeBeat].tag}
                </span>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-display uppercase tracking-wider text-gold">
                  Part {BEATS[activeBeat].step} of 03
                </span>
              </div>

              <h3 className="mt-2 font-display text-xl uppercase tracking-wide text-cream">
                {BEATS[activeBeat].title}
              </h3>

              <p className="mt-3 text-base text-cream/90 leading-relaxed italic">
                &ldquo;{BEATS[activeBeat].text}&rdquo;
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-gold/15 pt-3 text-xs text-cream/60">
                <span>— Chef Eddie</span>
                <div className="flex gap-1.5">
                  {BEATS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBeat(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeBeat === idx ? "w-6 bg-gold" : "w-2 bg-cream/30 hover:bg-cream/60"
                      }`}
                      aria-label={`Go to story beat ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
