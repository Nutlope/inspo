"use client";

import Link from "next/link";

/**
 * The home hero's call to action, in place of the old search capsule.
 *
 * The search bar answered a question nobody arriving cold was asking -
 * you have to already know what the archive holds before a search box is
 * useful. So the hero now points at the two things a first-time visitor
 * can actually do: wire the archive into their agent, or look at it.
 * Search is not lost, it moves to the quiet ⌘K line underneath (and the
 * palette is still on the shortcut everywhere else on the site).
 */
export function HomeCta({ screenCount }: { screenCount: number }) {
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
        {/* Primary - ink fills to accent, arrow nudges on the same
            easing so colour and motion read as one gesture. */}
        <Link
          href="/mcp"
          className="group/cta inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-[var(--color-fg)] px-8 text-[var(--color-bg)] transition-[background-color,transform] duration-200 ease-out hover:scale-[1.03] hover:bg-[var(--color-link)]"
        >
          Get started
          <svg
            aria-hidden
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 ease-out group-hover/cta:translate-x-0.5"
          >
            <path d="M5 12h14" />
            <path d="m13 5 7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/screens"
          className="inline-flex h-13 items-center justify-center rounded-full border rule px-8 transition-colors duration-200 hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]"
        >
          Browse the archive
        </Link>
      </div>

      <button
        type="button"
        onClick={openPalette}
        className="text-meta transition-colors hover:text-[var(--color-fg)]"
      >
        Free and open source. Or press{" "}
        <kbd className="rounded-full border rule px-1.5 py-0.5 font-sans">
          ⌘K
        </kbd>{" "}
        to search {screenCount.toLocaleString()} screens.
      </button>
    </div>
  );
}
