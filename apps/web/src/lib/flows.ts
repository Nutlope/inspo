/**
 * Server-side loader for captured flows. Reads the worker's
 * captures/_flows directory (manifest + per-flow flow.json). Dev-only;
 * the captures dir isn't shipped to production.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const FLOWS_ROOT = resolve(
  process.env.INSPO_FLOWS_DIR ??
    join(process.cwd(), "..", "worker", "captures", "_flows"),
);

export interface FlowStep {
  index: number;
  intent: string;
  url: string;
  title: string;
  screenshot: string;
  note?: string;
}

export interface Flow {
  slug: string;
  startUrl: string;
  flowType: string;
  steps: FlowStep[];
  video: string | null;
  stoppedReason: string;
  reachedSignupForm: boolean;
  capturedAt: string;
}

export function getAllFlows(): Flow[] {
  if (!existsSync(FLOWS_ROOT)) return [];
  let dirs: string[];
  try {
    dirs = readdirSync(FLOWS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name);
  } catch {
    return [];
  }
  const flows: Flow[] = [];
  for (const slug of dirs) {
    const fj = join(FLOWS_ROOT, slug, "flow.json");
    if (!existsSync(fj)) continue;
    try {
      const f = JSON.parse(readFileSync(fj, "utf8")) as Flow;
      // Only surface flows that actually walked somewhere worth showing.
      if (Array.isArray(f.steps) && f.steps.length >= 2) flows.push(f);
    } catch {
      /* skip malformed */
    }
  }
  // Richest / most-complete first: reached-a-form, then step count.
  flows.sort(
    (a, b) =>
      Number(b.reachedSignupForm) - Number(a.reachedSignupForm) ||
      b.steps.length - a.steps.length,
  );
  return flows;
}

export function getFlow(slug: string): Flow | null {
  const fj = join(FLOWS_ROOT, slug, "flow.json");
  if (!existsSync(fj)) return null;
  try {
    return JSON.parse(readFileSync(fj, "utf8")) as Flow;
  } catch {
    return null;
  }
}

/** Human label for a stop reason. */
export function stopLabel(reason: string): string {
  const map: Record<string, string> = {
    "completed-dashboard": "Reached the app",
    "email-verified": "Verified + continued",
    "email-verify-wall": "Stopped at email verify",
    "payment-wall": "Stopped at payment",
    "captcha-wall": "Stopped at captcha",
    "oauth-only": "OAuth-only signup",
    "no-signup-cta": "No signup entry found",
    "dead-end": "Walked to a required step",
    "max-steps": "Reached step limit",
    error: "Capture error",
  };
  return map[reason] ?? reason;
}
