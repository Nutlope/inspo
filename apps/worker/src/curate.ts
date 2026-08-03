/**
 * Curation server - review the whole catalogue and mark sites for removal.
 *
 * Serves a local review UI over every site in the seed, with the live
 * revisit status attached so dead and redirected captures sort to the
 * front. Clicking a card marks it; Save writes the marked slugs, one per
 * line, to captures/_reports/removals.txt - which is exactly the format
 * `delete-sites.ts --from-file=` consumes.
 *
 *   pnpm tsx src/curate.ts              serve on 4900
 *   pnpm tsx src/curate.ts --port=5100
 *
 * Then:
 *   pnpm tsx src/delete-sites.ts --from-file=captures/_reports/removals.txt
 *   pnpm tsx src/delete-sites.ts --from-file=captures/_reports/removals.txt --apply
 *
 * Selections survive a refresh (localStorage) and a restart (the file is
 * read back on boot), so a 870-site pass can be done over several
 * sittings. Nothing here mutates the catalogue; it only writes the list.
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");
const SEED = join(REPO_ROOT, "packages", "db", "src", "static-screens.json");
const REPORTS = join(import.meta.dirname, "..", "captures", "_reports");
const OUT = join(REPORTS, "removals.txt");

const PORT = Number(
  process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? 4900,
);

type Row = {
  slug: string;
  siteSlug: string;
  title?: string;
  sourceUrl?: string;
  capturedAt?: string;
  mode?: string;
  thumbUrl?: string;
  thumbVariants?: { webp?: { w: number; url: string }[] };
  tags?: { style?: string[] };
};

type Site = {
  slug: string;
  title: string;
  url: string;
  captured: string;
  mode: string;
  status: string;
  thumb: string;
  pages: number;
  styles: string[];
};

/** Newest revisit report wins, so a slug reflects its latest known state. */
function revisitStatus(): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(REPORTS)) return out;
  const reports = readdirSync(REPORTS)
    .filter((f) => f.startsWith("revisit-") && f.endsWith(".json"))
    .map((f) => join(REPORTS, f))
    .sort();
  for (const f of reports) {
    try {
      const rep = JSON.parse(readFileSync(f, "utf8"));
      for (const r of rep.rows ?? []) if (r.slug && r.status) out.set(r.slug, r.status);
    } catch {
      /* a half-written report should not stop the review */
    }
  }
  return out;
}

function loadSites(): Site[] {
  const raw = JSON.parse(readFileSync(SEED, "utf8"));
  const rows: Row[] = Array.isArray(raw) ? raw : (raw.screens ?? raw);
  const status = revisitStatus();
  const pageCount = new Map<string, number>();
  for (const r of rows) pageCount.set(r.siteSlug, (pageCount.get(r.siteSlug) ?? 0) + 1);

  const sites: Site[] = [];
  for (const r of rows) {
    if (r.slug !== r.siteSlug) continue; // one card per site, landing row
    const webp = r.thumbVariants?.webp?.[0]?.url;
    sites.push({
      slug: r.siteSlug,
      title: r.title || r.siteSlug,
      url: r.sourceUrl ?? "",
      captured: (r.capturedAt ?? "").slice(0, 10),
      mode: r.mode ?? "",
      status: status.get(r.siteSlug) ?? "unchecked",
      thumb: webp ?? r.thumbUrl ?? "",
      pages: pageCount.get(r.siteSlug) ?? 1,
      styles: (r.tags?.style ?? []).slice(0, 2),
    });
  }
  // Broken first, then newest: the things most likely to be cut come first.
  const rank = (s: string) =>
    s === "dead" ? 0 : s === "redirected" ? 1 : s === "bot-blocked" ? 2 : s === "error" ? 3 : 9;
  sites.sort((a, b) => rank(a.status) - rank(b.status) || b.captured.localeCompare(a.captured));
  return sites;
}

function loadExisting(): string[] {
  if (!existsSync(OUT)) return [];
  return readFileSync(OUT, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

const sites = loadSites();
const preMarked = loadExisting();
const broken = sites.filter((s) => !["ok", "unchecked"].includes(s.status)).length;

const page = (): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Inspo curation - ${sites.length} sites</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --ground:#f6f7f8; --surface:#fff; --ink:#12161a; --muted:#69737c; --edge:#e1e5e8;
  --live:#2e7d5b; --flag:#a8571d; --cut:#bb3b30; --focus:#2f6194;
  --ui:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace;
}
@media (prefers-color-scheme:dark){:root{
  --ground:#101315; --surface:#181c1f; --ink:#e9ecee; --muted:#8d959c; --edge:#272d32;
  --live:#5cbb8c; --flag:#d9873f; --cut:#e0645a; --focus:#6fa8dc; }}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--ui);font-size:15px;line-height:1.5;
  -webkit-font-smoothing:antialiased}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.wrap{max-width:1400px;margin:0 auto;padding:0 20px}
.bar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--ground) 93%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--edge)}
.barin{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 0}
h1{font-size:15px;font-weight:650;margin:0;letter-spacing:-.01em}
input[type=search]{font:inherit;font-size:13px;padding:6px 12px;border-radius:7px;min-width:190px;
  border:1px solid var(--edge);background:var(--surface);color:var(--ink)}
