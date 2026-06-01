/**
 * Shoot a clean 16:10 hero thumbnail of every "Made with Inspo" example
 * page. The /examples gallery shows these static thumbs (lightweight
 * <img>, composites everywhere, no 10×-animating-iframe jank); the live
 * iframe stays only on the detail page.
 *
 * Loads each public/examples/<slug>/index.html over file:// (the pages
 * are self-contained — inline CSS/JS, Google Fonts over the network),
 * waits for fonts + a beat for hero animations to populate, then clips
 * the top 1280×800.
 *
 *   pnpm --filter @inspo/worker exec tsx src/shoot-examples.ts
 *   pnpm --filter @inspo/worker exec tsx src/shoot-examples.ts --slug=subtone-records
 */

import { chromium } from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const EXAMPLES_DIR = resolve("..", "..", "apps", "web", "public", "examples");

async function main() {
  const slugFilter = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const slugs = readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => !slugFilter || s === slugFilter)
    .sort();

  console.log(`\n  shoot-examples · ${slugs.length} pages → thumb.jpg (1280×800)\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  let ok = 0;
  for (const slug of slugs) {
    const idx = join(EXAMPLES_DIR, slug, "index.html");
    if (!existsSync(idx)) continue;
    const page = await ctx.newPage();
    try {
      await page.goto(`file://${idx}`, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      // networkidle can hang on pages with looping timers — fall back to load
      await page.goto(`file://${idx}`, { waitUntil: "load", timeout: 30000 }).catch(() => {});
    }
    // Let webfonts swap in and any typed-in/hero animation populate.
    await page.evaluate(() => (document as Document).fonts?.ready).catch(() => {});
    await page.waitForTimeout(1400);
    await page.screenshot({
      path: join(EXAMPLES_DIR, slug, "thumb.jpg"),
      type: "jpeg",
      quality: 86,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
    await page.close();
    ok += 1;
    console.log(`  ✓ ${slug}`);
  }

  await browser.close();
  console.log(`\n  shot ${ok}/${slugs.length} thumbnails\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
