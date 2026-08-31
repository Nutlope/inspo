import { staticFile } from "remotion";

const shot = (slug: string) => staticFile(`shots/${slug}.jpg`);

/* The archive grid, 4 x 3, tones alternating so it reads as a wall of
   different real sites. Row-major. */
export const GRID_SLUGS: string[] = [
  "alder-money",
  "nocturne-festival",
  "saltgate-lido",
  "studio-volta",
  "wavecast",
  "meridian-review",
  "aureole-parfum",
  "coire-dubh",
  "sable-patisserie",
  "halcyon-optics",
  "spark-hall",
  "nightjar-sleeper",
];

/* The three references Inspo picks, in selection order: big display
   type (nocturne), a bottle-hero product page (aureole), a warm food
   palette (sable). Together they add up to ember-and-ash. */
export const PICKS = [1, 6, 8];

/* The new page those references become. */
export const RESULT = shot("ember-and-ash");

export const GRID = {
  cols: 4,
  rows: 3,
  tileW: 440,
  tileH: 275,
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
   three picks stack into before expanding into the result. */
export const CARD = { x: 520, y: 265, w: 880, h: 550, radius: 22 };

export const tileSrc = (slug: string) => shot(slug);
