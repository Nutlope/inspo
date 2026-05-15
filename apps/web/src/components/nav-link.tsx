"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Masthead nav link with two behaviours wired into one mark:
 *
 * - **Hover** — a hairline grows from the left under the label across
 *   220ms ease-out. The colour shifts to accent at the same time so
 *   the line and the type move together as one gesture.
 *
 * - **Active** — when the current path matches this link's href (or
 *   sits below it, e.g. `/screens/linear-app` while on the `Archive`
 *   link), the hairline is already drawn and the label is already
 *   coloured. Hover is a no-op in that state — there's nothing to
 *   reveal.
 *
 * The marker is a 1px line directly under the label, not a separate
 * pill or chip. Editorial restraint: the active state should feel
 * like the link is *settled*, not *highlighted*.
 *
 * `aria-current="page"` set on the active link so screen-readers
 * announce it.
 */
export function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();

  // Active if the pathname IS the link, or is below it (so /screens
  // keeps the Archive link active when the user is at /screens/<slug>).
  // Special-case "/" — exact match only; otherwise every page would
  // light up the home link.
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        group relative inline-flex h-7 items-center
        text-meta transition-colors duration-200
        ${
          isActive
            ? "text-[var(--color-link)]"
            : "text-[var(--color-fg-muted)] hover:text-[var(--color-link)]"
        }
      `}
    >
      <span>{label}</span>

      {/* Underline marker — origin-left scale so the grow direction
          reads as a left-to-right pen stroke. Persists at full width
          when the link is current. */}
      <span
        aria-hidden
        className={`
          pointer-events-none absolute inset-x-0 bottom-0 h-px
          origin-left bg-[var(--color-link)]
          transition-transform duration-[220ms] ease-out
          ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
        `}
      />
    </Link>
  );
}
