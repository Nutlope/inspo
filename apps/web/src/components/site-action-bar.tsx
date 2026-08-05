"use client";

/**
 * Sticky bottom action bar - appears on /sites/[slug] and /screens/[slug]
 * detail pages. Centred pill at the foot of the viewport with the
 * actions readers most often want once they've reached the bottom of
 * a long screenshot: copy the design system, copy the page URL, or
 * visit the live site.
 *
 * Editorial chrome - paper background, hairline border, subtle
 * shadow. Pill stays at the centre on every breakpoint; on mobile
 * the actions collapse to icons-only with sr-only labels.
 *
 * Dismissable via the small × on the right; the dismiss preference
 * persists in sessionStorage so it doesn't follow the user
 * across sessions, only across pages in the current tab.
 */

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ClipboardCopy, Link2, X } from "lucide-react";

const DISMISS_KEY = "inspo:action-bar:dismissed";

type CopyState = "idle" | "copying" | "ok" | "err";

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

  // Hydrate dismiss state + saved-flag after mount so we don't flash.
  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
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
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto flex items-stretch divide-x divide-[var(--color-border)] overflow-hidden rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_94%,transparent)] backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] font-mono text-xs tracking-normal"
      >
        {/* Primary CTA - filled so the most-wanted action reads at a
            glance. Ink-on-paper in light mode, paper-on-ink in dark.
            Matches the in-page CopyDesignMd button. */}
        <button
          type="button"
          onClick={onCopyDesign}
          disabled={copyDesign === "copying"}
          className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-3 bg-[var(--color-fg)] !text-white dark:!text-[var(--color-bg)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {copyDesign === "ok" ? (
            <Check size={15} strokeWidth={2} aria-hidden />
          ) : (
            <ClipboardCopy size={15} strokeWidth={2} aria-hidden />
          )}
          <span className="leading-none">{designLabel}</span>
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
          {copyUrl === "ok" ? (
            <Check size={15} strokeWidth={1.75} aria-hidden />
          ) : (
            <Link2 size={15} strokeWidth={1.75} aria-hidden />
          )}
          <span className="hidden leading-none sm:inline">{urlLabel}</span>
          <span className="sr-only sm:hidden">{urlLabel}</span>
        </button>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-3 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-link)]"
        >
          <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden />
          <span className="hidden leading-none md:inline">Visit live</span>
          <span className="sr-only md:hidden">Visit live site</span>
        </a>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss action bar"
          className="inline-flex items-center px-3 py-3 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          <X size={15} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}
