/**
 * Font family names as a designer would say them, not as a build emits
 * them.
 *
 * getComputedStyle reports whatever name the site's toolchain gave a
 * face, and extract.ts used to store it verbatim, so DESIGN.md, search
 * and the type ramp carried names like these:
 *
 *   __ppNeueMontreal_178781          next/font: the variable name + a hash
 *   Inter-dcbae5534c949be2           Framer, Astro: a content hash
 *   Univers LT W01_63 Bold_1476034   fonts.com: catalogue suffixes
 *   wfont_05766b_756b1717…           Wix: an upload with no name at all
 *
 * normalizeFontFamily() recovers the name where the string holds one
 * ("PP Neue Montreal", "Inter", "Univers LT") and returns null where it
 * holds none. Used at capture (extract.ts), at merge, and by
 * normalize-font-names.ts for rows already in the seed.
 */

const NEXT_FONT = /^__([A-Za-z0-9]+?)(_Fallback)?_[0-9a-f]{5,8}$/;
const HASH_SUFFIX = /^(.+?)-[0-9a-f]{8,}$/i;
const CATALOGUE_ID = /_\d{4,}$/;
const WEB_FONT_SERIES = /\s+W0\d(?:_\d+)?(?:\s.*)?$/;
const WIX_UPLOAD = /^wfont_[0-9a-f]+_[0-9a-f]+$/i;
const WEIGHT =
  /^(?:thin|hairline|extralight|ultralight|light|regular|book|normal|medium|semibold|demibold|bold|extrabold|ultrabold|heavy|black)$/i;

/** next/font variable names that say nothing about the face. */
const NO_NAME = new Set([
  "font", "fonts", "esbuild", "sans", "serif", "mono", "display",
  "body", "heading", "primary", "secondary", "main", "custom", "local",
]);

/** `ppNeueMontreal` -> "PP Neue Montreal", `fontMonumentGrotesk` -> "Monument Grotesk". */
function fromVariableName(id: string): string | null {
  let words = id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean);
  const last = () => words[words.length - 1]!;
  if (words.length > 1 && /^font$/i.test(words[0]!)) words = words.slice(1);
  if (words.length > 1 && /^font$/i.test(last())) words = words.slice(0, -1);
  if (words.length > 1 && WEIGHT.test(last())) words = words.slice(0, -1);
  if (words.length === 1 && NO_NAME.has(words[0]!.toLowerCase())) return null;
  return words
    .map((w, i) =>
      // A short lowercase lead is a foundry prefix: pp, twk, abc, gt.
      i === 0 && words.length > 1 && /^[a-z]{2,3}$/.test(w)
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

export function normalizeFontFamily(raw: string | null | undefined): string | null {
  let name = (raw ?? "").replace(/["']/g, "").replace(/\s+/g, " ").trim();
  if (!name || WIX_UPLOAD.test(name)) return null;

  const next = NEXT_FONT.exec(name);
  if (next) return next[2] ? null : fromVariableName(next[1]!);

  const hashed = HASH_SUFFIX.exec(name);
  if (hashed) name = hashed[1]!.trim();
  name = name.replace(CATALOGUE_ID, "").replace(WEB_FONT_SERIES, "").trim();
  return name || null;
}

/** A detected-typeface list: names cleaned, nameless faces dropped, no repeats. */
export function cleanFontList(fonts: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of fonts ?? []) {
    const name = normalizeFontFamily(raw);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}

/** A type-ramp row still needs a family, so a nameless face reads as one. */
export function cleanRampFamily(family: string | null | undefined): string {
  if (!family || family === "inherit") return "inherit";
  return normalizeFontFamily(family) ?? "Custom webfont";
}
