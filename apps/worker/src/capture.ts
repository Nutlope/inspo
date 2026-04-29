/**
 * Per-URL capture orchestrator.
 *
 * Pipeline:
 *   1. Launch browser, set realistic UA / locale / timezone
 *   2. Goto + waitUntil:'networkidle'
 *   3. Dismiss banners (cookie + chat overlays)
 *   4. Stabilize (fonts.ready, slow scroll, pause animations)
 *   5. Capture three viewports × {hero, full}
 *   6. Extract metadata (palette, fonts, tech, mode)
 *   7. Save to local storage
 *   8. (optional) AI tag via Claude vision
 *   9. (optional) Embed via Voyage
 *  10. Return CaptureResult
 *
 * Steps 8/9 are skipped silently if API keys are missing — useful for
 * smoke-testing the browser pipeline before paying any bills.
 */

import { chromium, type BrowserContext, type Page, type Response } from "playwright";
import { dismissBanners } from "./dismiss.js";
import { stabilize } from "./stabilize.js";
import { captureAllViewports } from "./screenshot.js";
import { saveLocal } from "./storage.js";
import { extract } from "./extract.js";
import { tagWithClaude } from "./tag.js";
import { embedMultimodal, embedText } from "./embed.js";
import type { CaptureResult } from "./types.js";

export type CaptureOptions = {
  url: string;
  /** Slug for filenames + DB row. Defaults to derived-from-host. */
  slug?: string;
  /** If false, skip the AI tagging + embedding step (faster smoke test). */
  enrich?: boolean;
};

export async function capture(opts: CaptureOptions): Promise<CaptureResult> {
  const url = opts.url;
  const slug = opts.slug ?? slugify(url);

  console.log(`▶ ${url}  (slug: ${slug})`);
  const t0 = Date.now();

  const browser = await chromium.launch({ headless: true });
  let ctx: BrowserContext | null = null;

  try {
    ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    const page = await ctx.newPage();

    // Track response headers of the main document for tech-fingerprinting.
    let mainHeaders: Record<string, string> = {};
    page.on("response", (r: Response) => {
      if (r.url() === url || r.url().split("?")[0] === url.split("?")[0]) {
        mainHeaders = r.headers();
      }
    });

    console.log("  navigating…");
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    console.log("  dismissing banners…");
    const dismissed = await dismissBanners(page);
    console.log(
      `   ↳ consent: ${dismissed.consentClicked} · text-buttons: ${dismissed.textButtonsClicked} · overlays-hidden: ${dismissed.overlaysHidden}`,
    );

    console.log("  stabilizing…");
    await stabilize(page);

    console.log("  capturing viewports…");
    const shots = await captureAllViewports(page, url, stabilize);

    console.log(`  saving ${shots.length} assets…`);
    const assets = await Promise.all(shots.map((s) => saveLocal(slug, s)));

    // Hero buffer for palette + AI tagging (desktop hero, above-the-fold)
    const heroShot = shots.find((s) => s.viewport === "desktop" && !s.fullPage)!;

    console.log("  extracting metadata…");
    const meta = await extract(page, mainHeaders, heroShot.buffer);

    let tags: CaptureResult["tags"] = undefined;
    let embeddings: CaptureResult["embeddings"] = undefined;

    if (opts.enrich !== false) {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          console.log("  tagging with Claude…");
          tags = await tagWithClaude({
            heroPng: heroShot.buffer,
            pageTitle: meta.pageTitle,
            pageDescription: meta.pageDescription,
            sourceUrl: url,
          });
        } catch (err) {
          console.warn(
            `  ⚠ Claude tagging failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        console.log("  ⨯ skipping Claude tagging (no ANTHROPIC_API_KEY)");
      }

      if (process.env.VOYAGE_API_KEY) {
        try {
          console.log("  embedding with Voyage…");
          const text = [
            meta.pageTitle,
            meta.pageDescription,
            tags?.description ?? "",
            (tags?.searchKeywords ?? []).join(" "),
          ]
            .filter(Boolean)
            .join(" — ");
          const [image, textEmb] = await Promise.all([
            embedMultimodal({
              imageBase64: heroShot.buffer.toString("base64"),
              text,
            }),
            embedText(text || meta.pageTitle || url),
          ]);
          embeddings = { image, text: textEmb };
        } catch (err) {
          console.warn(
            `  ⚠ Voyage embedding failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        console.log("  ⨯ skipping Voyage embeddings (no VOYAGE_API_KEY)");
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ ${slug} captured in ${elapsed}s`);

    return {
      sourceUrl: url,
      slug,
      capturedAt: new Date(),
      assets,
      meta,
      tags,
      embeddings,
    };
  } finally {
    await ctx?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

function slugify(url: string): string {
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
