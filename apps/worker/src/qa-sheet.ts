/**
 * QA contact sheets for fresh captures, for a human pass before anything
 * is merged: popups, cookie strips, login walls, blank bands, broken
 * layouts.
 *
 *   pnpm exec tsx src/qa-sheet.ts <slugs-file> [--out=<dir>] [--kinds=hero,full]
 *
 * Writes two kinds of sheet into captures/_reports/qa/ (or --out):
 *   hero-N.png  15 captures each: desktop hero + phone hero, labelled
 *   full-N.png   8 captures each: the whole desktop page and the whole
 *               phone page as scaled columns, so blank sections and
 *               broken renders show anywhere down the page
 * plus index.json mapping each cell number to its slug.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

function newest(slug: string, prefix: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".png"));
  if (files.length === 0) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return join(dir, files[0]!);
}

const esc = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

function label(text: string, width: number, height = 22): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#111"/>` +
      `<text x="6" y="15" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#fff">${esc(text)}</text></svg>`,
  );
}

function missing(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: "#6b1f1f" } }).png().toBuffer();
}

async function heroCell(i: number, slug: string): Promise<Buffer> {
  const DW = 384;
  const MW = 111;
  const H = 240;
  const GAP = 4;
  const LH = 22;
  const dPath = newest(slug, "desktop-hero-");
  const mPath = newest(slug, "mobile-hero-");
  const d = dPath
    ? await sharp(dPath).resize(DW, H, { fit: "cover", position: "top" }).png().toBuffer()
    : await missing(DW, H);
  const m = mPath
    ? await sharp(mPath).resize(MW, H, { fit: "cover", position: "top" }).png().toBuffer()
    : await missing(MW, H);
  const width = DW + GAP + MW;
  return sharp({ create: { width, height: H + LH, channels: 3, background: "#000" } })
    .composite([
      { input: d, top: 0, left: 0 },
      { input: m, top: 0, left: DW + GAP },
      { input: label(`${i}. ${slug}`.slice(0, 64), width, LH), top: H, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function column(path: string | null, width: number, maxH: number): Promise<Buffer> {
  if (!path) return missing(width, 80);
  const resized = await sharp(path, { limitInputPixels: false }).resize({ width }).png().toBuffer();
  const h = Math.min((await sharp(resized).metadata()).height ?? maxH, maxH);
  return sharp(resized).extract({ left: 0, top: 0, width, height: h }).png().toBuffer();
}

async function fullCell(i: number, slug: string): Promise<{ buf: Buffer; w: number; h: number }> {
  const DW = 180;
  const MW = 64;
  const GAP = 4;
  const LH = 22;
  const MAXH = 1800;
  const d = await column(newest(slug, "desktop-full-"), DW, MAXH);
  const m = await column(newest(slug, "mobile-full-"), MW, MAXH);
  const dh = (await sharp(d).metadata()).height ?? 0;
  const mh = (await sharp(m).metadata()).height ?? 0;
  const w = DW + GAP + MW;
  const h = Math.max(dh, mh) + LH;
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#000" } })
    .composite([
      { input: label(`${i}. ${slug}`.slice(0, 34), w, LH), top: 0, left: 0 },
      { input: d, top: LH, left: 0 },
      { input: m, top: LH, left: DW + GAP },
    ])
    .png()
    .toBuffer();
  return { buf, w, h };
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: qa-sheet.ts <slugs-file> [--out=<dir>] [--kinds=hero,full]");
    process.exit(1);
  }
  const outDir = resolve(
    argv.find((a) => a.startsWith("--out="))?.split("=")[1] ?? join(CAPTURES_DIR, "_reports", "qa"),
  );
  const kinds = (argv.find((a) => a.startsWith("--kinds="))?.split("=")[1] ?? "hero,full").split(",");
  const slugs = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.json"), JSON.stringify(slugs.map((slug, i) => ({ i, slug })), null, 1));

  if (kinds.includes("hero")) {
    const PER = 15;
    const COLS = 3;
    const GAP = 8;
    for (let s = 0; s < slugs.length; s += PER) {
      const batch = slugs.slice(s, s + PER);
      const cells = await Promise.all(batch.map((slug, k) => heroCell(s + k, slug)));
      const cw = (await sharp(cells[0]!).metadata()).width!;
      const ch = (await sharp(cells[0]!).metadata()).height!;
      const rows = Math.ceil(batch.length / COLS);
      const sheet = await sharp({
        create: {
          width: COLS * cw + (COLS + 1) * GAP,
          height: rows * ch + (rows + 1) * GAP,
          channels: 3,
          background: "#222",
        },
      })
        .composite(
          cells.map((input, k) => ({
            input,
            top: GAP + Math.floor(k / COLS) * (ch + GAP),
            left: GAP + (k % COLS) * (cw + GAP),
          })),
        )
        .png()
        .toBuffer();
      const out = join(outDir, `hero-${s / PER}.png`);
      writeFileSync(out, sheet);
      console.log(`  ${out}  (cells ${s}-${s + batch.length - 1})`);
    }
  }

  if (kinds.includes("full")) {
    const PER = 8;
    const GAP = 8;
    for (let s = 0; s < slugs.length; s += PER) {
      const batch = slugs.slice(s, s + PER);
      const cells = await Promise.all(batch.map((slug, k) => fullCell(s + k, slug)));
      const width = cells.reduce((sum, c) => sum + c.w, 0) + (cells.length + 1) * GAP;
      const height = Math.max(...cells.map((c) => c.h)) + 2 * GAP;
      let left = GAP;
      const composites = cells.map((c) => {
        const item = { input: c.buf, top: GAP, left };
        left += c.w + GAP;
        return item;
      });
      const sheet = await sharp({ create: { width, height, channels: 3, background: "#222" } })
        .composite(composites)
        .png()
        .toBuffer();
      const out = join(outDir, `full-${s / PER}.png`);
      writeFileSync(out, sheet);
      console.log(`  ${out}  (cells ${s}-${s + batch.length - 1})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
