/**
 * Local-only flow-asset streamer — `GET /api/flows/<slug>/<file>`.
 * Serves the step PNGs + flow.webm captured by the worker's
 * capture-flow into apps/worker/captures/_flows/<slug>/.
 *
 * Dev-only (the captures dir isn't part of the deploy). Same
 * path-traversal guard as /api/captures.
 */

import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { NextRequest } from "next/server";

const FLOWS_ROOT = resolve(
  process.env.INSPO_FLOWS_DIR ??
    join(process.cwd(), "..", "worker", "captures", "_flows"),
);

const MIME: Record<string, string> = {
  png: "image/png",
  webm: "video/webm",
  json: "application/json",
};

function safeJoin(slug: string, file: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) return null;
  if (file.includes("/") || file.includes("..") || file.includes("\\")) return null;
  const ext = file.split(".").pop()?.toLowerCase();
  if (!ext || !MIME[ext]) return null;
  const dir = join(FLOWS_ROOT, slug);
  const full = resolve(dir, file);
  if (!full.startsWith(resolve(dir) + "/") && full !== resolve(dir, file)) return null;
  if (!full.startsWith(FLOWS_ROOT + "/")) return null;
  return full;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await ctx.params;
  const path = safeJoin(slug, file);
  if (!path) return new Response("Bad path", { status: 400 });
  try {
    const s = await stat(path);
    if (!s.isFile()) throw new Error("not a file");
    const buf = await readFile(path);
    const ext = file.split(".").pop()!.toLowerCase();
    return new Response(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
