/**
 * Multi-viewport capture. For each viewport we take both above-the-fold
 * AND full-page. Returns Buffers + content hashes.
 */

import { createHash } from "node:crypto";
import type { Page } from "playwright";
import type { Viewport } from "./types";
import { VIEWPORT_SIZES } from "./types";

export type Shot = {
  viewport: Viewport;
  fullPage: boolean;
  buffer: Buffer;
  /** Physical pixels (CSS px x deviceScaleFactor). */
  width: number;
  height: number;
  contentHash: string;
};

/** Chromium refuses/garbles screenshots past ~16k physical px on a side. */
const MAX_PHYSICAL_PX = 16000;

/**
 * Resize a page to a viewport's CSS dimensions.
 *
 * This does NOT change deviceScaleFactor, and it cannot: in Playwright
 * DSF is fixed when the CONTEXT is created. Driving
 * `Emulation.setDeviceMetricsOverride` over a raw CDP session does not
 * work around it either - `page.screenshot()` captures at the viewport
 * Playwright itself knows about and silently ignores the override, so
 * an override plus a screenshot yields the ORIGINAL context size, not
 * the requested one. (Measured: a 1440x900 context overridden to
 * 375x812 @2x screenshots at 1440x900.)
 *
 * For a retina viewport, open a context with the right
 * deviceScaleFactor - see `mobileContextOptions()`.
 */
export async function applyViewport(page: Page, vp: Viewport): Promise<void> {
  const size = VIEWPORT_SIZES[vp];
  await page.setViewportSize({ width: size.width, height: size.height });
}

/**
 * Context options that actually produce a retina mobile capture: 375
 * CSS px at DSF 2 gives 750 physical px. `isMobile` also turns on the
 * mobile meta-viewport and touch heuristics, so sites serve their
 * phone layout rather than a squeezed desktop one.
 */
export function mobileContextOptions() {
  const size = VIEWPORT_SIZES.mobile;
  return {
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  };
}

export async function captureAllViewports(
  page: Page,
  url: string,
  stabilizeFn: (page: Page) => Promise<void>,
): Promise<Shot[]> {
  const out: Shot[] = [];
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  // The real scale factor comes from the context, not from
  // VIEWPORT_SIZES: a page opened in a DSF-1 context stays DSF 1 at
  // every viewport. Record what was actually captured rather than what
  // the table wishes for, or downstream sizing is wrong by 2x.
  const dsf = await page.evaluate(() => window.devicePixelRatio || 1);

  for (const vp of viewports) {
    const size = VIEWPORT_SIZES[vp];
    await applyViewport(page, vp);
    // Let the layout settle after resize
    await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));

    // Re-stabilize (lazy-load triggers may differ at this width)
    await stabilizeFn(page);

    // Hero (above-the-fold)
    const hero = await page.screenshot({ fullPage: false, type: "png" });
    out.push({
      viewport: vp,
      fullPage: false,
      buffer: Buffer.from(hero),
      width: size.width * dsf,
      height: size.height * dsf,
      contentHash: hashOf(hero),
    });

    // Clip horizontal overflow before the full-page shot. Some sites
    // have a stray wide element / horizontal carousel that pushes
    // scrollWidth past the viewport, baking off-screen-right content
    // into the full-page capture (it should be exactly the
    // viewport-width vertical scroll). The style persists across the
    // viewport loop, so every full-page shot is clipped.
    await page.evaluate(() => {
      if (document.getElementById("__inspo_clip__")) return;
      const s = document.createElement("style");
      s.id = "__inspo_clip__";
      s.textContent =
        "html,body{overflow-x:hidden !important;max-width:100vw !important;}";
      document.head.appendChild(s);
    });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));

    // Full page. At DSF > 1 a tall scroll can exceed Chromium's texture
    // ceiling in PHYSICAL px, so clip the capture to the tallest safe
    // CSS height instead of letting the screenshot fail.
    const scrollH = await page.evaluate(() =>
      Math.max(
        document.documentElement?.scrollHeight ?? 0,
        document.body?.scrollHeight ?? 0,
      ),
    );
    const maxCssH = Math.floor(MAX_PHYSICAL_PX / dsf);
    const clamped = dsf > 1 && scrollH > maxCssH;
    const full = clamped
      ? await page.screenshot({
          clip: { x: 0, y: 0, width: size.width, height: maxCssH },
          type: "png",
        })
      : await page.screenshot({ fullPage: true, type: "png" });
    out.push({
      viewport: vp,
      fullPage: true,
      buffer: Buffer.from(full),
      width: size.width * dsf,
      height: 0, // unknown without metadata; storage layer can fill in
      contentHash: hashOf(full),
    });
  }

  void url; // referenced for symmetry / future logging
  return out;
}

function hashOf(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return createHash("sha256").update(u8).digest("hex").slice(0, 16);
}
