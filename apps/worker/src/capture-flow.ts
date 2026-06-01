/**
 * Real flow capture — walk a product's sign-up / onboarding funnel
 * with Playwright and screenshot + video every actual state.
 *
 * This is NOT the sitemap "landing → pricing" thing we (correctly)
 * threw out. It drives the page: find the primary "Sign up" CTA,
 * click it, fill throwaway data into the form, advance, and capture
 * each real screen a new user would see — until it hits a wall it
 * can't (or shouldn't) cross: email verification, payment, captcha,
 * OAuth redirect, or the dashboard.
 *
 * Output per site: captures/_flows/<slug>/
 *   step-00-landing.png, step-01-signup.png, …   (ordered states)
 *   flow.webm                                     (the whole walk)
 *   flow.json                                     (manifest)
 *
 * Honest limits (reported, not hidden):
 *   - OAuth-only signups (Continue with Google/GitHub) → stop, label it.
 *   - Magic-link / email-verify → capture up to the wall (+ complete it
 *     if a temp inbox is wired and the link arrives).
 *   - Captcha / bot-wall → stop, label it.
 *   - Payment-gated → stop before entering card details.
 *   - Destructive flows (cancellation) → not attempted here.
 *
 *   pnpm tsx src/capture-flow.ts https://buttondown.email --slug=buttondown-email
 *   pnpm tsx src/capture-flow.ts --from-file=urls.txt --concurrency=2
 */

