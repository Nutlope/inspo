/**
 * Round-2 spacing forensics: for each eval cell, measure the seams
 * between top-level sections and the narrowest side gutter, at 1280
 * and 375. One-off audit for the spacingGuidance work; delete freely.
 *
 *   npx tsx src/_measure-eval4-spacing.ts [arm ...]
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../mcp-eval-4");
const ARMS = process.argv.slice(2).length ? process.argv.slice(2) : ["nothing", "inspo-only"];
const BRIEFS = ["m6-hardware", "m7-logistics", "m8-editorial", "m9-course", "m10-oss"];

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

for (const arm of ARMS) {
  for (const brief of BRIEFS) {
    const file = join(ROOT, arm, brief, "index.html");
    if (!existsSync(file)) continue;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`file://${file}`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const secs = [...document.querySelectorAll("body section, main > *, body > div > section")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 120 && r.width > 600;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top + scrollY, bottom: r.bottom + scrollY };
        })
        .sort((a, b) => a.top - b.top);
      // Visual seam = distance between one section's last text and the
      // next section's first text is hard generically; approximate with
      // boundary gaps + interior paddings.
      const gaps: number[] = [];
      for (let i = 1; i < secs.length; i++) {
        const g = secs[i].top - secs[i - 1].bottom;
        if (g >= 0) gaps.push(Math.round(g));
      }
      const pads = [...document.querySelectorAll("section")].map((el) => {
        const cs = getComputedStyle(el);
        return Math.round(parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
      });
      // Narrowest text gutter: min distance from any sizeable text
      // block to the viewport edge.
      let minGutter = Infinity;
      for (const el of document.querySelectorAll("h1,h2,h3,p,li")) {
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 12) continue;
        minGutter = Math.min(minGutter, r.left, innerWidth - r.right);
      }
      return {
        sections: secs.length,
        minGap: gaps.length ? Math.min(...gaps) : null,
        zeroPadSections: pads.filter((p) => p === 0).length,
        medianPad: pads.sort((a, b) => a - b)[Math.floor(pads.length / 2)] ?? null,
        minGutterDesktop: Math.round(minGutter),
      };
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    const mob = await page.evaluate(() => {
      let minGutter = Infinity;
      for (const el of document.querySelectorAll("h1,h2,h3,p,li")) {
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 12) continue;
        minGutter = Math.min(minGutter, r.left, innerWidth - r.right);
      }
      return { minGutterMobile: Math.round(minGutter) };
    });
    console.log(
      `${arm}/${brief}`.padEnd(26),
      `secs ${String(m.sections).padStart(2)}`,
      `pad~${String(m.medianPad).padStart(4)}px`,
      `zeroPad ${m.zeroPadSections}`,
      `gutter ${String(m.minGutterDesktop).padStart(4)}/${String(mob.minGutterMobile).padStart(3)}px`,
    );
  }
}
await browser.close();
