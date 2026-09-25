"use client";
// SOP: order-queue.md. Next up on top; Done slides it down greyed; Undo brings it back. Refreshes itself.
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { formatUsd } from "@/execution/lib/money";
import { sortQueue, type QueueOrder } from "@/execution/orders/queueSort";
import { markDone } from "../actions";
import { Chip } from "../ui";

const REFRESH_MS = 20_000;

function ago(iso: string, now: number): string {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} h ${min % 60} min ago` : `${Math.floor(h / 24)} d ago`;
}
/** Kansas City time everywhere (Eddie's clock, whatever device he's on); older than 12 h gets the weekday. */
const KC = "America/Chicago";
const clock = (iso: string, now = Date.now()) =>
  new Date(iso).toLocaleString("en-US", {
    ...(now - Date.parse(iso) > 12 * 3_600_000 ? { weekday: "short" } : {}),
    hour: "numeric",
    minute: "2-digit",
    timeZone: KC,
  });

function OrderCard({ o, next, now, onToggle }: { o: QueueOrder; next: boolean; now: number; onToggle: (done: boolean) => void }) {
  const done = Boolean(o.fulfilledAt) || o.status === "REFUNDED";
  return (
    <li
      className={`rounded-3xl border p-5 transition-all duration-300 motion-safe:animate-[fadein_.35s_ease-out] ${
        done ? "border-cream/5 bg-cream/[0.02] opacity-50 grayscale" : next ? "border-gold bg-[#1a1608] shadow-[0_0_0_4px_rgba(245,178,26,0.12)]" : "border-cream/10 bg-[#131313]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {next && <Chip tone="gold">Next up</Chip>}
            {o.status === "REFUNDED" && <Chip tone="ember">Refunded</Chip>}
            <span className="font-display text-sm uppercase tracking-widest text-cream/50">#{o.receiptNumber ?? "—"}</span>
          </div>
          <p className="mt-1 font-display text-3xl uppercase leading-none">{o.customerName ?? "Guest"}</p>
          <p className="mt-1 text-sm text-cream/60">
            Paid {ago(o.paidAt, now)} · {clock(o.paidAt, now)}
            {o.fulfilledAt && ` · done ${clock(o.fulfilledAt)}`}
          </p>
        </div>
        <p className="font-brush text-3xl text-gold">{formatUsd(o.totalCents)}</p>
      </div>

      {o.lines ? (
        <ul className="mt-4 grid gap-2">
          {o.lines.map((l, i) => (
            <li key={i} className="rounded-2xl bg-cream/[0.04] px-4 py-3">
              <p className="text-lg font-semibold">
                <span className="text-gold">{l.qty} ×</span> {l.name}
              </p>
              {l.modifiers.length > 0 && (
                <p className="mt-0.5 text-sm text-cream/70">{l.modifiers.map((m) => `${m.qty > 1 ? `${m.qty}× ` : ""}${m.name}`).join(" · ")}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-cream/[0.04] px-4 py-3 text-sm text-cream/60">Items unavailable right now — check Square → Orders.</p>
      )}
      {o.note && <p className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">📝 {o.note}</p>}

      {o.status === "PAID" &&
        (done ? (
          <button type="button" onClick={() => onToggle(false)} className="mt-4 min-h-12 w-full rounded-full border border-cream/30 font-display uppercase tracking-wider text-cream/80 hover:bg-cream/10 sm:w-auto sm:px-8">
            ↶ Undo — not picked up yet
          </button>
        ) : (
          <button type="button" onClick={() => onToggle(true)} className="mt-4 min-h-14 w-full rounded-full bg-gold font-display text-xl uppercase tracking-wider text-ink transition active:scale-[0.98] sm:w-auto sm:px-10">
            Done ✓ picked up
          </button>
        ))}
    </li>
  );
}

export function OrdersTab({ waiting, done, kitchenOpen, renderedAt }: { waiting: QueueOrder[]; done: QueueOrder[]; kitchenOpen: boolean; renderedAt: number }) {
  const router = useRouter();
  // Start from the server's clock so the first paint matches (no hydration mismatch), then tick.
  const [now, setNow] = useState(renderedAt);
  const [updated, setUpdated] = useState(renderedAt);
  useEffect(() => setUpdated(renderedAt), [renderedAt]);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  // Optimistic moves: orderId → fulfilledAt (null = back in line).
  const [moves, move] = useOptimistic(new Map<string, string | null>(), (m, [id, at]: [string, string | null]) => new Map(m).set(id, at));

  const all = [...waiting, ...done].map((o) => (moves.has(o.orderId) ? { ...o, fulfilledAt: moves.get(o.orderId)! } : o));
  const { waiting: line, done: finished } = sortQueue(all, new Date(now));

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const refresh = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setUpdated(Date.now());
      }
    }, REFRESH_MS);
    return () => (clearInterval(tick), clearInterval(refresh));
  }, [router]);

  const toggle = (id: string, isDone: boolean) =>
    start(async () => {
      setError(null);
      move([id, isDone ? new Date().toISOString() : null]);
      try {
        await markDone(id, isDone);
      } catch {
        setError("Couldn't save that tap — check your connection and try again.");
      }
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase leading-none">Tonight&rsquo;s orders</h1>
          <p className="mt-1 text-sm text-cream/60">
            {line.length ? `${line.length} waiting · oldest first` : kitchenOpen ? "All caught up." : "Kitchen's closed."} · updated{" "}
            {new Date(updated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: KC })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (router.refresh(), setUpdated(Date.now()))}
          className="min-h-11 rounded-full border border-cream/20 px-5 text-sm hover:bg-cream/10"
        >
          ↻ Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-ember/15 px-4 py-3 text-sm text-[#ffb3bd]">
          {error}
        </p>
      )}

      {line.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-cream/15 px-6 py-14 text-center">
          <p className="font-brush text-5xl text-gold">All clear</p>
          <p className="mt-2 max-w-sm text-cream/60">
            New paid orders pop in here on their own. {kitchenOpen ? "" : "Flip the kitchen open when you're ready to cook."}
          </p>
        </div>
      ) : (
        <ol className="grid gap-4" aria-label="Waiting orders">
          {line.map((o, i) => (
            <OrderCard key={o.orderId} o={o} next={i === 0} now={now} onToggle={(d) => toggle(o.orderId, d)} />
          ))}
        </ol>
      )}

      {finished.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-display text-lg uppercase tracking-widest text-cream/50">Done ({finished.length})</h2>
          <ol className="grid gap-3" aria-label="Done orders">
            {finished.map((o) => (
              <OrderCard key={o.orderId} o={o} next={false} now={now} onToggle={(d) => toggle(o.orderId, d)} />
            ))}
          </ol>
        </section>
      )}
      <p className="text-xs text-cream/40">&ldquo;Done&rdquo; is just for this list — it doesn&rsquo;t change anything in Square.</p>
    </>
  );
}
