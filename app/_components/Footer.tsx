"use client";
// SOP: notify-list.md + site-pages.md §9. Hours, pickup area and socials come from /admin (D42–D44).
import { useState } from "react";

export type FooterInfo = {
  hours: { days: string; time: string }[];
  hoursNote: string | null;
  pickupArea: string | null;
  socials: { instagram: string | null; tiktok: string | null; facebook: string | null };
};

const SOCIAL_ICONS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.8 2.3 4.5 5 4.8" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
} as const;
const SOCIAL_NAMES = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" } as const;

export function Footer({ kitchenOpen, info }: { kitchenOpen: boolean; info?: FooterInfo }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <footer className="bg-ink px-4 py-16 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="font-brush text-7xl text-gold sm:text-9xl">E.D.</p>
          <p className="mt-2 font-display text-xl uppercase tracking-widest">Eat. Different. · Kansas City, MO</p>
          <p className="mt-1 text-cream/70">Made with alofa in KC.</p>
          {info && (info.hours.length > 0 || info.pickupArea) && (
            <div className="mt-6 grid gap-1 text-cream/85">
              <p className="font-display text-sm uppercase tracking-[0.3em] text-gold">When &amp; where</p>
              {info.hours.map((h) => (
                <p key={h.days}>
                  <span className="font-semibold text-cream">{h.days}</span> · {h.time}
                </p>
              ))}
              {info.hoursNote && <p className="text-sm text-cream/60">{info.hoursNote}</p>}
              {info.pickupArea && <p>Pickup in {info.pickupArea} · exact spot after you order</p>}
            </div>
          )}
          {info && Object.values(info.socials).some(Boolean) && (
            <div className="mt-6 flex gap-2">
              {(Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[]).map((k) =>
                info.socials[k] ? (
                  <a
                    key={k}
                    href={info.socials[k]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`E.D. on ${SOCIAL_NAMES[k]}`}
                    className="grid h-12 w-12 place-items-center rounded-full border border-cream/20 text-cream transition hover:border-gold hover:text-gold"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {SOCIAL_ICONS[k]}
                    </svg>
                  </a>
                ) : null,
              )}
            </div>
          )}
        </div>
        <form id="notify" onSubmit={submit} className="scroll-mt-20 rounded-2xl border-2 border-gold/60 p-5">
          <p className="font-display text-2xl uppercase">{kitchenOpen ? "Want a heads-up next time?" : "Kitchen closed? Get the heads-up."}</p>
          {state === "done" ? (
            <p className="mt-4 text-lg">You&rsquo;re on the list. Fa&rsquo;afetai!</p>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label htmlFor="notify-email" className="sr-only">
                  Email
                </label>
                <input
                  id="notify-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-12 flex-1 rounded-full bg-cream/10 px-5 text-cream placeholder:text-cream/40"
                />
                <button type="submit" disabled={state === "busy"} className="min-h-12 rounded-full bg-gold px-6 font-display uppercase tracking-wider text-ink disabled:opacity-60">
                  {state === "busy" ? "Adding…" : "Notify me"}
                </button>
              </div>
              <p className="mt-2 text-xs text-cream/60">
                {state === "error" ? "Couldn't add you. Check the email and try again." : "We'll email you when the kitchen opens. Unsubscribe anytime."}
              </p>
            </>
          )}
        </form>
      </div>
    </footer>
  );
}
