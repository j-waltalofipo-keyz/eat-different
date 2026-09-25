import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cartCount,
  cartReducer,
  cartTotalCents,
  EMPTY_CART,
  lineKey,
  MAX_LINES,
  parseStoredCart,
  toCheckoutRequest,
  type CartLine,
} from "../site/cart";
import { truckProgress } from "../site/milestones";
import seedJson from "../../architecture/menu-seed.json";

const burger = (over: Partial<Omit<CartLine, "key">> = {}): Omit<CartLine, "key"> => ({
  variationId: "V_BURGER",
  name: "The E.D. Burger",
  qty: 1,
  unitCents: 2000,
  modifiers: [
    { id: "M_COMBO", name: "Combo", qty: 1 },
    { id: "M_BACON", name: "Bacon", qty: 2 },
  ],
  ...over,
});

describe("cart", () => {
  it("merges the same item + options regardless of option order", () => {
    let c = cartReducer(EMPTY_CART, { type: "add", line: burger() });
    c = cartReducer(c, { type: "add", line: burger({ modifiers: [...burger().modifiers].reverse(), qty: 2 }) });
    expect(c.lines).toHaveLength(1);
    expect(c.lines[0]!.qty).toBe(3);
    expect(cartCount(c)).toBe(3);
    expect(cartTotalCents(c)).toBe(6000);
  });
  it("keeps different options on separate lines", () => {
    let c = cartReducer(EMPTY_CART, { type: "add", line: burger() });
    c = cartReducer(c, { type: "add", line: burger({ modifiers: [] , unitCents: 1200 }) });
    expect(c.lines).toHaveLength(2);
  });
  it("clamps quantity to 1–20 and caps the cart at 30 lines", () => {
    let c = cartReducer(EMPTY_CART, { type: "add", line: burger({ qty: 50 }) });
    expect(c.lines[0]!.qty).toBe(20);
    c = cartReducer(c, { type: "setQty", key: c.lines[0]!.key, qty: 0 });
    expect(c.lines[0]!.qty).toBe(1);
    let full = EMPTY_CART;
    for (let i = 0; i < MAX_LINES + 5; i++) full = cartReducer(full, { type: "add", line: burger({ variationId: `V${i}` }) });
    expect(full.lines).toHaveLength(MAX_LINES);
  });
  it("builds the CheckoutRequest the API expects (ids + quantities only)", () => {
    const c = cartReducer(EMPTY_CART, { type: "add", line: burger() });
    expect(toCheckoutRequest(c, "  Tay ", "  ")).toEqual({
      items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_COMBO", qty: 1 }, { id: "M_BACON", qty: 2 }] }],
      customerName: "Tay",
      note: null,
    });
  });
  it("parses stored carts defensively", () => {
    expect(parseStoredCart(null)).toEqual(EMPTY_CART);
    expect(parseStoredCart("not json")).toEqual(EMPTY_CART);
    expect(parseStoredCart(JSON.stringify({ lines: [{ bogus: true }] }))).toEqual(EMPTY_CART);
    const stored = JSON.stringify({ lines: [{ ...burger({ qty: 99 }), key: "tampered" }] });
    const parsed = parseStoredCart(stored);
    expect(parsed.lines[0]!.qty).toBe(20);
    expect(parsed.lines[0]!.key).toBe(lineKey("V_BURGER", burger().modifiers));
  });
});

describe("truckProgress (D27: parts only)", () => {
  it("at the start, heads for the wheels", () => {
    expect(truckProgress(0)).toEqual({ reached: [], next: { at: 10, label: "Wheels" }, toNextPct: 0 });
    expect(truckProgress(5).toNextPct).toBe(50);
  });
  it("measures progress between parts", () => {
    expect(truckProgress(37.5)).toEqual({ reached: [10, 25], next: { at: 50, label: "Awning" }, toNextPct: 50 });
  });
  it("finishes at 100 and clamps out-of-range input", () => {
    expect(truckProgress(100)).toEqual({ reached: [10, 25, 50, 75, 100], next: null, toNextPct: 100 });
    expect(truckProgress(140).next).toBeNull();
    expect(truckProgress(-3).reached).toEqual([]);
  });
});

describe("menu photos (D33)", () => {
  it("every seed image points at a file that exists in public/images", () => {
    for (const item of seedJson.items) {
      if (item.image) expect(existsSync(`public/images/${item.image}`), item.image).toBe(true);
    }
  });
});
