/**
 * Multi-viewport capture. For each viewport we take both above-the-fold
 * AND full-page. Returns Buffers + content hashes.
 */

import { createHash } from "node:crypto";
import type { Page } from "playwright";
import sharp from "sharp";
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

/** Share of below-the-fold bands allowed to be flat colour before the
 *  direct full-page capture is treated as broken and scroll-stitched. */
const BLANK_RETRY_AT = 0.45;

/**
 * Resize a page to a viewport's CSS dimensions.
 *
 * This does NOT change deviceScaleFactor, and it cannot: in Playwright
 * DSF is fixed when the CONTEXT is created. Driving
 * `Emulation.setDeviceMetricsOverride` over a raw CDP session does not
 * work around it either: `page.screenshot()` captures at the viewport
 * Playwright itself knows about and silently ignores the override, so
 * an override plus a screenshot yields the ORIGINAL context size, not
 * the requested one. (Measured: a 1440x900 context overridden to
 * 375x812 @2x screenshots at 1440x900.)
 *
 * For a retina viewport, open a context with the right
 * deviceScaleFactor, see `mobileContextOptions()`.
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

/**
 * Clip horizontal overflow before a full-page shot. Some sites have a
 * stray wide element or horizontal carousel that pushes scrollWidth past
 * the viewport, baking off-screen-right content into the capture (it
 * should be exactly the viewport-width vertical scroll). The style
 * persists, so every later full-page shot on the page is clipped too.
 */
async function clipOverflowX(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.getElementById("__inspo_clip__")) return;
    const s = document.createElement("style");
    s.id = "__inspo_clip__";
    s.textContent =
      "html,body{overflow-x:hidden !important;max-width:100vw !important;}";
    document.head.appendChild(s);
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));
}

/**
 * Full-page screenshot that survives pages taller than Chromium's
 * texture ceiling. A short page is one capture. A tall one is captured
 * in slices (with fullPage set, `clip` is in document coordinates) and
 * stitched, where the old code simply cut a retina page off at 8,000
 * CSS px.
 */
export async function fullPageShot(
  page: Page,
  cssWidth: number,
  dsf: number,
): Promise<Buffer> {
  const scrollH = await page.evaluate(() =>
    Math.max(
      document.documentElement?.scrollHeight ?? 0,
      document.body?.scrollHeight ?? 0,
    ),
  );
  const sliceCss = Math.floor(MAX_PHYSICAL_PX / dsf);
  if (scrollH <= sliceCss) {
    return Buffer.from(await page.screenshot({ fullPage: true, type: "png" }));
  }
  const slices: { input: Buffer; top: number }[] = [];
  let top = 0;
  let width = 0;
  for (let y = 0; y < scrollH; y += sliceCss) {
    const h = Math.min(sliceCss, scrollH - y);
    const buf = Buffer.from(
      await page.screenshot({
        fullPage: true,
        type: "png",
        clip: { x: 0, y, width: cssWidth, height: h },
      }),
    );
    const m = await sharp(buf).metadata();
    width = Math.max(width, m.width ?? 0);
    slices.push({ input: buf, top });
    top += m.height ?? 0;
  }
  return sharp({
    create: { width, height: top, channels: 3, background: "#ffffff" },
  })
    .composite(slices.map((s) => ({ input: s.input, top: s.top, left: 0 })))
    .png()
    .toBuffer();
}

/**
 * Share of the page below the first viewport that is flat colour, in
 * viewport-tall bands. A real page, even a sparse one, has text or
 * imagery in most bands. A page whose content lives in a fixed
 * smooth-scroll wrapper, or only appears as it scrolls into view, comes
 * out of a direct full-page capture as one long empty band.
 */
