/**
 * Convert a query-layer result into the wire format the MCP returns.
 * Always returns absolute image URLs so the agent can fetch / pass to
 * a vision model directly.
 */

import type { ScreenSummary, Collection } from "@inspo/shared";
import { axesKey } from "@inspo/shared";
import type { CaptureDevice } from "@inspo/taxonomy";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import { absolute } from "./url";
import { imagesAffordable, textCharsFor, trimToChars } from "./budget";

type RoleVariants = NonNullable<ScreenSummary["thumbVariants"]>;

/**
 * Font names as the capture found them, cleaned for a reader.
 *
 * Next.js's font loader renames every face to `__Name_hash` and the
 * extractor recorded that verbatim on 23 sites, so `recommend`'s
 * evidence packet was listing "__Inter_f367f3" and "__esbuild_b38aaf"
 * as faces in use. The first is Inter; the second is a bundler
 * artefact and not a typeface at all. Returns null for names that
 * carry no information once the mangling is stripped.
 */
export function cleanFont(name: string): string | null {
  let n = name.trim();
  const next = /^__(.+?)_[0-9a-f]{6}$/.exec(n);
  if (next) n = next[1]!;
  if (/^(esbuild|webpack|vite|font|fallback)/i.test(n)) return null;
  // camelCase identifiers ("instrumentSans", "tomatoGroteskMedium")
  // come from CSS-in-JS variable names; space them out.
  if (/^[a-z]+[A-Z]/.test(n)) {
    n = n.replace(/([a-z])([A-Z])/g, "$1 $2");
    n = n.charAt(0).toUpperCase() + n.slice(1);
  }
  return n.length > 0 ? n : null;
}

export function cleanFonts(list: ReadonlyArray<string>): string[] {
  const out: string[] = [];
  for (const f of list) {
    const c = cleanFont(f);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/**
 * JSON for a model to read, not for a linter to admire.
 *
 * Two-space pretty printing put every palette hex and every tag on
 * its own line: 16-20% of a search response was indentation. This
 * keeps one space of indent so nesting stays legible, and folds any
 * array of primitives onto one line.
 */
export function compactJson(value: unknown): string {
  const pretty = JSON.stringify(value, null, 1);
  // A JSON primitive: string (with escapes), number, boolean, null.
  const prim = '(?:"(?:[^"\\\\]|\\\\.)*"|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|true|false|null)';
  const re = new RegExp("\\[\\n\\s*(" + prim + "(?:,\\n\\s*" + prim + ")*)\\n\\s*\\]", "g");
  return pretty.replace(re, (_m, inner: string) => `[${inner.replace(/,\n\s*/g, ", ")}]`);
}

/** Blob layout every row shares, stated once per response instead of
 *  four URLs per row. Every catalogue row has hero.{384,768,1440},
 *  thumb.384 and mobile.384 WebP; full.1440 exists on 94% of rows. */
export const IMAGE_PATTERN =
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/captures/<slug>/hero.1440.webp (also full.1440, thumb.384, mobile.384; get_screen returns exact URLs)";

/** Strip the tag list the tagger appended to every description
 *  ("...ornamentation.  ·  dark saas, developer tools, ..."): it
 *  repeats `tags` and the search index already reads it. */
function proseOnly(description: string): string {
  const i = description.indexOf("  ·  ");
  return i > 0 ? description.slice(0, i).trim() : description;
}

/** One-line tag summary for list rows. The four-array object cost
 *  ~100 tokens a row for information that reads fine as a sentence. */
function tagLine(s: ScreenSummary): string {
  const parts: string[] = [];
  if (s.tags.style.length) parts.push(s.tags.style.join(", "));
  if (s.tags.industry.length) parts.push(s.tags.industry.join(", "));
  if (s.tags.vibe.length) parts.push(s.tags.vibe.join(", "));
  if (s.tags.components.length) parts.push(s.tags.components.join(", "));
  return parts.join(" · ");
}

/**
 * The list-row shape: what a reader needs to decide whether a row is
 * worth drilling into, and nothing that only matters once it has.
 *
 * Measured over twenty agent builds, 13% of the sites returned in
 * lists were ever cited, so the per-row cost is paid ~8 times for
 * every row that earns it. Dropped from the old full row: four blob
 * URLs (IMAGE_PATTERN covers them once), the description (repeats
 * northstar plus tags), tech, capturedAt, and the six-field axes
 * object (now the axes key string plus the display face). The
 * autopsy stays on the rows the caller marks with `autopsy: true`;
 * list tools give it to the top few and get_screen gives it to any.
 */
export function formatScreenRow(
  s: ScreenSummary,
  opts: { autopsy?: boolean; why?: string; mobile?: boolean } = {},
) {
  return {
    slug: s.slug,
    title: s.title,
    ...(opts.mobile
      ? { mobile: absolute(smallestWebp(s.mobileVariants) ?? s.mobileImageUrl ?? s.thumbUrl) }
      : {}),
    ...(s.northstar ? { northstar: s.northstar } : {}),
    ...(opts.autopsy && s.autopsy ? { autopsy: s.autopsy } : {}),
    palette: s.palette,
    fonts: cleanFonts(s.fonts),
    mode: s.mode,
    ...(s.tags.macrostructure ? { macro: s.tags.macrostructure } : {}),
    ...(s.tags.axes
      ? {
          axes: `${axesKey(s.tags.axes)}${
            s.tags.axes.displayFace && cleanFont(s.tags.axes.displayFace)
              ? ` / ${cleanFont(s.tags.axes.displayFace)}`
              : ""
          }`,
        }
      : {}),
    tags: tagLine(s),
    ...(opts.why ? { whyThisMatches: opts.why } : {}),
  };
}

/** Smallest WebP variant URL for a role, if the seed carries one. */
function smallestWebp(v: RoleVariants | undefined): string | undefined {
  const list = v?.webp;
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => a.w - b.w)[0]!.url;
}

/** Largest WebP variant URL for a role, if the seed carries one. */
function largestWebp(v: RoleVariants | undefined): string | undefined {
  const list = v?.webp;
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => b.w - a.w)[0]!.url;
}

