// SOP: architecture/menu-admin.md. /admin menu editor → Square Catalog (truth) + Supabase menu_meta (site-only flags).
import { randomUUID } from "node:crypto";
import type { Square } from "square";
import { z } from "zod";
import { AppError } from "../lib/errors";
import { db, square } from "../lib/clients";
import { formatUsd, toCents, toMoney } from "../lib/money";
import type { Seed } from "../schemas";
import { getAdminMenu, invalidateMenuCache } from "../square/getMenu";
import { loadSeed, norm } from "../square/seed";
import { listCatalog } from "../square/seedCatalog";

type Obj = Square.CatalogObject;

// ---- Input -------------------------------------------------------------------------------
export const MenuItemInputSchema = z.object({
  itemId: z.string().trim().transform((s) => s || null),
  name: z.string().trim().min(1, "give the dish a name").max(60, "keep the name to 60 characters or fewer"),
  subtitle: z.string().trim().max(60, "keep the subtitle to 60 characters or fewer").transform((s) => s || null),
  description: z.string().trim().max(300, "keep the description to 300 characters or fewer"),
  priceCents: z
    .number({ error: "enter a price like 12 or 12.50" })
    .int()
    .min(100, "price must be at least $1")
    .max(50_000, "price must be $500 or less"),
  category: z.string().trim().min(1, "pick a category or type a new one").max(30, "keep the category to 30 characters or fewer"),
  options: z.array(z.string().min(1)).max(10),
});
export type MenuItemInput = z.infer<typeof MenuItemInputSchema>;

/** Pure. Editor form → input. Category is a pick, or "__new__" + typed name. */
export function parseMenuItemForm(form: { get(name: string): unknown; getAll(name: string): unknown[] }): MenuItemInput {
  const s = (n: string) => String(form.get(n) ?? "");
  const price = s("price").replace(/[$,\s]/g, "");
  return MenuItemInputSchema.parse({
    itemId: s("itemId"),
    name: s("name"),
    subtitle: s("subtitle"),
    description: s("description"),
    priceCents: price === "" ? NaN : Math.round(Number(price) * 100),
    category: s("category") === "__new__" ? s("newCategory") : s("category"),
    options: form.getAll("options").map(String),
  });
}

// ---- Square upsert (pure) -------------------------------------------------------------------
const NEW_ITEM = "#item-new";

/**
 * Pure. One batch for Square: a category if it's new, plus the item. Edits keep ids, versions and
 * every other itemData field; they replace name, description, category, options and the first price.
 */
