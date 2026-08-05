"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Masthead nav link as a pill:
 *
 * - **Hover** - a faint ink wash fills the capsule and the label
 *   shifts to accent, one gesture.
 *
 * - **Active** - when the current path matches this link's href (or
 *   sits below it, e.g. `/screens/linear-app` while on the `Archive`
 *   link), the pill is already filled with a slightly stronger wash
 *   and the label holds the accent colour. Hover is a no-op there.
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
  // Special-case "/" - exact match only; otherwise every page would
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
        inline-flex h-8 items-center rounded-full px-1.5 sm:h-9 sm:px-3.5
        text-xs sm:text-sm tracking-[0.01em] transition-colors duration-200
        ${
          isActive
            ? "bg-[color-mix(in_oklab,var(--color-link)_12%,transparent)] text-[var(--color-link)]"
            : "text-[var(--color-fg-muted)] hover:bg-[color-mix(in_oklab,var(--color-fg)_6%,transparent)] hover:text-[var(--color-link)]"
        }
      `}
    >
      {label}
    </Link>
  );
}