/**
 * Ordered inline-thumbnail candidates for one screen: cheapest first.
 * device="mobile" prefers the mobile capture (its 384 WebP is live on
 * Blob for nearly every row); desktop prefers the seed's thumb WebP
 * variant, then the synthesized `.384.webp` sibling (inline-images
 * derives it), then the PNG thumb which always exists.
 */
export function inlineThumbCandidates(
  s: ScreenSummary,
  device?: CaptureDevice,
): string[] {
  const out: string[] = [];
  if (device === "mobile") {
    const mobileWebp = smallestWebp(s.mobileVariants);
    if (mobileWebp) out.push(absolute(mobileWebp));
    if (s.mobileImageUrl) out.push(absolute(s.mobileImageUrl));
  }
  const thumbWebp = smallestWebp(s.thumbVariants);
  if (thumbWebp) out.push(absolute(thumbWebp));
  out.push(absolute(s.thumbUrl));
  return out;
}

/**
 * Asset URLs for one row: ONE url per role, WebP where it exists.
 *
 * This used to emit up to eight - `image` and `imageWebp`, `thumb` and
 * `thumbWebp`, three mobile fields - which measured at 235 tokens per
 * row, more than the entire evidence packet, and 1,175 across a
 * five-exemplar `recommend`. Most of that was the same 64-character
 * blob prefix repeated eight times.
 *
 * Nothing is lost by collapsing them. A PNG and its WebP twin are the
 * same picture, so shipping both spent ~29 tokens to offer a worse
 * download; the WebP is simply preferred now, which also makes every
 * fetch ~5x cheaper. The extra mobile roles survive on `get_screen`,
 * where the caller has asked about one row and wants everything.
 */
