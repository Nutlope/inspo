"use client";

/* Inspo · component: footer · genre: editorial · theme: Inspo-paper
 * archetype: Ft6 Newsletter inline · diversification: subscription is
 *   the primary action, link map collapses to a minimal index
 * states: default · hover · focus · success
 * contrast: pass (46-50)
 */

import { useState, type FormEvent } from "react";

/**
 * Newsletter footer - subscribe is the only action that earns a row of
 * its own. Three minimal links underneath; no four-column sitemap.
 * Reach for it when the site is content-led (essays, weekly notes)
 * and the email list is the asset.
 */
export function FooterNewsletter() {
  const [done, setDone] = useState(false);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(true);
  }
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-meta">Field notes</p>
          <p
            className="font-display mt-4 max-w-[22ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            New plates, every other Friday. <em className="italic">No noise.</em>
          </p>

          {done ? (
            <p className="mt-8 max-w-[40ch] border-l-2 border-[var(--color-link)] pl-4 font-mono text-sm">
              ✓ You&rsquo;re on the list.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="group mt-8 flex max-w-[32rem] items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]/60 transition-colors hover:border-[var(--color-fg)]/40 focus-within:border-[var(--color-link)]"
            >
              <input
                type="email"
                required
                placeholder="you@studio.com"
                className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm placeholder:text-[var(--color-fg-muted)]"
              />
              <button
                type="submit"
                className="font-mono text-xs tracking-normal text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
              >
                Subscribe ↵
              </button>
            </form>
          )}
        </div>
        <ul className="space-y-2 lg:col-span-5 lg:justify-self-end">
          {["The archive", "MCP", "About", "DMCA"].map((l) => (
            <li key={l}>
              <a
                href="#"
                className="text-sm text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
              >
                {l} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-meta mt-12 border-t rule pt-6">
        © {new Date().getFullYear()} Together AI · MIT
      </p>
    </footer>
  );
}
