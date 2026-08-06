/**
 * What a genre actually looks like, measured.
 *
 * An agent constructing a design system from scratch has one hard
 * problem, and it is not taste: it is that its own defaults are an
 * attractor. Asked for "a fintech page" it produces the same navy-and-
 * emerald page every time, because that is the centre of mass of its
 * training data. Told to be distinctive, it produces the same *second*
 * page every time.
 *
 * A measured distribution breaks that, but only if it is used the right
 * way round. This packet is not a template to copy. It is the thing to
 * take a position against. The consensus tells you where the category's
 * gravity is; the outliers tell you who escaped it and how; the faces
 * and anchors are real, licensable, in-use material rather than
 * remembered ones.
 *
 * Everything here is counted per SITE, never per row. The archive holds
 * up to twenty pages for some products, and a distribution that lets
 * one company vote twenty times is not a distribution.
 */

import type { ScreenSummary } from "@inspo/shared";
import type {
  AccentHueBand,
  DisplayClass,
  Macrostructure,
  PaperBand,
} from "@inspo/taxonomy";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";

/** One axis's distribution: the modal value, its share, and the full
 *  spread so a caller can see whether the mode is a real consensus or
 *  a three-way tie. */
export type AxisSpread<T extends string> = {
  consensus: T | null;
  share: number;
  spread: Record<string, number>;
};

export type Evidence = {
  sites: number;
  paperBand: AxisSpread<PaperBand>;
  displayClass: AxisSpread<DisplayClass>;
  accentHue: AxisSpread<AccentHueBand>;
  faces: { family: string; sites: number }[];
  anchors: string[];
  outliers: { slug: string; title: string; axes: string; differsOn: string[] }[];
  note: string;
};

/** Collapse rows to one per site, preferring the canonical capture
 *  over its `--archive` twin and the landing page over sub-pages. */
function oneRowPerSite(rows: ScreenSummary[]): ScreenSummary[] {
  const by = new Map<string, ScreenSummary>();
  for (const s of rows) {
    const cur = by.get(s.siteSlug);
    if (!cur) {
      by.set(s.siteSlug, s);
      continue;
    }
    const better =
      (cur.slug.includes("--archive") && !s.slug.includes("--archive")) ||
      (cur.pageType !== "landing" && s.pageType === "landing");
    if (better) by.set(s.siteSlug, s);
  }
  return [...by.values()];
}

function spreadOf<T extends string>(values: (T | undefined)[]): AxisSpread<T> {
  const counts = new Map<string, number>();
  let total = 0;
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
    total++;
  }
  if (total === 0) return { consensus: null, share: 0, spread: {} };
  let consensus: T | null = null;
  let best = 0;
  const spread: Record<string, number> = {};
  for (const [k, n] of counts) {
    spread[k] = Math.round((n / total) * 100) / 100;
    if (n > best) {
      best = n;
      consensus = k as T;
    }
  }
  return { consensus, share: Math.round((best / total) * 100) / 100, spread };
}

/**
 * Measure the axes distribution across a matched set.
 *
 * `rows` should be the ranked pool for the brief, not the whole
 * archive: the question being answered is "what does THIS genre look
 * like", and a distribution over all 784 sites answers a different and
 * far less useful question.
 */
