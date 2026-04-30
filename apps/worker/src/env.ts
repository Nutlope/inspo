/**
 * Walk up from cwd looking for a .env file and load it. Replaces
 * `import "dotenv/config"` which only reads ./. — wrong when the
 * worker is invoked from `apps/worker` but the env lives at the
 * monorepo root.
 */

import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

function findUpward(start: string, name: string, levels = 5): string | null {
  let dir = start;
  for (let i = 0; i < levels; i++) {
    const p = resolve(dir, name);
    if (existsSync(p)) return p;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const found = findUpward(process.cwd(), ".env");
if (found) {
  config({ path: found });
}
