# Design Direction — Eat. Different. (E.D.)

**Status: DRAFT — needs owner sign-off before any production page is built (Phase S rule).**
Concept preview: `npm run dev` → `http://localhost:3000/concept`.

## 1. The idea in one line
**E.D. is Eddie.** "Eat. Different." is his name hiding in plain sight — a Samoan cook in
Kansas City who breaks the comfort-food rules. The site *reveals* that wordplay, then feeds you.

## 2. What we're taking from the inspiration
| Site | Borrow | Leave |
|---|---|---|
| banhmiworld.ca | One saturated color filling the whole screen; huge stacked headline; a hand-held food cut-out floating over the type; rotating circular sticker | Their orange, the serif |
| therebelbites.co.uk | Bold bordered menu cards with cut-out food on black | Checkerboard (we have our own pattern) |
| fedupfoodtrucks.com | Owner story front and center; illustrated scene that moves as you scroll; "a portion goes to…" mission | Pastel monochrome |
| defoodtruckclub.nl | Giant condensed headline with staggered alignment; paper-white field; pill buttons | Dutch serif body |
| nope.ee | Polaroid cards with tape; stickers with personality; a mascot moment | Candy pastels |
| pizza-amici.nl | Logo intro animation; arch/window frames revealing photos | Sky blue |

**Common rule across all six:** one bold color field per section, one display font, lots of
air, *one* signature interaction per section — never everything at once. That's "clean".

## 3. Logo — the E and the D stand out
```
  ♛
  E at.            E and D: big gold hand-brushed letters (the menu's brush style)
  D ifferent.      "at." / "ifferent.": clean condensed caps, cream or ink
```
- Reading down the left edge spells **E.D.**; the crown from the menu sits on the E.
- **Intro animation:** only "E.D." shows, then the rest of each word slides out of its
  letter — *E.D. becomes Eat. Different.* Hover/tap the mark → a quick "It's Eddie." wink.
- Works as a compact "E.D." monogram (favicon, stickers, nav).

## 4. Palette (from the menu art — tight on purpose)
| Token | Hex | Use |
|---|---|---|
| `ink` | `#0B0B0B` | Backgrounds, text on gold |
| `gold` | `#F5B21A` | THE brand field; E and D; buttons |
| `cream` | `#F3EAD8` | Paper sections, text on ink |
| `ember` | `#D7263D` | Tiny accents only: "hot", sold out, the heart |
| `pacific` | `#1B3FA0` | Only in Eddie's Samoa → KC story |
`ember` and `pacific` echo the Samoan flag (red / blue) — and happen to be Kansas City's
colors too. Measured WCAG contrast: ink on gold **10.6:1**, cream on ink **16.5:1**, cream on
pacific **7.8:1** — all pass AAA for text. `ember` is only ~4:1 on ink/cream and **2.7:1 on
gold** → ember is for large text (≥ 24 px bold) and non-text accents only, never on gold.

## 5. Type (Google Fonts, self-hosted by Next)
- **Anton** — condensed display caps for headlines (the defoodtruckclub energy).
- **Knewave** — brush letters: only the **E**, the **D**, prices, and stickers.
- **DM Sans** — everything you read. Clean, friendly.

## 6. Samoa × Kansas City — woven into the interactions
- **"From 685 to 816."** Samoa's country code is +685; Kansas City's area code is 816. Eddie's
  story section is a scroll-driven dotted route across the Pacific from Samoa to KC — the
  E.D. truck drives it as you scroll.
- **Siapo-inspired bands.** Geometric patterns inspired by *siapo* (Samoan bark-cloth art)
  as section dividers that draw themselves in. We deliberately avoid *tatau* (tattoo) motifs —
  they're personal and sacred — unless Eddie wants something specific.
- **Samoan words, used warmly:** "Talofa!" as the greeting, "Fa'afetai!" on thank-you pages,
  "Made with alofa in KC" in the footer.
- **KC touches:** a Kansas City skyline at the end of the truck-fund road; "816" sticker.
- ⚠️ **Eddie should approve every cultural element** — words, patterns, colors — and can
  add family/village details he's proud of. We don't guess here.

## 7. Signature interactions (one per section)
| Section | Field | Interaction |
|---|---|---|
| Hero | gold | E.D. → Eat. Different. reveal; floating dish tilts with the pointer; rotating "TALOFA • KANSAS CITY • EDDIE'S KITCHEN" sticker; live Kitchen Open/Closed pill |
| Ticker | ink | "COMFORT FOOD. DIFFERENT RULES." marquee over a siapo band |
| Menu | ink | Category tabs; big cut-out dish cards; tap → "build your plate" sheet (waffle, combo, add-ons with live price) |
| Road to the Truck | cream | The truck assembles along a road to the KC skyline; "Chip in" coins drop into it |
| 685 → 816 | pacific/ink | Scroll-driven route Samoa → KC with Eddie's story beats |
| Reviews | gold | Polaroid cards with tape, slightly tilted; drag to shuffle |
| Footer | ink | Notify-me when closed; "Made with alofa in KC" |

## 8. The tracker problem (decision needed)
Public progress is a percent with one decimal, so the first ~$4,200 shows **0%**. Options:
- **A. Truck build milestones** — wheels 10%, grill 25%, awning 50%, crown 75%, keys 100%;
  the next part "glows" and a thin bar shows progress *to the next part*. Still dollar-free.
- **B. Two decimals** — "0.04%" moves with every few orders; less elegant.
- **C. A supporter counter** — "312 plates & chip-ins so far" next to the %. Shows
  momentum from order one; reveals order *count* (not dollars).
Recommendation: **A + C** (if Eddie is OK showing a count), else **A** alone.

## 9. Motion & quality rules
- GSAP + ScrollTrigger; UI transitions ≤ 400 ms; story motion tied to scroll, never autoplay loops.
- `prefers-reduced-motion`: every animation has a still, finished state.
- Mobile-first (375 px up), no horizontal page scroll, tap targets ≥ 44 px.
- Photos: v1 crops from the menu image (needs `reference/menu.jpg`); real photos later.
- Performance: hero interactive < 2.5 s LCP on 4G; fonts subset; images `next/image`.
