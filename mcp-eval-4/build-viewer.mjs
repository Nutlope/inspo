/**
 * Build the eval-4 viewer: one static page, all twenty cells side by
 * side, with every number the run produced.
 *
 *   node mcp-eval-4/build-viewer.mjs
 *
 * Data is inlined into the HTML so the page works off disk; only the
 * screenshots are referenced by relative path.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const ARMS = [
  { id: "nothing", label: "Nothing", note: "no archive, no skill" },
  { id: "inspo-only", label: "Inspo only", note: "reference archive" },
  { id: "hallmark-only", label: "Hallmark only", note: "design skill" },
  { id: "both", label: "Both", note: "archive + skill" },
];
const BRIEFS = [
  { id: "m1-meditation", label: "Tenor", note: "walking meditation app" },
  { id: "m2-devtool", label: "Sightline", note: "CI observability" },
  { id: "m3-fintech", label: "Even", note: "freelancer savings" },
  { id: "m4-ceramics", label: "Kiln & Co", note: "ceramics studio" },
  { id: "m5-producttour", label: "Reelframe", note: "guided product tour" },
];

const usage = JSON.parse(readFileSync(join(ROOT, "usage.json"), "utf8"));
const shots = JSON.parse(readFileSync(join(ROOT, "_shots/report.json"), "utf8"));
const shotBy = Object.fromEntries(shots.map((s) => [s.key, s]));

/** Two Hallmark Floor rules that can be checked mechanically: gate 54
 *  (no eyebrow) and gate 38a-i (no italicised word in a roman
 *  heading). The only objective quality signal in the run. */
function patterns(html) {
  const eyebrow =
    /<(p|span|div)[^>]*class="[^"]*(eyebrow|kicker|overline|label|tag)[^"]*"[^>]*>[^<]{2,40}<\/\1>\s*<h[12]/i.test(
      html,
    );
  const italicH1 =
    /<h1[^>]*>[^<]*<(em|i)\b/i.test(html) ||
    /<h1[^>]*>[\s\S]{0,200}?font-style:\s*italic/i.test(html);
  return { eyebrow, italicH1 };
}

