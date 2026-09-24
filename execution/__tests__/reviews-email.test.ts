import { describe, expect, it } from "vitest";
import { buildOpenAlertEmail } from "../email/sendOpenAlert";
import { buildOwnerAlertEmail } from "../email/sendOwnerAlert";
import { AppError } from "../lib/errors";
import { sign, verifySig } from "../lib/token";
import { unsubscribeUrl } from "../notify/subscribe";
import { summarize } from "../reviews/listReviews";
import { matchBuyerOrder, type Candidate } from "../reviews/submitReview";
import { order } from "./fixtures";

const paid = (p = {}, reviewed = false): Candidate => ({
  order: order({ status: "PAID", receipt_number: "Ab12", buyer_email: "tay@example.com", ...p }),
  reviewed,
});
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof AppError ? e.code : "NOT_APP_ERROR";
  }
  return "NO_ERROR";
};

describe("matchBuyerOrder", () => {
  it("matches a paid food order by receipt + email (case-insensitive email)", () => {
    expect(matchBuyerOrder([paid()], "TAY@example.com").square_order_id).toBe("ORDER_1");
  });
  it("rejects mismatched email, unpaid, and donation receipts with the same NOT_FOUND", () => {
    expect(code(() => matchBuyerOrder([paid()], "other@example.com"))).toBe("NOT_FOUND");
    expect(code(() => matchBuyerOrder([paid({ status: "PENDING" })], "tay@example.com"))).toBe("NOT_FOUND");
    expect(code(() => matchBuyerOrder([paid({ kind: "DONATION" })], "tay@example.com"))).toBe("NOT_FOUND");
    expect(code(() => matchBuyerOrder([], "tay@example.com"))).toBe("NOT_FOUND");
  });
  it("rejects a second review for the same order", () => {
    expect(code(() => matchBuyerOrder([paid({}, true)], "tay@example.com"))).toBe("ALREADY_REVIEWED");
  });
  it("picks the newest unreviewed order when several match", () => {
    const rows = [
      paid({ square_order_id: "OLD", created_at: "2026-01-01T00:00:00Z" }),
      paid({ square_order_id: "NEW", created_at: "2026-09-01T00:00:00Z" }),
      paid({ square_order_id: "DONE", created_at: "2026-09-20T00:00:00Z" }, true),
    ];
    expect(matchBuyerOrder(rows, "tay@example.com").square_order_id).toBe("NEW");
  });
});

describe("summarize", () => {
  it("averages every visible rating, low ones included", () => {
    expect(summarize([5, 4, 1])).toEqual({ average: 3.3, count: 3 });
    expect(summarize([])).toEqual({ average: null, count: 0 });
  });
});

describe("owner alert email", () => {
  it("food: subject with receipt + total, modifiers listed, user text escaped", () => {
    const email = buildOwnerAlertEmail({
      kind: "FOOD",
      receiptNumber: "Ab12",
      totalCents: 2300,
      tipCents: 300,
      customerName: "<Tay>",
      note: "no <b>onions</b>",
      lines: [{ qty: 1, name: "The E.D. Burger", modifiers: [{ qty: 2, name: "Bacon" }] }],
    });
    expect(email.subject).toBe("🔥 New order #Ab12: $23.00");
    expect(email.text).toContain("1 × The E.D. Burger\n    + 2× Bacon");
    expect(email.text).toContain("includes $3.00 tip");
    expect(email.html).toContain("&lt;Tay&gt;");
    expect(email.html).not.toContain("<b>onions</b>");
  });
  it("donation subject", () => {
    expect(buildOwnerAlertEmail({ kind: "DONATION", receiptNumber: "Zz99", amountCents: 2500 }).subject).toBe(
      "🚚 Truck fund donation: $25.00",
    );
  });
});

describe("notify links", () => {
  const secret = "s".repeat(43);
  it("unsubscribe signature verifies only for the same email", () => {
    const url = new URL(unsubscribeUrl("tay@example.com", "https://x.app", secret));
    expect(url.pathname).toBe("/api/notify/unsubscribe");
    const s = url.searchParams.get("s")!;
    expect(verifySig("tay@example.com", s, secret)).toBe(true);
    expect(verifySig("someone@else.com", s, secret)).toBe(false);
    expect(verifySig("tay@example.com", sign("tay@example.com", "other-secret"), secret)).toBe(false);
  });
  it("open alert contains the menu and unsubscribe links", () => {
    const e = buildOpenAlertEmail("https://x.app/menu", "https://x.app/api/notify/unsubscribe?e=a&s=b");
    expect(e.html).toContain('href="https://x.app/menu"');
    expect(e.html).toContain("Unsubscribe");
    expect(e.html).toContain("&amp;s=b");
  });
});
