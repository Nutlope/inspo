/**
 * CLI entrypoint: pnpm capture <url> [--slug=<slug>] [--no-enrich] [--no-persist]
 */

import "dotenv/config";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (cmd !== "capture") {
    console.error("Usage: pnpm capture <url> [--slug=<slug>] [--no-enrich] [--no-persist]");
    process.exit(1);
  }

  const args = argv.slice(1);
  const url = args.find((a) => !a.startsWith("--"));
  if (!url) {
    console.error("missing <url>");
    process.exit(1);
  }
  const slugFlag = args.find((a) => a.startsWith("--slug="));
  const slug = slugFlag?.split("=")[1];
  const enrich = !args.includes("--no-enrich");
  const persist = !args.includes("--no-persist");

  const result = await capture({ url, slug, enrich });

  console.log("\n— Result");
  console.log(JSON.stringify({
    slug: result.slug,
    capturedAt: result.capturedAt,
    assets: result.assets.map((a) => ({ ...a, filePath: a.filePath.replace(process.cwd(), ".") })),
    meta: result.meta,
    tags: result.tags,
    hasEmbeddings: Boolean(result.embeddings),
  }, null, 2));

  if (persist) {
    const persisted = await persistCapture(result);
    if (persisted) console.log(`\n✓ persisted as screen ${persisted.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