function assetUrls(s: ScreenSummary, allAssets: boolean) {
  const hero = largestWebp(s.heroVariants) ?? s.imageUrl;
  const full = largestWebp(s.fullVariants) ?? s.fullPageUrl;
  const thumb = smallestWebp(s.thumbVariants) ?? s.thumbUrl;
  const mobile = smallestWebp(s.mobileVariants) ?? s.mobileImageUrl;
  return {
    image: absolute(hero),
    fullPage: absolute(full),
    thumb: absolute(thumb),
    ...(mobile ? { mobile: absolute(mobile) } : {}),
    ...(allAssets && s.mobileFullUrl
      ? { mobileFull: absolute(s.mobileFullUrl) }
      : {}),
    ...(allAssets && s.imageUrl !== hero ? { imagePng: absolute(s.imageUrl) } : {}),
  };
}

export function formatScreen(
  s: ScreenSummary,
  why?: string,
  opts: { allAssets?: boolean } = {},
) {
  return {
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    designerCredit: s.designerCredit,
    capturedAt: s.capturedAt,
    ...assetUrls(s, opts.allAssets ?? false),
    ...(s.northstar ? { northstar: s.northstar } : {}),
    ...(s.autopsy ? { autopsy: s.autopsy } : {}),
    description: proseOnly(s.description),
    palette: s.palette,
    fonts: cleanFonts(s.fonts),
    tech: s.tech,
    mode: s.mode,
    tags: {
      style: s.tags.style,
      industry: s.tags.industry,
      components: s.tags.components,
      vibe: s.tags.vibe,
    },
    macrostructure: s.tags.macrostructure
      ? {
          slug: s.tags.macrostructure,
          label: MACROSTRUCTURE_LABELS[s.tags.macrostructure],
        }
      : null,
    // The three diversification axes, measured from the capture and
    // the palette. Replaces the old `theme` field, which named a theme
    // from one version of one design skill and went stale.
    axes: s.tags.axes
      ? {
          paperBand: s.tags.axes.paperBand,
          displayClass: s.tags.axes.displayClass,
          accentHue: s.tags.axes.accentHue,
          paperL: s.tags.axes.paperL,
          accentDeg: s.tags.axes.accentDeg,
          displayFace: s.tags.axes.displayFace
            ? cleanFont(s.tags.axes.displayFace)
            : s.tags.axes.displayFace,
        }
      : null,
    ...(why ? { whyThisMatches: why } : {}),
  };
}

/**
 * Lean result shape for the text-first profile (images=none). Drops the
 * long autopsy + description + full tags + tech so a multi-result search
 * stays a few hundred tokens instead of a few thousand; keeps the
 * pick-the-right-one essentials (northstar one-liner, palette, fonts,
 * mode, macrostructure, thumb). The agent drills into get_screen, or
 * passes detail:"full", for the complete breakdown.
 */
export function formatScreenConcise(s: ScreenSummary, why?: string) {
  return {
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    thumb: absolute(smallestWebp(s.thumbVariants) ?? s.thumbUrl),
    ...(smallestWebp(s.mobileVariants) ?? s.mobileImageUrl
      ? { mobile: absolute(smallestWebp(s.mobileVariants) ?? s.mobileImageUrl!) }
      : {}),
    ...(s.northstar ? { northstar: s.northstar } : {}),
    palette: s.palette,
    fonts: cleanFonts(s.fonts),
    mode: s.mode,
    // Compact form ("dark / grotesk-sans / cool"): one short string
    // instead of the six-field object, because this shape exists to
    // keep multi-result searches cheap. `paperBand` here is measured
    // from the capture and is the reliable one when it disagrees with
    // `mode`, which it does on ~15% of rows.
    ...(s.tags.axes ? { axes: axesKey(s.tags.axes) } : {}),
    macrostructure: s.tags.macrostructure
      ? {
          slug: s.tags.macrostructure,
          label: MACROSTRUCTURE_LABELS[s.tags.macrostructure],
        }
      : null,
    ...(why ? { whyThisMatches: why } : {}),
  };
}

