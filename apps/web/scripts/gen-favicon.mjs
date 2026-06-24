// Regenerates the raster favicon assets from the single source of truth,
// src/app/icon.svg (the "Inspo." I-and-dot monogram).
//
//   node scripts/gen-favicon.mjs
//
// Produces:
//   - src/app/favicon.ico   multi-size (16/32/48) PNG-in-ICO for legacy + the
//                           hard-coded /favicon.ico request path
//   - src/app/apple-icon.png 180x180 full-bleed (iOS rounds it itself, so this
//                           variant drops the SVG's own corner radius)
//
// sharp can rasterize SVG but cannot write .ico, so we pack the PNGs into an
// ICONDIR container by hand (PNG-compressed entries, valid on every browser
// since IE Vista).

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const rounded = readFileSync(join(webRoot, "src/app/icon.svg"), "utf8");
const square = rounded.replace('rx="20"', 'rx="0"');

const ICO_SIZES = [16, 32, 48];

function buildIco(pngs, sizes) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(count * 16);
  let offset = 6 + count * 16;
  pngs.forEach((png, i) => {
    const s = sizes[i];
    const e = dir.subarray(i * 16, (i + 1) * 16);
    e.writeUInt8(s >= 256 ? 0 : s, 0); // width
    e.writeUInt8(s >= 256 ? 0 : s, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8); // size of png blob
    e.writeUInt32LE(offset, 12); // offset
    offset += png.length;
  });

  return Buffer.concat([header, dir, ...pngs]);
}

const icoPngs = await Promise.all(
  ICO_SIZES.map((s) =>
    sharp(Buffer.from(rounded)).resize(s, s).png().toBuffer(),
  ),
);
writeFileSync(join(webRoot, "src/app/favicon.ico"), buildIco(icoPngs, ICO_SIZES));

const apple = await sharp(Buffer.from(square))
  .resize(180, 180)
  .png()
  .toBuffer();
writeFileSync(join(webRoot, "src/app/apple-icon.png"), apple);

console.log("favicon.ico + apple-icon.png regenerated from icon.svg");