.fbtn{font:inherit;font-size:13px;padding:5px 12px;border-radius:999px;cursor:pointer;
  border:1px solid var(--edge);background:var(--surface);color:var(--muted)}
.fbtn[aria-pressed=true]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
.tally{margin-left:auto;display:flex;gap:14px;font-size:13px;color:var(--muted)}
.tally b{color:var(--ink);font-weight:600}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:13px;padding:18px 0 130px}
.card{position:relative;background:var(--surface);border:1px solid var(--edge);border-radius:10px;
  overflow:hidden;cursor:pointer;transition:transform .12s,border-color .12s}
.card:hover{transform:translateY(-2px)}
.shot{aspect-ratio:16/10;background:var(--edge);overflow:hidden}
.shot img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;transition:filter .15s,opacity .15s}
.body{padding:10px 11px 11px}
.name{font-size:13px;font-weight:600;line-height:1.3;margin:0 0 3px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dom{margin:0;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}
.pill{font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:999px;white-space:nowrap}
.p-ok{color:var(--live);background:color-mix(in srgb,var(--live) 13%,transparent)}
.p-bad{color:var(--flag);background:color-mix(in srgb,var(--flag) 15%,transparent)}
.p-un{color:var(--muted);background:color-mix(in srgb,var(--muted) 13%,transparent)}
.sub{font-size:10.5px;color:var(--muted)}
.card.bad{border-color:color-mix(in srgb,var(--flag) 45%,var(--edge))}
.mark{position:absolute;top:7px;right:7px;font-size:10.5px;font-weight:650;padding:3px 9px;border-radius:999px;
  background:var(--cut);color:#fff;opacity:0;transition:opacity .12s;pointer-events:none}
.card:hover .mark{opacity:.5}
.card.cut{border-color:var(--cut)}
.card.cut .shot img{filter:grayscale(1);opacity:.35}
.card.cut .name{text-decoration:line-through;color:var(--muted)}
.card.cut .mark{opacity:1}
.dock{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--surface);border-top:1px solid var(--edge);
  box-shadow:0 -8px 24px -12px rgba(0,0,0,.3);transform:translateY(100%);transition:transform .18s}
.dock.on{transform:none}
.dockin{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:13px 0}
.slugs{flex:1;min-width:200px;font-size:11.5px;max-height:42px;overflow-y:auto;word-break:break-all;color:var(--muted)}
button.act{font:inherit;font-size:13px;font-weight:600;padding:8px 16px;border-radius:7px;cursor:pointer;
  border:1px solid var(--ink);background:var(--ink);color:var(--ground)}
button.ghost{font:inherit;font-size:13px;padding:8px 14px;border-radius:7px;cursor:pointer;
  border:1px solid var(--edge);background:transparent;color:var(--muted)}
.saved{font-size:13px;color:var(--live);font-weight:600}
.empty{padding:70px 0;text-align:center;color:var(--muted)}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style></head><body>
<div class="bar"><div class="wrap barin">
  <h1>Curation</h1>
  <input type="search" id="q" placeholder="Search name or domain" autocomplete="off">
  <button class="fbtn" data-f="all" aria-pressed="true">All ${sites.length}</button>
  <button class="fbtn" data-f="bad" aria-pressed="false">Broken ${broken}</button>
  <button class="fbtn" data-f="cut" aria-pressed="false">Marked <span id="fc">0</span></button>
  <div class="tally"><span><b class="mono" id="tKeep">${sites.length}</b> keeping</span>
    <span><b class="mono" id="tCut">0</b> to remove</span></div>
</div></div>
<div class="wrap"><div class="grid" id="grid"></div><p class="empty" id="empty" hidden>Nothing matches.</p></div>
<div class="dock" id="dock"><div class="wrap dockin">
  <p style="margin:0;font-size:13.5px"><b class="mono" id="dc">0</b> marked</p>
  <code class="slugs mono" id="ds"></code>
  <span class="saved" id="ok" hidden>Saved</span>
  <button class="act" id="save">Save list</button>
  <button class="ghost" id="clear">Clear all</button>
</div></div>
<script>
const SITES = ${JSON.stringify(sites)};
const cut = new Set(JSON.parse(localStorage.getItem("inspo.cut") || "null") || ${JSON.stringify(preMarked)});
let filter = "all", q = "";
const $ = (id) => document.getElementById(id);
const dom = (u) => u.replace(/^https?:\\/\\//, "").replace(/^www\\./, "").replace(/\\/$/, "");
const BAD = (s) => s !== "ok" && s !== "unchecked";

function build(){
  const frag = document.createDocumentFragment();
  for (const s of SITES){
    const el = document.createElement("article");
    el.className = "card" + (BAD(s.status) ? " bad" : "");
    el.dataset.slug = s.slug; el.dataset.status = s.status;
    el.dataset.hay = (s.title + " " + s.url + " " + s.slug).toLowerCase();
    el.tabIndex = 0; el.setAttribute("role","button");
    const cls = BAD(s.status) ? "p-bad" : s.status === "ok" ? "p-ok" : "p-un";
    const label = s.status === "ok" ? "Live" : s.status === "unchecked" ? "Unchecked" : s.status[0].toUpperCase()+s.status.slice(1);
    el.innerHTML =
      '<div class="shot">' + (s.thumb ? '<img loading="lazy" src="'+s.thumb+'" alt="">' : '') + '</div>' +
      '<div class="body"><h3 class="name"></h3><p class="dom"></p>' +
      '<div class="foot"><span class="pill '+cls+'">'+label+'</span>' +
      '<span class="sub mono">'+s.captured.slice(5)+' · '+s.pages+' pg</span></div></div>' +
      '<span class="mark">Remove</span>';
    el.querySelector(".name").textContent = s.title;
    el.querySelector(".dom").textContent = dom(s.url);
    const toggle = () => { cut.has(s.slug) ? cut.delete(s.slug) : cut.add(s.slug); persist(); render(); };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if(e.key===" "||e.key==="Enter"){ e.preventDefault(); toggle(); }});
    frag.appendChild(el);
  }
  $("grid").appendChild(frag);
}
function persist(){ localStorage.setItem("inspo.cut", JSON.stringify([...cut])); $("ok").hidden = true; }
function render(){
  let shown = 0;
  for (const el of $("grid").children){
    const s = el.dataset.slug;
    const okF = filter === "all" || (filter === "bad" && BAD(el.dataset.status)) || (filter === "cut" && cut.has(s));
    const okQ = !q || el.dataset.hay.includes(q);
    el.hidden = !(okF && okQ); if(!el.hidden) shown++;
    el.classList.toggle("cut", cut.has(s));
    el.setAttribute("aria-pressed", String(cut.has(s)));
  }
  $("empty").hidden = shown > 0;
  const list = [...cut];
  $("tCut").textContent = list.length; $("tKeep").textContent = SITES.length - list.length;
  $("fc").textContent = list.length; $("dc").textContent = list.length;
  $("ds").textContent = list.join(", ");
  $("dock").classList.toggle("on", list.length > 0);
}
for (const b of document.querySelectorAll(".fbtn"))
  b.addEventListener("click", () => { filter = b.dataset.f;
    document.querySelectorAll(".fbtn").forEach(x => x.setAttribute("aria-pressed", String(x===b))); render(); });
