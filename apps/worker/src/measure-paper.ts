/**
 * Measure a capture's surface lightness from its LQIP.
 *
 * Every row carries a ~400-byte AVIF data URI of the capture. Decoding
 * it costs about a millisecond and yields the one thing the row's
 * structured fields cannot give us: what the page actually looks like.
 *
 * This lives in the worker rather than @inspo/shared because it needs
 * sharp, which is a native module and unavailable in the workerd
 * runtime that serves the hosted MCP. `deriveAxes` stays pure and takes
 * the measured number as an optional input.
 */

import sharp from "sharp";

/** sRGB channel to linear light. */
function toLinear(v: number): number {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

/**
 * Median pixel lightness of a capture, 0-100.
 *
 * Median rather than mean: a page with a black hero over white body
 * should not average into a grey that describes neither. The median
 * lands on whichever surface actually covers more of the page, which
 * is exactly what a paper band is asking about.
 *
 * Returns null on anything undecodable, so callers fall back rather
 * than recording a fabricated measurement.
 */
export async function measurePaperL(lqip: string | undefined): Promise<number | null> {
  if (!lqip) return null;
  const b64 = lqip.includes(",") ? lqip.slice(lqip.indexOf(",") + 1) : lqip;
  let data: Buffer;
  try {
    const raw = await sharp(Buffer.from(b64, "base64"))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    data = raw.data;
  } catch {
    return null;
  }
  if (data.length < 3) return null;

  const ls: number[] = [];
  for (let i = 0; i + 2 < data.length; i += 3) {
    const y =
      0.2126 * toLinear(data[i]!) +
      0.7152 * toLinear(data[i + 1]!) +
      0.0722 * toLinear(data[i + 2]!);
    // Cube root approximates the OKLab lightness curve closely enough
    // for a three-way band decision, without a full colour transform.
    ls.push(Math.cbrt(y) * 100);
  }
  if (ls.length === 0) return null;
  ls.sort((a, b) => a - b);
  return ls[Math.floor(ls.length / 2)]!;
}
