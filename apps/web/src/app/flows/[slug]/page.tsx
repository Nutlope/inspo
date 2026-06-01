/**
 * /flows/[slug] — one captured journey: the video of the whole walk,
 * then every step screenshot in order with its intent + URL.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFlow, stopLabel } from "@/lib/flows";

export const dynamic = "force-dynamic";

const INTENT_LABEL: Record<string, string> = {
  landing: "Landing",
  signup: "Signup screen",
  form_filled: "Form filled",
  step: "Next step",
  oauth_only: "OAuth wall",
  captcha: "Captcha",
  email_verify: "Email verification",
  payment: "Payment",
  completed_dashboard: "Reached the app",
  verified: "Email verified",
  error: "Error",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — flow — Inspo` };
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const flow = getFlow(slug);
  if (!flow || flow.steps.length === 0) notFound();

  const host = hostOf(flow.startUrl);

  return (
    <div className="pb-24">
      {/* Masthead ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-10 sm:px-10">
        <Link href="/flows" className="text-meta hover:text-[var(--color-link)]">
          ← All flows
        </Link>
        <div className="mt-6 grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-8">
            <p className="text-meta">Signup / onboarding flow</p>
            <h1 className="mt-2 font-display text-[clamp(2.25rem,4.5vw,4rem)] leading-[1] tracking-tight">
              {host}
            </h1>
            <p className="mt-4 max-w-[58ch] text-[var(--color-fg-muted)]">
              {flow.steps.length} screens captured by walking the funnel
              with a throwaway account.
            </p>
          </div>
          <div className="lg:col-span-4 lg:pt-8">
            <dl className="space-y-3 border-t rule pt-4 text-sm">
              <Row label="Start">
                <a
                  href={flow.startUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-link)]"
                >
                  {host} ↗
                </a>
              </Row>
              <Row label="Steps">{flow.steps.length}</Row>
              <Row label="Reached form">
                {flow.reachedSignupForm ? "yes" : "no"}
              </Row>
              <Row label="Ended">{stopLabel(flow.stoppedReason)}</Row>
            </dl>
          </div>
        </div>
      </div>

      {/* Video ────────────────────────────────────────────── */}
      {flow.video ? (
        <div className="mx-auto mt-12 max-w-[100rem] px-6 sm:px-10">
          <p className="text-meta mb-3">The walk, recorded</p>
          <div className="overflow-hidden border rule bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={`/api/flows/${slug}/${flow.video}`}
              controls
              loop
              muted
              playsInline
              className="h-auto w-full"
            />
          </div>
        </div>
      ) : null}

      {/* Steps ────────────────────────────────────────────── */}
      <div className="mx-auto mt-20 max-w-[100rem] px-6 sm:px-10">
        <p className="text-meta mb-6">Step by step</p>
        <ol className="space-y-16">
          {flow.steps
            .filter((s) => s.screenshot)
            .map((s) => (
              <li key={s.index} className="grid grid-cols-1 gap-y-4 lg:grid-cols-12 lg:gap-x-10">
                <div className="lg:col-span-3 lg:sticky lg:top-8 lg:self-start">
                  <p className="font-mono text-sm text-[var(--color-link)]">
                    {String(s.index + 1).padStart(2, "0")} /{" "}
                    {String(flow.steps.length).padStart(2, "0")}
                  </p>
                  <p className="font-display text-2xl leading-tight mt-1">
                    {INTENT_LABEL[s.intent] ?? s.intent.replace(/_/g, " ")}
                  </p>
                  <p className="text-meta mt-3 break-all text-[var(--color-fg-muted)]">
                    {s.url}
                  </p>
                </div>
                <div className="lg:col-span-9">
                  <div className="overflow-hidden border rule">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/flows/${slug}/${s.screenshot}`}
                      alt={`${host} — ${s.intent}`}
                      className="h-auto w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </li>
            ))}
        </ol>
      </div>

      {/* Outro ────────────────────────────────────────────── */}
      <div className="mx-auto mt-20 max-w-[100rem] px-6 sm:px-10">
        <p className="text-meta border-t rule pt-6">
          Captured by the Inspo funnel-walker — Playwright drives the
          signup, fills a mail.tm throwaway account, and screenshots
          each real state.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-meta">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
