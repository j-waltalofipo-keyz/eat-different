import { describe, expect, it } from "vitest";
import { AppError } from "../lib/errors";
import { toOrderView } from "../orders/getOrderView";
import { canCheckout } from "../settings";
import { buildFoodPaymentLink } from "../square/createCheckout";
import { buildDonationPaymentLink, validateDonation } from "../square/createDonationCheckout";
import { priceCart } from "../square/priceCart";
import { MENU, order } from "./fixtures";

describe("kitchen gate", () => {
  it("closed kitchen blocks food (route → 409) but never donations", () => {
    expect(canCheckout("FOOD", { kitchen_open: false })).toBe(false);
    expect(canCheckout("DONATION", { kitchen_open: false })).toBe(true);
    expect(canCheckout("FOOD", { kitchen_open: true })).toBe(true);
  });
});

describe("buildFoodPaymentLink", () => {
  const priced = priceCart(
    { items: [{ variationId: "V_SWEET", qty: 2, modifiers: [{ id: "M_CLASSIC", qty: 1 }, { id: "M_BACON", qty: 2 }] }] },
    MENU,
  );
  const req = buildFoodPaymentLink({
    priced,
    customerName: "Tay",
    note: "extra napkins",
    locationId: "LOC",
    siteUrl: "https://eat-different.vercel.app",
    viewToken: "TOKEN",
    idempotencyKey: "KEY",
  });

  it("sends catalog ids + quantities only (Square prices from its catalog)", () => {
    expect(req.order?.lineItems).toEqual([
      {
        catalogObjectId: "V_SWEET",
        quantity: "2",
        modifiers: [
          { catalogObjectId: "M_CLASSIC", quantity: "1" },
          { catalogObjectId: "M_BACON", quantity: "2" },
        ],
      },
    ]);
  });
  it("is a PICKUP ASAP order tagged FOOD, tips on, redirect to the token page", () => {
    expect(req.order?.metadata).toEqual({ kind: "FOOD" });
    expect(req.order?.fulfillments).toEqual([
      {
        type: "PICKUP",
        state: "PROPOSED",
        pickupDetails: { scheduleType: "ASAP", recipient: { displayName: "Tay" }, note: "extra napkins" },
      },
    ]);
    expect(req.checkoutOptions).toEqual({ allowTipping: true, redirectUrl: "https://eat-different.vercel.app/order/TOKEN" });
  });
});

describe("donations", () => {
  const limits = { donation_min_cents: 100, donation_max_cents: 100_000 };
  it("accepts $1 … $1,000 whole cents", () => {
    expect(() => validateDonation(100, limits)).not.toThrow();
    expect(() => validateDonation(100_000, limits)).not.toThrow();
  });
  it("rejects out of range and fractional amounts", () => {
    for (const bad of [99, 100_001, 0, -500, 250.5]) {
      expect(() => validateDonation(bad, limits)).toThrow(AppError);
    }
  });
  it("has no fulfillment, no tipping, and the not-tax-deductible note", () => {
    const req = buildDonationPaymentLink({ amountCents: 1000, locationId: "LOC", siteUrl: "https://x.app", idempotencyKey: "K" });
    expect(req.order?.fulfillments).toBeUndefined();
    expect(req.order?.metadata).toEqual({ kind: "DONATION" });
    expect(req.order?.lineItems?.[0]).toMatchObject({ name: "E.D. Truck Fund Donation", basePriceMoney: { amount: 1000n } });
    expect(req.checkoutOptions).toEqual({ allowTipping: false, redirectUrl: "https://x.app/donate/thanks" });
    expect(req.paymentNote).toMatch(/not tax-deductible/);
  });
});

describe("order view pickup guard (Invariant 3)", () => {
  const settings = { pickup_address: "123 Home St", pickup_instructions: "Side door" };
  it("shows the address only for a PAID food order", () => {
    expect(toOrderView(order({ status: "PAID" }), settings).pickup).toEqual({ address: "123 Home St", instructions: "Side door" });
  });
  it("hides it while pending, after refund, and for donations", () => {
    expect(toOrderView(order({ status: "PENDING" }), settings).pickup).toBeNull();
    expect(toOrderView(order({ status: "REFUNDED" }), settings).pickup).toBeNull();
    expect(toOrderView(order({ status: "PAID", kind: "DONATION" }), settings).pickup).toBeNull();
  });
});
