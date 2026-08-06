"use client";

/* inspo-reference-component
 * type= faq | genre= editorial | theme= Inspo-paper
 * archetype= Search-led | diversification= filter input above an open
 *   list - search beats accordion when the FAQ runs long
 * states= default · focus · filtered · empty
 * contrast= pass (46-50)
 */

import { useMemo, useState } from "react";

const QA = [
  { q: "Is Inspo free?", a: "Yes - open source, MIT, free in every tier." },
  { q: "How do I install the MCP?", a: "`npx inspo init` writes the server entry into your editor's config." },
  { q: "Can I self-host?", a: "Every dependency has a free tier or local equivalent." },
  { q: "Where does the catalogue come from?", a: "Curated by hand from a seed list, then captured by the worker." },
  { q: "What models does the worker use?", a: "Together AI Gemma for tagging; Voyage-style embeddings for semantic search." },
  { q: "Does it work offline?", a: "Catalogue ships as static JSON, so /screens renders without a DB connection." },
  { q: "How do I add a site?", a: "Append it to apps/worker/src/seed-urls.ts and open a PR." },
  { q: "What about copyright?", a: "Editorial commentary precedent is well-established. We credit and respect takedown requests." },
];

export function FaqSearchLed() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      q.trim()
        ? QA.filter(
            (row) =>
              row.q.toLowerCase().includes(q.trim().toLowerCase()) ||
              row.a.toLowerCase().includes(q.trim().toLowerCase()),
          )
        : QA,
    [q],
  );

  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Questions</p>
      <p
        className="font-display mt-4 max-w-[20ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
      >
        Filter to what you&rsquo;re actually asking.
      </p>

      <form
        role="search"
        className="group mt-10 flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]/60 transition-colors hover:border-[var(--color-fg)]/40 focus-within:border-[var(--color-accent)]"
      >
        <span
          aria-hidden
          className="shrink-0 inline-flex text-[var(--color-fg-muted)] transition-colors group-focus-within:text-[var(--color-accent)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search the FAQ - try 'install' or 'self-host'"
          className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm placeholder:text-[var(--color-fg-muted)]"
        />
      </form>

      {filtered.length === 0 ? (
        <p className="mt-10 text-meta">
          Nothing matches that. Try a different word.
        </p>
      ) : (
        <dl className="mt-10 border-t rule">
          {filtered.map((row) => (
            <div
              key={row.q}
              className="grid grid-cols-1 gap-x-10 gap-y-2 border-b rule py-5 lg:grid-cols-[18rem_1fr]"
            >
              <dt className="font-display text-lg leading-tight">{row.q}</dt>
              <dd className="max-w-[60ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {row.a}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
