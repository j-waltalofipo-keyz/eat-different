// Owner dashboard (D41–D46): hours, site cards, menu editor, website-only flags, order queue.
import type { Square } from "square";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { buildMenuItemUpsert, describeChoices, parseMenuItemForm, type MenuItemInput } from "../admin/menuAdmin";
import { friendlyError, parseAnnouncementForm, parseDrinkForm, parseHoursForm } from "../admin/settingsForm";
import { toAlertLines } from "../email/sendOwnerAlert";
import { AppError } from "../lib/errors";
import { sortQueue, type QueueOrder } from "../orders/orderQueue";
import { SeedSchema, SettingsSchema, type WeekHours } from "../schemas";
import { groupHours, formatRange, formatTime, kcClock, nextOpening } from "../site/hours";
import { mapCatalogToMenu, toPublicItem } from "../square/getMenu";
import { buildCatalogUpsert } from "../square/seedCatalog";
import seedJson from "../../architecture/menu-seed.json";

type Obj = Square.CatalogObject;
const seed = SeedSchema.parse(seedJson);
const LOC = "LOC1";

// ---- hours -------------------------------------------------------------------------------------
const FRI_SUN: WeekHours = [null, null, null, null, { open: "17:00", close: "21:00" }, { open: "17:00", close: "21:00" }, { open: "12:00", close: "20:30" }];

describe("hours (display-only, D42)", () => {
  it("formats times and ranges the way people say them", () => {
    expect(formatTime("17:00")).toBe("5 PM");
    expect(formatTime("17:30")).toBe("5:30 PM");
    expect(formatTime("00:00")).toBe("12 AM");
    expect(formatTime("12:00")).toBe("12 PM");
    expect(formatRange("17:00", "21:00")).toBe("5–9 PM");
    expect(formatRange("11:00", "14:00")).toBe("11 AM–2 PM");
  });
  it("groups consecutive days with the same hours; closed days drop out", () => {
    expect(groupHours(FRI_SUN)).toEqual([
      { days: "Fri & Sat", time: "5–9 PM" },
      { days: "Sun", time: "12–8:30 PM" },
    ]);
    const weekdays: WeekHours = [...Array(5).fill({ open: "11:00", close: "14:00" }), null, null];
    expect(groupHours(weekdays)).toEqual([{ days: "Mon–Fri", time: "11 AM–2 PM" }]);
    expect(groupHours([null, null, null, null, null, null, null])).toEqual([]);
  });
  it("reads Kansas City wall-clock time, across daylight saving", () => {
    expect(kcClock(new Date("2026-09-25T22:30:00Z"))).toEqual({ day: 4, hhmm: "17:30" }); // Fri, CDT (UTC−5)
    expect(kcClock(new Date("2026-12-04T23:30:00Z"))).toEqual({ day: 4, hhmm: "17:30" }); // Fri, CST (UTC−6)
  });
  it("finds the next usual opening after now", () => {
    expect(nextOpening(FRI_SUN, new Date("2026-09-23T15:00:00Z"))).toBe("Fri 5 PM"); // Wed 10 AM KC
    expect(nextOpening(FRI_SUN, new Date("2026-09-24T15:00:00Z"))).toBe("tomorrow 5 PM"); // Thu
    expect(nextOpening(FRI_SUN, new Date("2026-09-25T15:00:00Z"))).toBe("today 5 PM"); // Fri 10 AM
    expect(nextOpening(FRI_SUN, new Date("2026-09-26T03:00:00Z"))).toBe("tomorrow 5 PM"); // Fri 10 PM → Sat
    expect(nextOpening(FRI_SUN, new Date("2026-09-28T02:00:00Z"))).toBe("Fri 5 PM"); // Sun 9 PM, after close
    expect(nextOpening([null, null, null, null, null, null, null], new Date())).toBeNull();
  });
});

// ---- site cards --------------------------------------------------------------------------------
const form = (fields: Record<string, string>) => (n: string) => fields[n];

