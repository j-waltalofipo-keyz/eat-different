// SOP: architecture/menu-sync.md (Tool 2). Square Catalog → MenuItem[].
import type { Square } from "square";
import { getEnv } from "../lib/env";
import { toCents } from "../lib/money";
import type { MenuItem, ModifierList, Seed } from "../schemas";
import { loadSeed, norm } from "./seed";
import { listCatalog } from "./seedCatalog";

type Obj = Square.CatalogObject;

function presentAt(o: Obj, locationId: string): boolean {
  if (o.isDeleted) return false;
  return o.presentAtAllLocations === false
    ? (o.presentAtLocationIds ?? []).includes(locationId)
    : !(o.absentAtLocationIds ?? []).includes(locationId);
}

/** Pure. */
export function mapCatalogToMenu(objects: Obj[], seed: Seed, locationId: string): MenuItem[] {
  const categoryNames = new Map<string, string>();
  const lists = new Map<string, Square.CatalogModifierList>();
  for (const o of objects) {
    if (o.type === "CATEGORY" && o.id) categoryNames.set(o.id, o.categoryData?.name ?? "");
    if (o.type === "MODIFIER_LIST" && !o.isDeleted && o.modifierListData) lists.set(o.id, o.modifierListData);
  }

  const items: MenuItem[] = [];
  for (const o of objects) {
    if (o.type !== "ITEM" || !o.itemData || o.itemData.isArchived || !presentAt(o, locationId)) continue;
    const data = o.itemData;
    const variation = (data.variations ?? []).find((v) => v.type === "ITEM_VARIATION" && presentAt(v, locationId));
    if (variation?.type !== "ITEM_VARIATION" || !variation.itemVariationData) continue;
    const vData = variation.itemVariationData;
    const seedItem = seed.items.find((s) => norm(s.name) === norm(data.name));
    const categoryId = data.categories?.[0]?.id ?? data.categoryId ?? "";

    const modifierLists: ModifierList[] = [];
    const infos = [...(data.modifierListInfo ?? [])].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    for (const info of infos) {
      const list = lists.get(info.modifierListId);
      if (!list || info.enabled === false) continue;
      const itemMin = info.minSelectedModifiers;
      const min = itemMin != null && itemMin >= 0 ? itemMin : Math.max(0, Number(list.minSelectedModifiers ?? 0));
      const seedList = seed.modifierLists.find((l) => norm(l.name) === norm(list.name));
      modifierLists.push({
        id: info.modifierListId,
        name: list.name ?? "",
        selection: list.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE",
        required: min >= 1,
        maxQtyPerOption: seedList?.maxQtyPerOption ?? 1,
        options: (list.modifiers ?? []).flatMap((m) =>
          m.type === "MODIFIER" && m.id && !m.isDeleted
            ? [{ id: m.id, name: m.modifierData?.name ?? "", priceCents: toCents(m.modifierData?.priceMoney) }]
            : [],
        ),
      });
    }

    items.push({
      variationId: variation.id,
      itemId: o.id,
      name: data.name ?? "",
      subtitle: seedItem?.subtitle ?? null,
      description: data.description ?? data.descriptionPlaintext ?? "",
      priceCents: toCents(vData.priceMoney),
      imageUrl: seedItem?.image ? `/images/${seedItem.image}` : null,
      category: categoryNames.get(categoryId) || "Menu",
      soldOut: (vData.locationOverrides ?? []).some((lo) => lo.locationId === locationId && lo.soldOut === true),
      modifierLists,
    });
  }

  const rank = (name: string) => {
    const i = seed.items.findIndex((s) => norm(s.name) === norm(name));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return items.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

let cache: { at: number; items: MenuItem[] } | null = null;
const TTL_MS = 60_000;

/** IO. Display reads may use the 60 s cache; checkout must pass { fresh: true }. */
export async function getMenu({ fresh = false } = {}): Promise<MenuItem[]> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.items;
  const items = mapCatalogToMenu(await listCatalog(), loadSeed(), getEnv().SQUARE_LOCATION_ID);
  cache = { at: Date.now(), items };
  return items;
}
