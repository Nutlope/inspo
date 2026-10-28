/**
 * Dev-only end-to-end verification for packages/db/src/catalogue-cache.ts.
 *
 * Spins up a mock origin (node:http) that serves five synthetic
 * catalogue files with strong ETags, honoring If-None-Match with 304s,
 * and then runs the real loaders from @inspo/db (ensureCatalogue +
 * sidecars, exactly what the shipped client calls) in fresh child
 * processes — memoization lives per-process, so each scenario needs a
 * clean child. Asserts the request pattern the origin observed after
 * every phase:
 *
 *   1. cold miss          → 5 plain GETs, all 200
 *   2. warm hit           → 5 conditional GETs, all zero-byte 304
 *   3. rotated etags      → 5 conditional GETs, all 200 (re-download)
 *   4. hung origin        → stale cache served within the 3s timeout
 *   5. corrupted .bin     → parseSidecar rejects, pair evicted
 *   6. next run           → evicted pair re-downloaded (miss), recovers
 *   7. corrupt meta.json  → treated as no-cache, plain GETs
 *   8. INSPO_CATALOGUE_CACHE=0 → no caching at all, both runs plain GETs
 *   9. read-only cache dir → silently degrades to plain GETs
 *
 * Run:  pnpm --filter @inspo/mcp exec tsx scripts/cache-test.ts
 */

import assert from "node:assert";
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIMS = 1024;
const CACHE_DIR = join(tmpdir(), `inspo-cache-test-${process.pid}`);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const SELF = resolve(HERE, "cache-test.ts");

/* ────────────────────────── client mode ──────────────────────────
 * A fresh process that runs exactly the shipped client's loader calls
 * against INSPO_CATALOGUE_URL and prints one JSON summary line. */
async function client(): Promise<void> {
  const base = process.env.INSPO_CATALOGUE_URL!;
  const db = await import("@inspo/db");
  const t0 = Date.now();
  const r = await db.ensureCatalogue(base, {
    sidecars: false,
    userAgent: "inspo-cache-test",
  });
  const site = await db.ensureSiteSidecarFromUrl(base, {});
  const row = await db.ensureRowSidecarFromUrl(base, {});
  const markerRes = await db.fetchThroughCache(`${base}/static-screens.json`);
  const marker = (await markerRes.json() as { marker: string }[])[0]!.marker;
  console.log(
    JSON.stringify({
      screens: r.screens,
      site,
      row,
      marker,
      ms: Date.now() - t0,
    }),
  );
}

/* ────────────────────────── mock origin ────────────────────────── */

type Mode = "normal" | "hang" | "fail";
let mode: Mode = "normal";
let version = 1;
const log: { url: string; inm: string | null; status: number; bytes: number }[] =
  [];

function payloads(v: number): Record<string, Buffer> {
  const idx = (slugs: string[]) =>
    Buffer.from(
      JSON.stringify({ slugs, dims: DIMS, count: slugs.length }),
    );
  return {
    "static-screens.json": Buffer.from(
      JSON.stringify([
        { slug: "alpha", marker: `v${v}` },
        { slug: "beta", marker: `v${v}` },
      ]),
    ),
    "embeddings.idx.json": idx(["alpha", "beta"]),
    "embeddings.bin": Buffer.alloc(2 * DIMS * 4),
    "embeddings-rows.idx.json": idx(["alpha", "beta", "gamma"]),
    "embeddings-rows.bin": Buffer.alloc(3 * DIMS * 4),
  };
}

function startOrigin(): Promise<Server> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname === "/__control") {
      const next = url.searchParams.get("mode") as Mode | null;
      if (next) mode = next;
      if (url.searchParams.get("rotate")) version += 1;
      res.writeHead(200).end("ok");
      return;
    }
    const name = url.pathname.replace(/^\/cat\//, "");
    const body = payloads(version)[name];
    if (!body) {
      res.writeHead(404).end();
      return;
    }
    if (mode === "hang") return; // never respond — tests the 3s timeout
    if (mode === "fail") {
      log.push({ url: name, inm: req.headers["if-none-match"] ?? null, status: 500, bytes: 0 });
      res.writeHead(500).end("boom");
      return;
    }
    const etag = `"v${version}-${name}"`;
    const inm = req.headers["if-none-match"] ?? null;
    if (inm === etag) {
      log.push({ url: name, inm, status: 304, bytes: 0 });
      res.writeHead(304, { etag }).end();
      return;
    }
    log.push({ url: name, inm, status: 200, bytes: body.length });
    res.writeHead(200, { etag, "content-type": "application/octet-stream" }).end(body);
  });
  return new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", () => resolveListen(server));
  });
}

/* ────────────────────────── orchestrator ────────────────────────── */