import "./env.js";
import { mkdirSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { createInbox, pollForLink, type Inbox } from "./temp-email.js";

/**
 * Lightweight cookie-consent accept. Unlike the capture pipeline's
 * `dismissBanners`, this NEVER hides fixed/sticky elements — doing so
 * would nuke the sticky header that holds the "Sign up" CTA we need to
 * click. It only clicks an obvious accept-cookies button so the banner
 * stops covering the funnel; anything left over is handled by the
 * locator's force-click fallback.
 */
async function acceptConsent(page: Page): Promise<void> {
  await page
    .evaluate(() => {
      const rx = /^(accept all|accept all cookies|accept cookies|allow all|i agree|agree|got it|accept|allow)\b/i;
      const inConsent = (el: Element) =>
        !!el.closest(
          '[class*="cookie" i],[class*="consent" i],[id*="cookie" i],[id*="consent" i],[class*="gdpr" i],[aria-label*="cookie" i]',
        );
      const buttons = Array.from(
        document.querySelectorAll<HTMLElement>("a, button"),
      ).filter((el) => {
        const t = (el.textContent ?? "").trim();
        return !!t && t.length < 30 && rx.test(t);
      });
      const target =
        buttons.find((el) => inConsent(el)) ??
        buttons.find((el) => /accept all|allow all/i.test(el.textContent ?? ""));
      target?.click();
    })
    .catch(() => {});
}

const FLOWS_DIR = resolve(process.env.INSPO_FLOWS_DIR ?? "./captures/_flows");
const VIEWPORT = { width: 1440, height: 900 };
const MAX_STEPS = 8;

/* ───────────────────────── types ───────────────────────── */

export type StopReason =
  | "completed-dashboard"
  | "email-verified"
  | "email-verify-wall"
  | "payment-wall"
  | "captcha-wall"
  | "oauth-only"
  | "no-signup-cta"
  | "dead-end"
  | "max-steps"
  | "error";

export interface FlowStep {
  index: number;
  intent: string;
  url: string;
  title: string;
  screenshot: string; // filename within the flow dir
  note?: string;
}

export interface FlowResult {
  slug: string;
  startUrl: string;
  flowType: "signup";
  steps: FlowStep[];
  video: string | null;
  stoppedReason: StopReason;
  reachedSignupForm: boolean;
  capturedAt: string;
}

export interface FlowOptions {
  url: string;
  slug: string;
  /** Throwaway identity used to fill forms. */
  identity?: { email: string; password: string; name: string };
}

/* ───────────────────── CTA / state detection ───────────────────── */

const SIGNUP_TEXT =
  /\b(sign\s?up|get\s?started|try\s+(it\s+)?free|get\s+\w+\s+free|start\s+(free|building|now|for\s+free)|create\s+(an\s+)?account|join\s+(free|now|for\s+free)|start\s+(your\s+)?(free\s+)?trial|register)\b/i;
const SUBMIT_TEXT =
  /\b(sign\s?up|create\s+account|continue|next|get\s?started|join|register|submit|agree|start)\b/i;

function randomIdentity(): { email: string; password: string; name: string } {
  // Deterministic-ish throwaway (no Math.random in worker scripts is
  // fine here — this runs in tsx, not the workflow sandbox).
  const n = Math.floor(Math.random() * 1e6).toString(36);
  return {
    email: `inspo.flow.${n}@example.com`,
    password: `Fl0w-${n}-Test!`,
    name: "Alex Rivera",
  };
}

/** Classify the current page state to decide whether to keep walking
 *  or stop with a labelled reason. Returns null when it's a normal
 *  form/step we can keep advancing. */
async function classifyState(page: Page): Promise<StopReason | null> {
  return page
    .evaluate(() => {
      const bodyText = (document.body?.innerText ?? "").toLowerCase();
      const has = (sel: string) => !!document.querySelector(sel);

      // Captcha / bot-wall
      if (
        has('iframe[src*="recaptcha"]') ||
        has('iframe[src*="hcaptcha"]') ||
        has('[class*="cf-turnstile"]') ||
        has('iframe[title*="captcha" i]') ||
        /verify you are human|are you a robot|checking your browser|just a moment/.test(bodyText)
      )
        return "captcha-wall";

      // Email verification wall
      if (
        /check your (e-?mail|inbox)|verify your (e-?mail|account)|confirmation (e-?mail|link)|we('| ha)ve sent|sent you (an|a) (e-?mail|link)|confirm your e-?mail/.test(
          bodyText,
        )
      )
        return "email-verify-wall";

      // Payment wall
      if (
        has('iframe[src*="stripe"]') ||
        has('input[name*="card" i]') ||
        has('[class*="card-number" i]') ||
        /card number|billing (address|details)|payment (method|details)|enter your card/.test(bodyText)
      )
        return "payment-wall";

      // Reached the app / onboarding success
      if (
        /\/(dashboard|app|home|welcome|onboarding|getting-started|setup)(\/|$|\?)/.test(
          location.pathname + location.search,
        ) ||
        /welcome (to|aboard|back)|you('| a)re (all )?set|your (workspace|account) is ready|let'?s get (you )?started/.test(
          bodyText,
        )
      )
        return "completed-dashboard";

      return null;
    })
    .catch(() => null) as Promise<StopReason | null>;
}

/** Is there an actual email/password form to fill on this page, or is
 *  it OAuth-only (just "Continue with Google/GitHub")? */
async function inspectForm(page: Page): Promise<{
  hasEmail: boolean;
  hasPassword: boolean;
  oauthOnly: boolean;
}> {
  return page
    .evaluate(() => {
      const emailInput = document.querySelector(
        'input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete="email"], input[placeholder*="email" i]',
      );
      const passwordInput = document.querySelector('input[type="password"]');
      const textInputs = document.querySelectorAll(
        'input[type="email"], input[type="password"], input[type="text"]:not([type="hidden"])',
      );
      const oauthButtons = Array.from(
        document.querySelectorAll("a,button"),
      ).filter((el) =>
        /continue with|sign ?up with|sign ?in with|with (google|github|apple|microsoft|sso)/i.test(
          el.textContent ?? "",
        ),
      );
      return {
        hasEmail: !!emailInput,
        hasPassword: !!passwordInput,
        oauthOnly: oauthButtons.length > 0 && textInputs.length === 0,
      };
    })
    .catch(() => ({ hasEmail: false, hasPassword: false, oauthOnly: false }));
}

/* ───────────────────────── the walk ───────────────────────── */

/** A cheap signature of the page's interactive state — input types,
 *  the primary heading, and a coarse text-length bucket. Multi-step
 *  SPA forms keep the same URL but change this, so it's what we use to
 *  tell "the funnel advanced" from "the click did nothing". */
async function fingerprint(page: Page): Promise<string> {
  return page
    .evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          "input:not([type=hidden])",
        ),
      )
        .map((i) => i.type || "text")
        .sort()
        .join(",");
      const h = (
        document.querySelector("h1, h2, [role=heading]")?.textContent ?? ""
      )
        .trim()
        .slice(0, 48);
      const txt = (document.body?.innerText ?? "").length;
      return `${inputs}|${h}|${Math.round(txt / 200)}`;
    })
    .catch(() => "");
}

