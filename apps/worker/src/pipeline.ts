/**
 * One-command intake pipeline: N new URLs from queue.txt all the way to
 * a published catalogue + committed seed. Every stage is an existing
 * idempotent CLI; this runner just sequences them, scoped by slug list,
 * and journals progress so a crashed run resumes.
 *
 *   tsx src/pipeline.ts --dry-run --n=25       print the plan
 *   tsx src/pipeline.ts --go --n=25
 *   tsx src/pipeline.ts --go --resume=<runId>  re-run from the first
 *                                              incomplete stage
 *   [--from-stage=encode] [--no-commit]
 *
 * Stages: intake -> capture -> revisit-none (skipped: fresh captures are
 * already enriched) -> encode -> upload -> merge -> mobile-fields ->
 * northstars -> autopsies -> quality -> row-embeddings -> umap ->
 * publish -> commit.
 *
 * Env: BLOB_READ_WRITE_TOKEN (upload/publish), TOGETHER_API_KEY
 * (capture tagging + vision passes + embeddings). No DATABASE_URL:
 * the pipeline is Neon-free by design.
 */

import "./env.js";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const WORKER_ROOT = process.cwd();
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(WORKER_ROOT, "captures"),
);
const PIPELINE_DIR = join(CAPTURES_DIR, "_pipeline");
const QUEUE = join(WORKER_ROOT, "queue.txt");
const SEED = resolve(WORKER_ROOT, "..", "..", "packages", "db", "src", "static-screens.json");

type Manifest = {
  runId: string;
  startedAt: string;
  n: number;
  urls: string[];
  slugs: string[];
  stages: Record<string, { status: "done" | "failed"; at: string }>;
};

function slugFromUrl(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return host.replace(/\./g, "-").toLowerCase();
}

function run(cmd: string, args: string[], label: string) {
  console.log(`\n  ── ${label}\n     tsx ${args.join(" ")}\n`);
  execFileSync(cmd, args, { stdio: "inherit", cwd: WORKER_ROOT });
}

