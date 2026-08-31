import { staticFile } from "remotion";

const shot = (slug: string) => staticFile(`shots/${slug}.jpg`);

/* Scene 2a: the accelerating full-bleed montage. Ordered for rhythm -
   dark, light, dark, cream, navy, paper, black - so every cut reads as
   a new page, ending on ember-and-ash (the red one) which becomes the
   grid's center tile. */
export const MONTAGE: { src: string; duration: number }[] = [
  { src: shot("nocturne-festival"), duration: 14 },
  { src: shot("alder-money"), duration: 12 },
  { src: shot("attract-mode"), duration: 10 },
  { src: shot("sable-patisserie"), duration: 9 },
  { src: shot("halcyon-optics"), duration: 8 },
  { src: shot("meridian-review"), duration: 7 },
  { src: shot("studio-volta"), duration: 7 },
];

export const EMBER = shot("ember-and-ash");

/* Scene 2b: the archive grid, 4 x 3, light/dark checkerboarded.
   null marks the cell ember-and-ash shrinks into. Row-major. */
export const GRID_SLUGS: (string | null)[] = [
  "driftmail",
  "saltgate-lido",
  "nightjar-sleeper",
  "loom-audio",
  "aureole-parfum",
  null,
  "fieldnote-db",
  "coire-dubh",
  "wavecast",
  "spark-hall",
  "rill-radio",
  "northline-transit",
];

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

export const EMBER_CELL = GRID_SLUGS.indexOf(null);

export const tileSrc = (slug: string) => shot(slug);