export function buildMenuItemUpsert(input: MenuItemInput, objects: Obj[], seed: Seed): Obj[] {
  const live = objects.filter((o) => !o.isDeleted);
  const items = live.filter((o): o is Obj & { type: "ITEM" } => o.type === "ITEM" && !o.itemData?.isArchived);

  const clash = items.find((o) => o.id !== input.itemId && norm(o.itemData?.name) === norm(input.name));
  if (clash) throw new AppError("NAME_TAKEN", 409, `There's already a dish called “${clash.itemData?.name}”.`);

  const existing = input.itemId ? items.find((o) => o.id === input.itemId) : undefined;
  if (input.itemId && !existing) throw new AppError("UNKNOWN_ITEM", 404, "That dish isn't in Square anymore. Refresh and try again.");

  const out: Obj[] = [];
  let categoryId = live.find((o) => o.type === "CATEGORY" && norm(o.categoryData?.name) === norm(input.category))?.id;
  if (!categoryId) {
    categoryId = "#cat-new";
    out.push({ type: "CATEGORY", id: categoryId, categoryData: { name: input.category } });
  }

  const listOrder = (name: string) => {
    const i = seed.modifierLists.findIndex((l) => norm(l.name) === norm(name));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const chosen = input.options.map((id) => {
    const list = live.find((o) => o.type === "MODIFIER_LIST" && o.id === id);
    if (list?.type !== "MODIFIER_LIST") throw new AppError("UNKNOWN_OPTIONS", 400, "One of those options isn't in Square anymore. Refresh and try again.");
    return list;
  });
  const modifierListInfo = chosen
    .sort((a, b) => listOrder(a.modifierListData?.name ?? "") - listOrder(b.modifierListData?.name ?? ""))
    .map((list, ordinal): Square.CatalogItemModifierListInfo => {
      const seedList = seed.modifierLists.find((l) => norm(l.name) === norm(list.modifierListData?.name));
      const single = list.modifierListData?.selectionType === "SINGLE";
      return {
        modifierListId: list.id,
        minSelectedModifiers: seedList?.required ? 1 : 0,
        maxSelectedModifiers: single ? 1 : undefined,
        enabled: true,
        ordinal,
      };
    });

  if (existing) {
    // Read-only / derived fields are dropped so the new description wins (Square rebuilds them).
    const { descriptionHtml, descriptionPlaintext, ecomUri, ecomImageUris, ...keep } = existing.itemData ?? {};
    void [descriptionHtml, descriptionPlaintext, ecomUri, ecomImageUris];
    const [first, ...others] = keep.variations ?? [];
    if (first?.type !== "ITEM_VARIATION") throw new AppError("UNKNOWN_ITEM", 404, "That dish has no price in Square. Edit it in Square once, then try again.");
    out.push({
      ...existing,
      itemData: {
        ...keep,
        name: input.name,
        description: input.description,
        categories: [{ id: categoryId }],
        modifierListInfo,
        variations: [{ ...first, itemVariationData: { ...first.itemVariationData, pricingType: "FIXED_PRICING", priceMoney: toMoney(input.priceCents) } }, ...others],
      },
    });
  } else {
    out.push({
      type: "ITEM",
      id: NEW_ITEM,
      presentAtAllLocations: true,
      itemData: {
        name: input.name,
        description: input.description,
        categories: [{ id: categoryId }],
        modifierListInfo,
        variations: [
          {
            type: "ITEM_VARIATION",
            id: "#var-new",
            presentAtAllLocations: true,
            itemVariationData: { itemId: NEW_ITEM, name: "Regular", pricingType: "FIXED_PRICING", priceMoney: toMoney(input.priceCents) },
          },
        ],
      },
    });
  }
  return out;
}

// ---- IO -----------------------------------------------------------------------------------
/** Creates or updates the dish in Square, then its photo, then its site-only fields. */
export async function saveMenuItem(input: MenuItemInput, photo: Buffer | null): Promise<{ itemId: string; photoFailed: boolean }> {
  const seed = loadSeed();
  const objects = await listCatalog("ITEM,CATEGORY,MODIFIER_LIST");
  const batch = buildMenuItemUpsert(input, objects, seed);
  const res = await square().catalog.batchUpsert({ idempotencyKey: randomUUID(), batches: [{ objects: batch }] });
  if (res.errors?.length) throw new Error(res.errors.map((e) => `${e.code}: ${e.detail}`).join("; "));
  const itemId = input.itemId ?? res.idMappings?.find((m) => m.clientObjectId === NEW_ITEM)?.objectId;
  if (!itemId) throw new Error("Square didn't return the new item's id");

  // Keep the seed link across renames: an existing meta link, else the item's pre-edit name.
  const before = objects.find((o) => o.id === input.itemId);
  const { data: metaRow } = await db().from("menu_meta").select("seed_key").eq("square_item_id", itemId).maybeSingle();
  const seedKey =
    metaRow?.seed_key ??
    (before?.type === "ITEM" ? seed.items.find((s) => norm(s.name) === norm(before.itemData?.name))?.key : undefined) ??
    null;
  const meta = await db()
    .from("menu_meta")
    .upsert({ square_item_id: itemId, seed_key: seedKey, subtitle: input.subtitle, updated_at: new Date().toISOString() });
  if (meta.error) throw new Error(`menu_meta: ${meta.error.message}`);

  let photoFailed = false;
  if (photo) {
    try {
      await square().catalog.images.create({
        request: {
          idempotencyKey: randomUUID(),
          objectId: itemId,
          isPrimary: true,
          image: { type: "IMAGE", id: "#photo", imageData: { name: input.name, caption: input.name } },
        },
        imageFile: new Blob([new Uint8Array(photo)], { type: "image/jpeg" }),
      });
    } catch (e) {
      console.error("menu photo upload failed (item is saved)", e);
      photoFailed = true;
    }
  }
  invalidateMenuCache();
  return { itemId, photoFailed };
}

/** Website-only switches. First touch copies today's subtitle + seed link so nothing visible changes. */
export async function setMenuFlag(itemId: string, flag: "hidden" | "sold_out", value: boolean): Promise<void> {
  const item = (await getAdminMenu()).find((i) => i.itemId === itemId);
  if (!item) throw new AppError("UNKNOWN_ITEM", 404, "That dish isn't in Square anymore. Refresh and try again.");
  const { data: row } = await db().from("menu_meta").select("square_item_id").eq("square_item_id", itemId).maybeSingle();
  const patch: Record<string, string | boolean | null> = { square_item_id: itemId, [flag]: value, updated_at: new Date().toISOString() };
  if (!row) Object.assign(patch, { subtitle: item.subtitle, seed_key: item.seedKey });
  const { error } = await db().from("menu_meta").upsert(patch);
  if (error) throw new Error(`menu_meta: ${error.message}`);
  invalidateMenuCache();
}

export type MenuChoices = {
  categories: string[];
  options: { id: string; name: string; summary: string; required: boolean }[];
};

/** Pure. What the editor offers: every category and every existing option set, described in plain words. */
export function describeChoices(objects: Obj[], seed: Seed): MenuChoices {
  const live = objects.filter((o) => !o.isDeleted);
  const seedCats = seed.categories.map((c) => c.name);
  const categories = [
    ...new Set([...seedCats, ...live.flatMap((o) => (o.type === "CATEGORY" && o.categoryData?.name ? [o.categoryData.name] : []))]),
  ];
  const listOrder = (name: string) => {
    const i = seed.modifierLists.findIndex((l) => norm(l.name) === norm(name));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const options = live
    .flatMap((o) => (o.type === "MODIFIER_LIST" && o.modifierListData ? [{ id: o.id, data: o.modifierListData }] : []))
    .sort((a, b) => listOrder(a.data.name ?? "") - listOrder(b.data.name ?? ""))
    .map(({ id, data }) => {
      const mods = (data.modifiers ?? []).flatMap((m) => (m.type === "MODIFIER" && !m.isDeleted ? [m.modifierData] : []));
      const summary = mods
        .map((m) => (toCents(m?.priceMoney) > 0 ? `${m?.name} +${formatUsd(toCents(m?.priceMoney))}` : (m?.name ?? "")))
        .join(" · ");
      const required = seed.modifierLists.find((l) => norm(l.name) === norm(data.name))?.required ?? false;
      return { id, name: data.name ?? "Options", summary, required };
    });
  return { categories, options };
}

/** IO. */
export async function getMenuChoices(): Promise<MenuChoices> {
  return describeChoices(await listCatalog("CATEGORY,MODIFIER_LIST"), loadSeed());
}