describe("site cards", () => {
  it("hours: checked days become {open, close}; unchecked are closed", () => {
    const parsed = parseHoursForm(form({ d4_open: "on", d4_from: "17:00", d4_to: "21:00", d6_from: "12:00", d6_to: "20:00", hours_note: " or until sold out " }));
    expect(parsed.hours).toEqual([null, null, null, null, { open: "17:00", close: "21:00" }, null, null]);
    expect(parsed.hours_note).toBe("or until sold out");
  });
  it("hours: refuses a close before the open, and says which day", () => {
    try {
      parseHoursForm(form({ d4_open: "on", d4_from: "21:00", d4_to: "17:00" }));
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
      expect(friendlyError(e as ZodError)).toContain("Friday: closing time must be after opening time");
    }
  });
  it("announcement: can't switch on an empty banner; off with no text is fine", () => {
    expect(parseAnnouncementForm(form({ announcement_on: "on", announcement_text: " Back Friday! " }))).toEqual({ announcement_on: true, announcement_text: "Back Friday!" });
    expect(parseAnnouncementForm(form({ announcement_text: "" }))).toEqual({ announcement_on: false, announcement_text: null });
    expect(() => parseAnnouncementForm(form({ announcement_on: "on", announcement_text: "  " }))).toThrow(ZodError);
    expect(() => parseAnnouncementForm(form({ announcement_text: "x".repeat(141) }))).toThrow(ZodError);
  });
  it("drink of the day: trimmed, empty → null, friendly length error", () => {
    expect(parseDrinkForm(form({ drink_of_the_day: " Pineapple lemonade " }))).toEqual({ drink_of_the_day: "Pineapple lemonade" });
    expect(parseDrinkForm(form({ drink_of_the_day: "" }))).toEqual({ drink_of_the_day: null });
    try {
      parseDrinkForm(form({ drink_of_the_day: "x".repeat(61) }));
    } catch (e) {
      expect(friendlyError(e as ZodError)).toBe("Drink of the day: keep it to 60 characters or fewer");
    }
  });
  it("settings rows with bad stored hours read as 'no hours', never a crash", () => {
    const row = {
      kitchen_open: false, fund_per_order_cents: 500, fund_goal_cents: 1, donation_presets_cents: [], donation_min_cents: 100, donation_max_cents: 100,
      pickup_address: null, pickup_instructions: null, google_review_url: null, pickup_area: null, hours: [1, 2], hours_note: null,
      announcement_on: false, announcement_text: null, drink_of_the_day: null, instagram_url: null, tiktok_url: null, facebook_url: null,
    };
    expect(SettingsSchema.parse(row).hours).toEqual([null, null, null, null, null, null, null]);
  });
});

// ---- menu editor ---------------------------------------------------------------------------------
/** A "live" catalog: the seed upserted, temp ids swapped for real-looking ones. */
const live: Obj[] = JSON.parse(
  JSON.stringify(buildCatalogUpsert(seed, []), (_k, v) => (typeof v === "bigint" ? Number(v) : v)).replace(/"#([a-z]+)-([a-z0-9-]+)"/g, '"$1_$2"'),
  (k, v) => (k === "amount" && typeof v === "number" ? BigInt(v) : v),
).map((o: Obj) =>
  o.type === "ITEM"
    ? { ...o, version: 7n, itemData: { ...o.itemData, variations: o.itemData?.variations?.map((v) => ({ ...v, version: 7n })) } }
    : { ...o, version: 7n },
);
const listId = (name: string): string => live.find((o) => o.type === "MODIFIER_LIST" && o.modifierListData?.name === name)!.id!;
const fd = (fields: Record<string, string | string[]>) => ({
  get: (n: string) => (Array.isArray(fields[n]) ? fields[n][0] : fields[n]) ?? null,
  getAll: (n: string) => (Array.isArray(fields[n]) ? fields[n] : fields[n] ? [fields[n]] : []),
});
const input = (over: Partial<MenuItemInput> = {}): MenuItemInput => ({
  itemId: null, name: "Loco Moco", subtitle: "Rice + patty + gravy", description: "Rice · Smash patty · Fried egg · Gravy",
  priceCents: 1400, category: "Bowls", options: [], ...over,
});

