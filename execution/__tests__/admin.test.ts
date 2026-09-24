import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { checkPassword, issueSession, SESSION_MS, sessionKey, verifySession } from "../admin/session";
import { parseSettingsForm } from "../admin/settingsForm";

const SECRET = "s".repeat(43);
const KEY = sessionKey(SECRET, "correct horse battery");
const NOW = 1_790_000_000_000;

describe("admin session", () => {
  it("a fresh session verifies until it expires (30 days)", () => {
    const token = issueSession(NOW, KEY);
    expect(verifySession(token, NOW, KEY)).toBe(true);
    expect(verifySession(token, NOW + SESSION_MS - 1, KEY)).toBe(true);
    expect(verifySession(token, NOW + SESSION_MS, KEY)).toBe(false);
  });
  it("changing the password (key) logs everyone out", () => {
    const token = issueSession(NOW, KEY);
    expect(verifySession(token, NOW, sessionKey(SECRET, "a new password!!"))).toBe(false);
  });
  it("rejects tampered, extended, or malformed tokens", () => {
    const [exp, sig] = issueSession(NOW, KEY).split(".");
    expect(verifySession(`${Number(exp) + 1}.${sig}`, NOW, KEY)).toBe(false);
    expect(verifySession(`${exp}.${sig}x`, NOW, KEY)).toBe(false);
    for (const bad of [undefined, "", "abc", `${exp}`, `${exp}.${sig}.extra`, `-1.${sig}`]) {
      expect(verifySession(bad, NOW, KEY)).toBe(false);
    }
  });
  it("password check is exact and never passes when unset", () => {
    expect(checkPassword("correct horse battery", "correct horse battery")).toBe(true);
    expect(checkPassword("correct horse batter", "correct horse battery")).toBe(false);
    expect(checkPassword("", "")).toBe(false);
  });
});

describe("admin settings form", () => {
  const base: Record<string, string> = {
    fund_per_order: "5.00",
    fund_goal: "$42,000",
    donation_min: "1",
    donation_max: "1000",
    donation_presets: "5, 10, 25, 50",
    pickup_address: "  123 Home St  ",
    pickup_instructions: "",
    google_review_url: "",
  };
  const parse = (over: Record<string, string> = {}) => parseSettingsForm((n) => ({ ...base, ...over })[n]);

  it("converts dollars to cents, trims text, empties → null", () => {
    expect(parse()).toEqual({
      fund_per_order_cents: 500,
      fund_goal_cents: 4_200_000,
      donation_min_cents: 100,
      donation_max_cents: 100_000,
      donation_presets_cents: [500, 1000, 2500, 5000],
      pickup_address: "123 Home St",
      pickup_instructions: null,
      google_review_url: null,
    });
  });
  it("rejects bad values", () => {
    const bad: Record<string, string>[] = [
      { fund_goal: "0" },
      { fund_per_order: "-1" },
      { fund_per_order: "abc" },
      { donation_min: "0.50" }, // below Square's $1 minimum
      { donation_min: "50", donation_max: "10" },
      { donation_presets: "5, 2000" }, // preset above max
      { google_review_url: "http://not-https.example" },
    ];
    for (const over of bad) {
      expect(() => parse(over), JSON.stringify(over)).toThrow(ZodError);
    }
  });
});
