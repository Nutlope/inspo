#!/usr/bin/env node
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
register("tsx/esm", pathToFileURL(__dirname + "/").href);

await import(pathToFileURL(resolve(__dirname, "../src/index.ts")).href);
