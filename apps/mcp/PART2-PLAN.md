# Inspo MCP: Part 2 + remaining-security plan

Status snapshot. "Biggest Wins" and "Part 1 (OSS models)" from the research
report are DONE (shipped in v0.1.1). Several Part 2 items were folded into
that work. What remains is below: gallery-parity polish and the second tier
of security hardening. The service stays free and unauthenticated throughout.

## Already shipped (v0.1.1)
- Concise text mode (lean list shape under `images=none`, `detail` override).
- `find_components` tags-fallback (no longer returns empty; honest "no crop" note).
- `get_site_pages` (web page sequences) and `get_filters` (facet discovery), both lite.
- `search_screens` limit 8 -> 6; mobile-pair + lexical-ranking tips.
- DESIGN.md save/re-fetch permalink; untrusted-content banner on live `study`.
- Hosted Worker defaults to `lite + images=none` (OSS-first; query/env override).
- README count + model names corrected; agent-facing host unified to inspo.design.
- Security: `study(url)` SSRF guard (public named http(s) hosts only, manual
  redirects + hop cap, byte-capped streaming, generic errors), per-caller
  rate-limit binding, 256KB body cap, top-level error hygiene,
  `global_fetch_strictly_public` flag.

## Part 2: remaining (gallery parity and beyond)

### Next (P1)
1. Pagination on the list tools. Add an optional `offset` to `search_screens`,
   `find_similar`, `find_by_color`, `find_examples_for_macrostructure`; thread
   into the query LIMIT/OFFSET; echo a "more available" hint when truncated.
   Why: the "find the exact pattern" wedge ceilings at limit=40, so result #15
   is currently unreachable. Effort: S.
2. Run the real per-element crop backfill for `find_components`. The extractor
   exists (`apps/worker/src/extract-components.ts`) but has not been run, so
   0/2,550 rows have crop regions (hence the fallback). Steps: validate on the
   top ~100 sites by page count, confirm the crop route reads the same
   `components` jsonb shape the scan writes, backfill (~870 sites x ~10s,
   roughly 2.5h single-threaded or less with `--concurrency`), republish the
   catalogue. Turns the fallback into actual element crops. Effort: M.

### Later (P2)
3. Shared empty-result recovery helper. `emptyResult(filters, alternatives)`
   wired into the zero-count branches of `find_by_color`, `find_components`,
   and `recommend` (note: `search_screens` and `find_examples_for_macrostructure`
   already self-correct). Lists 3-5 valid taxonomy values. Effort: S.
4. Surface the DESIGN.md re-fetch hint from `get_design_system` output too
   (the permalink already renders inside the doc). Effort: XS.

## Security: remaining (current state is already abuse-resistant)

### Next (P1)
1. Durable Object global token-bucket for `study()` egress. The rate-limit
   binding is per-colo, so a distributed attack multiplies egress across colos.
   A DO holding a global per-minute/day counter (reset via `alarm()`) is the
   real ceiling. Free plan includes DO + SQLite. Effort: M.
2. WAF rate-limiting rule on `/mcp` (Cloudflare dashboard, free tier allows one
   IP rule). Fires before the Worker is invoked, shielding it during a flood.
   Effort: XS (dashboard config, not code).
3. Study-specific limiter. A tighter `STUDY_LIMITER` (e.g. 20/min per caller)
   applied only when the JSON-RPC body is a `study` call (parse
   `request.clone()` for `"name":"study"`). Effort: S.

### Later (P2)
4. Env knobs `STUDY_MAX_BYTES` / `STUDY_RATE_LIMIT` to tune without a redeploy.
5. Content-type guard in `study()`: only parse `text/html` and `text/css`;
   skip binary bodies. Effort: XS.

## Deploy steps to make the shipped work live
1. npm: `cd apps/mcp/dist && npm publish` (v0.1.1; the token is already set).
   Ships tool + security code; the catalogue is fetched from the CDN at runtime.
2. Worker: register a workers.dev subdomain (still pending), then
   `pnpm --filter @inspo/mcp worker:deploy`. The `[[ratelimits]]` binding and
   `global_fetch_strictly_public` flag take effect on deploy. Needs wrangler
   4.36+ for the rate-limit binding.
3. Add the free WAF rate rule on `/mcp` in the Cloudflare dashboard.

## Red-team residuals (deferred; low / latent after the fixes shipped)
A multi-agent red-team reviewed the security work; the HIGH/MEDIUM findings
(name-only SSRF guard, Content-Length-trusting body cap, UA-evadable +
fail-open rate limiter) are FIXED. Remaining low/latent items:
- DNS rebinding TOCTOU in `study()`: the guard now resolves and rejects
  private IPs (closes nip.io / sslip.io / static-private / lookup-time
  private), but a sophisticated low-TTL rebind between our lookup and
  fetch's own resolve still exists on the Node/web path. Full close: pin
  the vetted IP via an undici dispatcher with a custom `lookup` (Node
  only). Token-only exfil + per-hop timeout keep residual risk low.
- `apps/web/.../api/mcp-demo/study` route: add per-IP rate/concurrency
  limiting + a total cross-hop deadline (today it is per-hop 10s x up to
  6 hops, so worst case ~70s of held sockets).
- Worker env parsing uses an inline parser that ignores the on/off/text
  image aliases; switch to the canonical `parseProfile`/`parseImages`
  (informational; documented values work).
- `find_by_color` / `find_components` fallback dedupe requires a
  `slug===siteSlug` canonical row (0/870 sites affected today); switch to
  "representative per siteSlug" or assert the invariant.
