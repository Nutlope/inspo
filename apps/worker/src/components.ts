/**
 * Component-region extractor.
 *
 * Scans the live DOM for semantically-meaningful page chunks (nav,
 * hero, pricing, features, cta, testimonial, logo-cloud, footer, faq,
 * stat) and returns page-absolute pixel bounding boxes. Crops are
 * served later by Sharp against the stored full-page PNG — no
 * re-rendering needed at request time.
 *
 * Each detector returns 0..N regions, deduped + clamped to viewport
 * sanity bounds. The list is intentionally short and high-precision;
 * we'd rather miss a region than mislabel one (a "pricing" tile that
 * isn't pricing is worse than no pricing tile).
 */

import type { Page } from "playwright";
import type { ComponentRegion } from "@inspo/db/schema";

export async function extractComponents(page: Page): Promise<ComponentRegion[]> {
  // Scroll to top so getBoundingClientRect doesn't trip on stickies
  // we'd already passed. Then add scrollY into the page-absolute coords.
  await page.evaluate("window.scrollTo(0, 0)").catch(() => {});

  const raw = await page.evaluate(SCAN_SCRIPT);
  return sanitise(raw as RawRegion[]);
}

type RawRegion = {
  type: ComponentRegion["type"];
  top: number;
  left: number;
  width: number;
  height: number;
  label?: string;
};

