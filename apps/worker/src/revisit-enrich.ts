/**
 * Revisit-enrich: ONE live Playwright pass over seed rows that
 * backfills what the May-cohort seed rebuild lost and what never ran:
 *
 *   fonts                (build-static-seed hardcoded [] on 2,278 rows)
 *   designSystem         typeRamp / spacing / radius / containerWidth /
 *                        cssVariables (capped - see CSS_VAR_CAP)
 *   components           ComponentRegion[] for the sharp crop route,
 *                        gated by drift vs the STORED full-page PNG
 *   mobile @ 2x          re-shoot mobile hero+full at deviceScaleFactor
 *                        2 (the pre-fix corpus is 375px physical)
 *
 * Writes ONLY into packages/db/src/static-screens.json (the production
 * database). Never touches palette / mode / title / description / tags:
 * those are curated or vision-derived and must stay consistent with the
 * autopsies. Rows whose live visit fails keep every old value.
 *
 *   tsx src/revisit-enrich.ts --sample=10                 dry sample, no write
 *   tsx src/revisit-enrich.ts --go --canonical-only --concurrency=5
 *   tsx src/revisit-enrich.ts --go --concurrency=5        everything un-enriched
 *     [--slugs=a,b] [--force] [--mobile=both|hero|none] [--no-components]
 *
 * Idempotent via the enrichedAt stamp; resumable via checkpoint saves
 * every 100 rows. Snapshot static-screens.pre-revisit-<ts>.json before
 * the first write. Run report: captures/_reports/revisit-<ts>.json.
 */

import "./env.js";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import {
  blockConsentNetworks,
  preSeedConsentCookies,
  dismissBanners,
} from "./dismiss.js";
import { stabilize } from "./stabilize.js";
import { extract } from "./extract.js";
import { applyViewport, mobileContextOptions } from "./screenshot.js";
import { saveLocal } from "./storage.js";
import { badPageReason, sameRegistrableDomain } from "./bad-capture.js";
import type { Shot } from "./screenshot.js";
import type { ComponentRegion } from "@inspo/db/schema";

const SEED = resolve(
  process.cwd(),
  "..",
  "..",
  "packages",
  "db",
  "src",
  "static-screens.json",
);
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);
const REPORTS_DIR = join(CAPTURES_DIR, "_reports");

/** Region acceptance tiers vs stored full-page height. */
const DRIFT_ACCEPT_ALL = 0.08;
const DRIFT_ACCEPT_TOP = 0.2;
/** cssVariables cap per row (entries + serialized bytes): unbounded
 *  writes ballooned rows to 40-80KB and would blow up the 11MB seed. */
const CSS_VAR_MAX_ENTRIES = 60;
const CSS_VAR_MAX_BYTES = 4096;
const CSS_VAR_PREFERRED =
  /^--(color|colour|font|text|type|radius|rounded|space|spacing|gap|size|bg|background|border|shadow|accent|brand|primary|secondary|surface|ink|paper|fg|foreground)/;

const MAX_PHYSICAL_PX = 16000;

type SeedRow = {
  slug: string;
  siteSlug: string;
  sourceUrl: string;
  fonts: string[];
  designSystem: {
    typeRamp: unknown[];
    spacingScale: number[];
    radiusScale: number[];
    containerWidth: number | null;
    cssVariables: Record<string, string>;
    colorWords: string[];
  };
  components: ComponentRegion[];
  enrichedAt?: string;
  [k: string]: unknown;
};

type RowStatus =
  | "ok"
  | "dead"
  | "redirected"
  | "bot-blocked"
  | "error";

type RowReport = {
  slug: string;
  status: RowStatus;
  fonts?: number;
  regions?: number;
  regionGate?: "all" | "top-only" | "drift-gated" | "width-mismatch" | "skipped";
  drift?: number;
  mobile?: boolean;
  error?: string;
};

