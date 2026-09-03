/**
 * Did the right bundle actually reach npm?
 *
 * 0.1.10 was published from a dist built before the installer existed.
 * The version string was already bumped, so nothing looked wrong until
 * `npx inspo-mcp install` printed nothing in production. This packs the
 * registry's current tarball and compares its bundle hash to dist/.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const local = readFileSync(join(DIST, "inspo-mcp.mjs"), "utf8");
const version = JSON.parse(readFileSync(join(DIST, "package.json"), "utf8")).version;
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);

const work = mkdtempSync(join(tmpdir(), "inspo-verify-"));
try {
  execFileSync("npm", ["pack", `inspo-mcp@${version}`], { cwd: work, stdio: "ignore" });
} catch {
  console.log(`\n  inspo-mcp@${version} is not on npm yet.`);
  console.log("  publish it first:  cd apps/mcp/dist && npm publish\n");
  process.exit(1);
}
const tgz = readdirSync(work).find((f) => f.endsWith(".tgz"));
execFileSync("tar", ["xzf", tgz], { cwd: work });
const published = readFileSync(join(work, "package", "inspo-mcp.mjs"), "utf8");

const ok = hash(local) === hash(published);
console.log(`\n  local  v${version}  sha256:${hash(local)}`);
console.log(`  npm    v${version}  sha256:${hash(published)}`);
console.log(ok ? "\n  match - the published build is this one.\n" : "\n  MISMATCH - npm is serving a different build. Bump and republish.\n");
process.exit(ok ? 0 : 1);
