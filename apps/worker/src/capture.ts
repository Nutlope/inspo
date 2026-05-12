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
import {
  dismissBanners,
  preSeedConsentCookies,
  blockConsentNetworks,
} from "./dismiss.js";
import { stabilize } from "./stabilize.js";
import { captureAllViewports } from "./screenshot.js";
import { saveLocal } from "./storage.js";
import { extract } from "./extract.js";
import { tagWithLLM } from "./tag.js";
import { embedText } from "./embed.js";
import type { CaptureResult } from "./types.js";

import type { PageType } from "./types.js";

export type CaptureOptions = {
  url: string;
  /** Slug for filenames + DB row. Defaults to derived-from-host. */
  slug?: string;
  /** If false, skip the AI tagging + embedding step (faster smoke test). */
  enrich?: boolean;
  /** Multi-page grouping: which site this page belongs to. Defaults to slug. */
  siteSlug?: string;
  /** Page classification — set by the discovery layer. Defaults 'landing'. */
  pageType?: PageType;
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

    // Block known consent / chat-widget CDNs at the network layer.
    // Many banners die when their script never loads. This must run
    // BEFORE newPage so it applies to the very first navigation.
    await blockConsentNetworks(ctx);

    // Pre-seed consent cookies for the destination host so banners
    // that read existing cookies skip rendering. Scoped to the host
    // so we don't leak fake state across domains.
    await preSeedConsentCookies(ctx, url);

    const page = await ctx.newPage();

    // Track response headers of the main document for tech-fingerprinting.
    let mainHeaders: Record<string, string> = {};
    page.on("response", (r: Response) => {
      if (r.url() === url || r.url().split("?")[0] === url.split("?")[0]) {
        mainHeaders = r.headers();
      }
    });

    console.log("  navigating…");
    // Random 200–800ms warmup before goto. Reduces Chromium's
    // DNS-resolver burst-throttling at concurrency >2 — the dominant
    // failure mode in the 840-URL seed run was ERR_NAME_NOT_RESOLVED
    // on URLs that obviously resolve (x.com, liftconference.com), a
    // resolver-throttling pattern that disappears with a small jitter.
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 600));

    // First wait for DOM ready (works on every site). Then *try* for
    // networkidle but don't fail the whole capture if analytics keep
    // chattering — networkidle was the #1 cause of false-failure on
    // production sites with persistent beacons.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {
        /* fine — page is loaded enough */
      });

    console.log("  dismissing banners…");
    const dismissed = await dismissBanners(page);
    console.log(
      `   ↳ consent: ${dismissed.consentClicked} · text-buttons: ${dismissed.textButtonsClicked} · overlays-hidden: ${dismissed.overlaysHidden} · phantoms-hidden: ${dismissed.phantomsHidden ?? 0}`,
    );

    console.log("  stabilizing…");
    await stabilize(page);

    console.log("  capturing viewports…");
    const shots = await captureAllViewports(page, url, stabilize);

    console.log(`  saving ${shots.length} assets…`);
    const assets = await Promise.all(shots.map((s) => saveLocal(slug, s)));

    // Hero buffer for palette + AI tagging (desktop hero, above-the-fold)
    const heroShot = shots.find((s) => s.viewport === "desktop" && !s.fullPage)!;

    // Reset to desktop before extracting — `getComputedStyle` results
    // depend on the active viewport (responsive CSS). Without this, we
    // sample type/spacing/container-width at 375px and report mobile
    // metrics for a desktop-class design system.
    console.log("  extracting metadata…");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));
    const meta = await extract(page, mainHeaders, heroShot.buffer);

    let tags: CaptureResult["tags"] = undefined;
    let embeddings: CaptureResult["embeddings"] = undefined;

    if (opts.enrich !== false) {
      if (process.env.TOGETHER_API_KEY) {
        try {
          console.log("  tagging with Together (Gemma 3n vision)…");
          tags = await tagWithLLM({
            heroPng: heroShot.buffer,
            pageTitle: meta.pageTitle,
            pageDescription: meta.pageDescription,
            sourceUrl: url,
          });
        } catch (err) {
          console.warn(
            `  ⚠ Together tagging failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        try {
          console.log("  embedding with Together (E5 multilingual)…");
          const text = [
            meta.pageTitle,
            meta.pageDescription,
            tags?.description ?? "",
            (tags?.searchKeywords ?? []).join(" "),
          ]
            .filter(Boolean)
            .join(" — ");
          const vec = await embedText(text || meta.pageTitle || url);
          embeddings = { text: vec };
        } catch (err) {
          console.warn(
            `  ⚠ Together embedding failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        console.log("  ⨯ skipping enrichment (no TOGETHER_API_KEY)");
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
      siteSlug: opts.siteSlug ?? slug,
      pageType: opts.pageType ?? "landing",
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