describe("menu editor (D46)", () => {
  it("parses the form: $ to cents, new category, several options", () => {
    const parsed = parseMenuItemForm(fd({ itemId: "", name: " Loco Moco ", subtitle: "", description: "Rice", price: "$14.50", category: "__new__", newCategory: " Island Plates ", options: ["A", "B"] }));
    expect(parsed).toEqual({ itemId: null, name: "Loco Moco", subtitle: null, description: "Rice", priceCents: 1450, category: "Island Plates", options: ["A", "B"] });
    expect(() => parseMenuItemForm(fd({ name: "X", price: "0.50", category: "Bowls" }))).toThrow(ZodError);
    expect(() => parseMenuItemForm(fd({ name: "X", price: "", category: "Bowls" }))).toThrow(ZodError);
    expect(() => parseMenuItemForm(fd({ name: "", price: "9", category: "Bowls" }))).toThrow(ZodError);
  });

  it("new dish in an existing category: temp ids, price, options in menu order with the seed's rules", () => {
    const objs = buildMenuItemUpsert(input({ options: [listId("Add-ons"), listId("Choose your waffle")] }), live, seed);
    expect(objs).toHaveLength(1); // "Bowls" exists → no new category
    const item = objs[0]!;
    expect(item).toMatchObject({ type: "ITEM", id: "#item-new", presentAtAllLocations: true });
    if (item.type !== "ITEM") throw new Error("not an item");
    expect(item.itemData?.categories).toEqual([{ id: "cat_bowls" }]);
    expect(item.itemData?.modifierListInfo?.map((m) => [m.modifierListId, m.minSelectedModifiers, m.maxSelectedModifiers, m.ordinal])).toEqual([
      [listId("Choose your waffle"), 1, 1, 0], // required SINGLE, first like on the real menu
      [listId("Add-ons"), 0, undefined, 1],
    ]);
    const v = item.itemData?.variations?.[0];
    expect(v?.type === "ITEM_VARIATION" && v.itemVariationData?.priceMoney).toEqual({ amount: 1400n, currency: "USD" });
  });

  it("a new category is created in the same batch", () => {
    const objs = buildMenuItemUpsert(input({ category: "Island Plates" }), live, seed);
    expect(objs[0]).toEqual({ type: "CATEGORY", id: "#cat-new", categoryData: { name: "Island Plates" } });
    expect(objs[1]?.type === "ITEM" && objs[1].itemData?.categories).toEqual([{ id: "#cat-new" }]);
  });

  it("edit keeps ids/versions/other fields, replaces what Eddie changed, drops derived descriptions", () => {
    const burger = live.find((o) => o.type === "ITEM" && o.itemData?.name === "The E.D. Burger")!;
    const withExtras = live.map((o) => (o.id === burger.id && o.type === "ITEM" ? { ...o, itemData: { ...o.itemData, descriptionHtml: "<p>old</p>", imageIds: ["IMG1"] } } : o));
    const [item] = buildMenuItemUpsert(input({ itemId: burger.id, name: "The E.D. Burger", description: "3 patties now", priceCents: 1500, category: "Burgers" }), withExtras, seed);
    if (item?.type !== "ITEM") throw new Error("not an item");
    expect(item).toMatchObject({ id: burger.id, version: 7n });
    expect(item.itemData).toMatchObject({ description: "3 patties now", imageIds: ["IMG1"] });
    expect(item.itemData?.descriptionHtml).toBeUndefined();
    const v = item.itemData?.variations?.[0];
    expect(v).toMatchObject({ id: "var_ed-burger", version: 7n });
    expect(v?.type === "ITEM_VARIATION" && v.itemVariationData?.priceMoney).toEqual({ amount: 1500n, currency: "USD" });
    expect(item.itemData?.modifierListInfo).toEqual([]); // options were unticked
  });

  it("refuses duplicate names (any case) and unknown items/options", () => {
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return e instanceof AppError ? e.code : "other";
      }
      return "none";
    };
    expect(code(() => buildMenuItemUpsert(input({ name: "the sweet heat" }), live, seed))).toBe("NAME_TAKEN");
    expect(code(() => buildMenuItemUpsert(input({ itemId: "NOPE" }), live, seed))).toBe("UNKNOWN_ITEM");
    expect(code(() => buildMenuItemUpsert(input({ options: ["NOPE"] }), live, seed))).toBe("UNKNOWN_OPTIONS");
    const sweet = live.find((o) => o.type === "ITEM" && o.itemData?.name === "The Sweet Heat")!;
    expect(code(() => buildMenuItemUpsert(input({ itemId: sweet.id, name: "The Sweet Heat" }), live, seed))).toBe("none"); // own name is fine
  });

  it("describes the choices in plain words, in menu order", () => {
    const { categories, options } = describeChoices(live, seed);
    expect(categories).toEqual(["Waffles", "Burgers", "Bowls", "Dirty Eats"]);
    expect(options.map((o) => [o.name, o.required])).toEqual([["Choose your waffle", true], ["Make it a combo", false], ["Add-ons", false]]);
    expect(options[2]!.summary).toContain("Bacon +$1.50");
  });
});

