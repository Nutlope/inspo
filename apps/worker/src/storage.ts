/**
 * Storage adapter. Local filesystem in dev; R2 plumbing stubbed for now.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Shot } from "./screenshot";
import type { CapturedAsset } from "./types";

const ROOT = join(process.cwd(), "captures");

export async function saveLocal(slug: string, shot: Shot): Promise<CapturedAsset> {
  const dir = join(ROOT, slug);
  await mkdir(dir, { recursive: true });

  const filename = `${shot.viewport}-${shot.fullPage ? "full" : "hero"}-${shot.contentHash}.png`;
  const path = join(dir, filename);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, shot.buffer);

  return {
    viewport: shot.viewport,
    fullPage: shot.fullPage,
    filePath: path,
    url: `file://${path}`,
    width: shot.width,
    height: shot.height,
    contentHash: shot.contentHash,
  };
}
