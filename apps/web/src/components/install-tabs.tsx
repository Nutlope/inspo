"use client";

/**
 * The MCP page's hero install module. Pick your client from a pill
 * row, get the exact snippet on a dark plate, copy it in one click.
 * Pure UI state (active tab, copied flash); all snippet content ships
 * from the server component that renders this.
 *
 * The plate keeps ink-on-dark literals (--color-ink / --color-ink-dark)
 * in BOTH themes: a terminal is dark everywhere, and the fixed plate is
 * what lets the command read as the loudest thing in the hero - light
 * mode gets full contrast against the paper, dark mode a step of
 * elevation off the page. The config-path note lives on the plate's
 * header line, so the module is one surface, not a stack of rows.
 * The old "prefer local?" footer is gone: local install is the npx tab.
 */

import { useState } from "react";

export type InstallTab = {
  id: string;
  label: string;
  /** Short natural-case note shown on the plate header (config path etc). */
  note?: string;
  /** The copy-pasteable snippet. */
  snippet: string;
  /** Optional one-click deeplink (Cursor). */
  deeplink?: { href: string; label: string };
};

export function InstallTabs({ tabs }: { tabs: InstallTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  const multiline = current.snippet.includes("\n");
  // Single-line snippets are shell commands; they get the $ prompt.
  const shell = !multiline;

  async function copy() {
    try {
      await navigator.clipboard.writeText(current!.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard can be blocked in embedded contexts - the snippet
       * is on screen, manual copy still works. */
    }
  }

  function select(id: string) {
    setActive(id);
    setCopied(false);
  }

  return (
    <div className="rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] p-2.5 sm:p-3">
      <div
        role="tablist"
        aria-label="Install instructions per client"
        className="flex flex-wrap justify-center gap-1.5 p-1.5 sm:p-2"
      >
        {tabs.map((t) => {
          const selected = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              onClick={() => select(t.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selected
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[color-mix(in_oklab,var(--color-fg)_7%,transparent)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* The plate ─ fixed ink tones in both themes. */}
      <div
        role="tabpanel"
        className="mt-1.5 rounded-[calc(var(--radius-card)-0.625rem)] bg-[var(--color-ink)] text-[var(--color-ink-dark)]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 pt-4 sm:px-7">
          {current.note && (
            <p className="text-xs text-[color-mix(in_oklab,var(--color-ink-dark)_55%,transparent)]">
              {current.note}
            </p>
          )}
          {current.deeplink && (
            <a
              href={current.deeplink.href}
              className="text-xs text-[var(--color-accent-dark)] underline-offset-4 hover:underline"
            >
              {current.deeplink.label}
            </a>
          )}
        </div>

        <div
          className={`flex gap-4 px-6 pt-2 pb-5 sm:px-7 ${
            multiline ? "items-start" : "items-center"
          }`}
        >
          <pre className="min-w-0 flex-1 overflow-x-auto py-1 text-left font-mono leading-relaxed">
            <code
              className={multiline ? "text-sm sm:text-base" : "text-base sm:text-lg"}
            >
              {shell && (
                <span
                  aria-hidden
                  className="select-none text-[color-mix(in_oklab,var(--color-ink-dark)_45%,transparent)]"
                >
                  {"$ "}
                </span>
              )}
              {current.snippet}
            </code>
          </pre>

          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${current.label} install snippet`}
            className={`inline-flex h-10 shrink-0 items-center rounded-full px-5 text-sm transition-colors duration-200 ${
              copied
                ? "bg-[var(--color-ink-dark)] text-[var(--color-ink)]"
                : // Literal ink on the accent: the plate ignores the theme,
                  // so its button does too (--color-accent-ink flips dark).
                  "bg-[var(--color-accent-light)] text-[#fdfdfb] hover:bg-[#b23927]"
            }`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
