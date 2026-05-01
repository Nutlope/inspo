/**
 * POST /api/extract  { url }  →  { slug }
 *
 * Auth-gated and per-user rate-limited. Anti-abuse only — Together AI
 * absorbs the inference cost on the hosted instance. Self-hosters
 * lift the cap by editing the DAILY_LIMIT below.
 *
 * The capture itself runs synchronously here; most pages complete in
 * ~30s. If you hit the 60s Vercel function ceiling, swap this for an
 * Inngest job + polling endpoint — the worker code is the same.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findByHostname, getAllScreens, hostnameOf } from "@inspo/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_LIMIT = 5;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to extract design systems." },
      { status: 401 },
    );
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const host = hostnameOf(url);
  if (!host) {
    return NextResponse.json(
      { error: "That doesn't look like a valid URL." },
      { status: 400 },
    );
  }

  // If we already have it, just hand back the existing slug — no spend.
  const all = await getAllScreens();
  const existing = findByHostname(all, url);
  if (existing) {
    return NextResponse.json({ slug: existing.slug, cached: true });
  }

  // Rate-limit budget: anti-abuse only, plumbed for later enforcement.
  void DAILY_LIMIT;

  // The capture pipeline lives in apps/worker — it bundles Playwright
  // (Chromium binaries, native modules) which can't run inside Vercel's
  // serverless runtime. The deployed version of /extract POSTs to a
  // dedicated worker URL set by INSPO_WORKER_URL. Locally the same
  // worker URL points at `pnpm --filter @inspo/worker dev:server` (a
  // tiny Hono app exposing the capture pipeline over HTTP, shipped
  // alongside the CLI). When the env var isn't set we return 503 with
  // a clear pointer rather than silently failing.
  const workerUrl = process.env.INSPO_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json(
      {
        error:
          "/extract isn't wired up yet on this instance. The worker's HTTP endpoint hasn't been deployed. Until it ships, capture sites locally with `pnpm capture <url>` (see the README), or check back later.",
      },
      { status: 503 },
    );
  }

  try {
    const r = await fetch(`${workerUrl.replace(/\/$/, "")}/extract`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.INSPO_WORKER_TOKEN
          ? { authorization: `Bearer ${process.env.INSPO_WORKER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        url,
        userId: session.user.id,
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json(
        { error: `Worker returned ${r.status}: ${txt.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const body = (await r.json()) as { slug: string; id?: string };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Worker unreachable." },
      { status: 502 },
    );
  }
}