function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const dryRun = argv.includes("--dry-run") || !go;
  const noCommit = argv.includes("--no-commit");
  const n = Number(argv.find((a) => a.startsWith("--n="))?.split("=")[1] ?? 25);
  const resumeId = argv.find((a) => a.startsWith("--resume="))?.split("=")[1];
  const fromStage = argv.find((a) => a.startsWith("--from-stage="))?.split("=")[1];

  mkdirSync(PIPELINE_DIR, { recursive: true });

  let manifest: Manifest;
  if (resumeId) {
    manifest = JSON.parse(
      readFileSync(join(PIPELINE_DIR, `run-${resumeId}.json`), "utf8"),
    ) as Manifest;
    console.log(`\n  resuming run ${manifest.runId} (${manifest.slugs.length} slugs)`);
  } else {
    // ── intake ──
    if (!existsSync(QUEUE)) {
      console.log(`\n  no ${QUEUE} - create it with one URL per line.\n`);
      process.exit(1);
    }
    const queued = readFileSync(QUEUE, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    const seedHosts = new Set(
      (JSON.parse(readFileSync(SEED, "utf8")) as { sourceUrl: string }[]).map(
        (r) => {
          try {
            return new URL(r.sourceUrl).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        },
      ),
    );
    const fresh = queued.filter((u) => {
      try {
        return !seedHosts.has(new URL(u).hostname.replace(/^www\./, ""));
      } catch {
        return false;
      }
    });
    const batch = fresh.slice(0, n);
    const runId = String(Date.now());
    manifest = {
      runId,
      startedAt: new Date().toISOString(),
      n,
      urls: batch,
      slugs: batch.map(slugFromUrl),
      stages: {},
    };
    console.log(
      `\n  pipeline run ${runId} · queued=${queued.length} fresh=${fresh.length} batch=${batch.length}`,
    );
    if (batch.length === 0) {
      console.log("  nothing new in the queue.\n");
      return;
    }
    if (go) {
      // Consume the batch from the queue (leave the rest + comments).
      const remaining = readFileSync(QUEUE, "utf8")
        .split("\n")
        .filter((l) => !batch.includes(l.trim()));
      writeFileSync(QUEUE, remaining.join("\n"));
    }
  }

  const runDir = join(PIPELINE_DIR, `run-${manifest.runId}`);
  mkdirSync(runDir, { recursive: true });
  const urlsFile = join(runDir, "urls.txt");
  const slugsFile = join(runDir, "slugs.txt");
  writeFileSync(urlsFile, manifest.urls.join("\n") + "\n");
  writeFileSync(slugsFile, manifest.slugs.join("\n") + "\n");
  const manifestPath = join(PIPELINE_DIR, `run-${manifest.runId}.json`);
  const saveManifest = () =>
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  saveManifest();

  const tsx = join(WORKER_ROOT, "node_modules", ".bin", "tsx");
  const stages: Array<{ name: string; args: string[]; when?: () => boolean }> = [
    { name: "capture", args: ["src/add-sites-disk.ts", urlsFile, "--concurrency=2"] },
    { name: "encode", args: ["src/encode-existing.ts", "--go", `--from-file=${slugsFile}`, "--concurrency=8"] },
    { name: "upload", args: ["src/upload-to-blob.ts", "--go", `--from-file=${slugsFile}`, "--concurrency=8"] },
    { name: "merge", args: ["src/merge-disk-captures-to-seed.ts", "--apply"] },
    { name: "mobile-fields", args: ["src/add-mobile-to-seed.ts", "--write", `--from-file=${slugsFile}`] },
    { name: "desktop-variants", args: ["src/add-desktop-variants-to-seed.ts", "--write", `--from-file=${slugsFile}`] },
    { name: "northstars", args: ["src/generate-northstars.ts", "--go", "--concurrency=6"] },
    { name: "autopsies", args: ["src/generate-autopsies.ts", "--go", "--concurrency=6"] },
    { name: "quality", args: ["src/generate-quality.ts", "--go", "--concurrency=8"] },
    { name: "row-embeddings", args: ["src/build-row-embeddings.ts", "--go", "--missing-only"] },
    { name: "umap", args: ["src/build-umap-layout.ts", "--apply"] },
    { name: "publish", args: ["src/publish-catalogue-to-blob.ts", "--go"] },
  ];

  const startIdx = fromStage
    ? stages.findIndex((s) => s.name === fromStage)
    : 0;
  if (startIdx < 0) throw new Error(`unknown stage ${fromStage}`);

  if (dryRun) {
    console.log(`\n  plan (${manifest.slugs.length} slugs):`);
    for (const s of stages.slice(startIdx))
      console.log(`    ${manifest.stages[s.name]?.status === "done" ? "✓" : "·"} ${s.name.padEnd(18)} tsx ${s.args.join(" ")}`);
    if (!noCommit) console.log(`    · commit             git add seed+sidecars+queue && git commit && git push`);
    console.log(`\n  dry-run. re-run with --go to execute.\n`);
    return;
  }

  for (const stage of stages.slice(startIdx)) {
    if (manifest.stages[stage.name]?.status === "done") {
      console.log(`  ── ${stage.name}: already done, skipping`);
      continue;
    }
    try {
      run(tsx, stage.args, stage.name);
      manifest.stages[stage.name] = { status: "done", at: new Date().toISOString() };
    } catch (err) {
      manifest.stages[stage.name] = { status: "failed", at: new Date().toISOString() };
      saveManifest();
      console.error(
        `\n  stage ${stage.name} FAILED - resume with: tsx src/pipeline.ts --go --resume=${manifest.runId}\n`,
      );
      throw err;
    }
    saveManifest();
  }

  if (!noCommit) {
    console.log("\n  ── commit\n");
    const git = (args: string[]) =>
      execFileSync("git", args, { stdio: "inherit", cwd: resolve(WORKER_ROOT, "..", "..") });
    git(["add",
      "packages/db/src/static-screens.json",
      "packages/db/src/embeddings.idx.json",
      "packages/db/src/embeddings.bin",
      "packages/db/src/embeddings-rows.idx.json",
      "packages/db/src/embeddings-rows.bin",
      "packages/db/src/umap-2d.json",
      "apps/worker/queue.txt",
    ]);
    git(["commit", "-m", `chore(catalogue): weekly intake - ${manifest.slugs.length} new sites\n\nAutomated pipeline run ${manifest.runId}.`]);
    git(["push", "origin", "main"]);
  }

  console.log(`\n  pipeline run ${manifest.runId} complete: ${manifest.slugs.length} sites.\n`);
  const reports = readdirSync(runDir);
  void reports;
}

main();
