// SOP: architecture/site-pages.md → Cart. Pure: the browser cart, and its CheckoutRequest.
// Display prices only — the server re-prices everything (Invariant 2).

export type CartModifier = { id: string; name: string; qty: number };
export type CartLine = {
  key: string;
  variationId: string;
  name: string;
  qty: number;
  unitCents: number; // item + modifiers, for display
  modifiers: CartModifier[];
};
export type Cart = { lines: CartLine[] };

export const MAX_LINES = 30;
export const MAX_QTY = 20;
export const EMPTY_CART: Cart = { lines: [] };

/** Same item + same options (in any order) → same line. */
export function lineKey(variationId: string, modifiers: Pick<CartModifier, "id" | "qty">[]): string {
  const mods = modifiers.map((m) => `${m.id}x${m.qty}`).sort().join(",");
  return `${variationId}|${mods}`;
}

export type CartAction =
  | { type: "add"; line: Omit<CartLine, "key"> }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "load"; cart: Cart };

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n)));

export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "add": {
      const key = lineKey(action.line.variationId, action.line.modifiers);
      const existing = cart.lines.find((l) => l.key === key);
      if (existing) {
        return { lines: cart.lines.map((l) => (l.key === key ? { ...l, qty: clampQty(l.qty + action.line.qty) } : l)) };
      }
      if (cart.lines.length >= MAX_LINES) return cart;
      return { lines: [...cart.lines, { ...action.line, key, qty: clampQty(action.line.qty) }] };
    }
    case "setQty":
      return { lines: cart.lines.map((l) => (l.key === action.key ? { ...l, qty: clampQty(action.qty) } : l)) };
    case "remove":
      return { lines: cart.lines.filter((l) => l.key !== action.key) };
    case "clear":
      return EMPTY_CART;
    case "load":
      return action.cart;
  }
}

export const cartCount = (cart: Cart) => cart.lines.reduce((n, l) => n + l.qty, 0);
export const cartTotalCents = (cart: Cart) => cart.lines.reduce((n, l) => n + l.unitCents * l.qty, 0);

export function toCheckoutRequest(cart: Cart, customerName: string, note: string) {
  return {
    items: cart.lines.map((l) => ({ variationId: l.variationId, qty: l.qty, modifiers: l.modifiers.map(({ id, qty }) => ({ id, qty })) })),
    customerName: customerName.trim(),
    note: note.trim() || null,
  };
}

/** Parse a stored cart defensively (localStorage is untrusted and may be stale). */
export function parseStoredCart(raw: string | null): Cart {
  try {
    const data = JSON.parse(raw ?? "null") as Cart | null;
    if (!data || !Array.isArray(data.lines)) return EMPTY_CART;
    const lines = data.lines
      .filter((l) => l && typeof l.variationId === "string" && Number.isFinite(l.qty) && Array.isArray(l.modifiers))
      .slice(0, MAX_LINES)
      .map((l) => ({ ...l, qty: clampQty(l.qty), key: lineKey(l.variationId, l.modifiers) }));
    return { lines };
  } catch {
    return EMPTY_CART;
  }
}
