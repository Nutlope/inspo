/**
 * Build the review page for the auth-wall scan.
 *
 *   node src/build-auth-review.mjs
 *
 * The scan decides; you decide what goes. Every flagged capture is
 * shown at size with what the model saw and what it was filed as, so a
 * wrong call is obvious at a glance rather than buried in a slug list.
 *
 * Ticking a card and hitting Copy produces the exact line format
 * `delete-screens.ts --from-file` consumes. Note SCREENS, not SITES:
 * these are page-level slugs, and delete-sites.ts matches on siteSlug,
 * so feeding it this list would silently delete almost nothing.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const scan = JSON.parse(readFileSync(resolve(ROOT, "mcp-eval-4/auth-scan.json"), "utf8"));
const seed = JSON.parse(
  readFileSync(resolve(ROOT, "packages/db/src/static-screens.json"), "utf8"),
);

const pagesPerSite = new Map();
for (const r of seed) pagesPerSite.set(r.siteSlug, (pagesPerSite.get(r.siteSlug) ?? 0) + 1);

/* The scan is a snapshot; the catalogue moves under it as rows get
   pruned. Anything already removed is dropped from the page rather
   than shown as a live candidate - a review list offering to delete
   what is already gone is worse than useless. */
const live = new Set(seed.map((r) => r.slug));
const alreadyRemoved = scan.verdicts.filter(
  (v) => (v.verdict === "locked" || v.verdict === "partial") && !live.has(v.slug),
).length;

const flagged = scan.verdicts
  .filter((v) => v.verdict === "locked" || v.verdict === "partial")
  .filter((v) => live.has(v.slug))
  .map((v) => ({
    ...v,
    sitePages: pagesPerSite.get(v.siteSlug) ?? 1,
    // A locked capture on a site with other captures is a page-level
    // cut; a locked LANDING page means the whole site is a dead entry.
    scope: v.pageType === "landing" ? "site" : "page",
  }))
  .sort(
    (a, b) =>
      (a.verdict === b.verdict ? 0 : a.verdict === "locked" ? -1 : 1) ||
      (b.scope === "site") - (a.scope === "site") ||
      b.confidence - a.confidence ||
      a.slug.localeCompare(b.slug),
  );

const tally = {};
for (const v of scan.verdicts) tally[v.verdict] = (tally[v.verdict] ?? 0) + 1;
const byType = {};
for (const f of flagged) byType[f.pageType] = (byType[f.pageType] ?? 0) + 1;

