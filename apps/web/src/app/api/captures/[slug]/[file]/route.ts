/**
 * Local-only capture-revision streamer — `GET /api/captures/<slug>/<file>`.
 *
 * Reads a single PNG/AVIF/WebP from the worker's captures directory
 * and streams it back with the right Content-Type. Used by the time
 * machine (`/screens/<slug>/history`) so we can serve every revision
 * of a hero without re-uploading them all to Blob storage.
 *
 * Production note: in production the worker captures dir isn't part
 * of the deployment, so this route 404s outside dev. The detail page
 * still works (it uses the Blob mirror); only the history page needs
 * disk access, and a "time machine on prod" deploy plan would either
 * ship the captures dir as a static asset or add a revision-aware
 * upload-to-blob step. Either is out of scope for the MVP.
 *
 * Path traversal guard: we resolve the joined path and reject any
 * file that resolves outside the captures root for the given slug.
 */

import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { NextRequest } from "next/server";

const CAPTURES_ROOT = resolve(
  process.env.INSPO_CAPTURES_DIR ??
    join(process.cwd(), "..", "worker", "captures"),
);

const MIME: Record<string, string> = {
  png: "image/png",
  avif: "image/avif",
  webp: "image/webp",
  lqip: "text/plain",
  json: "application/json",
};

function safeJoin(slug: string, file: string): string | null {
  // Slug must be a clean kebab/lowercase form. File must end in one of
  // the allowed extensions and have no separators.
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) return null;
  if (file.includes("/") || file.includes("..") || file.includes("\\")) return null;
  const ext = file.split(".").pop()?.toLowerCase();
  if (!ext || !MIME[ext]) return null;
  const dir = join(CAPTURES_ROOT, slug);
  const full = resolve(dir, file);
  // Defense-in-depth: even after the checks above, confirm the resolved
  // path is inside the slug's dir.
  if (!full.startsWith(resolve(dir) + "/") && full !== resolve(dir, file)) {
    return null;
  }
  if (!full.startsWith(CAPTURES_ROOT + "/")) return null;
  return full;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await ctx.params;
  const path = safeJoin(slug, file);
  if (!path) {
    return new Response("Bad path", { status: 400 });
  }
  try {
    const s = await stat(path);
    if (!s.isFile()) throw new Error("not a file");
    const buf = await readFile(path);
    const ext = file.split(".").pop()!.toLowerCase();
    return new Response(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        // Hash is in the filename — cache forever, immutable.
        "Cache-Control": "public, max-age=31536000, immutable",
        "Last-Modified": new Date(s.mtimeMs).toUTCString(),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
