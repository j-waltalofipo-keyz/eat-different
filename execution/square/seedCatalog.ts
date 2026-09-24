// SOP: architecture/menu-sync.md (Tool 1). Seed → Square Catalog, idempotent by name.
import { randomUUID } from "node:crypto";
import type { Square } from "square";
import { square } from "../lib/clients";
import { toMoney } from "../lib/money";
import type { Seed } from "../schemas";
import { norm } from "./seed";

type Obj = Square.CatalogObject;

const nameOf = (o: Obj): string =>
  o.type === "ITEM" ? (o.itemData?.name ?? "")
  : o.type === "CATEGORY" ? (o.categoryData?.name ?? "")
  : o.type === "MODIFIER_LIST" ? (o.modifierListData?.name ?? "")
  : "";

/** Pure. Reuses id + version of same-named existing objects; otherwise temp "#" ids (create). */
export function buildCatalogUpsert(seed: Seed, existing: Obj[]): Obj[] {
  const find = (type: Obj["type"], name: string) =>
    existing.find((o) => o.type === type && !o.isDeleted && norm(nameOf(o)) === norm(name));

  const categoryIds = new Map<string, string>();
  const categories: Obj[] = seed.categories.map((c) => {
    const ex = find("CATEGORY", c.name);
    const id = ex?.id ?? `#cat-${c.key}`;
    categoryIds.set(c.key, id);
    return { type: "CATEGORY", id, version: ex?.version, categoryData: { name: c.name } };
  });

  const listIds = new Map<string, string>();
  const lists: Obj[] = seed.modifierLists.map((l) => {
    const ex = find("MODIFIER_LIST", l.name);
    const exMods = ex?.type === "MODIFIER_LIST" ? (ex.modifierListData?.modifiers ?? []) : [];
    const id = ex?.id ?? `#ml-${l.key}`;
    listIds.set(l.key, id);
    return {
      type: "MODIFIER_LIST",
      id,
      version: ex?.version,
      modifierListData: {
        name: l.name,
        selectionType: l.selection,
        allowQuantities: l.maxQtyPerOption > 1,
        modifiers: l.options.map((opt): Obj => {
          const exMod = exMods.find((m) => m.type === "MODIFIER" && norm(m.modifierData?.name) === norm(opt.name));
          return {
            type: "MODIFIER",
            id: exMod?.id ?? `#mod-${opt.key}`,
            version: exMod?.version,
            modifierData: { name: opt.name, priceMoney: toMoney(opt.priceCents) },
          };
        }),
      },
    };
  });

  const items: Obj[] = seed.items.map((item) => {
    const ex = find("ITEM", item.name);
    const exVar = ex?.type === "ITEM" ? ex.itemData?.variations?.[0] : undefined;
    const id = ex?.id ?? `#item-${item.key}`;
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`seed item "${item.key}" has unknown category "${item.category}"`);
    return {
      type: "ITEM",
      id,
      version: ex?.version,
      presentAtAllLocations: true,
      itemData: {
        name: item.name,
        description: item.ingredients.join(" · "),
        categories: [{ id: categoryId }],
        modifierListInfo: item.modifierLists.map((key, ordinal) => {
          const list = seed.modifierLists.find((l) => l.key === key);
          const listId = listIds.get(key);
          if (!list || !listId) throw new Error(`seed item "${item.key}" has unknown modifier list "${key}"`);
          return {
            modifierListId: listId,
            minSelectedModifiers: list.required ? 1 : 0,
            maxSelectedModifiers: list.selection === "SINGLE" ? 1 : undefined,
            enabled: true,
            ordinal,
          };
        }),
        variations: [
          {
            type: "ITEM_VARIATION",
            id: exVar?.id ?? `#var-${item.key}`,
            version: exVar?.version,
            itemVariationData: {
              itemId: id,
              name: "Regular",
              pricingType: "FIXED_PRICING",
              priceMoney: toMoney(item.priceCents),
            },
          },
        ],
      },
    };
  });

  return [...categories, ...lists, ...items];
}

export async function listCatalog(types = "ITEM,CATEGORY,MODIFIER_LIST"): Promise<Obj[]> {
  const out: Obj[] = [];
  for await (const o of await square().catalog.list({ types })) out.push(o);
  return out;
}

/** IO. Upserts the seed; counts top-level objects (categories, lists, items) created vs updated. */
export async function seedCatalog(seed: Seed): Promise<{ created: number; updated: number }> {
  const objects = buildCatalogUpsert(seed, await listCatalog());
  const res = await square().catalog.batchUpsert({ idempotencyKey: randomUUID(), batches: [{ objects }] });
  if (res.errors?.length) throw new Error(res.errors.map((e) => `${e.code}: ${e.detail}`).join("; "));
  const created = objects.filter((o) => o.id?.startsWith("#")).length;
  return { created, updated: objects.length - created };
}
