/**
 * arena-gen.ts — agentic landing-page generation for the open-vs-closed "arena".
 *
 * Boots the REAL Inspo MCP server over stdio (same code path as call.ts), then
 * runs a Together AI chat-completions agentic loop: the model drives the Inspo
 * MCP via tool-calling to gather real design references, then emits a single
 * self-contained HTML landing page. We capture REAL wall-clock time, token
 * usage, cost, the Inspo tool-call timeline, and the final HTML.
 *
 *   node_modules/.bin/tsx src/arena-gen.ts <config.json>
 *
 * config.json: { model, label, vendor, priceIn, priceOut, brief, outDir, slug, maxTurns? }
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(__dirname, "server.ts");
const tsxBin = resolve(__dirname, "../node_modules/.bin/tsx");
const ENV_PATH = resolve(__dirname, "../../../.env"); // Inspo-design/.env

// ---- tiny .env loader ----
function loadEnv(p: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

const env = loadEnv(ENV_PATH);
const TOGETHER_API_KEY = env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY || "";
if (!TOGETHER_API_KEY) {
  console.error("missing TOGETHER_API_KEY");
  process.exit(2);
}

const cfgPath = process.argv[2];
if (!cfgPath) {
  console.error("usage: tsx src/arena-gen.ts <config.json>");
  process.exit(2);
}
const cfg = JSON.parse(readFileSync(cfgPath, "utf8")) as {
  model: string; label: string; vendor: string;
  priceIn: number; priceOut: number;
  brief: string; outDir: string; slug: string; maxTurns?: number;
  noTools?: boolean; system?: string;
};
const MAX_TURNS = cfg.maxTurns ?? 26;
const WALL_CAP_MS = 13 * 60 * 1000;

// curated, useful Inspo tool subset (keeps the model focused)
const TOOL_ALLOW = new Set([
  "recommend", "search_screens", "get_screen", "find_examples_for_macrostructure",
  "find_similar", "get_design_system", "study", "find_reference_components",
  "get_reference_jsx", "list_collections", "get_collection",
]);

// strip JSON-Schema keys Together's function-calling validator dislikes
function sanitizeSchema(s: any): any {
  if (Array.isArray(s)) return s.map(sanitizeSchema);
  if (s && typeof s === "object") {
    const o: any = {};
    for (const [k, v] of Object.entries(s)) {
      if (k === "$schema" || k === "additionalProperties") continue;
      o[k] = sanitizeSchema(v);
    }
    return o;
  }
  return s;
}

const SYSTEM = `You are a world-class frontend engineer and product designer. Build a COMPLETE, production-quality landing page as a SINGLE self-contained HTML file.

HARD RULES
- One file only. All CSS in a <style> tag, all JS inline. Google Fonts via <link> is allowed. No build step, no CSS/JS frameworks, and NO external image URLs (use CSS gradients, inline SVG, and emoji so the page renders perfectly offline).
- Make it visually striking, fully responsive, and genuinely usable: real product copy, a clear hero, multiple real sections, and a footer. No lorem ipsum and no empty placeholder boxes.
- Ground the design in REAL references. BEFORE writing any code, consult the Inspo design archive with the provided tools: start with recommend({brief}); then drill in with search_screens / get_design_system / find_examples_for_macrostructure as needed to choose a macrostructure, a real palette, and a type system taken from shipped sites. Keep tool use focused (a handful of calls, not dozens).
- Aim for the quality bar of a top design studio. Choose dark or light based on the brief and what the references suggest.

WORKFLOW
1) Call the Inspo tools to gather references (you MUST consult Inspo before coding).
2) Decide a direction in one short paragraph.
3) Output the final page as ONE fenced \`\`\`html block containing the entire document from <!doctype html> to </html>. Emitting that block ENDS the task; do not write anything after it.`;

type Step = { t: number; kind: "think" | "tool" | "write"; label: string; detail?: string };
let firstContentAt: number | null = null;

function primaryArg(name: string, args: any): string {
  if (!args || typeof args !== "object") return "";
  return String(args.brief || args.query || args.slug || args.name || args.url || args.type || "").slice(0, 80);
}

// streaming chat: SSE keeps the connection flowing so slow models don't hit
// client/gateway idle timeouts. Returns an OpenAI-shaped {usage, choices:[{message}]}.
async function togetherChat(messages: any[], tools: any[], toolChoice: string = "auto"): Promise<any> {
  let lastErr: any;
  for (let attempt = 0; attempt < 4; attempt++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 540000);
    try {
      const body: any = { model: cfg.model, messages, temperature: (cfg as any).temperature ?? 0.7, max_tokens: (cfg as any).maxTokens ?? 32000, stream: true, stream_options: { include_usage: true } };
      if ((cfg as any).topP != null) body.top_p = (cfg as any).topP;
      if (toolChoice !== "none") { body.tools = tools; body.tool_choice = toolChoice; }
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${TOGETHER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`together ${res.status}: ${t.slice(0, 180)}`); }
      const reader = (res.body as any).getReader();
      const dec = new TextDecoder();
      let buf = "", content = "", finish: string | null = null, usage: any = null, reasoningChars = 0;
      const tcs: any[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;
          let j: any; try { j = JSON.parse(payload); } catch { continue; }
          if (j.usage) usage = j.usage;
          const ch = j.choices?.[0];
          if (!ch) continue;
          if (ch.finish_reason) finish = ch.finish_reason;
          const d = ch.delta || {};
          if (d.reasoning || d.reasoning_content) {
            reasoningChars += (d.reasoning || d.reasoning_content).length;
            if (reasoningChars > 0 && reasoningChars % 50000 < 30) console.error(`[${cfg.label}] reasoning... ${Math.round(reasoningChars/1000)}k chars`);
          }
          if (d.content) {
            if (!content) console.error(`[${cfg.label}] streaming output...`);
            if (firstContentAt === null) firstContentAt = Date.now();
            content += d.content;
          }
          if (d.tool_calls) {
            for (const t of d.tool_calls) {
              const i = t.index ?? 0;
              if (!tcs[i]) tcs[i] = { id: t.id || `call_${i}`, type: "function", function: { name: "", arguments: "" } };
              if (t.id) tcs[i].id = t.id;
              if (t.function?.name) tcs[i].function.name = t.function.name;
              if (t.function?.arguments) tcs[i].function.arguments += t.function.arguments;
            }
          }
        }
      }
      const tool_calls = tcs.filter(Boolean);
      if (finish === "length") console.error(`[${cfg.label}] WARNING: hit max_tokens (reasoning ${Math.round(reasoningChars/1000)}k chars, content ${content.length} chars)`);
      return { usage: usage || {}, choices: [{ finish_reason: finish, message: { content, tool_calls: tool_calls.length ? tool_calls : undefined } }] };
    } catch (e: any) {
      lastErr = e;
      console.error(`[${cfg.label}] attempt ${attempt + 1} failed: ${String(e?.message || e).slice(0, 170)}`);
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    } finally {
      clearTimeout(to);
    }
  }
  throw lastErr;
}

function extractHtml(text: string): string | null {
  if (!text) return null;
  // fenced ```html ... ``` (prefer the longest)
  const fences = [...text.matchAll(/```(?:html)?\s*([\s\S]*?)```/gi)].map((m) => m[1]);
  let best: string | null = null;
  for (const f of fences) if (/<!doctype html|<html[\s>]/i.test(f) && (!best || f.length > best.length)) best = f;
  if (best) return best.trim();
  // unfenced doctype..</html>
  const m = text.match(/<!doctype html[\s\S]*<\/html>/i);
  return m ? m[0].trim() : null;
}

async function main() {
  let client: Client | null = null;
  let tools: any[] = [];
  if (!cfg.noTools) {
    const transport = new StdioClientTransport({ command: tsxBin, args: [serverEntry], env: (() => {
      const e: Record<string, string> = {};
      for (const [k, v] of Object.entries(process.env)) { if (k === "DATABASE_URL") continue; if (typeof v === "string") e[k] = v; }
      return e;
    })() });
    client = new Client({ name: "arena-gen", version: "0.0.0" });
    await client.connect(transport);
    const listed = await client.listTools();
    tools = listed.tools
      .filter((t) => TOOL_ALLOW.has(t.name))
      .map((t) => ({ type: "function", function: { name: t.name, description: (t.description || "").slice(0, 900), parameters: sanitizeSchema(t.inputSchema) || { type: "object", properties: {} } } }));
    console.error(`[${cfg.label}] inspo tools: ${tools.map((t) => t.function.name).join(", ")}`);
  } else {
    console.error(`[${cfg.label}] noTools mode (single-shot, no MCP)`);
  }

  const messages: any[] = [
    { role: "system", content: cfg.system || SYSTEM },
    { role: "user", content: cfg.noTools
      ? `TASK: ${cfg.brief}\n\nBuild it now. Output one final \`\`\`html block.`
      : `BRIEF: ${cfg.brief}\n\nBuild the landing page now. Remember: consult Inspo first, then output one final \`\`\`html block.` },
  ];

  const steps: Step[] = [];
  let promptTok = 0, completionTok = 0, inspoCalls = 0;
  const start = Date.now();
  let html: string | null = null;
  let nudges = 0;
  let forcedNudge = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (Date.now() - start > WALL_CAP_MS) { console.error("wall cap hit"); break; }
    const forceFinish = !cfg.noTools && inspoCalls >= ((cfg as any).maxTools ?? 14);
    if (forceFinish && !forcedNudge) {
      forcedNudge = true;
      messages.push({ role: "user", content: "You have gathered enough references. STOP calling tools and output the COMPLETE final page now as one fenced ```html block from <!doctype html> to </html>." });
      console.error(`[${cfg.label}] forcing finalize after ${inspoCalls} tool calls`);
    }
    const data = await togetherChat(messages, tools, (cfg.noTools || forceFinish) ? "none" : "auto");
    const u = data.usage || {};
    promptTok += u.prompt_tokens || 0;
    completionTok += u.completion_tokens || 0;
    const msg = data.choices?.[0]?.message || {};
    const tNow = (Date.now() - start) / 1000;

    const content: string = msg.content || "";
    const toolCalls = msg.tool_calls || [];

    if (content && content.trim()) steps.push({ t: tNow, kind: "think", label: content.trim().replace(/\s+/g, " ").slice(0, 140) });

    // try to finish if HTML present
    html = extractHtml(content);
    if (html) { steps.push({ t: tNow, kind: "write", label: "wrote final page" }); console.error(`[${cfg.label}] got HTML at turn ${turn} (${html.length} chars)`); break; }

    if (toolCalls.length) {
      // record assistant turn verbatim so tool results can be threaded
      messages.push({ role: "assistant", content: content || null, tool_calls: toolCalls });
      for (const tc of toolCalls) {
        const name = tc.function?.name;
        let args: any = {};
        try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
        let resultText = "";
        try {
          if (!client) throw new Error("no MCP client in noTools mode");
          const r: any = await client.callTool({ name, arguments: args });
          resultText = (r.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === "text").map((c) => c.text).join("\n");
        } catch (e: any) {
          resultText = JSON.stringify({ error: String(e?.message || e) });
        }
        inspoCalls++;
        const arg = primaryArg(name, args);
        steps.push({ t: (Date.now() - start) / 1000, kind: "tool", label: name, detail: arg });
        console.error(`[${cfg.label}] tool ${inspoCalls}: ${name}(${arg}) -> ${resultText.length}b`);
        messages.push({ role: "tool", tool_call_id: tc.id, content: resultText.slice(0, (cfg as any).toolTrunc ?? 4500) });
      }
      continue;
    }

    // no tool calls and no html: nudge once or twice, else give up
    if (nudges < 2) {
      nudges++;
      if (content && content.trim()) messages.push({ role: "assistant", content });
      messages.push({ role: "user", content: "Output the COMPLETE final page NOW as one fenced ```html block from <!doctype html> to </html>. Start the block immediately, no analysis or commentary." });
      console.error(`[${cfg.label}] nudge ${nudges} (content ${content.length} chars, no html)`);
      continue;
    }
    break;
  }

  if (client) await client.close();

  const durationSec = Math.round((Date.now() - start) / 10) / 100;
  const writeStartSec = firstContentAt ? Math.round((firstContentAt - start) / 10) / 100 : null;
  const totalTok = promptTok + completionTok;
  const costUSD = (promptTok * cfg.priceIn + completionTok * cfg.priceOut) / 1e6;
  const loc = html ? html.split("\n").length : 0;

  if (html) {
    mkdirSync(cfg.outDir, { recursive: true });
    writeFileSync(resolve(cfg.outDir, "index.html"), html, "utf8");
  }

  const result = {
    label: cfg.label, model: cfg.model, vendor: cfg.vendor, slug: cfg.slug,
    durationSec, writeStartSec, promptTok, completionTok, totalTok,
    costUSD: Math.round(costUSD * 1e4) / 1e4, inspoCalls, loc,
    ok: !!html, steps,
  };
  // persist full record next to the page for safekeeping
  try { if (html) writeFileSync(resolve(cfg.outDir, "run.json"), JSON.stringify(result, null, 2)); } catch {}

  console.log("===RESULT===");
  console.log(JSON.stringify(result));
}

main().catch((e) => { console.error(e); process.exit(1); });
