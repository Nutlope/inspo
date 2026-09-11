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
 * read back on boot), so a pass over the whole archive can be spread
 * over several sittings. Nothing here mutates the catalogue; it only
 * writes the list.
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
  heroVariants?: { webp?: { w: number; url: string }[] };
  fullVariants?: { webp?: { w: number; url: string }[] };
  fullPageUrl?: string;
  imageUrl?: string;
  tags?: { style?: string[] };
};

/** Widest webp variant, falling back to the original PNG. */
function widest(v: { webp?: { w: number; url: string }[] } | undefined, fallback = ""): string {
  const webp = v?.webp;
  if (!webp?.length) return fallback;
  return webp.reduce((a, b) => (b.w > a.w ? b : a)).url;
}

type Site = {
  slug: string;
  title: string;
  url: string;
  captured: string;
  mode: string;
  status: string;
  thumb: string;
  hero: string;
  full: string;
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
      hero: widest(r.heroVariants, r.imageUrl ?? ""),
      full: widest(r.fullVariants, r.fullPageUrl ?? ""),
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
/* Card actions: viewing and opening must not toggle the mark, so they are
   real buttons that stop the click from reaching the card. */
.acts{position:absolute;top:7px;left:7px;display:flex;gap:5px;opacity:0;transition:opacity .12s}
.card:hover .acts,.card:focus-within .acts{opacity:1}
.acts a,.acts button{font:inherit;font-size:10.5px;font-weight:600;line-height:1;padding:5px 9px;border-radius:999px;
  cursor:pointer;text-decoration:none;border:1px solid var(--edge);
  background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(6px);color:var(--ink)}
.acts a:hover,.acts button:hover{border-color:var(--ink)}
/* Viewer */
.view{position:fixed;inset:0;z-index:50;background:color-mix(in srgb,var(--ground) 88%,transparent);
  backdrop-filter:blur(12px);display:none;flex-direction:column}
.view.on{display:flex}
.vbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 18px;border-bottom:1px solid var(--edge);
  background:var(--surface)}
.vtitle{font-size:14px;font-weight:650;margin:0}
.vurl{font-size:12px;color:var(--muted);text-decoration:none}
.vurl:hover{color:var(--ink);text-decoration:underline}
.vspacer{margin-left:auto;display:flex;gap:8px;align-items:center}
.vbtn{font:inherit;font-size:12.5px;padding:6px 12px;border-radius:7px;cursor:pointer;text-decoration:none;
  border:1px solid var(--edge);background:var(--surface);color:var(--ink)}
.vbtn[aria-pressed=true]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
.vbtn.danger{border-color:var(--cut);color:var(--cut)}
.vbtn.danger[aria-pressed=true]{background:var(--cut);color:#fff}
.vscroll{flex:1;overflow:auto;padding:20px;display:flex;justify-content:center;align-items:flex-start}
.vscroll img{max-width:1100px;width:100%;height:auto;display:block;border:1px solid var(--edge);border-radius:8px;
  background:var(--surface)}
.vhint{font-size:11.5px;color:var(--muted)}
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
<div class="view" id="view" role="dialog" aria-modal="true" aria-label="Site preview"><div class="vbar">
  <button class="vbtn" id="vprev" title="Previous (left arrow)">&larr;</button>
  <button class="vbtn" id="vnext" title="Next (right arrow)">&rarr;</button>
  <div><h2 class="vtitle" id="vtitle"></h2><a class="vurl" id="vurl" target="_blank" rel="noreferrer noopener"></a></div>
  <div class="vspacer">
    <span class="vhint">Esc closes &middot; X marks</span>
    <button class="vbtn" id="vhero" aria-pressed="true">Hero</button>
    <button class="vbtn" id="vfull" aria-pressed="false">Full page</button>
    <a class="vbtn" id="vopen" target="_blank" rel="noreferrer noopener">Open live site &#8599;</a>
    <button class="vbtn danger" id="vcut" aria-pressed="false">Mark for removal</button>
    <button class="vbtn" id="vclose">Close</button>
  </div>
</div><div class="vscroll" id="vscroll"><img id="vimg" alt=""></div></div>
<script>
const SITES = ${JSON.stringify(sites)};
const cut = new Set(JSON.parse(localStorage.getItem("inspo.cut") || "null") || ${JSON.stringify(preMarked)});
let filter = "all", q = "";
const $ = (id) => document.getElementById(id);
const dom = (u) => u.replace(/^https?:\\/\\//, "").replace(/^www\\./, "").replace(/\\/$/, "");
const BAD = (s) => s !== "ok" && s !== "unchecked";

// Thumbnails load through our own queue rather than loading="lazy" or an
// IntersectionObserver: with the whole archive on one page both of those
// can silently never fire (neither one runs while a tab is hidden), which
// left every card blank. Measuring rects on demand always works, and the
// in-flight cap keeps a full-catalogue scroll from opening hundreds of
// sockets at once.
const pending = [];
let inflight = 0;
const MAX_INFLIGHT = 20;
function pump(){
  if (!pending.length) return;
  // innerHeight can report 0 before the pane has a size; falling back keeps
  // the window from collapsing to nothing and stalling the queue.
  const vh = innerHeight || document.documentElement.clientHeight || 900;
  const top = -900, bottom = vh + 900;
  for (let i = 0; i < pending.length && inflight < MAX_INFLIGHT; ){
    const img = pending[i];
    const card = img.closest(".card");
    if (card.hidden){ i++; continue; }
    const r = img.getBoundingClientRect();
    if (r.bottom < top || r.top > bottom){ i++; continue; }
    pending.splice(i, 1);
    inflight++;
    const done = () => { inflight--; pump(); };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    img.src = img.dataset.src; delete img.dataset.src;
  }
}
// Throttled, and called directly rather than through requestAnimationFrame,
// which is paused while the tab is in the background. A slow timer keeps the
// queue moving even if a scroll event is missed.
let last = 0;
function schedule(){
  const now = performance.now();
  if (now - last < 120) return;
  last = now; pump();
}
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule);
setInterval(pump, 1200);

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
      '<div class="shot">' + (s.thumb ? '<img data-src="'+s.thumb+'" alt="">' : '') + '</div>' +
      '<div class="body"><h3 class="name"></h3><p class="dom"></p>' +
      '<div class="foot"><span class="pill '+cls+'">'+label+'</span>' +
      '<span class="sub mono">'+s.captured.slice(5)+' · '+s.pages+' pg</span></div></div>' +
      '<div class="acts"><button type="button" class="v">View</button>' +
      '<a class="o" target="_blank" rel="noreferrer noopener">Open &#8599;</a></div>' +
      '<span class="mark">Remove</span>';
    el.querySelector(".name").textContent = s.title;
    el.querySelector(".dom").textContent = dom(s.url);
    el.querySelector(".o").href = s.url;
    el.querySelector(".o").title = "Open " + dom(s.url) + " in a new tab";
    const img = el.querySelector("img");
    if (img) pending.push(img);
    const toggle = () => { cut.has(s.slug) ? cut.delete(s.slug) : cut.add(s.slug); persist(); render(); };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => {
      if(e.key===" "||e.key==="Enter"){ e.preventDefault(); toggle(); }
      if(e.key==="v"||e.key==="V"){ e.preventDefault(); open(s.slug); }
    });
    // Both actions sit on top of a card whose whole surface toggles the mark.
    for (const a of el.querySelectorAll(".acts a, .acts button"))
      a.addEventListener("click", (e) => e.stopPropagation());
    el.querySelector(".v").addEventListener("click", () => open(s.slug));
    frag.appendChild(el);
  }
  $("grid").appendChild(frag);
}

