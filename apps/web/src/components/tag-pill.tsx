import Link from "next/link";

export function TagPill({
  label,
  href,
  variant = "default",
}: {
  label: string;
  href?: string;
  variant?: "default" | "macro";
}) {
  const cls =
    variant === "macro"
      ? "border-[var(--color-link)]/40 text-[var(--color-link)]"
      : "rule text-[var(--color-fg-muted)]";

  const inner = (
    <span
      className={`inline-block whitespace-nowrap border ${cls} px-2 py-1 text-xs capitalize leading-none tracking-[0.01em] transition-colors hover:text-[var(--color-fg)]`}
    >
      {label}
    </span>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
