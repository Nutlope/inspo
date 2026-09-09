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
   Pages Inspo built, each with the brief that produced it. The first
   is the page the film just built; the rest are from the examples
   gallery (apps/web/public/examples), shot full-page at 2x. */
export type MontagePage = {
  slug: string;
  brief: string;
  img: { w: number; h: number };
};

export const MONTAGE: MontagePage[] = [
  {
    slug: "northline-full",
    brief: "build me a landing page that actually looks good",
    img: { w: 2560, h: 4802 },
  },
  {
    slug: "sable-patisserie-full",
    brief: "a website for my patisserie",
    img: { w: 2560, h: 4696 },
  },
  {
    slug: "wavecast-full",
    brief: "an analytics dashboard for our podcast app",
    img: { w: 2560, h: 2676 },
  },
  {
    slug: "meridian-review-full",
    brief: "a homepage for an architecture magazine",
    img: { w: 2560, h: 7224 },
  },
  {
    slug: "studio-volta-full",
    brief: "a portfolio for our motion design studio",
    img: { w: 2560, h: 9228 },
  },
];

export const pageSrc = (slug: string) => staticFile(`real/${slug}.jpg`);

/* How far a full-page shot has to travel inside the frame to reach
   its footer. */
export const pageScrollDist = (img: { w: number; h: number }) =>
  Math.max(0, img.h * (FRAME.w / img.w) - FRAME.h);

/* Spacing between pages on the montage track: wide enough that a
   settled page's neighbours sit fully outside the frame. */
export const TRACK_GAP = 260;
export const trackPitch = FRAME.w + TRACK_GAP;
