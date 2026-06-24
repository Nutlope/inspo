import { site } from "@/lib/site";

type DatelineProps = {
  /** The section this eyebrow marks, e.g. "About", "The archive". */
  label?: string;
};

/**
 * Section eyebrow. Previously a faux-magazine "Issue Nº01 - 04-2026 -
 * <label>" dateline; that issue number and date were the same on every
 * page and carried no information, so they're gone. What's left is the
 * one useful part - the section name - set as a small accent-marked
 * label so each page still opens with a clear filed marker.
 */
export function Dateline({ label = site.issue.title }: DatelineProps) {
  return (
    <p className="text-meta flex items-center gap-2.5 text-[var(--color-fg)]">
      <span aria-hidden className="inline-block h-1.5 w-1.5 bg-[var(--color-link)]" />
      {label}
    </p>
  );
}
