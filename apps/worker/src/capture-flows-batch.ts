/**
 * Batch flow capture. Runs the funnel-walker over a list of sites with
 * limited concurrency and prints an honest coverage report (which
 * reached a form, which hit oauth/captcha/verify walls).
 *
 * The list below is biased toward products whose entry flow a headless
 * walker can actually traverse (email-first signup / onboarding) — the
 * kinds of journeys gallery surfaces — but it includes a few OAuth-only
 * ones too so the report shows the honest spread.
 *
 *   pnpm tsx src/capture-flows-batch.ts                 default list
 *   pnpm tsx src/capture-flows-batch.ts --from-file=urls.txt --concurrency=2
 */

import "./env.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { captureFlow, type FlowResult } from "./capture-flow.js";

const FLOWS_DIR = resolve(process.env.INSPO_FLOWS_DIR ?? "./captures/_flows");

// gallery-inspired, broad-journey set. Mix of analytics, productivity,
// forms, scheduling, design, newsletters — not all "sign up", since the
// walker naturally flows signup → onboarding (workspace/profile setup).
const DEFAULT_SITES: { url: string; slug: string }[] = [
  { url: "https://posthog.com", slug: "posthog-com" },
  { url: "https://todoist.com", slug: "todoist-com" },
  { url: "https://typeform.com", slug: "typeform-com" },
  { url: "https://calendly.com", slug: "calendly-com" },
  { url: "https://tally.so", slug: "tally-so" },
  { url: "https://pitch.com", slug: "pitch-com" },
  { url: "https://height.app", slug: "height-app" },
  { url: "https://www.beehiiv.com", slug: "beehiiv-com" },
  { url: "https://mailchimp.com", slug: "mailchimp-com" },
  { url: "https://www.canva.com", slug: "canva-com" },
  { url: "https://www.loom.com", slug: "loom-com" },
  { url: "https://www.notion.com", slug: "notion-com" },
  { url: "https://linear.app", slug: "linear-app" },
  { url: "https://vercel.com", slug: "vercel-com" },
];

function slugifyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const fromFile = argv.find((a) => a.startsWith("--from-file="))?.split("=")[1];
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );

  let sites = DEFAULT_SITES;
  if (fromFile) {
    sites = readFileSync(fromFile, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((url) => ({ url, slug: slugifyHost(url) }));
  }

  mkdirSync(FLOWS_DIR, { recursive: true });
  console.log(`\n  batch flow capture · ${sites.length} sites · concurrency=${concurrency}\n`);

  const results: FlowResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < sites.length) {
      const { url, slug } = sites[cursor++]!;
      const t0 = Date.now();
      try {
        const r = await captureFlow({ url, slug });
        results.push(r);
        const secs = ((Date.now() - t0) / 1000).toFixed(0);
        console.log(
          `  ✓ ${slug.padEnd(16)} ${String(r.steps.length).padStart(2)} steps · form:${r.reachedSignupForm ? "yes" : "no "} · ${r.stoppedReason.padEnd(20)} · ${secs}s`,
        );
      } catch (err) {
        console.log(`  ✗ ${slug.padEnd(16)} ${err instanceof Error ? err.message.slice(0, 50) : err}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // Coverage report.
  const reached = results.filter((r) => r.reachedSignupForm).length;
  const byReason = new Map<string, number>();
  for (const r of results) byReason.set(r.stoppedReason, (byReason.get(r.stoppedReason) ?? 0) + 1);
  console.log(`\n  ── coverage ──`);
  console.log(`  reached a form: ${reached}/${results.length}`);
  for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${reason.padEnd(22)} ${n}`);
  }

  // Manifest of all captured flows for the web view to read.
  const manifest = results.map((r) => ({
    slug: r.slug,
    startUrl: r.startUrl,
    steps: r.steps.length,
    reachedSignupForm: r.reachedSignupForm,
    stoppedReason: r.stoppedReason,
    video: r.video,
    capturedAt: r.capturedAt,
  }));
  writeFileSync(join(FLOWS_DIR, "_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n  manifest → ${join(FLOWS_DIR, "_manifest.json")}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