let failures = 0;
function check(label: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok   ${label}`);
  } catch (e) {
    failures += 1;
    console.error(`  FAIL ${label}: ${(e as Error).message}`);
  }
}

interface ChildResult {
  screens: number;
  site: boolean;
  row: boolean;
  marker: string;
  ms: number;
}

// Resolve the workspace tsx loader from this package, so clients spawn
// as plain `node --import tsx` — no nested pnpm, which proved flaky
// when exec'd inside another pnpm exec.
const TSX_LOADER = pathToFileURL(
  createRequire(import.meta.url).resolve("tsx"),
).href;

/* MUST be async: the mock origin lives in THIS process, and a sync
 * spawn would freeze its event loop — the server could never answer
 * the client's requests and every phase would hang to the timeout. */
function runClient(port: number, extraEnv: Record<string, string> = {}): Promise<ChildResult> {
  return new Promise((resolveP, rejectP) => {
    const proc = spawn(
      process.execPath,
      ["--import", TSX_LOADER, SELF, "client"],
      {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          INSPO_CATALOGUE_URL: `http://127.0.0.1:${port}/cat`,
          INSPO_CACHE_DIR: CACHE_DIR,
          ...extraEnv,
        },
      },
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      rejectP(
        new Error(
          `client timed out; stderr=${stderr} stdout-tail=${stdout.slice(-400)}`,
        ),
      );
    }, 30_000);
    proc.on("error", (e) => {
      clearTimeout(timer);
      rejectP(new Error(`client spawn failed: ${e.message}`));
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        rejectP(
          new Error(
            `client exited ${code}: ${stderr} stdout-tail=${stdout.slice(-400)}`,
          ),
        );
        return;
      }
      try {
        resolveP(JSON.parse(stdout.trim().split("\n").pop()!) as ChildResult);
      } catch {
        rejectP(
          new Error(`client printed unparseable output: ${stdout.slice(-400)}`),
        );
      }
    });
  });
}

async function control(port: number, query: string): Promise<void> {
  await fetch(`http://127.0.0.1:${port}/__control?${query}`);
}

function expectRequests(
  want: { count: number; status: number; inm: boolean },
  last: { status: number; inm: boolean },
): void {
  // log[0..count-1] are the loader calls under test. The child's final
  // marker re-read of static-screens.json (to prove which CONTENT it is
  // serving) goes through the same cache and always lands as one extra
  // trailing request — asserted separately via `last`.
  assert.equal(
    log.length,
    want.count + 1,
    `expected ${want.count + 1} requests, saw ${log.length}: ${JSON.stringify(log)}`,
  );
  for (const r of log.slice(0, want.count)) {
    assert.equal(r.status, want.status, `want ${want.status}, got ${JSON.stringify(log)}`);
    assert.equal(
      r.inm !== null,
      want.inm,
      `inm expectation failed: ${JSON.stringify(log)}`,
    );
    if (want.status === 304) assert.equal(r.bytes, 0, "304 carried a body");
  }
  const tail = log[log.length - 1]!;
  assert.equal(tail.url, "static-screens.json", `tail: ${JSON.stringify(log)}`);
  assert.equal(tail.status, last.status, `tail: ${JSON.stringify(log)}`);
  assert.equal(tail.inm !== null, last.inm, `tail: ${JSON.stringify(log)}`);
  if (last.status === 304) assert.equal(tail.bytes, 0, "304 carried a body");
}

function cacheFiles(): string[] {
  if (!existsSync(CACHE_DIR)) return [];
  return readdirSync(CACHE_DIR).flatMap((sub) => {
    const dir = join(CACHE_DIR, sub);
    try {
      return readdirSync(dir).map((f) => join(sub, f));
    } catch {
      return [];
    }
  });
}

