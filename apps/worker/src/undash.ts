/**
 * Em and en dashes never ship in archive copy. Built from char codes so
 * this file itself contains neither. URLs and LQIPs are left alone.
 *
 * Used by merge-disk-captures-to-seed.ts on every new row, and by
 * undash-seed.ts for rows that predate it.
 */

export const DASHES = String.fromCharCode(0x2013, 0x2014);
const DASH_BETWEEN_DIGITS = new RegExp(`(\\d)\\s*[${DASHES}]\\s*(\\d)`, "g");
const DASH_ANYWHERE = new RegExp(`\\s*[${DASHES}]\\s*`, "g");

/** True when the string holds an em or en dash. */
export const hasDash = (s: string) => s.includes(DASHES[0]!) || s.includes(DASHES[1]!);

export const undash = (s: string) =>
  s.replace(DASH_BETWEEN_DIGITS, "$1-$2").replace(DASH_ANYWHERE, " - ");

/**
 * undash every string in a value, except under keys that hold a URL or
 * an LQIP. A key that itself carries a dash (now and then a site's own
 * CSS variable name) is dropped: renaming it would describe a variable
 * the site does not have.
 */
export function scrub<T>(v: T, key = ""): T {
  if (typeof v === "string") return (/url$|lqip/i.test(key) ? v : undash(v)) as T;
  if (Array.isArray(v)) return v.map((x) => scrub(x, key)) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => !hasDash(k))
        .map(([k, x]) => [k, scrub(x, k)]),
    ) as T;
  }
  return v;
}
