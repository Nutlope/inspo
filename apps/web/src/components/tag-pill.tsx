import Link from "next/link";

/**
 * One tag chip. Always renders as a SINGLE element - the <Link> itself
 * carries the pill styling rather than wrapping a styled <span>.
 *
 * The wrapper version misaligned every row it appeared in: the <a> was
 * the flex item, its inline-block child added half-leading on top of the
 * 22px pill (27.2px item), and the linkless pills - a bare <span>, so a
 * flex item in their own right - stretched to that 27.2px under the
 * default align-items: stretch. Result: the mode chip rendered visibly
 * taller than its neighbours and every linked chip sat off-centre inside
 * its own box. One element with a fixed height removes both problems.
 */
export function TagPill({
  label,
  href,
  variant = "default",
}: {
  label: string;
  href?: string;
  variant?: "default" | "macro";
}) {
  const tone =
    variant === "macro"
      ? "border-[var(--color-link)]/40 text-[var(--color-link)]"
      : "rule text-[var(--color-fg-muted)]";

  // h-7 + inline-flex/items-center fixes the box and optically centres
  // the text regardless of ascenders or descenders in the label.
  const cls =
    `inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full border ${tone} ` +
    `px-3 text-xs capitalize leading-none tracking-[0.01em] transition-colors hover:text-[var(--color-fg)]`;

  return href ? (
    <Link href={href} className={cls}>
      {label}
    </Link>
  ) : (
    <span className={cls}>{label}</span>
  );
}