async function orchestrate(): Promise<void> {
  rmSync(CACHE_DIR, { recursive: true, force: true });
  mkdirSync(CACHE_DIR, { recursive: true });
  const server = await startOrigin();
  const addr = server.address();
  const port = addr && typeof addr === "object" ? addr.port : 0;

  console.log("phase 1: cold miss downloads everything");
  log.length = 0;
  let c = await runClient(port);
  check("5 plain 200s", () =>
    expectRequests(
      { count: 5, status: 200, inm: false },
      { status: 304, inm: true },
    ),
  );
  check("loaders succeeded", () => {
    assert.equal(c.screens, 2);
    assert.equal(c.site, true);
    assert.equal(c.row, true);
    assert.equal(c.marker, "v1");
  });

  console.log("phase 2: warm hit revalidates to zero-byte 304s");
  log.length = 0;
  c = await runClient(port);
  check("5 conditional 304s", () =>
    expectRequests(
      { count: 5, status: 304, inm: true },
      { status: 304, inm: true },
    ),
  );
  check("same content served", () => assert.equal(c.marker, "v1"));

  console.log("phase 3: rotated etags force a re-download");
  await control(port, "rotate=1");
  log.length = 0;
  c = await runClient(port);
  check("5 conditional 200s", () =>
    expectRequests(
      { count: 5, status: 200, inm: true },
      { status: 304, inm: true },
    ),
  );
  check("new content served", () => assert.equal(c.marker, "v2"));

  console.log("phase 4: hung origin falls back to stale inside the timeout");
  await control(port, "mode=hang");
  log.length = 0;
  c = await runClient(port);
  check("stale content served", () => {
    assert.equal(c.screens, 2);
    assert.equal(c.site, true);
    assert.equal(c.row, true);
    assert.equal(c.marker, "v2");
  });
  check("under 15s (four sequential 3s revalidations)", () =>
    assert.ok(c.ms < 15_000, `took ${c.ms}ms`),
  );
  await control(port, "mode=normal");

  console.log("phase 5: corrupted cached .bin is rejected and evicted");
  const binRel = cacheFiles().find((f) => f.endsWith("embeddings.bin"))!;
  const binPath = join(CACHE_DIR, binRel);
  // parseSidecar validates byteLength, not content — a flipped byte
  // still "parses". Truncation is the corruption it can detect.
  writeFileSync(binPath, readFileSync(binPath).subarray(0, 4096));
  log.length = 0;
  c = await runClient(port);
  check("site sidecar rejected (row untouched)", () => {
    assert.equal(c.site, false);
    assert.equal(c.row, true);
  });
  check("pair evicted from cache", () => {
    const files = cacheFiles();
    assert.ok(!files.some((f) => f.endsWith("embeddings.bin")), "bin survived");
    assert.ok(!files.some((f) => f.endsWith("embeddings.idx.json")), "idx survived");
  });

  console.log("phase 6: next run re-downloads the evicted pair");
  log.length = 0;
  c = await runClient(port);
  check("pair re-fetched uncached", () => {
    const pair = log.filter((r) => r.url.startsWith("embeddings."));
    assert.equal(pair.length, 2, JSON.stringify(log));
    for (const r of pair) assert.equal(r.status, 200);
    for (const r of pair) assert.equal(r.inm, null);
  });
  check("sidecar recovers", () => assert.equal(c.site, true));

  console.log("phase 7: corrupt meta.json is treated as no-cache");
  for (const sub of readdirSync(CACHE_DIR)) {
    const p = join(CACHE_DIR, sub, "meta.json");
    if (existsSync(p)) writeFileSync(p, "{not json");
  }
  log.length = 0;
  c = await runClient(port);
  check("5 plain 200s", () =>
    expectRequests(
      { count: 5, status: 200, inm: false },
      // meta.json self-heals: the first 200 of this run rewrites it
      // with the current etag, so the trailing marker re-read is
      // already a conditional 304.
      { status: 304, inm: true },
    ),
  );
  check("still serves", () => assert.equal(c.marker, "v2"));

  console.log("phase 8: INSPO_CATALOGUE_CACHE=0 disables caching");
  for (let i = 0; i < 2; i++) {
    log.length = 0;
    c = await runClient(port, { INSPO_CATALOGUE_CACHE: "0" });
    check(`run ${i + 1}: 5 plain 200s`, () =>
      expectRequests(
        { count: 5, status: 200, inm: false },
        { status: 200, inm: false },
      ),
    );
  }

  console.log("phase 9: read-only cache dir degrades to plain fetch");
  const roDir = join(tmpdir(), `inspo-cache-test-ro-${process.pid}`);
  rmSync(roDir, { recursive: true, force: true });
  mkdirSync(roDir, { recursive: true });
  chmodSync(roDir, 0o500);
  try {
    log.length = 0;
    c = await runClient(port, { INSPO_CACHE_DIR: roDir });
    check("5 plain 200s, no crash", () => {
      expectRequests(
        { count: 5, status: 200, inm: false },
        { status: 200, inm: false },
      );
      assert.equal(c.marker, "v2");
    });
  } finally {
    chmodSync(roDir, 0o700);
    rmSync(roDir, { recursive: true, force: true });
  }

  rmSync(CACHE_DIR, { recursive: true, force: true });
  // Close the mock origin explicitly — left listening it keeps the
  // event loop alive and the script never exits on success (a passing
  // run then looks exactly like a hang: no output, no exit).
  server.close();
  if (failures) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exitCode = 1;
    return;
  }
  console.log("\nall cache behaviors verified");
}

if (process.argv[2] === "client") {
  await client();
} else {
  await orchestrate();
}
