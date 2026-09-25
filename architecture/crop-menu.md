# SOP — Crop dish photos from the menu graphic

**Goal:** interim dish photos for the six menu items, cut from the owner's menu graphic, until
Eddie's real photos arrive (D31, D35). Real photos replace these files one-for-one.

## Inputs
- `reference/menu.jpg`: the owner's menu graphic, saved 2026-09-24. It is **920×2000**.
  Despite the `.jpg` name it is WebP inside; sharp reads it by content, so the name doesn't matter.
- `architecture/menu-crops.json`: one crop per seed item. Each crop has:
  - `rect`: a box in source pixels
  - `cutouts`: boxes relative to `rect`, covering menu lettering that touches the dish

## Tool
Run `npm run assets:menu-crops`, which calls `execution/assets/cropMenu.ts`.

1. **Refuse** when the source isn't exactly `sourceWidth×sourceHeight`. The coordinates only fit
   this exact file. A new menu graphic means re-measuring, not re-running.
2. For each crop:
   - extract `rect`
   - upscale ×`scale` (lanczos3) with a light sharpen
   - fade the edges with an elliptical vignette to transparent
   - punch out the `cutouts` with feathered edges
3. Write `public/images/<file>`. It is WebP with alpha, so the dish melts into whatever dark
   background it sits on (menu card, hero porthole).

## Measured crops (source px)
| Item | rect (left, top, w, h) | Cutouts (in-rect) | Why |
|---|---|---|---|
| Sweet Heat | 0, 618, 247, 226 | none | Right edge stops before "THE SWEET HEAT". Bottom stops above the baked-in "$12" tag. |
| E.D. Burger | 480, 640, 248, 252 | title, description, price-tag edge | Lettering sits right against the bun. |
| Teriyaki After Dark | 0, 914, 272, 234 | "TERIYAKI", "AFTER" | Title hugs the bowl rim. |
| Hammered Corn | 487, 920, 217, 240 | none | Starts right of the panel's gold border. |
| Dirty E.D. Fries | 0, 1170, 270, 242 | "DIRTY" | Starts under the row divider line. |
| Birthday Banger | 487, 1180, 243, 225 | "THE" | Starts right of the panel border. |

## Edge cases
- **Soft images:** the dishes are only about 250 px wide in the source. They are fine on cards
  and blurry if blown up large. Don't use them for hero-scale art beyond the porthole.
- **New item without a crop:** its seed `image` stays `null`, and the card shows the
  "Photo coming soon" placeholder (D33).
- **Real photo arrives:** drop it in `public/images/`, point the seed `image` at it, and delete
  that item's crop from `menu-crops.json`.
- The guard test fails if:
  - a seed `image` points at a missing file
  - a crop falls outside the source
  - a cutout falls outside its crop
