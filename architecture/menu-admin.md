# SOP: Menu editor in /admin (add, edit, sold out, hide)

## Goal
Eddie can grow and tune the menu from his phone without touching the Square dashboard (D46).
- **Adding a dish** uses a ready template:
  - drop or snap a photo
  - name, optional subtitle, description, price, category
  - switch on the existing options
  - a live preview of the real menu card, then Save
- **Editing** uses the same template, pre-filled.
- **Square stays the source of truth** for items, prices, categories, options and photos
  (Blueprint #3), so his Square app matches the site.

## Inputs — `MenuItemInput` (pure `parseMenuItemForm` → zod)
| Field | Rule |
|---|---|
| `itemId` | Empty → new item; otherwise the Square item id being edited. |
| `name` | 1–60 chars, trimmed. Must be **unique** (case-insensitive) among live items. |
| `subtitle` | 0–60 chars. Empty → none. Site only (Square has no field for it). |
| `description` | 0–300 chars. Shown on the card as written (e.g. "Crispy chicken · Hot honey"). |
| `price` | Dollars → cents, $1.00–$500.00. |
| `category` | An existing category name, or a new one (1–30 chars) that gets created. |
| `options` | Subset of the **existing** Square modifier lists (waffle choice, combo, add-ons). New option groups are out of scope (D46). |
| `photo` | Optional. JPEG, PNG, WebP or GIF up to 10 MB before resizing. |

## Photo pipeline
1. **Browser:** decode, downscale so the long edge is ≤ 1600 px, and re-encode as JPEG q≈0.85
   (typically 0.2–0.8 MB). This keeps uploads under Vercel's 4.5 MB request cap.
   - If the browser can't decode the file (e.g. HEIC on desktop), the original is sent and the
     server decides.
2. **Server (`processPhoto`, sharp):**
   - rotate from EXIF
   - fit inside 1600×1600
   - JPEG q84
   - strip metadata
   - refuse anything that isn't a readable image: "Couldn't read that photo — try a JPG or PNG."
3. **Square `CreateCatalogImage`** with `object_id` = the item and `is_primary: true`. Square
   accepts JPEG/PNG/GIF only, which is why we always send JPEG. Old photos stay in Square
   (never deleted); the primary one shows.

## Square write (`saveMenuItem`)
- **Pure `buildMenuItemUpsert(input, catalog)` → objects for one `batchUpsert`:**
  - **New:**
    - A category from `#cat-new` if the name isn't found.
    - Item `#item-new`: `presentAtAllLocations`, name, description, category.
    - `modifierListInfo`:
      - `min` = 1 when the list is required per the seed config (the waffle choice), else 0
      - `max` = 1 for SINGLE lists
      - ordinals follow the menu's list order
    - Variation `#var-new`: "Regular", FIXED_PRICING, price.
  - **Edit:**
    - Keep the item id, version, and every other `itemData` field (Square Online settings etc.).
    - Replace name, description, categories and `modifierListInfo`.
    - Keep the first variation's id and version, and replace its price.
- **IO order:** upsert → (photo) upload image → upsert `menu_meta` → clear the menu cache.
- If the photo upload fails after the item was saved, the item stays saved. Eddie sees "Saved —
  but the photo didn't upload. Open it and try the photo again."

## Website-only flags — Supabase `menu_meta`
Key: `square_item_id`.

| Column | Meaning |
|---|---|
| `subtitle` | Card subtitle. When a meta row exists it wins over the seed. |
| `seed_key` | Links a seed item across renames, so its local photo and menu position survive. |
| `hidden` | Off the public menu **and refused at checkout**. Stays in Square. Reversible. No deletes. |
| `sold_out` | "Sold out tonight" on the site. Square ignores app-set `sold_out` (SDK docs), so this is site-only. Shown sold out if **either** Square or this flag says so. Checkout refuses it. |

## Reading the menu (`getMenu`)
- **Catalog list** includes `IMAGE`. The photo is the item's first `imageIds` image from Square;
  otherwise the seed's local crop (matched by `seed_key`, then by name); otherwise `null`
  (placeholder).
- **Hidden items:** the public/checkout menu leaves them out. The admin menu includes them,
  with their flags.
- **Order:** seed order first (via `seed_key`/name), then new items alphabetically. Category tabs
  follow the item order, so a new category appears after the existing ones.
- **Cache:** the module cache (60 s) is cleared on every admin write. Other server instances may
  lag ≤ 60 s, which is acceptable.
- **Card style:** local crops (`/images/…`, transparent edges) use `object-contain` on the glow
  stage. Uploaded photos use `object-cover`.

## Edge cases
- Two items with the same name are refused: "There's already a dish called …".
- A category is never deleted; empty categories simply don't show.
- An edited price applies to new checkouts immediately, since checkout re-prices with
  `getMenu({ fresh: true })` (Invariant 2).
- There is no "delete dish": hide it instead (safe, and it keeps Square order history intact).
- **Sandbox vs production:** edits go to whichever Square environment `.env` points at. In
  Phase T the production catalog is seeded first, then edited there.
