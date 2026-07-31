/**
 * Multi-viewport capture. For each viewport we take both above-the-fold
 * AND full-page. Returns Buffers + content hashes.
 */

import { createHash } from "node:crypto";
import type { CDPSession, Page } from "playwright";
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

/* One CDP session per Page, created lazily. Playwright can't change
 * deviceScaleFactor after context creation (page.setViewportSize only
 * moves width/height), so retina viewports need the Emulation domain. */
const cdpSessions = new WeakMap<Page, CDPSession | null>();

async function cdpFor(page: Page): Promise<CDPSession | null> {
  if (cdpSessions.has(page)) return cdpSessions.get(page) ?? null;
  try {
    const session = await page.context().newCDPSession(page);
    cdpSessions.set(page, session);
    return session;
  } catch {
    // Non-Chromium or remote transport without CDP: degrade to DSF 1.
    cdpSessions.set(page, null);
    return null;
  }
}

/**
 * Apply a viewport INCLUDING its deviceScaleFactor. This is the fix for
 * the "mobile captured at 1x" bug: VIEWPORT_SIZES declares DSF 2 for
 * tablet/mobile but setViewportSize can never apply it.
 */
export async function applyViewport(page: Page, vp: Viewport): Promise<void> {
  const size = VIEWPORT_SIZES[vp];
  const cdp = await cdpFor(page);
  if (cdp) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: size.width,
      height: size.height,
      deviceScaleFactor: size.deviceScaleFactor,
      mobile: vp === "mobile",
    });
  } else {
    await page.setViewportSize({ width: size.width, height: size.height });
  }
}

export async function captureAllViewports(
  page: Page,
  url: string,
  stabilizeFn: (page: Page) => Promise<void>,
): Promise<Shot[]> {
  const out: Shot[] = [];
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

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
      width: size.width * size.deviceScaleFactor,
      height: size.height * size.deviceScaleFactor,
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
    const maxCssH = Math.floor(MAX_PHYSICAL_PX / size.deviceScaleFactor);
    const clamped = size.deviceScaleFactor > 1 && scrollH > maxCssH;
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
      width: size.width * size.deviceScaleFactor,
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
