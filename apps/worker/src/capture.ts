/**
 * Per-URL capture orchestrator.
 *
 * Pipeline:
 *   1. Launch browser, set realistic UA / locale / timezone
 *   2. Goto + waitUntil:'networkidle'
 *   3. Dismiss banners (cookie + chat overlays)
 *   4. Stabilize (fonts.ready, slow scroll, pause animations)
 *   5. Capture desktop + tablet x {hero, full}, sweeping for late popups
 *      before each viewport's shots
 *   6. Capture mobile x {hero, full} in its own phone context (375 @2x)
 *   7. Extract metadata (palette, fonts, tech, mode)
 *   8. Save to local storage
 *   9. (optional) AI tag via a Together vision model
 *  10. (optional) Embed via Together
 *  11. Return CaptureResult
 *
 * Steps 9 and 10 are skipped silently if API keys are missing, which is
 * useful for smoke-testing the browser pipeline before paying any bills.
 */

import { chromium, type Browser, type BrowserContext, type Page, type Response } from "playwright";
import {
  dismissBanners,
  preSeedConsentCookies,
  blockConsentNetworks,
} from "./dismiss.js";
import { stabilize } from "./stabilize.js";
import {
  applyViewport,
  captureAllViewports,
  captureMobileShots,
  mobileContextOptions,
  type Shot,
} from "./screenshot.js";
import { saveLocal } from "./storage.js";
import { encodeVariants } from "./encode-variants.js";
import { extract } from "./extract.js";
import { tagWithLLM } from "./tag.js";
import { embedText } from "./embed.js";
import type { CaptureResult } from "./types.js";

import type { PageType } from "./types.js";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

