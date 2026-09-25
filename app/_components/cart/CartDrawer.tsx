"use client";
// SOP: architecture/site-pages.md → Cart. Checkout = POST /api/checkout → Square's hosted page.
import { useState } from "react";
import { formatUsd } from "@/execution/lib/money";
import { cartTotalCents, MAX_QTY, toCheckoutRequest } from "@/execution/site/cart";
import { Sheet } from "../Sheet";
import { useCart } from "./CartProvider";

const MESSAGES: Record<string, string> = {
  KITCHEN_CLOSED: "Eddie just closed the kitchen. Your order is saved for next time.",
  INVALID_INPUT: "Please add your name so Eddie knows whose plate it is.",
};

export function CartDrawer({ kitchenOpen }: { kitchenOpen: boolean }) {
  const { cart, dispatch, drawerOpen, setDrawerOpen } = useCart();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toCheckoutRequest(cart, name, note)),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError(
        MESSAGES[data.error] ??
          (res.status === 422 ? `Something on your order changed. ${data.message ?? ""} Please review it.` : "Couldn't reach checkout. Try again."),
      );
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Your order" side="right">
      <h2 className="font-display text-4xl uppercase">Your order</h2>
      {cart.lines.length === 0 ? (
        <p className="mt-6 text-cream/70">Nothing here yet. Pick a plate from the menu.</p>
      ) : (
        <form onSubmit={checkout} className="mt-6 grid gap-6">
          <ul className="grid gap-4">
            {cart.lines.map((l) => (
              <li key={l.key} className="rounded-2xl bg-cream/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl uppercase text-gold">{l.name}</p>
                    {l.modifiers.map((m) => (
                      <p key={m.id} className="text-sm text-cream/70">
                        + {m.qty > 1 ? `${m.qty}× ` : ""}
                        {m.name}
                      </p>
                    ))}
                  </div>
                  <p className="font-brush text-xl">{formatUsd(l.unitCents * l.qty)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    Qty
                    <select
                      value={l.qty}
                      onChange={(e) => dispatch({ type: "setQty", key: l.key, qty: Number(e.target.value) })}
                      className="min-h-11 rounded-lg bg-cream/10 px-3"
                    >
                      {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n} className="bg-ink">
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={() => dispatch({ type: "remove", key: l.key })} className="min-h-11 text-sm underline">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t border-cream/10 pt-4">
            <span className="font-display text-xl uppercase">Total</span>
            <span className="font-brush text-3xl text-gold">{formatUsd(cartTotalCents(cart))}</span>
          </div>

          <label className="grid gap-1">
            <span className="font-medium">Your name (for pickup)</span>
            <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" className="min-h-11 rounded-xl bg-cream/10 px-4" />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Note for Eddie (optional)</span>
            <textarea maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-xl bg-cream/10 px-4 py-2" />
          </label>

          <p className="text-sm text-cream/60">Pickup only. You pay on Square&rsquo;s secure page, and your pickup spot shows up right after.</p>
          {error && (
            <p role="alert" className="rounded-xl bg-ember/20 p-3 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !kitchenOpen || !name.trim()}
            className="min-h-12 rounded-full bg-gold px-6 py-3 font-display text-lg uppercase tracking-wider text-ink disabled:opacity-50"
          >
            {!kitchenOpen ? "Kitchen's closed" : busy ? "Heading to checkout…" : "Checkout"}
          </button>
        </form>
      )}
    </Sheet>
  );
}