function sanitise(rows: RawRegion[]): ComponentRegion[] {
  const out: ComponentRegion[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (
      r.width < 200 ||
      r.height < 60 ||
      r.width > 5000 ||
      r.height > 5000 ||
      r.top < 0 ||
      r.left < 0
    )
      continue;
    // Drop near-duplicates (same type within 16px of each other).
    const key = `${r.type}:${Math.round(r.top / 16)}:${Math.round(r.left / 16)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type: r.type,
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
      label: r.label?.slice(0, 80),
    });
    if (out.length >= 40) break; // hard cap
  }
  return out;
}

/* ─────────────────────────────── browser-side script ─────────────────
 * Same in-page-as-string pattern as extract.ts — tsx/esbuild rewrites
 * named inner functions to use __name, which the page context doesn't
 * have. Keep this monolithic and pure-string.
 */
const SCAN_SCRIPT = `(() => {
  const out = [];
  const seen = new Set();
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

  const pageRect = (el) => {
    const r = el.getBoundingClientRect();
    return {
      top: r.top + scrollY,
      left: r.left,
      width: r.width,
      height: r.height,
    };
  };

  const push = (type, el, label) => {
    if (!el || !(el instanceof HTMLElement)) return;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    const pr = pageRect(el);
    if (pr.width < 200 || pr.height < 60) return;
    // Dedupe by element identity (don't add the same node under two types).
    const id = (el.dataset.__inspoId ||= String(Math.random()));
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ type, ...pr, label: (label || el.textContent || '').trim().slice(0, 80) });
  };

  /* ── nav ──────────────────────────────────────────── */
  // First nav-shaped element near the top.
  const navCands = Array.from(
    document.querySelectorAll('header, nav, [role="banner"]'),
  );
  for (const n of navCands.slice(0, 4)) {
    const r = n.getBoundingClientRect();
    if (r.top + scrollY < 200 && r.height < 200 && r.width > 600) {
      push('nav', n);
      break;
    }
  }

  /* ── hero ─────────────────────────────────────────── */
  // First H1 ancestor that's section/main/div-shaped and at least 1/3
  // of viewport height. Walks up to the first wide block.
  const h1 = document.querySelector('h1');
  if (h1) {
    let cand = h1;
    for (let i = 0; i < 8 && cand && cand.parentElement; i += 1) {
      const r = cand.getBoundingClientRect();
      if (r.width > window.innerWidth * 0.7 && r.height > window.innerHeight * 0.35) {
        push('hero', cand, h1.textContent || '');
        break;
      }
      cand = cand.parentElement;
    }
  }

  /* ── pricing ──────────────────────────────────────── */
  // Sections with 2-4 sibling cards each containing $ or text like
  // "free", "pro", "team" + a button.
  const sections = Array.from(document.querySelectorAll('section, div'));
  for (const sec of sections) {
    const text = (sec.textContent || '').toLowerCase();
    if (!/\\$\\d|free|pro|team|starter|business|enterprise|month|per.*user/i.test(text)) continue;
    const childCards = Array.from(sec.children).filter((c) => {
      if (!(c instanceof HTMLElement)) return false;
      const t = (c.textContent || '').toLowerCase();
      return /\\$\\d|month|year|free|pro|team|enterprise/i.test(t) && c.offsetWidth > 180;
    });
    if (childCards.length >= 2 && childCards.length <= 6) {
      push('pricing', sec, 'pricing');
      break; // at most one
    }
  }

  /* ── features (bento or 3-up) ─────────────────────── */
  // Sections that contain a grid of >=3 same-size children with icons/svgs.
  for (const sec of sections) {
    if (out.some((o) => o.type === 'features')) break;
    const cs = sec instanceof HTMLElement ? window.getComputedStyle(sec) : null;
    if (!cs) continue;
    if (cs.display !== 'grid' && cs.display !== 'flex') {
      // also accept sections that contain a grid child
      const gridChild = sec.querySelector(':scope > div[style*="grid-template"], :scope > div[class*="grid"]');
      if (!gridChild) continue;
    }
    const cards = Array.from(sec.querySelectorAll(':scope > * > *, :scope > *')).filter((c) => {
      if (!(c instanceof HTMLElement)) return false;
      const r = c.getBoundingClientRect();
      if (r.width < 220 || r.height < 120) return false;
      return c.querySelector('svg, img, [class*="icon"]');
    });
    if (cards.length >= 3 && cards.length <= 12) {
      push('features', sec, 'features');
    }
  }

  /* ── cta ──────────────────────────────────────────── */
  // Big visible button-rich section, not in the hero — usually
  // mid-page or near-footer. Heuristic: any wide section with
  // exactly 1-2 prominent buttons and < 200 chars of text.
  for (const sec of sections) {
    if (out.some((o) => o.type === 'cta')) break;
    const r = sec.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.7) continue;
    if (r.height < 160 || r.height > 600) continue;
    if (r.top + scrollY < 500) continue; // not at top (that's hero)
    const buttons = sec.querySelectorAll('a[class*="button" i], a[class*="btn" i], button');
    const text = (sec.textContent || '').trim();
    if (buttons.length >= 1 && buttons.length <= 3 && text.length < 300 && text.length > 10) {
      push('cta', sec, text.slice(0, 80));
    }
  }

  /* ── testimonial ──────────────────────────────────── */
  for (const sec of sections) {
    if (out.some((o) => o.type === 'testimonial')) break;
    const text = (sec.textContent || '').toLowerCase();
    if (!/testimonial|customers? say|trusted by|reviews?|"|"|"/.test(text)) continue;
    const quotes = sec.querySelectorAll('blockquote, q, [class*="quote" i], [class*="testimonial" i]');
    if (quotes.length >= 1) {
      push('testimonial', sec, 'testimonial');
    }
  }

  /* ── logo cloud ───────────────────────────────────── */
  // A row of >=4 logos in a strip.
  for (const sec of sections) {
    if (out.some((o) => o.type === 'logo-cloud')) break;
    const r = sec.getBoundingClientRect();
    if (r.height > 300 || r.width < window.innerWidth * 0.5) continue;
    const logos = sec.querySelectorAll('img, svg');
    let visible = 0;
    for (const l of Array.from(logos)) {
      if (!(l instanceof HTMLElement || l instanceof SVGElement)) continue;
      const lr = l.getBoundingClientRect();
      if (lr.width > 60 && lr.width < 240 && lr.height > 20 && lr.height < 120) visible += 1;
    }
    if (visible >= 4) push('logo-cloud', sec, 'logo cloud');
  }

  /* ── faq ──────────────────────────────────────────── */
  // <details> stack or section with several "?-ending" headings.
  const detailsParent = (() => {
    const ds = Array.from(document.querySelectorAll('details'));
    if (ds.length < 3) return null;
    let p = ds[0].parentElement;
    while (p && p.parentElement && Array.from(p.children).filter((c) => c.tagName === 'DETAILS').length < 3) {
      p = p.parentElement;
    }
    return p;
  })();
  if (detailsParent) push('faq', detailsParent, 'faq');

  /* ── stat strip ───────────────────────────────────── */
  // 3-4 large numbers in a row.
  for (const sec of sections) {
    if (out.some((o) => o.type === 'stat')) break;
    const bigNums = Array.from(sec.querySelectorAll('*')).filter((c) => {
      if (!(c instanceof HTMLElement)) return false;
      const t = (c.textContent || '').trim();
      if (!/^[\\$£€]?\\d[\\d,.]*[%+kKmMbB]?$/.test(t)) return false;
      const cs = window.getComputedStyle(c);
      return parseFloat(cs.fontSize) > 36;
    });
    if (bigNums.length >= 3 && bigNums.length <= 8) {
      push('stat', sec, 'stats');
    }
  }

  /* ── footer ───────────────────────────────────────── */
  const footers = Array.from(document.querySelectorAll('footer, [role="contentinfo"]'));
  for (const f of footers.slice(0, 2)) {
    const r = f.getBoundingClientRect();
    if (r.height > 80 && r.width > 600) {
      push('footer', f);
      break;
    }
  }

  return out;
})()`;
