/**
 * Build contact sheets (montage grids) from a flagged-audit report so
 * a human / vision reviewer can eyeball many candidates per image
 * instead of opening them one at a time.
 *
 * Each cell = the newest desktop-hero thumbnail + a label strip with
 * an index number and the slug. Grid is 4 wide; one sheet per 20
 * candidates. Prints the index→slug map to stdout so the reviewer can
 * call out "delete 3, 7, 12" and we resolve to slugs.
 *
 *   pnpm tsx src/build-contact-sheet.ts <report.json> [--cols=4] [--per=20]
 *
 * Output: captures/_reports/contact-sheet-<n>.png  +  contact-index.json
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const CAPTURES_DIR = resolve(process.env.INSPO_CAPTURES_DIR ?? "./captures");

const CELL_W = 320;
const IMG_H = 200;
const LABEL_H = 28;
const CELL_H = IMG_H + LABEL_H;
const GAP = 8;

function newestHero(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return null;
  }
  let best: { p: string; m: number } | null = null;
  for (const f of files) {
    if (!f.startsWith("desktop-hero-") || !f.endsWith(".png")) continue;
    const p = join(dir, f);
    let m = 0;
    try {
      m = statSync(p).mtimeMs;
    } catch {
      continue;
    }
    if (!best || m > best.m) best = { p, m };
  }
  return best?.p ?? null;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}

async function cell(idx: number, slug: string): Promise<Buffer> {
  const heroPath = newestHero(slug);
  const labelSvg = Buffer.from(
    `<svg width="${CELL_W}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="#111"/>
      <text x="6" y="19" font-family="monospace" font-size="13" fill="#fff">${idx}. ${escapeXml(slug).slice(0, 40)}</text>
    </svg>`,
  );
  let img: Buffer;
  if (heroPath) {
    img = await sharp(heroPath)
      .resize(CELL_W, IMG_H, { fit: "cover", position: "top" })
      .toBuffer();
  } else {
    img = await sharp({
      create: { width: CELL_W, height: IMG_H, channels: 3, background: "#333" },
    })
      .png()
      .toBuffer();
  }
  return sharp({
    create: { width: CELL_W, height: CELL_H, channels: 3, background: "#000" },
  })
    .composite([
      { input: img, top: 0, left: 0 },
      { input: labelSvg, top: IMG_H, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const reportPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!reportPath) {
    console.error("usage: build-contact-sheet.ts <report.json> [--cols=4] [--per=20]");
    process.exit(1);
  }
  const cols = Number(process.argv.find((a) => a.startsWith("--cols="))?.split("=")[1] ?? 4);
  const per = Number(process.argv.find((a) => a.startsWith("--per="))?.split("=")[1] ?? 20);

  const flagged = JSON.parse(readFileSync(reportPath, "utf8")) as {
    slug: string;
    kind?: string;
    reason?: string;
  }[];
  const slugs = flagged.map((f) => f.slug);
  console.log(`building contact sheets for ${slugs.length} candidates`);

  const reportDir = join(process.cwd(), "captures", "_reports");
  mkdirSync(reportDir, { recursive: true });

  const indexMap: { idx: number; slug: string; kind?: string }[] = [];
  let sheetNo = 0;
  for (let start = 0; start < slugs.length; start += per) {
    const batch = slugs.slice(start, start + per);
    const cells = await Promise.all(
      batch.map((slug, i) => {
        const globalIdx = start + i;
        indexMap.push({ idx: globalIdx, slug, kind: flagged[globalIdx]?.kind });
        return cell(globalIdx, slug);
      }),
    );
    const rows = Math.ceil(batch.length / cols);
    const sheetW = cols * CELL_W + (cols + 1) * GAP;
    const sheetH = rows * CELL_H + (rows + 1) * GAP;
    const composites = cells.map((buf, i) => ({
      input: buf,
      top: GAP + Math.floor(i / cols) * (CELL_H + GAP),
      left: GAP + (i % cols) * (CELL_W + GAP),
    }));
    const sheet = await sharp({
      create: { width: sheetW, height: sheetH, channels: 3, background: "#000" },
    })
      .composite(composites)
      .png()
      .toBuffer();
    const outPath = join(reportDir, `contact-sheet-${sheetNo}.png`);
    writeFileSync(outPath, sheet);
    console.log(`  sheet ${sheetNo}: ${batch.length} cells (idx ${start}–${start + batch.length - 1}) → ${outPath}`);
    sheetNo++;
  }
  writeFileSync(join(reportDir, "contact-index.json"), JSON.stringify(indexMap, null, 2));
  console.log(`index map → ${join(reportDir, "contact-index.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
