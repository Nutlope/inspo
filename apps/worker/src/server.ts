/**
 * HTTP endpoint for the capture pipeline.
 *
 * The web app's /api/extract route POSTs here. We keep Playwright in
 * this process (apps/web on Vercel can't run a real browser) and the
 * Next.js side just forwards.
 *
 * Run locally:
 *   pnpm --filter @inspo/worker dev:server
 *
 * Deploy: any Node host with Chromium. fly.toml in this folder ships
 * a Dockerfile that bundles the Playwright base image.
 *
 * Auth: optional shared-secret bearer token. If `INSPO_WORKER_TOKEN`
 * is set, every request must carry `Authorization: Bearer <token>`.
 * Self-hosters who run the worker on the same machine as Next can
 * leave it unset.
 */

import "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";

const app = new Hono();

const TOKEN = process.env.INSPO_WORKER_TOKEN ?? null;

app.use("*", async (c, next) => {
  if (!TOKEN) {
    await next();
    return;
  }
  const auth = c.req.header("authorization") ?? "";
  if (auth !== `Bearer ${TOKEN}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

app.get("/", (c) =>
  c.json({
    name: "@inspo/worker",
    endpoints: ["GET /healthz", "POST /extract"],
  }),
);

app.get("/healthz", (c) => c.json({ ok: true }));

app.post("/extract", async (c) => {
  let body: { url?: unknown; userId?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "expected JSON body" }, 400);
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\//i.test(url)) {
    return c.json({ error: "url must start with http(s)://" }, 400);
  }

  try {
    console.log(`[server] extract ${url}`);
    const result = await capture({ url, enrich: true });
    // Submitted via /extract = lands as 'pending' in the curator queue.
    // The curator approves before it shows in the public archive.
    const persisted = await persistCapture(result, { status: "pending" });
    return c.json({ slug: result.slug, id: persisted?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[server] extract failed: ${msg}`);
    return c.json({ error: msg }, 502);
  }
});

const port = Number(process.env.PORT ?? 4780);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
  console.log(
    `[server] auth: ${TOKEN ? "Bearer token required" : "open (no INSPO_WORKER_TOKEN)"}`,
  );
});
