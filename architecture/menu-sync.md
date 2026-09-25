# SOP — Menu Sync (seed → Square Catalog → site)

## Goal
Square Catalog is the single source of truth for what is sold and for how much. The site reads it;
it never stores its own prices.

## Inputs
- `architecture/menu-seed.json` — categories, modifier lists, items (owner-confirmed).
- Square Catalog (`ITEM`, `CATEGORY`, `MODIFIER_LIST` objects) for `SQUARE_LOCATION_ID`.

## Tool 1 — `execution/square/seedCatalog.ts` (`npm run seed:catalog`)
1. Validate the seed with zod. Abort on any error.
2. List existing `ITEM`, `CATEGORY`, `MODIFIER_LIST` objects.
3. Pure `buildCatalogUpsert(seed, existing)`:
   - Match existing objects **by name** (case-insensitive). Match → reuse its `id` + `version`
     (update). No match → temp id `#<kind>-<key>` (create).
   - Category → `CATEGORY`.
   - Modifier list → `MODIFIER_LIST` with `selectionType`, nested `MODIFIER`s (price in cents),
     `allowQuantities = maxQtyPerOption > 1`.
   - Item → `ITEM` with `description` = ingredients joined `" · "`, one variation named
     `"Regular"` at `priceCents`, `categories: [category]`, and `modifierListInfo`:
     required list → `min 1 / max 1`; optional SINGLE → `min 0 / max 1`; MULTIPLE → `min 0`.
4. One `catalog.batchUpsert` call. Re-running is safe: second run updates, never duplicates.

## Tool 2 — `execution/square/getMenu.ts`
- IO: `catalog.list({ types: "ITEM,CATEGORY,MODIFIER_LIST" })`, all pages.
- Pure `mapCatalogToMenu(objects, seed, locationId)` → `MenuItem[]`:
  - Skip items that are archived, deleted, or not present at `locationId`.
  - First variation → `variationId`, `priceCents`.
  - `soldOut` = `itemVariationData.locationOverrides[locationId].soldOut === true`.
  - `category` = the Square category **name** (string, not an enum — owner may add categories).
  - `modifierLists` from `modifierListInfo` where `enabled !== false`;
    `required = minSelectedModifiers ≥ 1`; `maxQtyPerOption` from the seed list with the same
    name, else 1.
  - Presentation-only fields not representable in Square (`subtitle`, `image`) come from the seed
    item with the same **name**; missing → `null`. A seed `image` stays `null` until its file
    exists in `public/images/` (D33 — a test enforces it), so the site never shows a broken image.
  - Order: seed order first, then any other items alphabetically.
- Cache: in-memory 60 s for display. **Checkout always calls with `{ fresh: true }`.**

## Edge cases
- Owner renames an item in Square → it still sells; it just loses the seed subtitle/image until
  the seed is updated.
- Owner marks an item sold out in the Square app → `soldOut: true` within 60 s on the menu,
  immediately at checkout.
- Seed changes (new item/price) → edit `menu-seed.json`, re-run `npm run seed:catalog`.
