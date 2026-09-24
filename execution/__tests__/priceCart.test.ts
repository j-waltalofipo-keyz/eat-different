import { describe, expect, it } from "vitest";
import { AppError } from "../lib/errors";
import { priceCart } from "../square/priceCart";
import { MENU } from "./fixtures";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof AppError ? e.code : "NOT_APP_ERROR";
  }
  return "NO_ERROR";
};

describe("priceCart", () => {
  it("Burger + combo + 2× bacon totals $20.00", () => {
    const cart = priceCart(
      { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_COMBO", qty: 1 }, { id: "M_BACON", qty: 2 }] }] },
      MENU,
    );
    expect(cart.totalCents).toBe(2000);
    expect(cart.lines[0]!.modifiers.map((m) => [m.name, m.qty])).toEqual([
      ["The E.D. Combo (fries + drink of the day)", 1],
      ["Bacon", 2],
    ]);
  });

  it("multiplies modifiers by line quantity and sums lines", () => {
    const cart = priceCart(
      {
        items: [
          { variationId: "V_SWEET", qty: 2, modifiers: [{ id: "M_CHOC", qty: 1 }, { id: "M_SAUCE", qty: 3 }] },
          { variationId: "V_TERIYAKI", qty: 1, modifiers: [] },
        ],
      },
      MENU,
    );
    expect(cart.lines[0]!.lineTotalCents).toBe((1200 + 150) * 2);
    expect(cart.totalCents).toBe(2700 + 1300);
  });

  it("has no way to accept client prices (only ids and quantities are read)", () => {
    const tampered = { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [], priceCents: 1 }] } as never;
    expect(priceCart(tampered, MENU).totalCents).toBe(1200);
  });

  it("rejects unknown and sold-out items", () => {
    expect(code(() => priceCart({ items: [{ variationId: "NOPE", qty: 1, modifiers: [] }] }, MENU))).toBe("UNKNOWN_ITEM");
    expect(code(() => priceCart({ items: [{ variationId: "V_CORN", qty: 1, modifiers: [] }] }, MENU))).toBe("SOLD_OUT");
  });

  it("rejects a Sweet Heat without a waffle choice", () => {
    expect(code(() => priceCart({ items: [{ variationId: "V_SWEET", qty: 1, modifiers: [] }] }, MENU))).toBe("MISSING_REQUIRED");
  });

  it("rejects two waffles on one Sweet Heat", () => {
    const req = { items: [{ variationId: "V_SWEET", qty: 1, modifiers: [{ id: "M_CLASSIC", qty: 1 }, { id: "M_CHOC", qty: 1 }] }] };
    expect(code(() => priceCart(req, MENU))).toBe("TOO_MANY_CHOICES");
  });

  it("rejects a combo on Teriyaki After Dark", () => {
    const req = { items: [{ variationId: "V_TERIYAKI", qty: 1, modifiers: [{ id: "M_COMBO", qty: 1 }] }] };
    expect(code(() => priceCart(req, MENU))).toBe("UNKNOWN_MODIFIER");
  });

  it("rejects a 4th bacon and a zero quantity", () => {
    const four = { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_BACON", qty: 4 }] }] };
    const zero = { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_BACON", qty: 0 }] }] };
    expect(code(() => priceCart(four, MENU))).toBe("MODIFIER_QTY");
    expect(code(() => priceCart(zero, MENU))).toBe("MODIFIER_QTY");
  });

  it("rejects a double combo and duplicate modifier ids", () => {
    const two = { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_COMBO", qty: 2 }] }] };
    const dup = { items: [{ variationId: "V_BURGER", qty: 1, modifiers: [{ id: "M_BACON", qty: 1 }, { id: "M_BACON", qty: 1 }] }] };
    expect(code(() => priceCart(two, MENU))).toBe("MODIFIER_QTY");
    expect(code(() => priceCart(dup, MENU))).toBe("DUPLICATE_MODIFIER");
  });
});
