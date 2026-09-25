// SOPs: architecture/menu-sync.md (Tool 2), menu-admin.md (photos, website-only flags). Square Catalog → MenuItem[].
import type { Square } from "square";
import { db } from "../lib/clients";
import { getEnv } from "../lib/env";
import { toCents } from "../lib/money";
import type { MenuItem, ModifierList, Seed } from "../schemas";
import { loadSeed, norm } from "./seed";
import { listCatalog } from "./seedCatalog";

type Obj = Square.CatalogObject;

/** Website-only presentation + flags per Square item (Supabase `menu_meta`, D46). */
export type MenuMeta = { square_item_id: string; seed_key: string | null; subtitle: string | null; hidden: boolean; sold_out: boolean };

/** What /admin sees: the public item plus where each flag comes from. */
export type AdminMenuItem = MenuItem & {
  hidden: boolean;
  siteSoldOut: boolean;
  squareSoldOut: boolean;
  seedKey: string | null;
  categoryId: string | null;
  modifierListIds: string[];
};

function presentAt(o: Obj, locationId: string): boolean {
  if (o.isDeleted) return false;
  return o.presentAtAllLocations === false
    ? (o.presentAtLocationIds ?? []).includes(locationId)
    : !(o.absentAtLocationIds ?? []).includes(locationId);
}

/** Pure. Every live item, hidden ones included (callers decide who sees them). */
export function mapCatalogToMenu(objects: Obj[], seed: Seed, locationId: string, meta: MenuMeta[] = []): AdminMenuItem[] {
  const categoryNames = new Map<string, string>();
  const lists = new Map<string, Square.CatalogModifierList>();
  const images = new Map<string, string>();
  for (const o of objects) {
    if (o.type === "CATEGORY" && o.id) categoryNames.set(o.id, o.categoryData?.name ?? "");
    if (o.type === "MODIFIER_LIST" && !o.isDeleted && o.modifierListData) lists.set(o.id, o.modifierListData);
    if (o.type === "IMAGE" && !o.isDeleted && o.imageData?.url) images.set(o.id, o.imageData.url);
  }
  const metaById = new Map(meta.map((m) => [m.square_item_id, m]));

  const items: AdminMenuItem[] = [];
  for (const o of objects) {
    if (o.type !== "ITEM" || !o.itemData || o.itemData.isArchived || !presentAt(o, locationId)) continue;
    const data = o.itemData;
    const variation = (data.variations ?? []).find((v) => v.type === "ITEM_VARIATION" && presentAt(v, locationId));
    if (variation?.type !== "ITEM_VARIATION" || !variation.itemVariationData) continue;
    const vData = variation.itemVariationData;
    const m = metaById.get(o.id);
    const seedItem = (m?.seed_key ? seed.items.find((s) => s.key === m.seed_key) : undefined) ?? seed.items.find((s) => norm(s.name) === norm(data.name));
    const squareImage = (data.imageIds ?? []).map((id) => images.get(id)).find(Boolean);
    const squareSoldOut = (vData.locationOverrides ?? []).some((lo) => lo.locationId === locationId && lo.soldOut === true);
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
      subtitle: m ? m.subtitle : (seedItem?.subtitle ?? null),
      description: data.description ?? data.descriptionPlaintext ?? "",
      priceCents: toCents(vData.priceMoney),
      imageUrl: squareImage ?? (seedItem?.image ? `/images/${seedItem.image}` : null),
      category: categoryNames.get(categoryId) || "Menu",
      soldOut: squareSoldOut || m?.sold_out === true,
      modifierLists,
      hidden: m?.hidden === true,
      siteSoldOut: m?.sold_out === true,
      squareSoldOut,
      seedKey: seedItem?.key ?? null,
      categoryId: categoryId || null,
      modifierListIds: modifierLists.map((l) => l.id),
    });
  }

  const rank = (key: string | null) => {
    const i = key ? seed.items.findIndex((s) => s.key === key) : -1;
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return items.sort((a, b) => rank(a.seedKey) - rank(b.seedKey) || a.name.localeCompare(b.name));
}

/** Pure. The public shape — admin-only fields stripped. */
export function toPublicItem({ hidden, siteSoldOut, squareSoldOut, seedKey, categoryId, modifierListIds, ...item }: AdminMenuItem): MenuItem {
  return item;
}

let cache: { at: number; items: AdminMenuItem[] } | null = null;
const TTL_MS = 60_000;

async function loadMenu(fresh: boolean): Promise<AdminMenuItem[]> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.items;
  const [objects, meta] = await Promise.all([
    listCatalog("ITEM,CATEGORY,MODIFIER_LIST,IMAGE"),
    db().from("menu_meta").select("square_item_id, seed_key, subtitle, hidden, sold_out"),
  ]);
  if (meta.error) throw new Error(`menu_meta: ${meta.error.message}`);
  const items = mapCatalogToMenu(objects, loadSeed(), getEnv().SQUARE_LOCATION_ID, meta.data);
  cache = { at: Date.now(), items };
  return items;
}

/** IO. The public menu (hidden items left out). Display reads may use the 60 s cache; checkout must pass { fresh: true }. */
export async function getMenu({ fresh = false } = {}): Promise<MenuItem[]> {
  return (await loadMenu(fresh)).filter((i) => !i.hidden).map(toPublicItem);
}

/** IO. Everything, hidden included, always fresh — /admin only. */
export const getAdminMenu = (): Promise<AdminMenuItem[]> => loadMenu(true);

/** Every admin menu write calls this so this server shows the change at once (others lag ≤ 60 s). */
export function invalidateMenuCache(): void {
  cache = null;
}
