/**
 * Above-the-fold scan for shortlisting: one desktop viewport per URL,
 * cleared of cookie notices and popups the same way a full capture is,
 * saved small and laid out on labelled contact sheets. Cheap enough to
 * look at a hundred candidates before spending full captures on the best
 * of them.
 *
 *   pnpm exec tsx src/hero-scan.ts <urls-file> --out=<dir> [--concurrency=3]
 *
 * Writes <dir>/<slug>.jpg (720 px wide), <dir>/sheet-N.jpg (20 per sheet,
 * 4 across) and <dir>/index.json (sheet cell to slug, url, or the error
 * that stopped it). Slugs match add-sites-disk.ts, so a pick can go
 * straight into a capture list. Resumable: a slug whose jpg exists is
 * not shot again.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type Browser } from "playwright";
import sharp from "sharp";
import { blockConsentNetworks, dismissBanners, preSeedConsentCookies } from "./dismiss.js";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const TILE_W = 480;
const TILE_H = 300;
const LABEL_H = 22;
const GAP = 8;
const COLS = 4;
const PER_SHEET = 20;
const SITE_TIMEOUT_MS = 75_000;

function slugifyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "");
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }
}

const esc = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

async function shoot(browser: Browser, url: string): Promise<Buffer> {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: UA,
    locale: "en-US",
  });
  try {
    await blockConsentNetworks(ctx);
    await preSeedConsentCookies(ctx, url);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40_000 });
    await page.waitForLoadState("load", { timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(2_500);
    await dismissBanners(page);
    await page.waitForTimeout(1_200);
    await dismissBanners(page, [], { clicks: false });
    await page.waitForTimeout(300);
    return await page.screenshot({ type: "png" });
  } finally {
    await ctx.close().catch(() => {});
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((ok, fail) => {
    const t = setTimeout(() => fail(new Error(`timed out after ${ms / 1000}s`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        ok(v);
      },
      (e) => {
        clearTimeout(t);
        fail(e);
      },
    );
  });
}

type Cell = { i: number; slug: string; url: string; ok: boolean; error?: string };

async function sheet(cells: Cell[], outDir: string, n: number): Promise<string> {
  const rows = Math.ceil(cells.length / COLS);
  const width = COLS * TILE_W + (COLS + 1) * GAP;
  const height = rows * (TILE_H + LABEL_H) + (rows + 1) * GAP;
  const layers: sharp.OverlayOptions[] = [];
  for (const [k, c] of cells.entries()) {
    const left = GAP + (k % COLS) * (TILE_W + GAP);
    const top = GAP + Math.floor(k / COLS) * (TILE_H + LABEL_H + GAP);
    const jpg = join(outDir, `${c.slug}.jpg`);
    const tile = c.ok && existsSync(jpg)
      ? await sharp(jpg).resize(TILE_W, TILE_H, { fit: "cover", position: "top" }).toBuffer()
      : await sharp({ create: { width: TILE_W, height: TILE_H, channels: 3, background: "#6b1f1f" } }).png().toBuffer();
    layers.push({ input: tile, left, top });
    const text = `${c.i}. ${c.slug}${c.ok ? "" : "  (failed)"}`;
    layers.push({
      input: Buffer.from(
        `<svg width="${TILE_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#111"/>` +
          `<text x="6" y="15" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#fff">${esc(text)}</text></svg>`,
      ),
      left,
      top: top + TILE_H,
    });
  }
  const file = join(outDir, `sheet-${n}.jpg`);
  await sharp({ create: { width, height, channels: 3, background: "#222" } })
    .composite(layers)
    .jpeg({ quality: 78 })
    .toFile(file);
  return file;
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  const outArg = argv.find((a) => a.startsWith("--out="))?.split("=")[1];
  if (!file || !outArg) {
    console.error("usage: hero-scan.ts <urls-file> --out=<dir> [--concurrency=3]");
    process.exit(1);
  }
  const outDir = resolve(outArg);
  mkdirSync(outDir, { recursive: true });
  const concurrency = Number(argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 3);
  const urls = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const cells: Cell[] = urls.map((url, i) => ({ i, slug: slugifyHost(url), url, ok: false }));
  console.log(`\n  hero-scan · ${cells.length} URLs · concurrency=${concurrency}\n`);

  const browser = await chromium.launch();
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < cells.length) {
        const c = cells[cursor++]!;
        const jpg = join(outDir, `${c.slug}.jpg`);
        if (existsSync(jpg)) {
          c.ok = true;
        } else {
          try {
            const png = await withTimeout(shoot(browser, c.url), SITE_TIMEOUT_MS);
            await sharp(png).resize(720).jpeg({ quality: 72 }).toFile(jpg);
            c.ok = true;
          } catch (e) {
            c.error = (e as Error).message.split("\n")[0]!.slice(0, 160);
          }
        }
        done += 1;
        console.log(`[${String(done).padStart(3)}/${cells.length}] ${c.ok ? "✓" : "✗"} ${c.slug}${c.error ? `: ${c.error}` : ""}`);
      }
    }),
  );
  await browser.close();

  for (let s = 0; s * PER_SHEET < cells.length; s += 1) {
    const f = await sheet(cells.slice(s * PER_SHEET, (s + 1) * PER_SHEET), outDir, s);
    console.log(`  ${f}  (cells ${s * PER_SHEET}-${Math.min(cells.length, (s + 1) * PER_SHEET) - 1})`);
  }
  writeFileSync(join(outDir, "index.json"), JSON.stringify(cells, null, 1));
  const failed = cells.filter((c) => !c.ok);
  console.log(`\n  ok ${cells.length - failed.length} · failed ${failed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
