/**
 * Screenshot every eval-4 page, serially, in one browser.
 *
 * The 20 build agents ran concurrently against a single shared browser
 * pane and a single shared scratchpad, so several of them had calls
 * land on a sibling's tab and none could verify their own output by
 * eye. This is the corrective pass: one browser, one page at a time,
 * no possibility of cross-contamination.
 *
 * Captures the 1280x800 fold (the rule every arm was held to) and the
 * full page, and records anything that would have failed a real
 * verification round: horizontal overflow, console errors, and whether
 * the fold is actually complete.
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../mcp-eval-4");
const OUT = join(ROOT, "_shots");
const ARMS = ["nothing", "inspo-only", "hallmark-only", "both"];
const BRIEFS = [
  "m1-meditation",
  "m2-devtool",
  "m3-fintech",
  "m4-ceramics",
  "m5-producttour",
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const report: Record<string, unknown>[] = [];

for (const arm of ARMS) {
  for (const brief of BRIEFS) {
    const file = join(ROOT, arm, brief, "index.html");
    const key = `${arm}/${brief}`;
    if (!existsSync(file)) {
      report.push({ key, error: "no index.html" });
      continue;
    }
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 120));
    });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));

    try {
      await page.goto(`file://${file}`, { waitUntil: "load", timeout: 30_000 });
      // Web fonts and any load-time reveal need a beat before the fold
      // shot, or the capture lies about what a visitor sees.
      await page.waitForTimeout(2500);

      const stem = `${arm}__${brief}`;
      await page.screenshot({ path: join(OUT, `${stem}.fold.png`) });
      await page.screenshot({
        path: join(OUT, `${stem}.full.png`),
        fullPage: true,
      });

      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const overflow = de.scrollWidth - de.clientWidth;
        // The fold rule asks whether the HERO is complete above 800px,
        // so the measurement has to stop at the hero. Scanning the
        // whole document just finds a footer link and reports it as a
        // failure, which is a bug in the check, not the page.
        //
        // The hero is taken as the first h1's nearest sectioning
        // ancestor; its bottom is what matters.
        const h1 = document.querySelector("h1");
        let deepest = 0;
        if (h1) {
          const hero =
            h1.closest("section, header, main > div, body > div") ?? h1;
          for (const el of hero.querySelectorAll("h1, h2, p, a, button, svg, img")) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            const b = r.bottom + window.scrollY;
            if (b > deepest) deepest = b;
          }
          deepest = Math.max(deepest, h1.getBoundingClientRect().bottom + window.scrollY);
        }
        return {
          overflowPx: overflow,
          heroBottomPx: Math.round(deepest),
          docHeight: de.scrollHeight,
          hasCharset: !!document.querySelector("meta[charset]"),
          title: document.title.slice(0, 60),
        };
      });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(600);
      const mob = await page.evaluate(() => {
        const de = document.documentElement;
        return { overflowPx: de.scrollWidth - de.clientWidth };
      });
      await page.screenshot({ path: join(OUT, `${stem}.mobile.png`) });

      report.push({ key, ...m, mobileOverflowPx: mob.overflowPx, errors });
    } catch (e) {
      report.push({ key, error: String(e).slice(0, 160) });
    }
    await ctx.close();
  }
}

await browser.close();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));

const pad = (s: unknown, n: number) => String(s ?? "-").padEnd(n);
console.log(
  pad("cell", 30) + pad("charset", 9) + pad("fold≤800", 10) + pad("ovf", 6) + pad("mob ovf", 9) + pad("height", 8) + "errors",
);
console.log("-".repeat(88));
for (const r of report as any[]) {
  if (r.error) {
    console.log(pad(r.key, 30) + "ERROR " + r.error);
    continue;
  }
  console.log(
    pad(r.key, 30) +
      pad(r.hasCharset ? "yes" : "NO", 9) +
      pad(r.heroBottomPx <= 800 ? "ok" : `NO ${r.heroBottomPx}`, 10) +
      pad(r.overflowPx > 0 ? `${r.overflowPx}!` : "0", 6) +
      pad(r.mobileOverflowPx > 0 ? `${r.mobileOverflowPx}!` : "0", 9) +
      pad(r.docHeight, 8) +
      (r.errors.length ? `${r.errors.length}: ${r.errors[0]}` : "none"),
  );
}