$("q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); render(); });
$("save").addEventListener("click", async () => {
  const r = await fetch("/save", { method:"POST", headers:{"content-type":"application/json"},
    body: JSON.stringify({ slugs: [...cut] }) });
  if (r.ok){ $("ok").hidden = false; $("save").textContent = "Save list"; }
  else $("save").textContent = "Save failed";
});
$("clear").addEventListener("click", () => { if(confirm("Clear all marks?")){ cut.clear(); persist(); render(); }});
build(); render();
</script></body></html>`;

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/save") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { slugs } = JSON.parse(body) as { slugs: string[] };
        const known = new Set(sites.map((s) => s.slug));
        const clean = [...new Set(slugs)].filter((s) => known.has(s)).sort();
        mkdirSync(REPORTS, { recursive: true });
        writeFileSync(
          OUT,
          `# Sites marked for removal in the curation UI.\n` +
            `# Feed to: pnpm tsx src/delete-sites.ts --from-file=captures/_reports/removals.txt --apply\n` +
            clean.join("\n") +
            (clean.length ? "\n" : ""),
        );
        console.log(`  saved ${clean.length} slug(s) -> ${OUT}`);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, count: clean.length }));
      } catch (err) {
        res.writeHead(400).end(String(err));
      }
    });
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page());
}).listen(PORT, () => {
  console.log(`\n  Inspo curation · ${sites.length} sites · ${broken} broken · ${preMarked.length} already marked`);
  console.log(`  open  http://localhost:${PORT}`);
  console.log(`  saves to captures/_reports/removals.txt\n`);
});