export function buildEvidence(
  rows: ScreenSummary[],
  opts: { concise?: boolean; limit?: number } = {},
): Evidence {
  // The packet runs ~500 tokens at full detail, a quarter of a
  // `recommend` response. Worth it - it is the only part that answers
  // "what does this genre actually look like". But the text-first
  // profile exists for small models on tight budgets, so there it
  // keeps the consensus and the outliers (the two things you cannot
  // reconstruct) and sheds the long tails.
  const { concise = false, limit = 60 } = opts;
  const sites = oneRowPerSite(rows).slice(0, limit);
  const axed = sites.filter((s) => s.tags.axes);

  const paperBand = spreadOf(axed.map((s) => s.tags.axes?.paperBand));
  const displayClass = spreadOf(axed.map((s) => s.tags.axes?.displayClass));
  const accentHue = spreadOf(axed.map((s) => s.tags.axes?.accentHue));

  // Real faces in use, counted per site. Only the display face: the
  // body face is usually a neutral workhorse and carries little signal
  // about the genre's register.
  const faceCounts = new Map<string, number>();
  for (const s of axed) {
    const f = s.tags.axes?.displayFace;
    if (f) faceCounts.set(f, (faceCounts.get(f) ?? 0) + 1);
  }
  const faces = [...faceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, concise ? 5 : 12)
    .map(([family, n]) => ({ family, sites: n }));

  // Accent anchors: the most-saturated colour from each of the top
  // sites, deduped. Real values, not remembered ones.
  const anchors: string[] = [];
  for (const s of sites) {
    const first = s.palette?.[0];
    if (first && !anchors.includes(first)) anchors.push(first);
    if (anchors.length >= (concise ? 5 : 8)) break;
  }

  // Sites that escaped the consensus on two or more axes. These are
  // the useful ones: proof that the category's gravity is optional,
  // and a demonstration of what it costs to leave.
  const outliers = axed
    .map((s) => {
      const a = s.tags.axes!;
      const differsOn: string[] = [];
      if (paperBand.consensus && a.paperBand !== paperBand.consensus)
        differsOn.push("paperBand");
      if (displayClass.consensus && a.displayClass !== displayClass.consensus)
        differsOn.push("displayClass");
      if (accentHue.consensus && a.accentHue !== accentHue.consensus)
        differsOn.push("accentHue");
      return {
        slug: s.slug,
        title: s.title,
        axes: `${a.paperBand} / ${a.displayClass} / ${a.accentHue}`,
        differsOn,
      };
    })
    .filter((o) => o.differsOn.length >= 2)
    .slice(0, concise ? 3 : 5);

  const strongest =
    [
      { axis: "paper band", v: paperBand },
      { axis: "display class", v: displayClass },
      { axis: "accent hue", v: accentHue },
    ].sort((a, b) => b.v.share - a.v.share)[0] ?? null;

  const note =
    axed.length === 0
      ? "No axes data on the matched rows; treat this as unmeasured and construct without a register constraint."
      : axed.length < 4
        ? `Only ${axed.length} site${axed.length === 1 ? "" : "s"} matched. That is too thin to call a consensus - treat the numbers below as anecdote, not distribution.`
        : `Measured over ${axed.length} sites. The category's strongest pull is ${strongest?.axis} = ${strongest?.v.consensus} at ${Math.round((strongest?.v.share ?? 0) * 100)}%. This is the gravity to take a position on, with it or against it - not a template to match.`;

  const lean = <T extends string>(a: AxisSpread<T>): AxisSpread<T> =>
    concise ? { ...a, spread: {} } : a;

  return {
    sites: axed.length,
    paperBand: lean(paperBand),
    displayClass: lean(displayClass),
    accentHue: lean(accentHue),
    faces,
    anchors,
    outliers,
    note,
  };
}

/**
 * Distinct sites per macrostructure across the whole archive.
 *
 * Published in `get_filters` so a caller can see, before it commits,
 * that the shape it is about to build has four exemplars and not four
 * hundred. Nine of the twenty-one shapes have four sites or fewer, so
 * this is not a footnote.
 */
export function macrostructureCoverage(
  rows: ScreenSummary[],
): Record<string, number> {
  const counts = new Map<Macrostructure, Set<string>>();
  for (const s of rows) {
    const m = s.tags.macrostructure;
    if (!m) continue;
    let set = counts.get(m);
    if (!set) counts.set(m, (set = new Set()));
    set.add(s.siteSlug);
  }
  const out: Record<string, number> = {};
  for (const m of Object.keys(MACROSTRUCTURE_LABELS) as Macrostructure[]) {
    out[m] = counts.get(m)?.size ?? 0;
  }
  return out;
}

/**
 * Rank macrostructures by how well the brief matched them.
 *
 * The old behaviour returned one opinionated pick and nothing else,
 * which gave a caller no way to tell a landslide from a three-way tie.
 * Returning the runners-up with their hit and exemplar counts makes the
 * pick auditable: a shape that led by one hit over two others is a
 * coin toss the caller should get to re-throw.
 */
export function macrostructureShortlist(
  ranked: ScreenSummary[],
  topN = 3,
): {
  slug: Macrostructure;
  label: string;
  hits: number;
  exemplars: number;
}[] {
  const hits = new Map<Macrostructure, number>();
  for (const s of ranked.slice(0, 12)) {
    const m = s.tags.macrostructure;
    if (m) hits.set(m, (hits.get(m) ?? 0) + 1);
  }
  const exemplarCounts = new Map<Macrostructure, number>();
  for (const s of oneRowPerSite(ranked)) {
    const m = s.tags.macrostructure;
    if (m) exemplarCounts.set(m, (exemplarCounts.get(m) ?? 0) + 1);
  }
  return [...hits.entries()]
    .map(([slug, n]) => ({
      slug,
      label: MACROSTRUCTURE_LABELS[slug],
      hits: n,
      exemplars: exemplarCounts.get(slug) ?? 0,
    }))
    .sort((a, b) => b.hits - a.hits || b.exemplars - a.exemplars)
    .slice(0, topN);
}
