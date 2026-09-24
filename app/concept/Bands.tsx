// Concept — design-direction.md §6–7: siapo-inspired divider + ticker. Geometric, not tatau.

export function SiapoBand({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg className={`block h-8 w-full ${className}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <pattern id={id} width="48" height="32" patternUnits="userSpaceOnUse">
          <rect width="48" height="32" fill="#0b0b0b" />
          {/* teeth top + bottom */}
          <path d="M0 0 L6 6 L12 0 L18 6 L24 0 L30 6 L36 0 L42 6 L48 0 Z" fill="#f5b21a" />
          <path d="M0 32 L6 26 L12 32 L18 26 L24 32 L30 26 L36 32 L42 26 L48 32 Z" fill="#f5b21a" />
          {/* diamond + dots */}
          <path d="M24 9 L31 16 L24 23 L17 16 Z" fill="none" stroke="#f5b21a" strokeWidth="2" />
          <circle cx="24" cy="16" r="2" fill="#f5b21a" />
          <circle cx="6" cy="16" r="1.6" fill="#f5b21a" />
          <circle cx="42" cy="16" r="1.6" fill="#f5b21a" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const TICKER = ["Comfort food. Different rules.", "You know the food…", "you don't know E.D.", "Made with alofa in KC"];

export function Ticker() {
  const run = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden bg-gold py-4 text-ink" aria-label={TICKER.join(" ")}>
      <div className="flex w-max motion-safe:animate-[marquee_28s_linear_infinite]" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {run.map((t, i) => (
              <span key={`${copy}-${i}`} className="mx-6 font-display text-3xl uppercase tracking-tight sm:text-5xl">
                {t} <span className="font-brush text-ember">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
