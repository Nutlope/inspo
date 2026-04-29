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
  width: number;
  height: number;
  contentHash: string;
};

export async function captureAllViewports(
  page: Page,
  url: string,
  stabilizeFn: (page: Page) => Promise<void>,
): Promise<Shot[]> {
  const out: Shot[] = [];
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  for (const vp of viewports) {
    const size = VIEWPORT_SIZES[vp];
    await page.setViewportSize({ width: size.width, height: size.height });
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
      width: size.width,
      height: size.height,
      contentHash: hashOf(hero),
    });

    // Full page
    const full = await page.screenshot({ fullPage: true, type: "png" });
    out.push({
      viewport: vp,
      fullPage: true,
      buffer: Buffer.from(full),
      width: size.width,
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
