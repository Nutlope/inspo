# Osteria Nera — build log

**Prompt:** "Create a landing page for a fine-dining tasting-menu restaurant."

**Brand invented:** *Osteria Nera* — a 14-seat tasting-menu restaurant in the Quadrilatero
Romano, Torino (Piedmont, Italy). Chef-patron **Lucia Maranzano**, raised in the Langhe.
One nightly menu, *Il Buio* ("the dark"), eleven movements, written each afternoon from
whatever the Alpine foothills gave up that morning. Two seatings, Wednesday–Saturday, €185
per guest. One star since 2024. The conceit: **no choices but the wine**, and the room kept
dark on purpose so the plate and the person across from you are the only things lit.

**Register chosen:** DARK. Fine dining in this archive splits two ways — warm-light
(Eleven Madison Park, Mirazur) and dark-atmospheric (Dinner by Heston, Death & Co). Since the
existing coffee example already owns warm-light, and the strongest "quiet authority / luxe /
mysterious" signal in my refs was dark, I built the dark counterpart to prove the same archive
yields a fully different register.

---

## MCP calls, in order

1. `search_screens {"query":"restaurant fine dining tasting menu","limit":8}`
   → Surfaced the hospitality cluster: **dinnerbyheston-com** (dark charcoal "Specimen",
   *"quiet authority"*), **atomixnyc-com** (teal+rust split, dark-mode restaurant),
   **elevenmadisonpark-com** & **mirazur-fr** (warm earth-tone split-studios). Established that
   the category lives in `editorial` + `minimalism` with `luxe/calm/serious` vibes.

2. `search_screens {"query":"luxe hospitality elegant serif warm","limit":8}`
   → Confirmed the luxe spine: **goyard-com**, **chanel-com**, **italic-com** (Martina Plantijn
   serif), reinforced EMP/Mirazur. Told me the luxe move is restraint + a serif + huge negative space.

