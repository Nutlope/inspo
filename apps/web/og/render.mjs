// Renders og.html to the two OG PNGs the repo ships:
//   apps/web/src/app/opengraph-image.png  (what the site serves)
//   docs/img/og.png                        (the README copy)
//
// The nine full-page strips in assets/ come from the archive; strips.tsv
// lists slug and URL, and the folder is not committed. Fetch them first:
//   while IFS=$'\t' read s u; do curl -sfL -o "assets/$s.webp" "$u"; done < strips.tsv
// then: node render.mjs  (from this folder; uses the worker's Playwright)
import { chromium } from "../../worker/node_modules/playwright/index.mjs";
import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../src/app/opengraph-image.png");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("file://" + resolve(here, "og.html"), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
copyFileSync(out, resolve(here, "../../../docs/img/og.png"));
console.log("wrote", out, "and docs/img/og.png");