function inspoCalls(notes) {
  const m = notes.match(/inspo:\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
}

const cells = [];
for (const arm of ARMS) {
  for (const brief of BRIEFS) {
    const key = `${arm.id}/${brief.id}`;
    const dir = join(ROOT, arm.id, brief.id);
    const htmlPath = join(dir, "index.html");
    const notesPath = join(dir, "NOTES.md");
    const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
    const notes = existsSync(notesPath) ? readFileSync(notesPath, "utf8") : "";
    const u = usage[key] ?? {};
    const s = shotBy[key] ?? {};
    cells.push({
      key,
      arm: arm.id,
      brief: brief.id,
      tokens: u.tokens ?? null,
      toolUses: u.toolUses ?? null,
      secs: u.durationMs ? Math.round(u.durationMs / 1000) : null,
      inspo: inspoCalls(notes),
      kb: existsSync(htmlPath) ? Math.round(statSync(htmlPath).size / 1024) : null,
      height: s.docHeight ?? null,
      foldOk: s.heroBottomPx != null ? s.heroBottomPx <= 800 : null,
      ovf: s.overflowPx ?? null,
      mobOvf: s.mobileOverflowPx ?? null,
      ...patterns(html),
      shot: `_shots/${arm.id}__${brief.id}`,
      page: `${arm.id}/${brief.id}/index.html`,
    });
  }
}

const byArm = ARMS.map((a) => {
  const rows = cells.filter((c) => c.arm === a.id);
  const avg = (f) => Math.round(rows.reduce((n, r) => n + (r[f] ?? 0), 0) / rows.length);
  return {
    ...a,
    tokens: avg("tokens"),
    toolUses: avg("toolUses"),
    secs: avg("secs"),
    kb: avg("kb"),
    eyebrow: rows.filter((r) => r.eyebrow).length,
    italicH1: rows.filter((r) => r.italicH1).length,
  };
});

const DATA = JSON.stringify({ arms: ARMS, briefs: BRIEFS, cells, byArm });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Eval 4 · Inspo × Hallmark</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --paper: #f4f1ec;
    --paper-2: #ebe6de;
    --ink: #1b1a18;
    --ink-2: #6b6660;
    --rule: #d8d2c8;
    --accent: #c7402f;
    --ok: #3f6b4a;
    --bad: #b0472f;
    --display: "Fraunces", Georgia, serif;
    --body: "Inter Tight", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #16150f; --paper-2: #1e1d16; --ink: #ece7dd;
      --ink-2: #918b80; --rule: #33312a; --accent: #e2705c;
      --ok: #7fae87; --bad: #d9836c;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font-family: var(--body); font-size: 14px; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1560px; margin: 0 auto; padding-inline: 28px; }
  .band { padding-block: 40px; }
  header { border-bottom: 1px solid var(--rule); }
  h1 {
    font-family: var(--display); font-weight: 600; font-size: 34px;
    margin: 0 0 6px; letter-spacing: -0.01em;
  }
  .sub { color: var(--ink-2); max-width: 62ch; margin: 0; }
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 19px;
    margin: 0 0 14px; letter-spacing: -0.01em;
  }
  table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
  th, td { text-align: right; padding: 7px 12px; border-bottom: 1px solid var(--rule); }
  th:first-child, td:first-child { text-align: left; }
  th { font-weight: 500; color: var(--ink-2); font-size: 12px; }
  .scroll { overflow-x: auto; }
  .ok { color: var(--ok); } .bad { color: var(--bad); }

  .controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    padding-block: 18px; border-bottom: 1px solid var(--rule);
    position: sticky; top: 0; background: var(--paper); z-index: 5; }
  button {
    font: inherit; font-size: 13px; color: var(--ink); cursor: pointer;
    background: transparent; border: 1px solid var(--rule);
    border-radius: 2px; padding: 5px 11px;
    transition: background 140ms ease, border-color 140ms ease;
  }
  button:hover { background: var(--paper-2); }
  button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .ctl-label { color: var(--ink-2); font-size: 12px; margin-right: 2px; }

  .row { padding-block: 30px; border-bottom: 1px solid var(--rule); }
  .row-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
  .row-head strong { font-family: var(--display); font-size: 20px; font-weight: 600; }
  .row-head span { color: var(--ink-2); }
  .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  @media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 620px) { .grid { grid-template-columns: minmax(0, 1fr); } }

  figure { margin: 0; }
  .shot {
    display: block; border: 1px solid var(--rule); background: var(--paper-2);
    overflow: hidden; border-radius: 2px; aspect-ratio: 16 / 10;
  }
  .shot.tall { aspect-ratio: auto; max-height: 460px; overflow-y: auto; }
  .shot img { display: block; width: 100%; height: auto; }
  .shot:hover { border-color: var(--ink-2); }
  .shot:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  figcaption { padding-top: 8px; }
  .cap-arm { font-weight: 500; }
  .cap-note { color: var(--ink-2); font-size: 12px; }
  .stats { margin-top: 6px; color: var(--ink-2); font-size: 12px;
    font-variant-numeric: tabular-nums; display: flex; flex-wrap: wrap; gap: 4px 10px; }
  .flags { margin-top: 5px; display: flex; gap: 6px; flex-wrap: wrap; }
  .flag { font-size: 11px; padding: 1px 6px; border: 1px solid var(--rule); border-radius: 2px; }
  .flag.hit { color: var(--bad); border-color: var(--bad); }
  .flag.clean { color: var(--ok); border-color: var(--ok); }
  footer { padding-block: 30px 60px; color: var(--ink-2); }
  a { color: inherit; }
</style>
</head>
<body>
<header class="band">
  <div class="wrap">
    <h1>Eval 4 · four arms, five briefs, twenty pages</h1>
    <p class="sub">Every page below was built by one agent under one condition. The only variable is which design aids it could reach for. Click any screenshot to open the live page.</p>
  </div>
</header>

<section class="band wrap">
  <h2>Cost, averaged per arm</h2>
  <div class="scroll"><table id="summary"></table></div>
</section>

<section class="band wrap" style="padding-top:0">
  <h2>Banned patterns, counted across all twenty</h2>
  <p class="sub" style="margin-bottom:14px">Two design-skill floor rules that can be checked mechanically rather than judged: no eyebrow before a heading, and no italicised word inside a roman heading. The only objective quality signal in the run.</p>
  <div class="scroll"><table id="patterns"></table></div>