3. `search_screens {"query":"dark moody editorial restaurant atmospheric","limit":8}`
   → Found the dark-atmospheric pillar: **deathandcompany-com** (*"deep charcoal expanse,
   elegant script… sophisticated and slightly mysterious"*), plus mubi, erikjohanssonphoto,
   crackmagazine. This is where the candlelit-dark direction crystallised.

4. `get_design_system {"slug":"dinnerbyheston-com","live":true}`
   → Macrostructure **Specimen**; color words *monochrome / muted / high-contrast*;
   tags `dark-mode + editorial + luxe`. Confirmed "typography-as-hero on a near-monochrome
   field" as a real fine-dining pattern. (Live fetch timed out; captured DESIGN.md used.)

5. `get_design_system {"slug":"atomixnyc-com","live":true}`
   → **Live fonts: Libre Franklin / Heebo / Work Sans** (grotesque UI), ink `#222222`.
   Palette `#c95535 / #471e13 / #e3a696` → my **warm rust + flesh** family.

6. `get_design_system {"slug":"deathandcompany-com","live":true}`  ← highest signal
   → **Live font: EB Garamond.** Live palette: `#fff`, `#000`, **`#b32614`** (brand red),
   `rgba(0,0,0,.7)`. This is the keystone: an elegant serif on near-black with an oxblood accent.

7. `get_design_system {"slug":"elevenmadisonpark-com","live":true}`  ← keystone #2
   → **Live fonts: Inter Tight + EB Garamond** — the canonical NYC tasting menu pairs the
   *exact two faces* I use. Palette `#c57838 / #70412b / #e1b997` → my **candle amber**.

8. `find_similar {"slug":"deathandcompany-com","limit":6}`
   → Returned the Death & Co sub-pages (about/contact/private-events, all Marquee-Hero) +
   **louispoulsen-com** (*"warm golden liquid light… quiet luxury"*) — validated the warm-glow-on-dark idea.

9. `search_screens {"query":"elegant serif type specimen dark editorial wine","limit":6}`
   → **olsonkundig-com** (dark Type-Specimen, *"carefully considered presentation of an ethos"*)
   + commercialtype/ortype/camelot. Confirmed the **Type Specimen** macrostructure as a real,
   reusable scaffold for "the menu as the hero object."

10. `compare {"slugs":["deathandcompany-com","elevenmadisonpark-com","dinnerbyheston-com"]}`
    → Common styles `minimalism + editorial` across all three; distinct macrostructures
    (Marquee Hero / Split Studio / Specimen). Triangulated the house style: *editorial-minimal,
    serif-led, one big idea per screen.*

11. `find_by_color {"hex":"#8a1c12"}`
    → Tight real cluster around my oxblood: **#882219** (lesswrong, Δ.009), **#871812**
    (workable), **#86201c** (parsons), **#872414** (branchfurniture, Δ.012), **#8a2718** (ysl).
    Proves the exact accent is drawn from real captures, not invented.

12. `get_screen {"slug":"deathandcompany-com"}`
    → Verified the slug/record so the reference can't 404.

---

## References (all verified in tool results — none will 404)

| slug | what it gave |
|---|---|
| `deathandcompany-com` | **The keystone.** Live **EB Garamond** + near-black ground + oxblood red (`#b32614`); the dark, *"sophisticated and slightly mysterious"* atmosphere; Marquee-Hero. |
| `elevenmadisonpark-com` | Live **Inter Tight + EB Garamond** pairing (my exact type system); warm earth palette → candle amber `#C9882E` / flesh `#E3A074`. |
| `dinnerbyheston-com` | The **Specimen** macrostructure for fine dining — typography as the hero, monochrome, *"quiet authority."* My menu-as-carte and restrained type ramp. |
| `atomixnyc-com` | Warm **rust** family (`#c95535`/`#471e13`/`#e3a696`); grotesque-for-UI confirmation (Libre Franklin). |
| `olsonkundig-com` | Dark **Type-Specimen** scaffold — proof a near-black field + a big serif + vast space reads as "considered ethos," used for the menu band. |
| `louispoulsen-com` | *"Warm golden liquid light… quiet luxury"* on dark — the warm-glow-on-black mood behind the CSS candlelight. |

---

## Palette, traced to source

| token | hex | traced to |
|---|---|---|
| `--ink` | `#0C0A08` | Death & Co live `#000`, warmed a hair toward brown (per Dinner by Heston's *muted* monochrome) so the field never reads as flat black. |
| `--bone` | `#ECE6D8` | Death & Co live `#fff`, warmed toward bone — EMP/Atomix palettes are all warm-neutral, never cold white. |
| `--oxblood` | `#8A1C12` | Death & Co brand red `#b32614`, deepened; sits dead-center of the `find_by_color #8a1c12` cluster (#882219 / #86201c / #872414 / #8a2718). |
| `--ember` | `#B23A24` | Lifted oxblood for hovers — between Death&Co `#b32614` and Atomix `#c95535`. |
| `--amber` | `#C9882E` | Eleven Madison Park `#c57838` / Louis Poulsen `#d49434` — the candle-gold accent. |
| `--flesh` | `#E3A074` | EMP `#e1b997` + Atomix `#e3a696` — warm highlight on serif emphasis + the plated food. |

**Type:** EB Garamond (display/serif) + Inter Tight (UI/labels) — both pulled live, the literal
faces from Death & Co and Eleven Madison Park. Roman numerals throughout (I–XI courses, MMXIX,
*Una stella*) lean the Italian fine-dining register without a third typeface.

---

## The standout move

**A candlelit table, composed entirely in CSS — no images.** Restaurants have no stock photos
in Inspo, so the hero atmosphere is built from primitives the way the coffee example builds its
bean bags: a near-black ground, two layered radial gradients that pool warm candlelight and fall
off into black (tracing Louis Poulsen's *"golden liquid light"* and EMP's warm earth), a
fine-grain SVG noise so the dark never goes flat (Dinner by Heston's *muted* monochrome), and a
**plated fifth course** rendered from gradients and border-radius — a sauce smear, a quenelle, a
foraged leaf, scattered spice-dust — beside a **flickering CSS taper** (keyframed flame with a
warm box-shadow halo, killed under `prefers-reduced-motion`). The menu itself is then set as a
numbered Roman *carte* in the Dinner-by-Heston **Specimen** voice: the eleven movements ARE the
hero content, not decoration around a photo. Dark, restrained, expensive, specific — the opposite
of the warm-light coffee example, from the same archive.

## Craft / constraint notes
- Fully responsive: hero collapses to single-column at 980px (plate moves below copy); nav menu
  swaps to the compact reserve button at 880px; the menu carte reflows its 3-col grid to a
  number+body stack at 680px; the reservations split + all three-up bands stack at 820px. Real
  390px mobile layout, not a squished desktop.
- Sandbox-safe: no localStorage/cookies/sessionStorage, no external JS bundles. The only JS is a
  segmented party-size toggle, a no-storage booking confirmation, and an IntersectionObserver
  reveal that hides nothing if JS never runs.
- Above-the-fold (the gallery tile) is the candlelit hero with the plate + flame — striking at
  both widths.
- 1065 lines, all tags balanced (verified), matching the considered craft of the existing bar.

## Self-score: **8.6 / 10**
The dark register is genuinely specific and the CSS-composed candle/plate is a real
atmosphere-from-nothing move that the brief explicitly asks for. Type and palette are traced to
two real Michelin-tier captures (Death & Co + EMP), not guessed. It loses points only because,
like any restaurant page without photography, the food can only be *suggested* — the single
plated course carries a lot of the "appetite" the category would normally get from a photo.