export type CaptureOptions = {
  url: string;
  /** Slug for filenames + DB row. Defaults to derived-from-host. */
  slug?: string;
  /** If false, skip the AI tagging + embedding step (faster smoke test). */
  enrich?: boolean;
  /** Multi-page grouping: which site this page belongs to. Defaults to slug. */
  siteSlug?: string;
  /** Page classification, set by the discovery layer. Defaults 'landing'. */
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
      userAgent: DESKTOP_UA,
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
    // Random 200 to 800ms warmup before goto. Reduces Chromium's
    // DNS-resolver burst-throttling at concurrency >2: the dominant
    // failure mode in the 840-URL seed run was ERR_NAME_NOT_RESOLVED
    // on URLs that obviously resolve (x.com, liftconference.com), a
    // resolver-throttling pattern that disappears with a small jitter.
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 600));
    await load(page, url);

    console.log("  dismissing banners…");
    const dismissed = await dismissBanners(page);
    console.log(
      `   ↳ consent: ${dismissed.consentClicked} · text-buttons: ${dismissed.textButtonsClicked} · overlays-hidden: ${dismissed.overlaysHidden} · phantoms-hidden: ${dismissed.phantomsHidden ?? 0}`,
    );

    console.log("  stabilizing…");
    await stabilize(page);

    // Before every viewport's screenshots, sweep again without clicking.
    // Popups that arrive late (timed newsletter modals, scroll-triggered
    // promos) or only at a narrower width would otherwise be baked into
    // the shot.
    const sweep = async (p: Page) => {
      await stabilize(p);
      const late = await dismissBanners(p, [], { clicks: false });
      if (late.phantomsHidden) console.log(`   ↳ late popups hidden: ${late.phantomsHidden}`);
    };

    console.log("  capturing desktop + tablet…");
    // Tablet only supplies the 384px thumb; nothing uses its full page.
    const shots: Shot[] = await captureAllViewports(page, url, sweep, ["desktop", "tablet"], ["desktop"]);

    console.log("  capturing mobile (375 @2x, phone context)…");
    try {
      shots.push(...(await captureMobile(browser, url)));
    } catch (err) {
      console.warn(
        `   ⚠ phone context failed (${err instanceof Error ? err.message : String(err)}); using a resized desktop page`,
      );
      shots.push(...(await captureAllViewports(page, url, sweep, ["mobile"])));
    }

    console.log(`  saving ${shots.length} assets…`);
    const assets = await Promise.all(shots.map((s) => saveLocal(slug, s)));

    // Encode AVIF + WebP variants next to each source PNG. The capture
    // pipeline is already on a beefy machine; the encoder adds ~600ms
    // per site (about 4s of CPU spread across viewports) and turns the
    // gallery's first-paint payload from megabytes to kilobytes. Skips
    // outputs that already exist, so re-captures stay cheap.
    console.log("  encoding AVIF/WebP variants…");
    let encoded = 0;
    let skipped = 0;
    for (const asset of assets) {
      // `desktop-hero` is the gallery's tile + the hero plate; `tablet-
      // hero` doubles as the upload-to-blob "thumb". Encode variants
      // for both, and full-page for the detail view. Mobile variants
      // come from encode-existing.ts, which knows the mobile roles.
      const isHero =
        !asset.fullPage &&
        (asset.viewport === "desktop" || asset.viewport === "tablet");
      const isFull = asset.fullPage && asset.viewport === "desktop";
      if (!isHero && !isFull) continue;
      try {
        const role = isFull ? "full" : asset.viewport === "tablet" ? "thumb" : "hero";
        const r = await encodeVariants(asset.filePath, { role });
        encoded += r.written.length;
        skipped += r.skipped.length;
      } catch (err) {
        // Encoding is a perf win, not a correctness requirement:
        // never let it sink a capture.
        console.warn(
          `   ⚠ encode failed for ${asset.filePath}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    console.log(`   ↳ wrote ${encoded} · reused ${skipped}`);

    // Hero buffer for palette + AI tagging (desktop hero, above-the-fold)
    const heroShot = shots.find((s) => s.viewport === "desktop" && !s.fullPage)!;

    // Reset to desktop before extracting: `getComputedStyle` results
    // depend on the active viewport (responsive CSS). Without this, we
    // sample type/spacing/container-width at a narrow width and report
    // tablet metrics for a desktop-class design system.
    console.log("  extracting metadata…");
    await applyViewport(page, "desktop");
    await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));
    const meta = await extract(page, mainHeaders, heroShot.buffer);

    let tags: CaptureResult["tags"] = undefined;
    let embeddings: CaptureResult["embeddings"] = undefined;

    if (opts.enrich !== false) {
      if (process.env.TOGETHER_API_KEY) {
        try {
          console.log("  tagging with Together (vision)…");
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
            .join(" · ");
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

/**
 * DOM ready first (works on every site), then *try* for networkidle but
 * don't fail the whole capture if analytics keep chattering: networkidle
 * was the #1 cause of false failures on sites with persistent beacons.
 */
async function load(page: Page, url: string): Promise<void> {
  // Chromium's resolver throttles bursts of lookups when several
  // browsers start at once, so ERR_NAME_NOT_RESOLVED on a domain that
  // plainly resolves is routine at concurrency > 2. Retry transient
  // network failures twice before giving up.
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const transient =
        /ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_(RESET|CLOSED|REFUSED|TIMED_OUT)|ERR_NETWORK_CHANGED|ERR_TIMED_OUT|ERR_HTTP2|Timeout/i.test(msg);
      if (!transient || attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt + Math.random() * 1000));
    }
  }
  await page
    .waitForLoadState("networkidle", { timeout: 8_000 })
    .catch(() => {
      /* fine: page is loaded enough */
    });
}

/**
 * Mobile in its own context. DSF is fixed per context in Playwright, so
 * a resized desktop page can only ever produce a 1x, desktop-UA frame.
 * A phone context gets the retina pixels and the site's real phone
 * layout, and runs the same consent layers and popup sweeps.
 */
async function captureMobile(browser: Browser, url: string): Promise<Shot[]> {
  const mctx = await browser.newContext({
    ...mobileContextOptions(),
    userAgent: PHONE_UA,
    locale: "en-US",
    timezoneId: "America/New_York",
    colorScheme: "light",
  });
  try {
    await blockConsentNetworks(mctx);
    await preSeedConsentCookies(mctx, url);
    const mpage = await mctx.newPage();
    await load(mpage, url);
    await dismissBanners(mpage);
    await stabilize(mpage);
    await dismissBanners(mpage, [], { clicks: false });
    return await captureMobileShots(mpage);
  } finally {
    await mctx.close().catch(() => {});
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