export function formatCollection(c: Collection) {
  return {
    slug: c.slug,
    title: c.title,
    number: c.number,
    date: c.date,
    editorBlurb: c.editorBlurb,
    coverScreenSlug: c.coverScreenSlug,
    screens: c.screens.map((e) => ({
      slug: e.slug,
      editorNote: e.editorNote,
      span: e.span,
    })),
  };
}

export function asTextContent(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: compactJson(value),
      },
    ],
  };
}

/**
 * Same JSON text payload as `asTextContent`, plus a native `image`
 * content block per provided thumbnail URL - fetched in parallel,
 * WebP-preferred with PNG fallback, in-process LRU-cached. Agents
 * see the thumbnails directly in the tool response instead of having
 * to curl each one and Read it.
 *
 * Order of image blocks matches the order of `imageUrls` (which the
 * caller is expected to pass in the same order as the `results`
 * array in `value`), so agents can correlate JSON ↔ image by index.
 *
 * Failed fetches are silently dropped - the JSON text always still
 * comes back, the agent can fall back to the URLs in the payload.
 *
 * `inline=false` (the text-first profile: most OSS harnesses either
 * drop image blocks or run text-only models) skips the fetches and
 * returns the JSON text alone.
 *
 * `budget.maxTokens` caps the whole response: the ranked results list
 * is trimmed from the tail first, then whatever tokens are left decide
 * how many thumbnails are still affordable. Set `trimResults: false`
 * for payloads whose list the caller named explicitly (compare), where
 * dropping an entry answers a different question than the one asked.
 */
export interface ResponseBudget {
  maxTokens?: number | null;
  trimResults?: boolean;
}

export async function withImages(
  value: unknown,
  imageUrls: ReadonlyArray<string | ReadonlyArray<string>>,
  inline = true,
  budget?: ResponseBudget,
) {
  // Image URLs stay in the payload whatever the budget does, so nothing
  // becomes unreachable under a cap - just uninlined.
  let body = value;
  let images = imageUrls;
  const maxTokens = budget?.maxTokens ?? null;
  if (maxTokens) {
    if (budget?.trimResults !== false) {
      const trimmed = trimToChars(body, textCharsFor(maxTokens, inline));
      body = trimmed.value;
      // Images are passed as a prefix of the results (one per result, or
      // the top few of them), so a trimmed list must take the thumbnails
      // down with it or a surviving image would caption a result that is
      // no longer in the JSON. More images than results means the arrays
      // aren't index-aligned, so leave them alone.
      if (
        trimmed.keptEntries !== null &&
        images.length <= trimmed.originalEntries
      ) {
        images = images.slice(0, trimmed.keptEntries);
      }
    }
    if (inline) {
      const spentChars = compactJson(body).length;
      images = images.slice(0, imagesAffordable(maxTokens, spentChars));
    }
  }
  if (!inline || images.length === 0) return asTextContent(body);
  const { thumbnailBlocks, MAX_INLINE_PER_CALL, MAX_INLINE_TOTAL_BYTES } =
    await import("./inline-images");
  const slice = images.slice(0, MAX_INLINE_PER_CALL);
  const fetched = await thumbnailBlocks(slice);
  const blocks = fetched.filter((b) => b !== null);
  // Enforce a total decoded-byte budget across the whole response.
  // Order is result order, so what survives is the top of the list.
  const kept: typeof blocks = [];
  let spent = 0;
  for (const b of blocks) {
    const bytes = Math.ceil((b.data.length * 3) / 4);
    if (spent + bytes > MAX_INLINE_TOTAL_BYTES && kept.length > 0) continue;
    kept.push(b);
    spent += bytes;
  }
  const dropped = blocks.length - kept.length;
  return {
    content: [
      {
        type: "text" as const,
        text: compactJson(body),
      },
      ...kept,
      ...(dropped > 0
        ? [
            {
              type: "text" as const,
              text: `(${dropped} inline thumbnail${dropped === 1 ? "" : "s"} omitted to fit the response budget; every result still carries its image URLs.)`,
            },
          ]
        : []),
    ],
  };
}
