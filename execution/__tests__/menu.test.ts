import type { Square } from "square";
import { describe, expect, it } from "vitest";
import { mapCatalogToMenu } from "../square/getMenu";
import { buildCatalogUpsert } from "../square/seedCatalog";
import { SeedSchema } from "../schemas";
import seedJson from "../../architecture/menu-seed.json";

const seed = SeedSchema.parse(seedJson);
const LOC = "LOC1";
type Obj = Square.CatalogObject;

describe("buildCatalogUpsert", () => {
  it("creates everything with temp ids on an empty catalog", () => {
    const objs = buildCatalogUpsert(seed, []);
    expect(objs.filter((o) => o.type === "CATEGORY")).toHaveLength(4);
    expect(objs.filter((o) => o.type === "MODIFIER_LIST")).toHaveLength(3);
    expect(objs.filter((o) => o.type === "ITEM")).toHaveLength(6);
    expect(objs.every((o) => o.id?.startsWith("#"))).toBe(true);
  });

  it("encodes the menu rules: waffle required only on Sweet Heat, combo on 3 items, add-ons on all 6", () => {
    const objs = buildCatalogUpsert(seed, []);
    const items = objs.filter((o): o is Extract<Obj, { type: "ITEM" }> => o.type === "ITEM");
    const lists = (name: string) =>
      items.find((i) => i.itemData?.name === name)!.itemData!.modifierListInfo!.map((m) => [m.modifierListId, m.minSelectedModifiers]);
    expect(lists("The Sweet Heat")).toEqual([["#ml-waffle", 1], ["#ml-combo", 0], ["#ml-addons", 0]]);
    expect(lists("Teriyaki After Dark")).toEqual([["#ml-addons", 0]]);
    const withCombo = items.filter((i) => i.itemData?.modifierListInfo?.some((m) => m.modifierListId === "#ml-combo"));
    expect(withCombo.map((i) => i.itemData?.name)).toEqual(["The Sweet Heat", "The Birthday Banger", "The E.D. Burger"]);
    expect(items.every((i) => i.itemData?.modifierListInfo?.some((m) => m.modifierListId === "#ml-addons"))).toBe(true);
  });

  it("reuses id + version of same-named existing objects (idempotent re-seed)", () => {
    const existing: Obj[] = [
      { type: "CATEGORY", id: "CAT_REAL", version: 7n, categoryData: { name: "waffles" } },
      {
        type: "ITEM",
        id: "ITEM_REAL",
        version: 9n,
        itemData: {
          name: "The Sweet Heat",
          variations: [{ type: "ITEM_VARIATION", id: "VAR_REAL", version: 9n, itemVariationData: { name: "Regular" } }],
        },
      },
    ];
    const objs = buildCatalogUpsert(seed, existing);
    expect(objs.find((o) => o.type === "CATEGORY" && o.categoryData?.name === "Waffles")).toMatchObject({ id: "CAT_REAL", version: 7n });
    const item = objs.find((o) => o.type === "ITEM" && o.itemData?.name === "The Sweet Heat");
    expect(item).toMatchObject({ id: "ITEM_REAL", version: 9n });
    expect(item?.type === "ITEM" && item.itemData?.variations?.[0]).toMatchObject({ id: "VAR_REAL", version: 9n });
  });
});

describe("mapCatalogToMenu", () => {
  const catalog: Obj[] = [
    { type: "CATEGORY", id: "CAT_B", categoryData: { name: "Burgers" } },
    {
      type: "MODIFIER_LIST",
      id: "ML_ADD",
      modifierListData: {
        name: "Add-ons",
        selectionType: "MULTIPLE",
        modifiers: [{ type: "MODIFIER", id: "M_BACON", modifierData: { name: "Bacon", priceMoney: { amount: 150n, currency: "USD" } } }],
      },
    },
    {
      type: "ITEM",
      id: "I_BURGER",
      itemData: {
        name: "The E.D. Burger",
        description: "2 smashed patties",
        categories: [{ id: "CAT_B" }],
        modifierListInfo: [{ modifierListId: "ML_ADD", minSelectedModifiers: 0, enabled: true }],
        variations: [
          {
            type: "ITEM_VARIATION",
            id: "V_BURGER",
            itemVariationData: {
              priceMoney: { amount: 1200n, currency: "USD" },
              locationOverrides: [{ locationId: LOC, soldOut: true }],
            },
          },
        ],
      },
    },
    {
      type: "ITEM",
      id: "I_ARCHIVED",
      itemData: { name: "Old Thing", isArchived: true, variations: [{ type: "ITEM_VARIATION", id: "V_OLD", itemVariationData: {} }] },
    },
    {
      type: "ITEM",
      id: "I_ELSEWHERE",
      presentAtAllLocations: false,
      presentAtLocationIds: ["OTHER"],
      itemData: { name: "Elsewhere", variations: [{ type: "ITEM_VARIATION", id: "V_ELSE", itemVariationData: {} }] },
    },
  ];

  it("maps price, category name, sold-out-at-location, and seed presentation fields", () => {
    const [burger, ...rest] = mapCatalogToMenu(catalog, seed, LOC);
    expect(rest).toHaveLength(0); // archived + other-location items skipped
    expect(burger).toMatchObject({
      variationId: "V_BURGER",
      name: "The E.D. Burger",
      priceCents: 1200,
      category: "Burgers",
      soldOut: true,
      imageUrl: "/images/ed-burger.jpg",
    });
    expect(burger!.modifierLists[0]).toEqual({
      id: "ML_ADD",
      name: "Add-ons",
      selection: "MULTIPLE",
      required: false,
      maxQtyPerOption: 3, // from the seed list with the same name
      options: [{ id: "M_BACON", name: "Bacon", priceCents: 150 }],
    });
  });
});
