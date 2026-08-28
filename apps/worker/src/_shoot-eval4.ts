/**
 * Screenshot eval-4 cells, serially, in one browser.
 *
 * Pass arm ids as argv to re-shoot only those; with no args it does
 * every source including the preserved `hallmark-old` build.
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../mcp-eval-4");
const OUT = join(ROOT, "_shots");
const ALL = ["nothing", "inspo-only", "hallmark-only", "hallmark-old", "both"];
const ARMS = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const BRIEFS = [
  "m1-meditation",
  "m2-devtool",
  "m3-fintech",
  "m4-ceramics",
  "m5-producttour",
  // Round 2 (2026-08-28): nothing + inspo-only arms only.
  "m6-hardware",
  "m7-logistics",
  "m8-editorial",
  "m9-course",
  "m10-oss",
];

mkdirSync(OUT, { recursive: true });
const reportPath = join(OUT, "report.json");
const prior: Record<string, unknown>[] = existsSync(reportPath)
  ? JSON.parse(readFileSync(reportPath, "utf8"))
  : [];
const byKey = new Map(prior.map((r) => [(r as { key: string }).key, r]));

const browser = await chromium.launch();

for (const arm of ARMS) {
  for (const brief of BRIEFS) {
    const file = join(ROOT, arm, brief, "index.html");
    const key = `${arm}/${brief}`;
    // Round-2 briefs exist for two arms only - a cell whose directory
    // was never created is "not part of this round", not an error.
    if (!existsSync(join(ROOT, arm, brief))) continue;
    if (!existsSync(file)) {
      byKey.set(key, { key, error: "no index.html" });
      continue;
    }
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));

    try {
      await page.goto(`file://${file}`, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(2500);

      const stem = `${arm}__${brief}`;
      await page.screenshot({ path: join(OUT, `${stem}.fold.png`) });
      await page.screenshot({ path: join(OUT, `${stem}.full.png`), fullPage: true });

      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const h1 = document.querySelector("h1");
        let deepest = 0;
        if (h1) {
          const hero = h1.closest("section, header, main > div, body > div") ?? h1;
          for (const el of hero.querySelectorAll("h1, h2, p, a, button, svg, img")) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            deepest = Math.max(deepest, r.bottom + window.scrollY);
          }
          deepest = Math.max(deepest, h1.getBoundingClientRect().bottom + window.scrollY);
        }
        return {
          overflowPx: de.scrollWidth - de.clientWidth,
          heroBottomPx: Math.round(deepest),
          docHeight: de.scrollHeight,
          hasCharset: !!document.querySelector("meta[charset]"),
        };
      });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(600);
      const mob = await page.evaluate(() => {
        const de = document.documentElement;
        return { overflowPx: de.scrollWidth - de.clientWidth };
      });
      await page.screenshot({ path: join(OUT, `${stem}.mobile.png`) });

      byKey.set(key, { key, ...m, mobileOverflowPx: mob.overflowPx, errors });
      console.log(
        `${key.padEnd(30)} fold ${m.heroBottomPx <= 800 ? "ok" : "NO " + m.heroBottomPx}  ovf ${m.overflowPx}/${mob.overflowPx}  h ${m.docHeight}`,
      );
    } catch (e) {
      byKey.set(key, { key, error: String(e).slice(0, 160) });
      console.log(`${key} ERROR`);
    }
    await ctx.close();
  }
}

await browser.close();
writeFileSync(reportPath, JSON.stringify([...byKey.values()], null, 2));
console.log(`\nwrote ${reportPath} (${byKey.size} cells)`);
