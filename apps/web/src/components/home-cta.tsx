"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The home hero's call to action.
 *
 * The primary CTA IS the install: a click-to-copy `npx -y inspo-mcp`
 * capsule styled like the primary button it replaces. A "Get started"
 * pill only added a hop to /mcp, where the first thing you'd do is
 * copy this exact command - so the hero hands it over directly.
 * Per-client setup stays one quiet link away, and search keeps its
 * spot on the small line (the palette is on ⌘K site-wide anyway).
 */
export function HomeCta({ screenCount }: { screenCount: number }) {
  const [copied, setCopied] = useState(false);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText("npx -y inspo-mcp");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard can be blocked in embedded contexts - the command
       * is visible, manual copy still works. */
    }
  }

  const openPalette = () => {
    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toLowerCase().includes("mac");
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: !isMac,
        metaKey: isMac,
        bubbles: true,
      }),
    );
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {/* Primary - the one-line install, copied on click. */}
        <button
          type="button"
          onClick={copyInstall}
          aria-label="Copy the MCP install command"
          className="group/cta inline-flex h-13 items-center justify-center gap-3 rounded-full bg-[var(--color-fg)] pl-6 pr-2 text-[var(--color-bg)] transition-colors duration-200 ease-out hover:bg-[color-mix(in_oklab,var(--color-fg)_92%,var(--color-bg))]"
        >
          <span
            aria-hidden
            className="opacity-50 transition-opacity duration-200 group-hover/cta:opacity-75"
          >
            $
          </span>
          <code className="font-mono tracking-wide">npx -y inspo-mcp</code>
          <span
            aria-hidden
            className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm transition-colors duration-200 ${
              copied
                ? "bg-[var(--color-bg)] text-[var(--color-fg)]"
                : "bg-[color-mix(in_oklab,var(--color-bg)_16%,transparent)] group-hover/cta:bg-[color-mix(in_oklab,var(--color-bg)_26%,transparent)]"
            }`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </span>
        </button>

        <Link
          href="/screens"
          className="inline-flex h-13 items-center justify-center rounded-full border rule px-8 transition-colors duration-200 hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]"
        >
          Browse the archive
        </Link>
      </div>

      <p className="text-meta">
        Works with any MCP client -{" "}
        <Link
          href="/mcp"
          className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
        >
          see setup
        </Link>
        . Or press{" "}
        <button
          type="button"
          onClick={openPalette}
          aria-label="Open search"
          className="rounded-full border rule px-1.5 py-0.5 font-sans transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
        >
          ⌘K
        </button>{" "}
        to search {screenCount.toLocaleString()} screens.
      </p>
    </div>
  );
}