async function snap(
  page: Page,
  dir: string,
  intent: string,
  steps: FlowStep[],
  note?: string,
) {
  // Index is the running step count — always monotonic, no collisions.
  const index = steps.length;
  const file = `step-${String(index).padStart(2, "0")}-${intent}.png`;
  await page
    .screenshot({ path: join(dir, file), fullPage: false })
    .catch(() => {});
  steps.push({
    index,
    intent,
    url: page.url(),
    title: await page.title().catch(() => ""),
    screenshot: file,
    note,
  });
}

// OAuth / SSO buttons we must never click — they bounce us off-site to
// Google/GitHub and end the flow. Used to exclude from both the CTA and
// the submit search.
const OAUTH_TEXT =
  /with\s+(google|github|apple|microsoft|facebook|twitter|x|sso|okta|saml)|continue with|use single sign/i;

const TARGET_ATTR = "data-inspo-flow-target";

/** Click the most prominent element whose text matches `re` (and does
 *  NOT match the OAuth exclusion). When `preferSubmit`, a real submit
 *  control (type=submit / button inside a form) wins over a generic
 *  link. The chosen element is tagged in-page, then clicked via a
 *  Playwright locator so we get real actionability (auto-scroll, wait
 *  for stable, and a force fallback if something overlays it). */
