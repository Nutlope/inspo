import { staticFile } from "remotion";

const real = (slug: string) => staticFile(`real/${slug}.jpg`);

/* The archive grid, 3 x 3: the nine real sites featured on the Inspo
   homepage, in the homepage's own "featured" order. Desktop-hero
   captures, 1440x900, same 1.6 aspect as the tiles. Row-major. */
export const GRID_SLUGS: string[] = [
  "buildkite-com",
  "ghost-org",
  "are-na",
  "capacities-io",
  "mercury-com",
  "heptabase-com",
  "highlight-xyz",
  "dust-tt",
  "bandcamp-com",
];

/* The three references Inspo picks, in selection order: Mercury (the
   serif product polish), Bandcamp (the music), Capacities last (the
   warm cream) so the front of the stack matches the page it becomes. */
export const PICKS = [4, 8, 3];

/* The generated page those references become: loom-audio, shot
   full-page so the teaser can scroll through it. */
export const RESULT = staticFile("real/loom-full.jpg");
export const RESULT_IMG = { w: 2560, h: 6110 };

export const GRID = {
  cols: 3,
  rows: 3,
  tileW: 496,
  tileH: 310,
  gap: 14,
  radius: 18,
};

const gridW = GRID.cols * GRID.tileW + (GRID.cols - 1) * GRID.gap;
const gridH = GRID.rows * GRID.tileH + (GRID.rows - 1) * GRID.gap;

export const gridOffset = {
  x: (1920 - gridW) / 2,
  y: (1080 - gridH) / 2,
};

export const cellRect = (index: number) => {
  const col = index % GRID.cols;
  const row = Math.floor(index / GRID.cols);
  return {
    x: gridOffset.x + col * (GRID.tileW + GRID.gap),
    y: gridOffset.y + row * (GRID.tileH + GRID.gap),
    w: GRID.tileW,
    h: GRID.tileH,
  };
};

/* The converge target: one card in the middle of the frame that the
   three picks stack into. Same 1.6 aspect as the captures. */
export const CARD = { x: 520, y: 265, w: 880, h: 550, radius: 22 };

/* Where the generated page lands: framed on the paper with breathing
   room on every side, never full-bleed. */
export const FINAL = { x: 180, y: 101, w: 1560, h: 878, radius: 24 };

export const tileSrc = (slug: string) => real(slug);
