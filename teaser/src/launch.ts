import { staticFile } from "remotion";

/* ── Launch cut geometry ─────────────────────────────────────
   Everything the launch film adds on top of the teaser: the row the
   references are read in, the slightly smaller page frame (a brief
   has to fit above it), and the montage of other pages Inspo built. */

/* The framed page. Same proportions as the teaser's, sat 60px lower
   and a touch smaller so the brief pill has room above it. */
export const FRAME = { x: 231, y: 160, w: 1458, h: 820, radius: 24 };

/* The brief pill that floats above a page in the montage. */
export const BRIEF = { top: 64, h: 64 };

/* The row the three references fan into to be read. */
export const ROW = { y: 320, w: 540, h: 338, gap: 54, radius: 20 };
const rowX0 = (1920 - (3 * ROW.w + 2 * ROW.gap)) / 2;
export const rowRect = (k: number) => ({
  x: rowX0 + k * (ROW.w + ROW.gap),
  y: ROW.y,
  w: ROW.w,
  h: ROW.h,
});

/* What Inspo read off each reference. Real archive data, lifted from
   packages/db/src/static-screens.json (palette + fonts per screen). */
export const REF_META: Record<
  string,
  { name: string; face: string; palette: string[] }
> = {
  "mercury-com": {
    name: "mercury.com",
    face: "Arcadia",
    palette: ["#3986c5", "#0c1c29", "#dcbeae", "#718095", "#cdb2aa"],
  },
  "bandcamp-com": {
    name: "bandcamp.com",
    face: "Helvetica Neue",
    palette: ["#e4505b", "#14449c", "#dca1e6", "#a35e7a", "#cac59d"],
  },
  "buildkite-com": {
    name: "buildkite.com",
    face: "Aeonik",
    palette: ["#7a21ed", "#1c044c", "#8c44e4", "#5c9f8d", "#bbbac6"],
  },
};

/* ── The montage ─────────────────────────────────────────────
   Pages Inspo built, each with the brief that produced it. All ten
   Fable 5.1 generations, from apps/web/public/examples, shot full-page
   at 2x and cropped to what the frame actually reaches.

   The first is the page the film just built; the four after it are
   cast for range, not just for looks - a frame builder, a marine
   forecast board, a ceramics studio and a terminal emulator say
   "any register, any page type" in a way five landing pages cannot.
   They alternate light and dark, starting light against the dark
   opera page they follow. */
export type MontagePage = {
  slug: string;
  brief: string;
  img: { w: number; h: number };
};

export const MONTAGE: MontagePage[] = [
  {
    slug: "ravensgate-opera-full",
    brief: "build me a landing page that actually looks good",
    img: { w: 2560, h: 5600 },
  },
  {
    slug: "calder-frameworks-full",
    brief: "a site for my bike workshop",
    img: { w: 2560, h: 1950 },
  },
  {
    slug: "halyard-marine-full",
    brief: "a weather dashboard for sailors",
    img: { w: 2560, h: 1950 },
  },
  {
    slug: "shirakawa-kiln-full",
    brief: "a shop page for our ceramics studio",
    img: { w: 2560, h: 1950 },
  },
  {
    slug: "ferrite-terminal-full",
    brief: "a page for our open source terminal",
    img: { w: 2560, h: 1950 },
  },
];

export const pageSrc = (slug: string) => staticFile(`real/${slug}.jpg`);

/* How far a full-page shot has to travel inside the frame to reach
   its footer. */
export const pageScrollDist = (img: { w: number; h: number }) =>
  Math.max(0, img.h * (FRAME.w / img.w) - FRAME.h);

/* Where the built page's scroll stops. A cap rather than the true
   footer: these pages run five to eight screens deep, and racing one
   end to end in forty frames is a smear, not a read.

   The value is chosen for the page that is cast, not picked round:
   2300 parks the opera page on its set-model section, the lit
   headland and the quote beside it, which is both the best frame in
   the page and a composition worth holding on while the montage
   brings its brief back. Recast the result page and re-choose it.

   Both the archive scene and the montage read the scroll from here,
   so the page sits at exactly the same offset either side of the cut. */
export const HERO_SCROLL_MAX = 2300;
export const heroScroll = (img: { w: number; h: number }) =>
  Math.min(pageScrollDist(img), HERO_SCROLL_MAX);

/* Spacing between pages on the montage track: wide enough that a
   settled page's neighbours sit fully outside the frame. */
export const TRACK_GAP = 260;
export const trackPitch = FRAME.w + TRACK_GAP;