// ---- reading the menu with website-only flags ------------------------------------------------------
describe("menu with photos + website-only flags", () => {
  const sweet = live.find((o) => o.type === "ITEM" && o.itemData?.name === "The Sweet Heat")!;
  const withImage = live.map((o) => (o.id === sweet.id && o.type === "ITEM" ? { ...o, itemData: { ...o.itemData, imageIds: ["IMG_SWEET"] } } : o));
  const catalog: Obj[] = [...withImage, { type: "IMAGE", id: "IMG_SWEET", imageData: { url: "https://sq.example/sweet.jpg" } }];

  it("Square photo beats the local crop; the crop is the fallback", () => {
    const items = mapCatalogToMenu(catalog, seed, LOC);
    expect(items.find((i) => i.name === "The Sweet Heat")?.imageUrl).toBe("https://sq.example/sweet.jpg");
    expect(items.find((i) => i.name === "The E.D. Burger")?.imageUrl).toBe("/images/ed-burger.webp");
  });

  it("meta: hidden + site sold-out + subtitle; renamed seed items keep their photo and place via seed_key", () => {
    const burger = catalog.find((o) => o.type === "ITEM" && o.itemData?.name === "The E.D. Burger")!;
    const renamed = catalog.map((o) => (o.id === burger.id && o.type === "ITEM" ? { ...o, itemData: { ...o.itemData, name: "The Big E.D." } } : o));
    const items = mapCatalogToMenu(renamed, seed, LOC, [
      { square_item_id: burger.id!, seed_key: "ed-burger", subtitle: null, hidden: false, sold_out: true },
      { square_item_id: sweet.id!, seed_key: "sweet-heat", subtitle: "New subtitle", hidden: true, sold_out: false },
    ]);
    const big = items.find((i) => i.name === "The Big E.D.")!;
    expect(big).toMatchObject({ imageUrl: "/images/ed-burger.webp", subtitle: null, soldOut: true, siteSoldOut: true, squareSoldOut: false });
    expect(items.map((i) => i.name).slice(0, 3)).toEqual(["The Sweet Heat", "The Birthday Banger", "The Big E.D."]); // seed order kept
    expect(items.find((i) => i.itemId === sweet.id)).toMatchObject({ hidden: true, subtitle: "New subtitle" });
  });

  it("the public shape carries no admin fields", () => {
    const [first] = mapCatalogToMenu(catalog, seed, LOC);
    expect(Object.keys(toPublicItem(first!)).sort()).toEqual(
      ["category", "description", "imageUrl", "itemId", "modifierLists", "name", "priceCents", "soldOut", "subtitle", "variationId"].sort(),
    );
  });
});

// ---- order queue ------------------------------------------------------------------------------------
describe("tonight's orders (D45)", () => {
  const NOW = new Date("2026-09-25T02:00:00Z");
  const o = (id: string, over: Partial<QueueOrder>): QueueOrder => ({
    orderId: id, receiptNumber: id, customerName: "Test", totalCents: 1200, status: "PAID",
    paidAt: "2026-09-25T01:00:00Z", fulfilledAt: null, lines: [], note: null, ...over,
  });

  it("waiting oldest-first on top; done newest-first below; refunds last; stale ones drop off", () => {
    const { waiting, done } = sortQueue(
      [
        o("late", { paidAt: "2026-09-25T01:30:00Z" }),
        o("early", { paidAt: "2026-09-25T00:10:00Z" }),
        o("yesterday-unserved", { paidAt: "2026-09-23T23:00:00Z" }),
        o("done-1", { fulfilledAt: "2026-09-25T01:10:00Z" }),
        o("done-2", { fulfilledAt: "2026-09-25T01:40:00Z" }),
        o("done-old", { fulfilledAt: "2026-09-24T02:00:00Z" }),
        o("refunded", { status: "REFUNDED", paidAt: "2026-09-25T00:30:00Z" }),
        o("refunded-old", { status: "REFUNDED", paidAt: "2026-09-23T00:30:00Z" }),
      ],
      NOW,
    );
    expect(waiting.map((x) => x.orderId)).toEqual(["yesterday-unserved", "early", "late"]);
    expect(done.map((x) => x.orderId)).toEqual(["done-2", "done-1", "refunded"]);
  });

  it("Undo = fulfilledAt back to null → the card returns to its place in line", () => {
    const orders = [o("a", { paidAt: "2026-09-25T00:00:00Z", fulfilledAt: "2026-09-25T01:00:00Z" }), o("b", { paidAt: "2026-09-25T00:30:00Z" })];
    expect(sortQueue(orders, NOW).waiting.map((x) => x.orderId)).toEqual(["b"]);
    orders[0]!.fulfilledAt = null;
    expect(sortQueue(orders, NOW).waiting.map((x) => x.orderId)).toEqual(["a", "b"]);
  });

  it("line items + note come from the Square order (same mapping as the owner email)", () => {
    expect(
      toAlertLines({
        locationId: LOC,
        lineItems: [{ quantity: "2", name: "The E.D. Burger", modifiers: [{ name: "Make it a combo", quantity: "1" }, { name: "Bacon", quantity: "2" }] }],
        fulfillments: [{ type: "PICKUP", pickupDetails: { note: "no onions" } }],
      }),
    ).toEqual({ note: "no onions", lines: [{ qty: 2, name: "The E.D. Burger", modifiers: [{ qty: 1, name: "Make it a combo" }, { qty: 2, name: "Bacon" }] }] });
  });
});
