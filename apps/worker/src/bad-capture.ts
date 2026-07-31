/**
 * Shared "does this page look like a real capture?" heuristics.
 * Extracted from merge-disk-captures-to-seed.ts so the revisit pass
 * and future intake stages gate on the same vocabulary.
 */

export const BAD_TITLE =
  /(access\s*denied|forbidden|cloudflare|just a moment|verify you are human|checking your browser|page not found|404\b|403\b|something went wrong|attention required|under maintenance|sit tight|temporarily unavailable|not supported|browser not supported|unsupported browser|javascript (is )?required|enable javascript|please enable cookies)/i;

/** Null when the title/description pair looks like a real page;
 *  otherwise a short reason string. */
export function badPageReason(
  title: string | null | undefined,
  description: string | null | undefined,
): string | null {
  const t = (title ?? "").trim();
  const d = (description ?? "").trim();
  if (!t && !d) return "blank title+description";
  if (BAD_TITLE.test(t)) return `bad title: ${t.slice(0, 60)}`;
  if (BAD_TITLE.test(d)) return `bad description: ${d.slice(0, 60)}`;
  return null;
}

/** Registrable-domain comparison for redirect detection. Approximate:
 *  last two labels, or three when the middle label is a common
 *  second-level registry (co.uk, com.au, ...). */
export function sameRegistrableDomain(a: string, b: string): boolean {
  const norm = (h: string) => {
    const labels = h.toLowerCase().replace(/^www\./, "").split(".");
    if (labels.length <= 2) return labels.join(".");
    const second = labels[labels.length - 2]!;
    const take = ["co", "com", "net", "org", "gov", "ac", "edu"].includes(second)
      ? 3
      : 2;
    return labels.slice(-take).join(".");
  };
  return norm(a) === norm(b);
}
