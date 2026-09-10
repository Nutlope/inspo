# Seeding the catalogue

How a site gets into the archive: capture it to disk, look at the captures, then run the enrichment and publish steps. Everything runs from `apps/worker` and needs no database; Together AI does the tagging, autopsies and embeddings.

Candidate sites are proposed in [`apps/worker/src/seed-urls.ts`](apps/worker/src/seed-urls.ts). The bar: does the site make the archive better for someone building a website?

## Prerequisites

```bash
pnpm install
pnpm --filter @inspo/worker run playwright:install   # Chromium
```

Create `.env` at the repo root (`.env.example` lists every variable):

```env
TOGETHER_API_KEY=        # tags, descriptions, northstars, autopsies, quality scores, embeddings
BLOB_READ_WRITE_TOKEN=   # uploads screenshots and publishes the catalogue
```

Without `TOGETHER_API_KEY` the worker still captures pages, palettes, fonts and tech, but tags, descriptions and embeddings stay empty.

## 1. Capture landing pages

Put one URL per line in a file, then:

```bash
cd apps/worker
pnpm exec tsx src/add-sites-disk.ts urls.txt --concurrency=2
```

Each site lands in `captures/<slug>/`: desktop hero and full page, a phone view, the extracted palette, fonts, type ramp and CSS variables, and a `meta.json` sidecar with the tags. Cookie notices, popups and chat bubbles are cleared before every shot. The run is idempotent: a slug that already has a `meta.json` is skipped, so a stopped run resumes where it left off.

## 2. Capture more pages per site (optional)

```bash
pnpm exec tsx src/capture-pages-disk.ts sites.txt --max=3 --concurrency=3
```

Discovers public pages (pricing, about, docs, blog, changelog and so on) and captures each into `captures/<site>--<path>/`. Sign-in, account, checkout and legal pages are never picked, and pages that answer with an error, a not-found page or a bot check are dropped.

## 3. Look before you merge

```bash
pnpm exec tsx src/qa-sheet.ts slugs.txt
```

Writes contact sheets to `captures/_reports/qa/`: desktop and phone heroes, and whole pages as columns. Leave out any page that shows a cookie notice, a modal, a login wall, a blank band, or a copy of the landing page. `qa-captures.ts` runs a vision pass over the same captures as a first filter; the sheets are the real check.

## 4. Merge and enrich

With `slugs.txt` listing every capture dir that goes in (each site's landing page first), run these stages in order. Each one is idempotent, so a failed stage can be re-run on its own.

```bash
pnpm exec tsx src/encode-existing.ts --go --from-file=slugs.txt                 # AVIF/WebP variants
pnpm exec tsx src/upload-to-blob.ts --go --from-file=slugs.txt                  # PNGs + variants to Blob
pnpm exec tsx src/merge-disk-captures-to-seed.ts --from-file=slugs.txt --apply  # rows into the seed
pnpm exec tsx src/add-mobile-to-seed.ts --write --from-file=slugs.txt           # phone views
pnpm exec tsx src/add-desktop-variants-to-seed.ts --write --from-file=slugs.txt # full-page variants
pnpm exec tsx src/backfill-axes.ts                                              # measured axes + light/dark mode
pnpm exec tsx src/generate-northstars.ts --go                                   # one-line design summary
pnpm exec tsx src/generate-autopsies.ts --go                                    # fold-by-fold autopsy
pnpm exec tsx src/generate-quality.ts --go                                      # capture quality score
pnpm exec tsx src/build-row-embeddings.ts --go --missing-only
pnpm exec tsx src/rebuild-site-embeddings.ts --go
pnpm exec tsx src/build-umap-layout.ts --apply
```

`merge-disk-captures-to-seed.ts` also takes `--site-meta=site-meta.json` (`{"<siteSlug>": {"title": "Relume", "industry": ["saas", "ai"]}}`) for curated site names and industries. It cleans font names and takes em and en dashes out of every row on the way in.

## 5. Publish

```bash
pnpm exec tsx src/publish-catalogue-to-blob.ts --go
```

Uploads the seed and both embedding sidecars to Blob, where `npx inspo-mcp` reads them. Commit the seed files too: the next deploy of `apps/web` serves the new rows in the gallery and through the hosted MCP.

## Removing pages or sites

```bash
pnpm exec tsx src/delete-screens.ts --from-file=pages.txt           # dry run
pnpm exec tsx src/delete-screens.ts --from-file=pages.txt --apply
```

List page slugs, one per line; a whole site means its landing slug plus every `<site>--*` slug. The script also updates both embedding sidecars and reports any collection or example write-up that still names a removed page. Rebuild the map layout afterwards (`build-umap-layout.ts --apply`) and publish again.

## Tags

The allow-lists in [`packages/taxonomy/src/index.ts`](packages/taxonomy/src/index.ts) are the single source of truth. The tagger picks only from these enums and every value is validated before it is written. Add a missing tag there and both the worker prompt and the gallery filter rail pick it up.

## Models

Defaults live in code; each can be overridden from `.env`.

| Stage | Default | Override |
|---|---|---|
| Tags, descriptions, northstars | `google/gemma-4-31B-it` | `INSPO_VISION_MODEL` |
| Quality scores | `google/gemma-4-31B-it` | `INSPO_QUALITY_MODEL` |
| Autopsies | `moonshotai/Kimi-K2.6` (a dedicated Together deployment) | `INSPO_AUTOPSY_MODEL`, e.g. `google/gemma-4-31B-it` |
| Embeddings | `intfloat/multilingual-e5-large-instruct` (1024-dim) | `INSPO_EMBED_MODEL` |