export async function blankFraction(
  png: Buffer,
  skipTopPx: number,
  bandPx: number,
): Promise<number> {
  const meta = await sharp(png, { limitInputPixels: false }).metadata();
  const height = meta.height ?? 0;
  if (height <= skipTopPx + bandPx) return 0;
  const { data, info } = await sharp(png, { limitInputPixels: false })
    .resize({ width: 180 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const scale = info.height / height;
  const top = Math.floor(skipTopPx * scale);
  const band = Math.max(4, Math.floor(bandPx * scale));
  let blank = 0;
  let total = 0;
  for (let y = top; y + band <= info.height; y += band) {
    let sum = 0;
    let sq = 0;
    let n = 0;
    for (let yy = y; yy < y + band; yy++) {
      for (let x = 0; x < w; x++) {
        const v = data[yy * w + x]!;
        sum += v;
        sq += v * v;
        n++;
      }
    }
    const mean = sum / n;
    const sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
    total++;
    if (sd < 3) blank++;
  }
  return total ? blank / total : 0;
}

/**
 * Full page captured the way a person sees it: scroll one viewport at a
 * time, let the page's own scroll handling (smooth-scroll wrappers,
 * reveal-on-scroll) settle, shoot the viewport, stitch. Fixed bars that
 * would repeat in every frame (navs, badges) are hidden after the first
 * frame, which shows them in place. Used when the direct capture comes
 * out mostly blank.
 */
export async function scrollStitchShot(page: Page, dsf: number): Promise<Buffer> {
  const vh = await page.evaluate(() => window.innerHeight);
  const vw = await page.evaluate(() => window.innerWidth);
  const total = await page.evaluate(() =>
    Math.max(document.documentElement?.scrollHeight ?? 0, document.body?.scrollHeight ?? 0),
  );
  const maxY = Math.max(0, total - vh);
  const stops: number[] = [];
  for (let y = 0; y < maxY; y += vh) stops.push(y);
  stops.push(maxY);

  const frames: { input: Buffer; top: number }[] = [];
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate(`window.scrollTo(0, ${stops[i]})`);
    await page.waitForTimeout(900);
    if (i === 1) {
      await page.evaluate(`(() => {
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" && cs.position !== "sticky") continue;
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.height < innerHeight * 0.35) {
            el.setAttribute("data-inspo-stitch-hidden", "1");
            el.style.setProperty("visibility", "hidden", "important");
          }
        }
      })()`);
      await page.waitForTimeout(150);
    }
    const y = (await page.evaluate(() => window.scrollY)) as number;
    frames.push({
      input: Buffer.from(await page.screenshot({ type: "png" })),
      top: Math.round(y * dsf),
    });
  }
  await page.evaluate(`(() => {
    for (const el of document.querySelectorAll("[data-inspo-stitch-hidden]")) {
      el.style.removeProperty("visibility");
      el.removeAttribute("data-inspo-stitch-hidden");
    }
    window.scrollTo(0, 0);
  })()`);
  await page.waitForTimeout(300);

  const height = Math.max(...frames.map((f) => f.top)) + Math.round(vh * dsf);
  return sharp({
    create: { width: Math.round(vw * dsf), height, channels: 3, background: "#ffffff" },
  })
    .composite(frames.map((f) => ({ input: f.input, top: f.top, left: 0 })))
    .png()
    .toBuffer();
}

/** Direct full-page capture, with the scroll-stitched fallback when the
 *  direct one is mostly blank below the fold. Keeps whichever shows more. */
async function bestFullPage(
  page: Page,
  vp: Viewport,
  cssWidth: number,
  cssHeight: number,
  dsf: number,
): Promise<Buffer> {
  const direct = await fullPageShot(page, cssWidth, dsf);
  const bandPx = cssHeight * dsf;
  const blank = await blankFraction(direct, bandPx, bandPx);
  if (blank < BLANK_RETRY_AT) return direct;
  const stitched = await scrollStitchShot(page, dsf);
  const blank2 = await blankFraction(stitched, bandPx, bandPx);
  console.log(
    `   ↳ ${vp} full page ${Math.round(blank * 100)}% blank below the fold; scroll-stitched ${Math.round(blank2 * 100)}%${blank2 < blank ? " (kept)" : " (discarded)"}`,
  );
  return blank2 < blank ? stitched : direct;
}

export async function captureAllViewports(
  page: Page,
  url: string,
  stabilizeFn: (page: Page) => Promise<void>,
  viewports: Viewport[] = ["desktop", "tablet", "mobile"],
  /** Viewports that also get a full-page shot. The tablet view only
   *  supplies the 384px gallery thumb, so its full page is dead weight. */
  fullPageFor: Viewport[] = viewports,
): Promise<Shot[]> {
  const out: Shot[] = [];

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

    if (!fullPageFor.includes(vp)) continue;
    await clipOverflowX(page);
    const full = await bestFullPage(page, vp, size.width, size.height, dsf);
    out.push({
      viewport: vp,
      fullPage: true,
      buffer: full,
      width: size.width * dsf,
      height: 0, // unknown without metadata; storage layer can fill in
      contentHash: hashOf(full),
    });
  }

  void url; // referenced for symmetry / future logging
  return out;
}

/**
 * Hero + full page from a page opened in a real phone context
 * (`mobileContextOptions()`): 375 CSS px at DSF 2, so 750 physical px,
 * served the site's phone layout. Phone pages run long; past the texture
 * ceiling the stitched full page is kept whole but halved to 1x, which
 * is what the archive's older mobile full pages are and what the WebP
 * encoder can still take.
 */
export async function captureMobileShots(page: Page): Promise<Shot[]> {
  const size = VIEWPORT_SIZES.mobile;
  const dsf = await page.evaluate(() => window.devicePixelRatio || 1);
  const hero = Buffer.from(await page.screenshot({ fullPage: false, type: "png" }));
  await clipOverflowX(page);
  let full = await bestFullPage(page, "mobile", size.width, size.height, dsf);
  let fullWidth = size.width * dsf;
  const m = await sharp(full).metadata();
  if (dsf > 1 && (m.height ?? 0) > MAX_PHYSICAL_PX) {
    fullWidth = size.width;
    full = await sharp(full).resize({ width: fullWidth }).png().toBuffer();
  }
  return [
    {
      viewport: "mobile",
      fullPage: false,
      buffer: hero,
      width: size.width * dsf,
      height: size.height * dsf,
      contentHash: hashOf(hero),
    },
    {
      viewport: "mobile",
      fullPage: true,
      buffer: full,
      width: fullWidth,
      height: 0,
      contentHash: hashOf(full),
    },
  ];
}

function hashOf(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return createHash("sha256").update(u8).digest("hex").slice(0, 16);
}
