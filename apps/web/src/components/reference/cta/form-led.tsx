"use client";

/* inspo-reference-component
 * type= cta | genre= editorial | theme= Inspo-paper
 * archetype= Form-led | diversification= differs from Banded on
 *   action shape (input vs button) + paper band (paper vs accent)
 * states= default · hover · focus · success (after submit)
 * contrast= pass (46-50)
 */

import { useState, type FormEvent } from "react";

/**
 * Form-led CTA - the input *is* the action. Single email field with an
 * inline submit affordance, a small value-prop above. The success state
 * collapses the form to a confirmation line; failure shows under the
 * input in mono caption type. Reach for it when the conversion is a
 * subscribe / waitlist, not a checkout.
 */
export function CtaFormLed() {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    // Demo: bounce to done after 600ms. Hook to your real endpoint here.
    window.setTimeout(() => setState("done"), 600);
  }

  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="text-meta">Field notes - every other Friday</p>
        <p
          className="font-display mt-4 text-balance leading-[1.1]"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
        >
          New captures, new collections,{" "}
          <em className="italic">one essay</em>. No noise.
        </p>

        {state === "done" ? (
          <p className="mt-10 border-l-2 border-[var(--color-accent)] pl-4 font-mono text-sm">
            ✓ You&rsquo;re on the list. Look out for the next issue.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="group mt-10 flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]/60 transition-colors duration-200 hover:border-[var(--color-fg)]/40 focus-within:border-[var(--color-accent)]"
          >
            <span
              aria-hidden
              className="shrink-0 inline-flex text-[var(--color-fg-muted)] transition-colors duration-200 group-focus-within:text-[var(--color-accent)]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <input
              type="email"
              required
              placeholder="you@studio.com"
              autoComplete="email"
              disabled={state === "submitting"}
              className="flex-1 min-w-0 bg-transparent outline-none font-mono text-base placeholder:text-[var(--color-fg-muted)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={state === "submitting"}
              className="shrink-0 font-mono text-sm tracking-normal text-[var(--color-fg)] transition-colors duration-200 hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              {state === "submitting" ? "…" : "Subscribe ↵"}
            </button>
          </form>
        )}

        <p className="text-meta mt-4 normal-case tracking-normal text-[var(--color-fg-muted)]">
          One issue every other Friday. Unsubscribe anywhere.
        </p>
      </div>
    </section>
  );
}
