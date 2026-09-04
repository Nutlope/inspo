import { staticFile } from "remotion";
import { WALL_ORDER } from "./wall-order";

export { WALL_ORDER };

const real = (slug: string) => staticFile(`real/${slug}.jpg`);

/* ── The wall ────────────────────────────────────────────────
   165 real archive captures, 12 across and 14 down, scrolled past
   twice over so the scan never runs out of pages. */
export const WALL = {
  cols: 12,
  rows: 14,
  tileW: 146,
  tileH: 91,
  gap: 8,
  radius: 6,
};

export const wallPitch = {
  x: WALL.tileW + WALL.gap,
  y: WALL.tileH + WALL.gap,
};

export const wallW = WALL.cols * WALL.tileW + (WALL.cols - 1) * WALL.gap;
export const wallH = WALL.rows * WALL.tileH + (WALL.rows - 1) * WALL.gap;
export const wallX = (1920 - wallW) / 2;

export const wallCell = (index: number) => {
  const col = index % WALL.cols;
  const row = Math.floor(index / WALL.cols);
  return {
    x: wallX + col * wallPitch.x,
    y: row * wallPitch.y,
    w: WALL.tileW,
    h: WALL.tileH,
  };
};

export const wallTile = (slug: string) => staticFile(`wall/${slug}.webp`);

/* ── The three Inspo picks ───────────────────────────────────
   Cells inside the zoom band, in selection order: Mercury (the live
   dashboard), Bandcamp (dense and colour-coded), Buildkite last
   because it is dark, like the page the stack becomes - a cream card
   turning black as it grows would read as a flash.
   Full-size captures, not the wall's 384px thumbnails. */
export const PICKS: { cell: number; slug: string }[] = [
  { cell: 88, slug: "mercury-com" },
  { cell: 103, slug: "bandcamp-com" },
  { cell: 113, slug: "buildkite-com" },
];

export const pickSrc = (slug: string) => real(slug);

/* Where the wall comes to rest: the picks' centroid at frame centre. */
const centroid = PICKS.reduce(
  (acc, p) => {
    const r = wallCell(p.cell);
    return { x: acc.x + (r.x + r.w / 2) / 3, y: acc.y + (r.y + r.h / 2) / 3 };
  },
  { x: 0, y: 0 },
);

export const WALL_REST_Y = 540 - centroid.y;
export const WALL_START_Y = WALL_REST_Y + wallH;
/* Pin point for the push-in, in wall coordinates. */
export const ZOOM_ANCHOR = { x: centroid.x, y: centroid.y };
export const ZOOM_MAX = 2.1;

/* How far the archive is searched, and how far it got. */
export const SCREEN_COUNT = 2141;

/* ── The result ──────────────────────────────────────────────
   The converge target: one card in the middle of the frame that the
   three picks stack into, then the framed page it becomes. */
export const CARD = { x: 520, y: 265, w: 880, h: 550, radius: 22 };
export const FINAL = { x: 180, y: 101, w: 1560, h: 878, radius: 24 };

export const RESULT = staticFile("real/northline-full.jpg");
export const RESULT_IMG = { w: 2560, h: 4802 };
