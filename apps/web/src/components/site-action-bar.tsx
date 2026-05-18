"use client";

/**
 * Sticky bottom action bar — appears on /sites/[slug] and /screens/[slug]
 * detail pages. Centred pill at the foot of the viewport with the
 * actions readers most often want once they've reached the bottom of
 * a long screenshot: copy the design system, copy the page URL, save
 * to ⌘K, or visit the live site.
 *
 * Editorial chrome — paper background, hairline border, subtle
 * shadow. Pill stays at the centre on every breakpoint; on mobile
 * the actions collapse to icons-only with sr-only labels.
 *
 * Dismissable via the small × on the right; the dismiss preference
 * persists in sessionStorage so it doesn't follow the user
 * across sessions, only across pages in the current tab.
 */

import { useEffect, useState } from "react";

const SAVED_KEY = "inspo:cmdk:saved";
const DISMISS_KEY = "inspo:action-bar:dismissed";

type CopyState = "idle" | "copying" | "ok" | "err";

function readSavedList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function SiteActionBar({
  slug,
  sourceUrl,
}: {
  slug: string;
  sourceUrl: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [copyDesign, setCopyDesign] = useState<CopyState>("idle");
  const [copyUrl, setCopyUrl] = useState<CopyState>("idle");
  const [saved, setSaved] = useState(false);

  // Hydrate dismiss state + saved-flag after mount so we don't flash.
  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
    setSaved(readSavedList().includes(slug));
  }, [slug]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function onCopyDesign() {
    setCopyDesign("copying");
    try {
      const res = await fetch(`/api/design/${slug}`);
      if (!res.ok) throw new Error(String(res.status));
      const md = await res.text();
      await navigator.clipboard.writeText(md);
      setCopyDesign("ok");
      setTimeout(() => setCopyDesign("idle"), 1800);
    } catch {
      setCopyDesign("err");
      setTimeout(() => setCopyDesign("idle"), 1800);
    }
  }

  async function onCopyUrl() {
    setCopyUrl("copying");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyUrl("ok");
      setTimeout(() => setCopyUrl("idle"), 1800);
    } catch {
      setCopyUrl("err");
      setTimeout(() => setCopyUrl("idle"), 1800);
    }
  }

  function onToggleSave() {
    const current = readSavedList();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [slug, ...current];
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSaved(next.includes(slug));
  }

  if (!mounted || dismissed) return null;

  const designLabel =
    copyDesign === "copying"
      ? "Copying…"
      : copyDesign === "ok"
      ? "Copied ✓"
      : copyDesign === "err"
      ? "Couldn't copy"
      : "Copy DESIGN.md";

  const urlLabel =
    copyUrl === "copying"
      ? "Copying…"
      : copyUrl === "ok"
      ? "Copied ✓"
      : copyUrl === "err"
      ? "Couldn't copy"
      : "Copy URL";

  return (
    <div
      role="region"
      aria-label="Quick actions"
      className="
        fixed inset-x-0 bottom-4 z-40 flex justify-center px-4
        pointer-events-none
      "
    >
      <div
        className="
          pointer-events-auto
          flex items-stretch divide-x divide-[var(--color-border)]
          border rule
          bg-[color-mix(in_oklab,var(--color-bg)_94%,transparent)]
          backdrop-blur-md
          shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]
          font-mono text-[0.7rem] uppercase tracking-[0.12em]
        "
      >
        <button
          type="button"
          onClick={onCopyDesign}
          disabled={copyDesign === "copying"}
          className={`
            relative inline-flex items-center gap-2 px-4 sm:px-5 py-3
            transition-colors
            ${
              copyDesign === "ok"
                ? "text-[var(--color-link)]"
                : "text-[var(--color-fg)] hover:text-[var(--color-link)]"
            }
            disabled:opacity-50
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="8" y="3" width="13" height="13" rx="1" />
            <path d="M5 7v13a1 1 0 0 0 1 1h13" />
          </svg>
          <span>{designLabel}</span>
        </button>

        <button
          type="button"
          onClick={onCopyUrl}
          disabled={copyUrl === "copying"}
          className={`
            inline-flex items-center gap-2 px-4 sm:px-5 py-3
            transition-colors
            ${
              copyUrl === "ok"
                ? "text-[var(--color-link)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-link)]"
            }
            disabled:opacity-50
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 17H7A5 5 0 1 1 7 7h2" />
            <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
            <path d="M8 12h8" />
          </svg>
          <span className="hidden sm:inline">{urlLabel}</span>
          <span className="sr-only sm:hidden">{urlLabel}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          className={`
            inline-flex items-center gap-2 px-4 py-3
            transition-colors
            ${saved ? "text-[var(--color-link)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}
          `}
        >
          <span aria-hidden className="text-base leading-none">
            {saved ? "★" : "☆"}
          </span>
          <span className="hidden md:inline">{saved ? "Saved" : "Save"}</span>
        </button>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-2 px-4 py-3
            text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-link)]
          "
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          <span className="hidden md:inline">Visit live</span>
          <span className="sr-only md:hidden">Visit live site</span>
        </a>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss action bar"
          className="
            inline-flex items-center px-3 py-3
            text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]
          "
        >
          <span aria-hidden>✕</span>
        </button>
      </div>
    </div>
  );
}
