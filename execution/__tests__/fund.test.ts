import { describe, expect, it } from "vitest";
import { computeProgress } from "../fund/computeProgress";
import { planPaymentRecord } from "../orders/recordPayment";
import { planRefund } from "../orders/recordRefund";
import type { PaymentFacts } from "../schemas";
import { order } from "./fixtures";

const NOW = "2026-09-23T12:00:00.000Z";
const settings = { fund_per_order_cents: 500 };
const payment = (p: Partial<PaymentFacts> = {}): PaymentFacts => ({
  id: "PAY_1",
  orderId: "ORDER_1",
  status: "COMPLETED",
  receiptNumber: "Ab12",
  buyerEmail: "tay@example.com",
  amountCents: 2000,
  tipCents: 300,
  totalCents: 2300,
  refundedCents: 0,
  ...p,
});

describe("computeProgress", () => {
  const now = new Date(NOW);
  it("floors to one decimal against the $42,000 goal", () => {
    expect(computeProgress(500, 4_200_000, now).percent).toBe(0); // 0.0119% → 0.0
    expect(computeProgress(5_000, 4_200_000, now).percent).toBe(0.1);
    expect(computeProgress(2_100_000, 4_200_000, now).percent).toBe(50);
    expect(computeProgress(2_104_199, 4_200_000, now).percent).toBe(50.0);
    expect(computeProgress(2_104_200, 4_200_000, now).percent).toBe(50.1);
  });
  it("clamps to 0–100", () => {
    expect(computeProgress(-1_000, 4_200_000, now).percent).toBe(0);
    expect(computeProgress(9_999_999, 4_200_000, now).percent).toBe(100);
  });
  it("returns only percent + timestamp (never dollars)", () => {
    expect(Object.keys(computeProgress(1, 4_200_000, now)).sort()).toEqual(["percent", "updatedAt"]);
  });
});

describe("planPaymentRecord", () => {
  it("food order: PAID + $5 ORDER row regardless of order size or tip", () => {
    const plan = planPaymentRecord(order(), payment(), settings, NOW);
    expect(plan.orderUpdate).toMatchObject({ status: "PAID", receipt_number: "Ab12", buyer_email: "tay@example.com" });
    expect(plan.ledger).toEqual({ square_order_id: "ORDER_1", reason: "ORDER", amount_cents: 500 });
  });

  it("donation: 100% of the amount (tip excluded)", () => {
    const plan = planPaymentRecord(order({ kind: "DONATION" }), payment({ amountCents: 1000, tipCents: 0 }), settings, NOW);
    expect(plan.ledger).toEqual({ square_order_id: "ORDER_1", reason: "DONATION", amount_cents: 1000 });
  });

  it("replay on an already-PAID order: no status change; same ledger row (DB unique makes it a no-op)", () => {
    const first = planPaymentRecord(order(), payment(), settings, NOW);
    const replay = planPaymentRecord(order({ status: "PAID" }), payment(), settings, NOW);
    expect(replay.orderUpdate).toBeNull();
    expect(replay.ledger).toEqual(first.ledger);
  });

  it("uses fund_per_order_cents at payment time", () => {
    expect(planPaymentRecord(order(), payment(), { fund_per_order_cents: 700 }, NOW).ledger?.amount_cents).toBe(700);
  });

  it("does nothing for non-completed payments or refunded orders", () => {
    expect(planPaymentRecord(order(), payment({ status: "APPROVED" }), settings, NOW)).toEqual({ orderUpdate: null, ledger: null });
    expect(planPaymentRecord(order({ status: "REFUNDED" }), payment(), settings, NOW)).toEqual({ orderUpdate: null, ledger: null });
  });
});

describe("planRefund (D18: full refunds only)", () => {
  it("full refund reverses exactly the original amount", () => {
    const plan = planRefund(order({ status: "PAID" }), payment({ refundedCents: 2000 }), { amount_cents: 500 });
    expect(plan).toEqual({ markRefunded: true, ledger: { square_order_id: "ORDER_1", reason: "REFUND", amount_cents: -500 } });
  });
  it("full refund of a donation reverses the full donation", () => {
    const plan = planRefund(order({ kind: "DONATION", status: "PAID" }), payment({ amountCents: 2500, refundedCents: 2500 }), {
      amount_cents: 2500,
    });
    expect(plan.ledger?.amount_cents).toBe(-2500);
  });
  it("tip not refunded still counts as full (tip excluded)", () => {
    expect(planRefund(order({ status: "PAID" }), payment({ refundedCents: 2000 }), { amount_cents: 500 }).markRefunded).toBe(true);
  });
  it("partial refund changes nothing", () => {
    expect(planRefund(order({ status: "PAID" }), payment({ refundedCents: 1999 }), { amount_cents: 500 })).toEqual({
      markRefunded: false,
      ledger: null,
    });
  });
  it("no original credit → mark refunded, no ledger row", () => {
    expect(planRefund(order(), payment({ refundedCents: 2000 }), null)).toEqual({ markRefunded: true, ledger: null });
  });
});
