/**
 * Deterministic half of the standing benchmark: what does a fixed set
 * of tool calls actually cost, in text and in inline image bytes?
 *
 * The A/B corpus (briefs.json) needs a model and real money. This does
 * not: it boots the stdio server, makes the same calls every time, and
 * reports the spend. Run it on every release and diff against the
 * committed baseline - it catches "that change tripled every search
 * result" without anyone having to notice by eye.
 *
 *   node bench/response-cost.mjs                 measure, print a table
 *   node bench/response-cost.mjs --json          machine-readable
 *   node bench/response-cost.mjs --write         overwrite the baseline
 *   node bench/response-cost.mjs --check         exit 1 on a regression
 *
 * --check tolerates GROWTH_TOLERANCE; shrinking never fails. New calls
 * absent from the baseline are reported, not failed, so adding a case
 * doesn't break CI before someone runs --write.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const BASELINE = resolve(here, "baseline.json");

/** Fraction a call may grow before --check fails it. Inline images move
 *  in steps as the variant backfill lands, so this is deliberately
 *  loose; it exists to catch 2x, not 5%. */
const GROWTH_TOLERANCE = 0.2;

/** Pretty-printed JSON runs a little under 4 chars per token. Matches
 *  CHARS_PER_TOKEN in src/budget.ts - keep them in step. */
const CHARS_PER_TOKEN = 4;

/**
 * The calls that dominate real usage. Two profiles per case where the
 * profile changes the answer: `vision` is the stdio default (full +
 * thumbs), `text` is what the hosted endpoint serves (lite + none).
 */
const CASES = [
  { name: "recommend", args: { brief: "dark developer tool landing page" }, profiles: ["vision", "text"] },
  { name: "search_screens", args: { query: "dark editorial agency", limit: 6 }, profiles: ["vision", "text"] },
  { name: "search_screens/mobile", tool: "search_screens", args: { query: "dark editorial agency", limit: 6, device: "mobile" }, profiles: ["vision"] },
  { name: "search_screens/budgeted", tool: "search_screens", args: { query: "dark editorial agency", limit: 12, maxTokens: 3000 }, profiles: ["vision"] },
  { name: "find_examples_for_macrostructure", args: { name: "Bento Grid" }, profiles: ["vision", "text"] },
  { name: "get_screen", args: { slug: "novu-co" }, profiles: ["vision", "text"] },
  { name: "get_design_system", args: { slug: "linear-app" }, profiles: ["text"] },
  { name: "find_similar", args: { slug: "novu-co", limit: 8 }, profiles: ["vision"] },
  { name: "get_site_pages", args: { siteSlug: "linear-app" }, profiles: ["vision"] },
  { name: "find_components", args: { type: "pricing", limit: 8 }, profiles: ["vision"] },
  { name: "find_reference_components", args: { type: "hero" }, profiles: ["vision"] },
  { name: "search_screens/full", tool: "search_screens", args: { query: "dark editorial agency", limit: 8, detail: "full" }, profiles: ["vision"] },
];

const PROFILE_ENV = {
  vision: { INSPO_PROFILE: "full", INSPO_IMAGES: "thumbs" },
  text: { INSPO_PROFILE: "lite", INSPO_IMAGES: "none" },
};

async function connect(profileEnv) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === "DATABASE_URL") continue;
    if (typeof v === "string") env[k] = v;
  }
  // A stray INSPO_MAX_TOKENS in the shell would silently shrink every
  // number and make the baseline meaningless.
  delete env.INSPO_MAX_TOKENS;
  Object.assign(env, profileEnv);
  const transport = new StdioClientTransport({
    command: resolve(root, "node_modules/.bin/tsx"),
    args: [resolve(root, "src/server.ts")],
    env,
  });
  const client = new Client({ name: "bench", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

function measure(content) {
  let textChars = 0;
  let images = 0;
  let imageBytes = 0;
  for (const b of content) {
    if (b.type === "text") textChars += b.text.length;
    else if (b.type === "image") {
      images += 1;
      imageBytes += Math.ceil((b.data.length * 3) / 4);
    }
  }
  return { textChars, textTokens: Math.round(textChars / CHARS_PER_TOKEN), images, imageKb: Math.round(imageBytes / 1024) };
}

async function run() {
  const out = { schemas: {}, calls: {} };
  for (const [profile, env] of Object.entries(PROFILE_ENV)) {
    const client = await connect(env);
    const listed = await client.listTools();
    out.schemas[profile] = {
      tools: listed.tools.length,
      chars: JSON.stringify(listed.tools).length,
      tokens: Math.round(JSON.stringify(listed.tools).length / CHARS_PER_TOKEN),
    };
    for (const c of CASES) {
      if (!c.profiles.includes(profile)) continue;
      const res = await client.callTool({ name: c.tool ?? c.name, arguments: c.args });
      out.calls[`${c.name} [${profile}]`] = measure(res.content);
    }
    await client.close();
  }
  return out;
}

const argv = process.argv.slice(2);
const result = await run();

if (argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("\n  tool schemas (paid once per session, cached after)");
  for (const [p, s] of Object.entries(result.schemas)) {
    console.log(`    ${p.padEnd(8)} ${String(s.tools).padStart(2)} tools · ${String(s.chars).padStart(6)} chars · ~${s.tokens} tokens`);
  }
  console.log("\n  tool results (paid once, then re-read every subsequent turn)");
  console.log(`    ${"call".padEnd(44)}${"text".padStart(8)}${"~tok".padStart(8)}${"imgs".padStart(6)}${"imgKB".padStart(8)}`);
  for (const [name, m] of Object.entries(result.calls)) {
    console.log(
      `    ${name.padEnd(44)}${String(m.textChars).padStart(8)}${String(m.textTokens).padStart(8)}${String(m.images).padStart(6)}${String(m.imageKb).padStart(8)}`,
    );
  }
  console.log();
}

if (argv.includes("--write")) {
  writeFileSync(BASELINE, JSON.stringify(result, null, 2) + "\n");
  console.log(`  baseline written → ${BASELINE}\n`);
}

if (argv.includes("--check")) {
  if (!existsSync(BASELINE)) {
    console.error("  no baseline.json - run with --write first");
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(BASELINE, "utf8"));
  const problems = [];
  const added = [];
  for (const [name, now] of Object.entries(result.calls)) {
    const was = base.calls?.[name];
    if (!was) {
      added.push(name);
      continue;
    }
    for (const metric of ["textChars", "imageKb"]) {
      const before = was[metric] ?? 0;
      const after = now[metric] ?? 0;
      if (before === 0) continue;
      const growth = (after - before) / before;
      if (growth > GROWTH_TOLERANCE) {
        problems.push(`${name} ${metric}: ${before} → ${after} (+${Math.round(growth * 100)}%)`);
      }
    }
  }
  for (const [p, s] of Object.entries(result.schemas)) {
    const was = base.schemas?.[p];
    if (!was) continue;
    const growth = (s.chars - was.chars) / was.chars;
    if (growth > GROWTH_TOLERANCE) {
      problems.push(`schema [${p}]: ${was.chars} → ${s.chars} chars (+${Math.round(growth * 100)}%)`);
    }
  }
  for (const a of added) console.log(`  new case (not in baseline, not checked): ${a}`);
  if (problems.length > 0) {
    console.error(`\n  ${problems.length} response(s) grew past ${GROWTH_TOLERANCE * 100}%:`);
    for (const p of problems) console.error(`    ✗ ${p}`);
    console.error("\n  If the growth is intended, re-run with --write.\n");
    process.exit(1);
  }
  console.log("  ✓ no response grew past tolerance\n");
}