</section>

<div class="wrap controls">
  <span class="ctl-label">View</span>
  <button data-view="fold" aria-pressed="true">Fold 1280×800</button>
  <button data-view="full" aria-pressed="false">Full page</button>
  <button data-view="mobile" aria-pressed="false">Mobile 375</button>
</div>

<main id="rows"></main>

<footer class="wrap">
  Written up in <a href="REPORT.md">REPORT.md</a>. Per-cell rationale in each <code>NOTES.md</code>.
</footer>

<script>
const D = ${DATA};
let view = "fold";

const fmt = n => n == null ? "—" : n.toLocaleString();
const mmss = s => s == null ? "—" : Math.floor(s/60) + "m" + String(s%60).padStart(2,"0") + "s";

function table(el, head, rows) {
  el.innerHTML =
    "<thead><tr>" + head.map(h => "<th>" + h + "</th>").join("") + "</tr></thead>" +
    "<tbody>" + rows.map(r => "<tr>" + r.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody>";
}

table(document.getElementById("summary"),
  ["Arm", "Tokens", "Tool calls", "Wall", "Page size"],
  D.byArm.map(a => [
    "<strong>" + a.label + "</strong> <span class='cap-note'>" + a.note + "</span>",
    fmt(a.tokens), a.toolUses, mmss(a.secs), a.kb + " KB",
  ]));

table(document.getElementById("patterns"),
  ["Arm", "Eyebrow", "Italic in heading"],
  D.byArm.map(a => {
    const cell = n => "<span class='" + (n === 0 ? "ok" : "bad") + "'>" + n + " / 5</span>";
    return ["<strong>" + a.label + "</strong>", cell(a.eyebrow), cell(a.italicH1)];
  }));

function cellHtml(c) {
  const arm = D.arms.find(a => a.id === c.arm);
  const flag = (label, hit) =>
    "<span class='flag " + (hit ? "hit" : "clean") + "'>" + label + (hit ? "" : " ✓") + "</span>";
  return "<figure>" +
    "<a class='shot" + (view === "full" ? " tall" : "") + "' href='" + c.page + "' target='_blank' rel='noopener'>" +
      "<img loading='lazy' alt='" + c.key + "' src='" + c.shot + "." + view + ".png'>" +
    "</a>" +
    "<figcaption>" +
      "<div class='cap-arm'>" + arm.label + "</div>" +
      "<div class='stats'>" +
        "<span>" + fmt(c.tokens) + " tok</span>" +
        "<span>" + c.toolUses + " calls</span>" +
        (c.inspo ? "<span>" + c.inspo + " inspo</span>" : "") +
        "<span>" + mmss(c.secs) + "</span>" +
        "<span>" + c.kb + " KB</span>" +
        "<span>" + fmt(c.height) + "px tall</span>" +
      "</div>" +
      "<div class='flags'>" +
        flag("eyebrow", c.eyebrow) +
        flag("italic head", c.italicH1) +
        "<span class='flag " + (c.foldOk ? "clean" : "hit") + "'>fold" + (c.foldOk ? " ✓" : " ✗") + "</span>" +
        "<span class='flag " + (!c.ovf && !c.mobOvf ? "clean" : "hit") + "'>no overflow" + (!c.ovf && !c.mobOvf ? " ✓" : " ✗") + "</span>" +
      "</div>" +
    "</figcaption></figure>";
}

function render() {
  document.getElementById("rows").innerHTML = D.briefs.map(b =>
    "<section class='row'><div class='wrap'>" +
      "<div class='row-head'><strong>" + b.label + "</strong><span>" + b.note + "</span></div>" +
      "<div class='grid'>" +
        D.arms.map(a => cellHtml(D.cells.find(c => c.arm === a.id && c.brief === b.id))).join("") +
      "</div>" +
    "</div></section>").join("");
}

for (const btn of document.querySelectorAll("[data-view]")) {
  btn.addEventListener("click", () => {
    view = btn.dataset.view;
    for (const b of document.querySelectorAll("[data-view]"))
      b.setAttribute("aria-pressed", String(b === btn));
    render();
  });
}
render();
</script>
</body>
</html>`;

writeFileSync(join(ROOT, "index.html"), html);
console.log(`wrote ${join(ROOT, "index.html")} · ${cells.length} cells`);
