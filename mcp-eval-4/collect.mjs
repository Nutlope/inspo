/**
 * Assemble the eval-4 results table from each cell's NOTES.md.
 *
 *   node mcp-eval-4/collect.mjs
 *
 * Wall time comes from the epoch stamps each agent wrote; token counts
 * are pasted in from the task notifications (the task tooling reports
 * them per agent, but only to the parent, not to the agent itself).
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const ARMS = ["nothing", "inspo-only", "hallmark-only", "both"];
const BRIEFS = [
  "m1-meditation",
  "m2-devtool",
  "m3-fintech",
  "m4-ceramics",
  "m5-producttour",
  // Round 2 (2026-08-28): nothing + inspo-only arms only.
  "m6-hardware",
  "m7-logistics",
  "m8-editorial",
  "m9-course",
  "m10-oss",
];

/** Tokens/tool-calls/duration, keyed "<arm>/<brief>", filled from the
 *  parent's task notifications. */
const USAGE = JSON.parse(
  existsSync(join(ROOT, "usage.json"))
    ? readFileSync(join(ROOT, "usage.json"), "utf8")
    : "{}",
);

function section(md, name) {
  const re = new RegExp(`##\\s+${name}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  return md.match(re)?.[1]?.trim() ?? "";
}

const rows = [];
for (const arm of ARMS) {
  for (const brief of BRIEFS) {
    const dir = join(ROOT, arm, brief);
    if (!existsSync(dir)) continue; // round-2 brief, arm not in the round
    const notesPath = join(dir, "NOTES.md");
    const htmlPath = join(dir, "index.html");
    const key = `${arm}/${brief}`;
    if (!existsSync(notesPath)) {
      rows.push({ key, status: "MISSING NOTES.md" });
      continue;
    }
    const md = readFileSync(notesPath, "utf8");
    const timing = section(md, "Timing");
    const start = Number(timing.match(/start:\s*(\d+)/)?.[1] ?? 0);
    const end = Number(timing.match(/end:\s*(\d+)/)?.[1] ?? 0);
    const calls = section(md, "Tool calls");
    rows.push({
      key,
      status: existsSync(htmlPath) ? "ok" : "NO index.html",
      selfSecs: start && end ? end - start : null,
      toolsTotal: Number(calls.match(/total:\s*(\d+)/)?.[1] ?? 0) || null,
      inspoCalls: (() => {
        const m = calls.match(/inspo:\s*(\d+)/i);
        return m ? Number(m[1]) : null;
      })(),
      htmlKb: existsSync(htmlPath)
        ? Math.round(statSync(htmlPath).size / 1024)
        : null,
      friction: section(md, "Friction"),
      drove: section(md, "What drove the design"),
      usage: USAGE[key] ?? null,
    });
  }
}

const pad = (s, n) => String(s ?? "-").padEnd(n);
console.log(
  pad("cell", 30) +
    pad("status", 14) +
    pad("tokens", 10) +
    pad("calls", 7) +
    pad("inspo", 7) +
    pad("wall", 9) +
    "html",
);
console.log("-".repeat(90));
for (const r of rows) {
  const u = r.usage;
  console.log(
    pad(r.key, 30) +
      pad(r.status, 14) +
      pad(u?.tokens?.toLocaleString(), 10) +
      pad(u?.toolUses ?? r.toolsTotal, 7) +
      pad(r.inspoCalls, 7) +
      pad(u ? `${Math.round(u.durationMs / 1000)}s` : r.selfSecs ? `${r.selfSecs}s` : null, 9) +
      (r.htmlKb ? `${r.htmlKb}KB` : "-"),
  );
}

// Contamination sweep: the browser pane is shared across parallel
// agents, so any cell reporting cross-tab bleed had no visual
// verification and its page may carry defects nobody caught.
console.log("\n\nFRICTION (cells reporting browser/tab contamination flagged *):");
for (const r of rows) {
  if (!r.friction) continue;
  const bleed = /browser|tab|screenshot|render|pane/i.test(r.friction);
  console.log(`\n${bleed ? "*" : " "} ${r.key}`);
  for (const line of r.friction.split("\n")) console.log(`    ${line}`);
}
