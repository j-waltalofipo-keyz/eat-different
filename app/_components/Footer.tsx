"use client";
// SOP: notify-list.md + site-pages.md §9. No socials until Eddie provides them (D30).
import { useState } from "react";

export function Footer({ kitchenOpen }: { kitchenOpen: boolean }) {
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