async function clickByText(
  page: Page,
  re: RegExp,
  opts: { preferSubmit?: boolean } = {},
): Promise<boolean> {
  const marked = await page
    .evaluate(
      (args: { reSource: string; oauthSource: string; preferSubmit: boolean; attr: string }) => {
        const rx = new RegExp(args.reSource, "i");
        const oauth = new RegExp(args.oauthSource, "i");
        document
          .querySelectorAll(`[${args.attr}]`)
          .forEach((e) => e.removeAttribute(args.attr));
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>(
            "a, button, [role='button'], input[type='submit']",
          ),
        ).filter((el) => {
          const t = (el.textContent ?? (el as HTMLInputElement).value ?? "").trim();
          if (oauth.test(t)) return false; // never click OAuth
          if (!t || t.length > 40) {
            return (
              args.preferSubmit && (el as HTMLInputElement).type === "submit"
            );
          }
          if (!rx.test(t)) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const score = (el: HTMLElement) => {
          let s = 0;
          if (args.preferSubmit) {
            if ((el as HTMLInputElement).type === "submit") s -= 100;
            if (el.closest("form")) s -= 50;
          }
          const top = el.getBoundingClientRect().top;
          s += top * 0.01;
          if (!args.preferSubmit && top < 120) s -= 5;
          return s;
        };
        candidates.sort((a, b) => score(a) - score(b));
        const best = candidates[0];
        if (!best) return false;
        best.setAttribute(args.attr, "1");
        return true;
      },
      {
        reSource: re.source,
        oauthSource: OAUTH_TEXT.source,
        preferSubmit: opts.preferSubmit ?? false,
        attr: TARGET_ATTR,
      },
    )
    .catch(() => false);
  if (!marked) return false;
  const loc = page.locator(`[${TARGET_ATTR}]`).first();
  try {
    await loc.click({ timeout: 5000 });
    return true;
  } catch {
    try {
      await loc.click({ timeout: 3000, force: true });
      return true;
    } catch {
      return false;
    }
  }
}

async function fillForm(
  page: Page,
  identity: { email: string; password: string; name: string },
): Promise<boolean> {
  return page
    .evaluate((id) => {
      let filled = false;
      const set = (el: Element | null, val: string) => {
        if (!el) return;
        const input = el as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(input, val);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
      };
      set(
        document.querySelector(
          'input[type="email"], input[name*="email" i], input[autocomplete="email"], input[placeholder*="email" i]',
        ),
        id.email,
      );
      set(document.querySelector('input[type="password"]'), id.password);
      const nameEl = document.querySelector(
        'input[name*="name" i]:not([name*="user" i]), input[placeholder*="name" i], input[autocomplete="name"]',
      );
      set(nameEl, id.name);
      return filled;
    }, identity)
    .catch(() => false);
}

export async function captureFlow(opts: FlowOptions): Promise<FlowResult> {
  const { url, slug } = opts;
  // A real throwaway inbox (mail.tm) lets signup forms accept the email
  // and lets us complete the "check your email" wall. Falls back to a
  // synthetic identity if mail.tm is unreachable (flow still captures
  // up to the verify wall).
  const inbox: Inbox | null = opts.identity ? null : await createInbox();
  const fallback = randomIdentity();
  const identity = opts.identity ?? {
    email: inbox?.address ?? fallback.email,
    password: fallback.password,
    name: fallback.name,
  };
  const dir = join(FLOWS_DIR, slug);
  mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  let ctx: BrowserContext | null = null;
  const steps: FlowStep[] = [];
  let stoppedReason: StopReason = "error";
  let reachedSignupForm = false;

  try {
    ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "America/New_York",
      viewport: VIEWPORT,
      colorScheme: "light",
      recordVideo: { dir, size: VIEWPORT },
    });

    // tsx/esbuild injects a `__name()` helper into transpiled function
    // bodies. When Playwright ships an evaluate() function to the page
    // via toString(), that helper isn't defined in the browser, so the
    // evaluate throws "__name is not defined" and silently returns the
    // catch fallback. Shim it once for every document in this context.
    await ctx.addInitScript(() => {
      (globalThis as unknown as { __name?: unknown }).__name = (fn: unknown) => fn;
    });

    // Track popups / new tabs — many "Get started" CTAs open the app
    // in a new tab (target=_blank). We follow the funnel into whichever
    // page is frontmost after a click.
    const switchToNewest = (current: Page): Page => {
      const open = ctx!.pages().filter((p) => !p.isClosed());
      return open.length ? open[open.length - 1]! : current;
    };

    let page = await ctx.newPage();

    // ── step 0: landing ──
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => {});
    await acceptConsent(page);
    await page.waitForTimeout(600);
    await snap(page, dir, "landing", steps);

    // ── click the primary signup CTA ──
    const clicked = await clickByText(page, SIGNUP_TEXT);
    if (!clicked) {
      stoppedReason = "no-signup-cta";
    } else {
      await page.waitForTimeout(1200);
      page = switchToNewest(page); // follow a new-tab signup if one opened
      await page
        .waitForLoadState("networkidle", { timeout: 8_000 })
        .catch(() => {});
      await page.waitForTimeout(900);
      await acceptConsent(page);
      await snap(page, dir, "signup", steps);

      // ── walk the funnel ──
      for (let i = 0; i < MAX_STEPS; i++) {
        const state = await classifyState(page);
        if (state) {
          stoppedReason = state;
          await snap(page, dir, state.replace(/-wall|-/g, "_"), steps);
          break;
        }
        const form = await inspectForm(page);
        if (form.oauthOnly) {
          stoppedReason = "oauth-only";
          await snap(page, dir, "oauth_only", steps);
          break;
        }
        if (form.hasEmail || form.hasPassword) {
          reachedSignupForm = true;
          const didFill = await fillForm(page, identity);
          if (didFill) await snap(page, dir, "form_filled", steps);
        }
        // Advance: real submit / continue (never an OAuth button).
        const urlBefore = page.url();
        const fpBefore = await fingerprint(page);
        const advanced = await clickByText(page, SUBMIT_TEXT, {
          preferSubmit: true,
        });
        if (!advanced) {
          stoppedReason = "dead-end";
          break;
        }
        await page.waitForTimeout(1000);
        page = switchToNewest(page);
        await page
          .waitForLoadState("networkidle", { timeout: 8_000 })
          .catch(() => {});
        await page.waitForTimeout(1000);
        // Progress = the URL changed OR the form's state changed (the
        // multi-step-SPA case: same URL, new fields). No progress + no
        // new wall → genuine dead end.
        const fpAfter = await fingerprint(page);
        const progressed = page.url() !== urlBefore || fpAfter !== fpBefore;
        if (!progressed) {
          const reState = await classifyState(page);
          if (reState) {
            stoppedReason = reState;
            await snap(page, dir, reState.replace(/-wall|-/g, "_"), steps);
          } else {
            stoppedReason = "dead-end";
          }
          break;
        }
        await snap(page, dir, `step`, steps);
        if (i >= MAX_STEPS - 2) {
          stoppedReason = "max-steps";
          break;
        }
      }
    }

    // ── complete the "check your email" wall with the temp inbox ──
    if (stoppedReason === "email-verify-wall" && inbox) {
      const link = await pollForLink(inbox, { timeoutMs: 45_000 });
      if (link) {
        try {
          await page.goto(link, {
            waitUntil: "domcontentloaded",
            timeout: 30_000,
          });
          await page
            .waitForLoadState("networkidle", { timeout: 8_000 })
            .catch(() => {});
          await page.waitForTimeout(1500);
          page = switchToNewest(page);
          await snap(page, dir, "verified", steps);
          const post = await classifyState(page);
          stoppedReason =
            post === "completed-dashboard"
              ? "completed-dashboard"
              : "email-verified";
        } catch {
          /* keep the verify-wall reason — link didn't resolve cleanly */
        }
      }
    }
  } catch (err) {
    stoppedReason = "error";
    steps.push({
      index: steps.length,
      intent: "error",
      url,
      title: "",
      screenshot: "",
      note: err instanceof Error ? err.message.slice(0, 140) : String(err),
    });
  } finally {
    // Closing the context finalizes the video file.
    await ctx?.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  // Rename the (randomly-named) Playwright video to flow.webm.
  let video: string | null = null;
  try {
    const { readdirSync } = await import("node:fs");
    const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
    if (webm) {
      if (webm !== "flow.webm") {
        renameSync(join(dir, webm), join(dir, "flow.webm"));
      }
      video = "flow.webm";
    }
  } catch {
    /* ignore */
  }

  const result: FlowResult = {
    slug,
    startUrl: url,
    flowType: "signup",
    steps,
    video,
    stoppedReason,
    reachedSignupForm,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(join(dir, "flow.json"), JSON.stringify(result, null, 2));
  return result;
}

/* ───────────────────────── CLI ───────────────────────── */

function slugifyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const url = argv.find((a) => !a.startsWith("--"));
  const slugArg = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
  if (!url) {
    console.error("usage: capture-flow.ts <url> [--slug=...]");
    process.exit(1);
  }
  const slug = slugArg ?? slugifyHost(url);
  if (!existsSync(FLOWS_DIR)) mkdirSync(FLOWS_DIR, { recursive: true });
  console.log(`\n  flow capture · ${slug} · ${url}\n`);
  const r = await captureFlow({ url, slug });
  console.log(`  steps:   ${r.steps.length}`);
  console.log(`  form:    ${r.reachedSignupForm ? "reached" : "not reached"}`);
  console.log(`  stopped: ${r.stoppedReason}`);
  console.log(`  video:   ${r.video ?? "none"}`);
  console.log(`  → ${join(FLOWS_DIR, slug)}`);
  for (const s of r.steps) console.log(`    ${String(s.index).padStart(2)} ${s.intent.padEnd(16)} ${s.url.slice(0, 60)}`);
}

// Run as CLI only when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