function pngDims(path: string): { w: number; h: number } | null {
  try {
    const buf = readFileSync(path);
    if (buf.length < 24) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function newestPngPath(slug: string, prefix: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  try {
    const files = readdirSync(dir)
      .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
      .map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    return files[0] ? join(dir, files[0].f) : null;
  } catch {
    return null;
  }
}

function hashOf(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

function capCssVariables(
  vars: Record<string, string>,
): Record<string, string> {
  const entries = Object.entries(vars).filter(
    ([, v]) => typeof v === "string" && v.length <= 256,
  );
  const preferred = entries.filter(([k]) => CSS_VAR_PREFERRED.test(k));
  const rest = entries.filter(([k]) => !CSS_VAR_PREFERRED.test(k));
  const out: Record<string, string> = {};
  let bytes = 2;
  let count = 0;
  for (const [k, v] of [...preferred, ...rest]) {
    if (count >= CSS_VAR_MAX_ENTRIES) break;
    const cost = k.length + v.length + 6;
    if (bytes + cost > CSS_VAR_MAX_BYTES) continue;
    out[k] = v;
    bytes += cost;
    count++;
  }
  return out;
}

/** Gate freshly-scanned regions against the STORED full-page PNG the
 *  crop route serves. Regions are page-absolute vs TODAY's DOM; the
 *  stored PNG is from capture time. */
function gateRegions(
  regions: ComponentRegion[],
  slug: string,
  liveHeight: number,
): { accepted: ComponentRegion[]; gate: RowReport["regionGate"]; drift?: number } {
  const stored = newestPngPath(slug, "desktop-full-");
  const dims = stored ? pngDims(stored) : null;
  if (!dims) return { accepted: [], gate: "skipped" };
  // 99% of stored fulls are exactly 1440; a handful land 1441-1444
  // (sub-pixel rounding at shoot time). A few px of slack costs nothing
  // against crop accuracy.
  if (Math.abs(dims.w - 1440) > 8)
    return { accepted: [], gate: "width-mismatch" };
  const drift = Math.abs(liveHeight - dims.h) / dims.h;
  const inBounds = (r: ComponentRegion) =>
    r.top >= 0 && r.top + r.height <= dims.h && r.width > 0 && r.height > 0;
  if (drift <= DRIFT_ACCEPT_ALL) {
    return { accepted: regions.filter(inBounds), gate: "all", drift };
  }
  if (drift <= DRIFT_ACCEPT_TOP) {
    return {
      accepted: regions.filter(
        (r) => inBounds(r) && (r.type === "nav" || (r.type === "hero" && r.top < 200)),
      ),
      gate: "top-only",
      drift,
    };
  }
  return { accepted: [], gate: "drift-gated", drift };
}

/**
 * Re-shoot mobile at retina. This needs its OWN context: Playwright
 * fixes deviceScaleFactor at context creation, so resizing the desktop
 * page to 375x812 yields a 1x capture at best - and combined with a raw
 * `Emulation` override, a full-size desktop frame mislabelled as mobile.
 * A dedicated DSF-2 mobile context is the only thing that produces the
 * 750px-wide shot we actually want.
 */
async function shootMobile(
  mobileCtx: BrowserContext,
  url: string,
  slug: string,
  which: "both" | "hero" | "none",
): Promise<boolean> {
  if (which === "none") return false;
  const page = await mobileCtx.newPage();
  try {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  if (response && response.status() >= 400) return false;
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
  await dismissBanners(page);
  await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));
  await stabilize(page);
  const hero = await page.screenshot({ fullPage: false, type: "png" });
  const shots: Shot[] = [
    {
      viewport: "mobile",
      fullPage: false,
      buffer: Buffer.from(hero),
      width: 750,
      height: 1624,
      contentHash: hashOf(new Uint8Array(hero)),
    },
  ];
  if (which === "both") {
    const scrollH = await page.evaluate(() =>
      Math.max(
        document.documentElement?.scrollHeight ?? 0,
        document.body?.scrollHeight ?? 0,
      ),
    );
    const maxCssH = Math.floor(MAX_PHYSICAL_PX / 2);
    const full =
      scrollH > maxCssH
        ? await page.screenshot({
            clip: { x: 0, y: 0, width: 375, height: maxCssH },
            type: "png",
          })
        : await page.screenshot({ fullPage: true, type: "png" });
    shots.push({
      viewport: "mobile",
      fullPage: true,
      buffer: Buffer.from(full),
      width: 750,
      height: 0,
      contentHash: hashOf(new Uint8Array(full)),
    });
  }
  for (const s of shots) await saveLocal(slug, s);
  return true;
  } finally {
    await page.close().catch(() => {});
  }
}

async function processOne(
  ctx: BrowserContext,
  row: SeedRow,
  opts: {
    mobile: "both" | "hero" | "none";
    components: boolean;
    mobileCtx: BrowserContext;
  },
): Promise<RowReport> {
  const page = await ctx.newPage();
  try {
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 400));
    let response;
    try {
      response = await page.goto(row.sourceUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
    } catch {
      return { slug: row.slug, status: "dead" };
    }
    if (response && response.status() >= 400)
      return { slug: row.slug, status: "dead" };
    const finalHost = new URL(page.url()).hostname;
    const srcHost = new URL(row.sourceUrl).hostname;
    if (!sameRegistrableDomain(finalHost, srcHost))
      return { slug: row.slug, status: "redirected" };

    await page
      .waitForLoadState("networkidle", { timeout: 5_000 })
      .catch(() => {});
    await applyViewport(page, "desktop");
    await dismissBanners(page);
    await stabilize(page);

    const title = await page.title().catch(() => "");
    const desc = await page
      .evaluate(
        () =>
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") ?? "",
      )
      .catch(() => "");
    const badReason = badPageReason(title, desc);
    if (badReason) return { slug: row.slug, status: "bot-blocked", error: badReason };

    // Same overflow clip the capture pipeline bakes into full shots, so
    // the live height measures the same document the stored PNG shows.
    await page.evaluate(() => {
      if (document.getElementById("__inspo_clip__")) return;
      const s = document.createElement("style");
      s.id = "__inspo_clip__";
      s.textContent =
        "html,body{overflow-x:hidden !important;max-width:100vw !important;}";
      document.head.appendChild(s);
    });
    const liveHeight = await page.evaluate(() =>
      Math.max(
        document.documentElement?.scrollHeight ?? 0,
        document.body?.scrollHeight ?? 0,
      ),
    );

    // Throwaway hero buffer: extract() wants it for Vibrant, but we do
    // not write palette; a viewport shot is cheap (~0.4s).
    const heroBuf = Buffer.from(
      await page.screenshot({ fullPage: false, type: "png" }),
    );
    const meta = await extract(page, {}, heroBuf);

    // ── Write back into the row (cherry-picked, non-empty only) ──
    if (meta.fonts.length > 0) row.fonts = meta.fonts;
    const ds = meta.designSystem;
    if (ds.typeRamp.length > 0) row.designSystem.typeRamp = ds.typeRamp;
    if (ds.spacingScale.length > 0)
      row.designSystem.spacingScale = ds.spacingScale;
    if (ds.radiusScale.length > 0)
      row.designSystem.radiusScale = ds.radiusScale;
    if (ds.containerWidth != null)
      row.designSystem.containerWidth = ds.containerWidth;
    const cappedVars = capCssVariables(ds.cssVariables);
    if (Object.keys(cappedVars).length > 0)
      row.designSystem.cssVariables = cappedVars;

    let gate: RowReport["regionGate"] = "skipped";
    let drift: number | undefined;
    let regions = 0;
    if (opts.components) {
      const gated = gateRegions(meta.components, row.slug, liveHeight);
      gate = gated.gate;
      drift = gated.drift;
      if (gated.accepted.length > 0) {
        row.components = gated.accepted;
        regions = gated.accepted.length;
      }
    }

    const mobile = await shootMobile(
      opts.mobileCtx,
      row.sourceUrl,
      row.slug,
      opts.mobile,
    ).catch(() => false);

    row.enrichedAt = new Date().toISOString().slice(0, 10);
    return {
      slug: row.slug,
      status: "ok",
      fonts: meta.fonts.length,
      regions,
      regionGate: gate,
      drift: drift != null ? Math.round(drift * 1000) / 1000 : undefined,
      mobile,
    };
  } catch (err) {
    return {
      slug: row.slug,
      status: "error",
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const force = argv.includes("--force");
  const canonicalOnly = argv.includes("--canonical-only");
  const noComponents = argv.includes("--no-components");
  const sample = Number(argv.find((a) => a.startsWith("--sample="))?.split("=")[1] ?? 0);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 5,
  );
  const mobile = (argv.find((a) => a.startsWith("--mobile="))?.split("=")[1] ??
    "both") as "both" | "hero" | "none";
  const slugsArg = argv.find((a) => a.startsWith("--slugs="))?.split("=")[1];
  const only = slugsArg ? new Set(slugsArg.split(",").map((s) => s.trim())) : null;

  const rows = JSON.parse(readFileSync(SEED, "utf8")) as SeedRow[];
  const startCount = rows.length;

  let targets = rows.filter((r) => force || !r.enrichedAt);
  if (canonicalOnly) targets = targets.filter((r) => r.slug === r.siteSlug);
  if (only) targets = targets.filter((r) => only.has(r.slug));
  if (sample > 0) targets = targets.slice(0, sample);

  console.log(
    `\n  revisit-enrich · ${targets.length} targets · go=${go} · mobile=${mobile} · components=${!noComponents} · concurrency=${concurrency}\n`,
  );
  if (targets.length === 0) return;

  if (go) {
    const snap = SEED.replace(
      /static-screens\.json$/,
      `static-screens.pre-revisit-${Date.now()}.json`,
    );
    copyFileSync(SEED, snap);
    console.log(`  snapshot: ${snap}\n`);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  // Retina mobile needs its own context: deviceScaleFactor is fixed at
  // context creation and cannot be changed on a live page.
  const mobileCtx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    locale: "en-US",
    timezoneId: "America/New_York",
    colorScheme: "light",
    ...mobileContextOptions(),
  });
  await blockConsentNetworks(ctx);
  await blockConsentNetworks(mobileCtx);

  const reports: RowReport[] = [];
  let done = 0;
  let dirty = 0;

  const save = () => {
    if (rows.length !== startCount)
      throw new Error(
        `row count changed (${startCount} -> ${rows.length}) - refusing to write`,
      );
    writeFileSync(SEED, JSON.stringify(rows));
  };

  const queue = [...targets];
  const worker = async () => {
    for (;;) {
      const row = queue.shift();
      if (!row) return;
      try {
        await preSeedConsentCookies(ctx, row.sourceUrl).catch(() => {});
      } catch {
        /* best-effort */
      }
      const report = await Promise.race([
        processOne(ctx, row, {
          mobile,
          components: !noComponents,
          mobileCtx,
        }),
        new Promise<RowReport>((r) =>
          setTimeout(
            () => r({ slug: row.slug, status: "error", error: "hard timeout" }),
            90_000,
          ),
        ),
      ]);
      reports.push(report);
      done++;
      if (report.status === "ok") dirty++;
      const pct = ((done / targets.length) * 100).toFixed(1);
      console.log(
        `  [${String(done).padStart(4)}/${targets.length} ${pct.padStart(5)}%] ${report.status.padEnd(11)} ${row.slug}${report.fonts != null ? ` fonts=${report.fonts}` : ""}${report.regions ? ` regions=${report.regions}` : ""}${report.regionGate && report.regionGate !== "all" ? ` gate=${report.regionGate}` : ""}${report.error ? ` (${report.error.slice(0, 60)})` : ""}`,
      );
      if (go && dirty > 0 && done % 100 === 0) {
        save();
        console.log(`  … checkpoint saved (${done}/${targets.length})`);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await browser.close().catch(() => {});

  if (go && dirty > 0) save();

  // ── Report ──
  mkdirSync(REPORTS_DIR, { recursive: true });
  const byStatus = new Map<string, number>();
  for (const r of reports)
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  const okReports = reports.filter((r) => r.status === "ok");
  const withFonts = okReports.filter((r) => (r.fonts ?? 0) > 0).length;
  const withRegions = okReports.filter((r) => (r.regions ?? 0) > 0).length;
  const reportPath = join(REPORTS_DIR, `revisit-${Date.now()}.json`);
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        go,
        mobile,
        components: !noComponents,
        targets: targets.length,
        byStatus: Object.fromEntries(byStatus),
        okWithFonts: withFonts,
        okWithRegions: withRegions,
        okSlugs: okReports.map((r) => r.slug),
        rows: reports,
      },
      null,
      2,
    ),
  );

  console.log(`\n  status: ${[...byStatus.entries()].map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  console.log(`  ok with fonts: ${withFonts}/${okReports.length} · ok with regions: ${withRegions}/${okReports.length}`);
  console.log(`  report: ${reportPath}`);
  if (!go) console.log(`\n  dry-run. re-run with --go to write the seed.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