const DATA = JSON.stringify({
  alreadyRemoved,
  scanned: scan.verdicts.length,
  total: scan.total,
  model: scan.model,
  tally,
  byType,
  flagged,
});

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auth-wall review · Inspo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<style>
 :root{--paper:#f4f1ec;--paper-2:#ebe6de;--ink:#1b1a18;--ink-2:#6b6660;--rule:#d8d2c8;--accent:#c7402f;--ok:#3f6b4a;
   --display:"Fraunces",Georgia,serif;--body:"Inter Tight",system-ui,sans-serif}
 @media(prefers-color-scheme:dark){:root{--paper:#16150f;--paper-2:#1e1d16;--ink:#ece7dd;--ink-2:#918b80;--rule:#33312a;--accent:#e2705c;--ok:#7fae87}}
 *{box-sizing:border-box}
 body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
 .wrap{max-width:1560px;margin:0 auto;padding-inline:28px}
 header{border-bottom:1px solid var(--rule);padding-block:36px}
 h1{font-family:var(--display);font-weight:600;font-size:32px;margin:0 0 6px;letter-spacing:-.01em}
 .sub{color:var(--ink-2);max-width:70ch;margin:0}
 table{border-collapse:collapse;margin-top:18px;font-variant-numeric:tabular-nums}
 td,th{text-align:right;padding:5px 14px 5px 0}
 td:first-child,th:first-child{text-align:left}
 th{font-weight:500;color:var(--ink-2);font-size:12px}
 .bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;
   padding-block:14px;background:var(--paper);border-bottom:1px solid var(--rule)}
 button{font:inherit;font-size:13px;color:var(--ink);cursor:pointer;background:transparent;
   border:1px solid var(--rule);border-radius:2px;padding:5px 11px}
 button:hover{background:var(--paper-2)}
 button[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
 button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
 .count{margin-left:auto;color:var(--ink-2);font-variant-numeric:tabular-nums}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(21rem,1fr));gap:18px;padding-block:26px}
 figure{margin:0;border:1px solid var(--rule);border-radius:3px;overflow:hidden;background:var(--paper-2)}
 figure.marked{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
 .shot{display:block;position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--paper-2)}
 .shot img{width:100%;height:100%;object-fit:cover;object-position:50% 0%;display:block}
 figcaption{padding:11px 13px 13px}
 .row1{display:flex;align-items:baseline;gap:8px}
 .title{font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .chip{font-size:11px;padding:1px 7px;border:1px solid var(--rule);border-radius:2px;white-space:nowrap}
 .chip.locked{color:var(--accent);border-color:var(--accent)}
 .chip.partial{color:var(--ink-2)}
 .chip.site{background:var(--accent);color:#fff;border-color:var(--accent)}
 .what{color:var(--ink-2);font-size:12.5px;margin-top:5px}
 .meta{color:var(--ink-2);font-size:11.5px;margin-top:6px;font-family:ui-monospace,monospace;
   overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .acts{display:flex;gap:7px;margin-top:10px}
 .acts a{font-size:12px;color:var(--ink-2);text-decoration:none;border-bottom:1px solid var(--rule)}
 .acts a:hover{color:var(--accent)}
 textarea{width:100%;height:190px;font-family:ui-monospace,monospace;font-size:12px;
   background:var(--paper-2);color:var(--ink);border:1px solid var(--rule);border-radius:2px;padding:12px}
 footer{padding-block:26px 70px}
</style></head><body>
<header><div class="wrap">
 <h1>Captures that are really a sign-in wall</h1>
 <p class="sub">Every capture in the archive was shown to a vision model and asked one question: would a visitor see this page, or is it gated? Below are the ones it says are gated. <strong>Nothing is deleted by this page</strong> — tick what you want gone and copy the list.</p>
 <table id="summary"></table>
</div></header>

<div class="wrap bar">
 <span style="color:var(--ink-2);font-size:12px">Show</span>
 <button data-f="all" aria-pressed="true">All flagged</button>
 <button data-f="locked" aria-pressed="false">Locked only</button>
 <button data-f="site" aria-pressed="false">Whole-site (landing gated)</button>
 <button data-f="mislabelled" aria-pressed="false">Filed as something else</button>
 <button id="markall">Tick all shown</button>
 <button id="clear">Clear ticks</button>
 <button id="copy" class="primary">Copy removal list</button>
 <span class="count" id="count"></span>
</div>

<main class="wrap"><div class="grid" id="grid"></div></main>

<footer class="wrap">
 <p class="sub" style="margin-bottom:10px">Removal list — feed to <code>delete-screens.ts --from-file</code> (page-level; <code>delete-sites.ts</code> matches whole sites and would ignore most of these):</p>
 <textarea id="out" readonly></textarea>
</footer>

<script>
const D = ${DATA};
const marked = new Set(JSON.parse(localStorage.getItem("authwall-marked") || "[]"));
let filter = "all";

const st = document.getElementById("summary");
st.innerHTML = "<tr><th>Scanned</th><th>Open</th><th>Partial</th><th>Locked</th><th>Already removed</th><th>Still to review</th></tr>" +
 "<tr><td>" + D.scanned + " / " + D.total + "</td><td>" + (D.tally.open||0) + "</td><td>" +
 (D.tally.partial||0) + "</td><td>" + (D.tally.locked||0) + "</td><td>" + D.alreadyRemoved +
 "</td><td><strong>" + D.flagged.length + "</strong></td></tr>";

function shown(){
  return D.flagged.filter(f =>
    filter === "all" ? true :
    filter === "locked" ? f.verdict === "locked" :
    filter === "site" ? f.scope === "site" :
    f.pageType !== "auth");
}
function save(){ localStorage.setItem("authwall-marked", JSON.stringify([...marked])); }

function render(){
  const list = shown();
  document.getElementById("grid").innerHTML = list.map(f => {
    const on = marked.has(f.slug);
    return '<figure class="' + (on?"marked":"") + '" data-slug="' + f.slug + '">' +
      '<span class="shot"><img loading="lazy" src="' + f.hero + '" alt=""></span>' +
      '<figcaption>' +
        '<div class="row1"><span class="title">' + f.title + '</span>' +
          '<span class="chip ' + f.verdict + '">' + f.verdict + ' ' + f.confidence + '</span></div>' +
        '<div class="what">' + f.what + '</div>' +
        '<div class="meta">' + f.pageType + ' · ' + f.slug + '</div>' +
        '<div class="acts">' +
          (f.scope === "site" ? '<span class="chip site">whole site · ' + f.sitePages + ' pages</span>' : '') +
          '<a href="' + f.sourceUrl + '" target="_blank" rel="noopener">live ↗</a>' +
          '<a href="' + f.hero + '" target="_blank" rel="noopener">full shot ↗</a>' +
        '</div>' +
      '</figcaption></figure>';
  }).join("");
  document.getElementById("count").textContent = list.length + " shown · " + marked.size + " ticked";
  document.getElementById("out").value = [...marked].sort().join("\\n");
}

document.getElementById("grid").addEventListener("click", e => {
  const fig = e.target.closest("figure");
  if (!fig || e.target.closest("a")) return;
  const s = fig.dataset.slug;
  marked.has(s) ? marked.delete(s) : marked.add(s);
  save(); render();
});
for (const b of document.querySelectorAll("[data-f]")) {
  b.addEventListener("click", () => {
    filter = b.dataset.f;
    for (const x of document.querySelectorAll("[data-f]")) x.setAttribute("aria-pressed", String(x===b));
    render();
  });
}
document.getElementById("markall").onclick = () => { for (const f of shown()) marked.add(f.slug); save(); render(); };
document.getElementById("clear").onclick = () => { marked.clear(); save(); render(); };
document.getElementById("copy").onclick = () => {
  const t = document.getElementById("out"); t.select();
  navigator.clipboard.writeText(t.value).then(() => {
    const b = document.getElementById("copy"); const o = b.textContent;
    b.textContent = "Copied " + marked.size; setTimeout(() => b.textContent = o, 1400);
  });
};
render();
</script></body></html>`;

const OUT = resolve(ROOT, "mcp-eval-4/auth-review.html");
writeFileSync(OUT, html);
console.log(
  `wrote ${OUT}\n  scanned ${scan.verdicts.length}/${scan.total}` +
    ` · already removed ${alreadyRemoved} · still to review ${flagged.length}`,
);