/* ---- viewer ---------------------------------------------------------- */
let viewing = -1, shot = "hero";
const visible = () => [...$("grid").children].filter((el) => !el.hidden).map((el) => el.dataset.slug);
function paint(){
  const s = SITES[viewing]; if(!s) return;
  $("vtitle").textContent = s.title;
  $("vurl").textContent = dom(s.url); $("vurl").href = s.url;
  $("vopen").href = s.url;
  const full = shot === "full" && s.full;
  $("vimg").src = full ? s.full : (s.hero || s.thumb);
  $("vhero").setAttribute("aria-pressed", String(!full));
  $("vfull").setAttribute("aria-pressed", String(!!full));
  $("vfull").disabled = !s.full;
  $("vfull").title = s.full ? "Whole page, top to bottom" : "No full-page capture for this site";
  $("vcut").setAttribute("aria-pressed", String(cut.has(s.slug)));
  $("vcut").textContent = cut.has(s.slug) ? "Marked for removal" : "Mark for removal";
  $("vscroll").scrollTop = 0;
}
function open(slug){
  viewing = SITES.findIndex((s) => s.slug === slug); if(viewing < 0) return;
  shot = "hero"; $("view").classList.add("on"); paint(); $("vclose").focus();
}
function close(){ $("view").classList.remove("on"); viewing = -1; }
/* Step through what the current filter and search actually show. */
function step(dir){
  const order = visible(); if(!order.length) return;
  const here = order.indexOf(SITES[viewing]?.slug);
  const next = order[(here + dir + order.length) % order.length];
  if(next){ viewing = SITES.findIndex((s) => s.slug === next); shot = "hero"; paint(); }
}
$("vclose").addEventListener("click", close);
$("view").addEventListener("click", (e) => { if(e.target === $("view")) close(); });
$("vprev").addEventListener("click", () => step(-1));
$("vnext").addEventListener("click", () => step(1));
$("vhero").addEventListener("click", () => { shot = "hero"; paint(); });
$("vfull").addEventListener("click", () => { shot = "full"; paint(); });
$("vcut").addEventListener("click", () => {
  const s = SITES[viewing]; if(!s) return;
  cut.has(s.slug) ? cut.delete(s.slug) : cut.add(s.slug); persist(); render(); paint();
});
document.addEventListener("keydown", (e) => {
  if(viewing < 0) return;
  if(e.key === "Escape") close();
  else if(e.key === "ArrowRight") step(1);
  else if(e.key === "ArrowLeft") step(-1);
  else if(e.key === "x" || e.key === "X") $("vcut").click();
  else if(e.key === "f" || e.key === "F") $("vfull").click();
});
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
  pump(); // filtering reflows the grid, so a new set of cards is now on screen
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
