/**
 * Unit checks for the thumbnail fetcher. No network: `fetch` is stubbed per
 * case so the behaviour under a soft 404 is deterministic (#7). Run with
 * `pnpm --filter @inspo/mcp test:unit` (tsx, so it also runs on Node 20).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { thumbnailBlock } from "./inline-images";

// 1x1 transparent PNG, the smallest real image we can hand the decoder.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

function stubFetch(routes: Record<string, () => Response>) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push(url);
    const route = Object.entries(routes).find(([suffix]) => url.endsWith(suffix));
    return route ? route[1]() : new Response("missing", { status: 404 });
  }) as typeof fetch;
  return calls;
}

test("a 200 text/html for the webp variant falls through to the png", async () => {
  const calls = stubFetch({
    "thumb.384.webp": () =>
      new Response("<html>soft 404</html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
    "thumb.png": () => new Response(PNG, { status: 200, headers: { "content-type": "image/png" } }),
  });
  const block = await thumbnailBlock("https://blob.example/a/thumb.png");
  assert.equal(block?.mimeType, "image/png");
  assert.deepEqual(calls, ["https://blob.example/a/thumb.384.webp", "https://blob.example/a/thumb.png"]);
});

test("the html answer is not cached: a later call still tries the webp", async () => {
  // Same URL as above would be served from the LRU if the html block had
  // been stored; a fresh slug keeps the cases independent instead.
  let webpHits = 0;
  stubFetch({
    "thumb.384.webp": () => {
      webpHits++;
      return new Response("<html>nope</html>", { status: 200, headers: { "content-type": "text/html" } });
    },
    "thumb.png": () => new Response(PNG, { status: 200, headers: { "content-type": "image/png" } }),
  });
  await thumbnailBlock("https://blob.example/b/thumb.png");
  await thumbnailBlock("https://blob.example/b/thumb.384.webp");
  assert.equal(webpHits, 2);
});

test("a real webp still wins and avif is still skipped", async () => {
  stubFetch({
    "thumb.384.webp": () => new Response(PNG, { status: 200, headers: { "content-type": "image/webp" } }),
  });
  assert.equal((await thumbnailBlock("https://blob.example/c/thumb.png"))?.mimeType, "image/webp");
  stubFetch({
    "thumb.avif": () => new Response(PNG, { status: 200, headers: { "content-type": "image/avif" } }),
  });
  assert.equal(await thumbnailBlock("https://blob.example/d/thumb.avif"), null);
});

test("a missing or octet-stream content-type falls back to the url extension", async () => {
  stubFetch({ "thumb.384.webp": () => new Response(PNG, { status: 200 }) });
  assert.equal((await thumbnailBlock("https://blob.example/e/thumb.384.webp"))?.mimeType, "image/webp");
  stubFetch({
    "thumb.png": () => new Response(PNG, { status: 200, headers: { "content-type": "application/octet-stream" } }),
  });
  assert.equal((await thumbnailBlock("https://blob.example/f/thumb.png"))?.mimeType, "image/png");
});
