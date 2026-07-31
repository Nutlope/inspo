/**
 * Response budgets: let a caller cap what a single tool call is allowed
 * to spend, in tokens, across BOTH halves of the response.
 *
 * Why this exists: `MAX_INLINE_TOTAL_BYTES` caps inline images, but
 * nothing capped the JSON text, so there was no way for a host to say
 * "give me your best answer under N tokens". Measured on the hosted
 * endpoint, one `recommend` call is ~10 KB of text with images off and
 * ~69 KB with thumbs on, and every tool result is re-read on each
 * subsequent turn of the conversation - so a caller working in a small
 * context window needs a hard ceiling, not just a nudge.
 *
 * Resolution order (first hit wins):
 *   1. per-call `maxTokens` argument
 *   2. INSPO_MAX_TOKENS env / ?maxTokens= on the HTTP transport
 *   3. no budget (today's behaviour)
 *
 * The budget is a target, not a guarantee: the truncation note and the
 * response envelope itself are outside the measured text, and image
 * cost is estimated rather than exact (see TOKENS_PER_INLINE_IMAGE).
 * Overshoot is bounded to a few hundred tokens.
 */

/** Pretty-printed JSON runs a little under 4 characters per token
 *  (punctuation and indentation tokenize densely, URLs and slugs less
 *  so). 4 is the conventional estimate and errs toward under-trimming. */
export const CHARS_PER_TOKEN = 4;

/** Estimated cost of one inline thumbnail content block. Vision models
 *  price images by pixel area, not bytes: Anthropic charges about
 *  (w x h) / 750 tokens, so the ~384x240 WebP variants we inline land
 *  near 125 and the 768-wide PNG fallbacks near 500. 260 is the middle
 *  of the range we actually serve. */
export const TOKENS_PER_INLINE_IMAGE = 260;

/** Below this a response cannot carry a useful result, so we clamp
 *  rather than return an empty list. */
export const MIN_BUDGET_TOKENS = 300;
export const MAX_BUDGET_TOKENS = 200_000;

/** Share of a budget reserved for JSON text when images are also being
 *  inlined. Text is what makes a result actionable (slugs, palettes,
 *  URLs to fetch later); images are the luxury. Unspent text budget
 *  rolls over to images, so this is a floor, not a quota. */
const TEXT_SHARE_WITH_IMAGES = 0.55;

/** Headroom left for the truncation note appended to a trimmed body. */
const NOTE_RESERVE_CHARS = 240;

function clamp(n: number): number {
  return Math.min(MAX_BUDGET_TOKENS, Math.max(MIN_BUDGET_TOKENS, Math.round(n)));
}

/** Server-wide default from the environment. Hosts that cannot pass a
 *  per-call argument (every MCP client today) set this instead. */
export function envBudget(): number | null {
  const raw = typeof process !== "undefined" ? process.env?.INSPO_MAX_TOKENS : undefined;
  const n = Number(raw ?? "");
  return Number.isFinite(n) && n > 0 ? clamp(n) : null;
}

/** Parse a `maxTokens` value coming off a URL query string. */
export function parseBudget(v: string | undefined): number | null {
  const n = Number(v?.trim() ?? "");
  return Number.isFinite(n) && n > 0 ? clamp(n) : null;
}

/** perCall argument > host default (?maxTokens= / RegisterOptions) > env. */
export function resolveBudget(
  perCall?: number | null,
  hostDefault?: number | null,
): number | null {
  if (typeof perCall === "number" && Number.isFinite(perCall) && perCall > 0) {
    return clamp(perCall);
  }
  if (
    typeof hostDefault === "number" &&
    Number.isFinite(hostDefault) &&
    hostDefault > 0
  ) {
    return clamp(hostDefault);
  }
  return envBudget();
}

export interface TrimResult {
  value: unknown;
  /** How many entries of the trimmed array survived, or null when
   *  nothing was trimmed (either it already fit or there was no
   *  safely-trimmable list). */
  keptEntries: number | null;
  /** Length the trimmed array had before trimming. */
  originalEntries: number;
}

/**
 * Shrink a tool payload so its serialized JSON fits `maxChars`.
 *
 * Strategy: drop entries from the tail of the payload's largest
 * top-level array of objects. In every list-returning tool that array
 * is the results list (`results`, `exemplars`, `screens`, `pages`,
 * `sites`), and results are already ranked, so the tail is the least
 * relevant thing in the response. Never trims below one entry: a caller
 * who asked for a tiny budget still gets the top hit rather than an
 * empty list they cannot act on.
 *
 * Scalar fields (tips, filters, hero guidance, the macrostructure pick)
 * are never touched, so a trimmed response stays as usable as a full
 * one - just shorter.
 */
export function trimToChars(value: unknown, maxChars: number): TrimResult {
  const budget = Math.max(400, maxChars - NOTE_RESERVE_CHARS);
  if (JSON.stringify(value, null, 2).length <= budget) {
    return { value, keptEntries: null, originalEntries: 0 };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { value, keptEntries: null, originalEntries: 0 };
  }
  const obj = value as Record<string, unknown>;

  // Pick the array that actually costs something: at least two entries,
  // holding objects (not a palette's worth of hex strings).
  let key: string | null = null;
  let arr: unknown[] = [];
  let biggest = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (!Array.isArray(v) || v.length < 2) continue;
    if (!v.some((e) => e !== null && typeof e === "object")) continue;
    const size = JSON.stringify(v)?.length ?? 0;
    if (size > biggest) {
      biggest = size;
      key = k;
      arr = v;
    }
  }
  if (!key) return { value, keptEntries: null, originalEntries: 0 };

  // Serialized length grows monotonically with entry count, so binary
  // search lands on the largest prefix that fits.
  let lo = 1;
  let hi = arr.length;
  let best = 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const candidate = { ...obj, [key]: arr.slice(0, mid) };
    if (JSON.stringify(candidate, null, 2).length <= budget) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const dropped = arr.length - best;
  const trimmed: Record<string, unknown> = { ...obj, [key]: arr.slice(0, best) };
  if (dropped > 0) {
    trimmed.budgetNote =
      `Trimmed to fit maxTokens: showing the top ${best} of ${arr.length} ${key} ` +
      `(results are ranked, so the ${dropped} dropped ${dropped === 1 ? "entry was" : "entries were"} the weakest matches). ` +
      `Raise maxTokens, or narrow the query, for the rest.`;
  }
  return { value: trimmed, keptEntries: best, originalEntries: arr.length };
}

/** How many inline images the leftover budget can pay for, given what
 *  the (already trimmed) text actually spent. */
export function imagesAffordable(totalTokens: number, textChars: number): number {
  const spent = Math.ceil(textChars / CHARS_PER_TOKEN);
  const left = totalTokens - spent;
  if (left <= 0) return 0;
  return Math.floor(left / TOKENS_PER_INLINE_IMAGE);
}

/** Character ceiling the JSON text gets under a budget. Images, when
 *  inlined, hold back a share so a budget never returns pictures with
 *  no context to act on. */
export function textCharsFor(totalTokens: number, withImages: boolean): number {
  const share = withImages ? TEXT_SHARE_WITH_IMAGES : 1;
  return Math.floor(totalTokens * share * CHARS_PER_TOKEN);
}
