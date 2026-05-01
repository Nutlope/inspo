import Link from "next/link";
import { getAllScreens } from "@inspo/db";
import { site } from "@/lib/site";

export async function Masthead() {
  // Live count of published screens, mono badge next to the brand mark.
  // No telemetry, just the catalogue size.
  const count = (await getAllScreens()).length;

  return (
    <header className="border-b rule">
      <div className="mx-auto flex max-w-[120rem] items-center justify-between gap-8 px-6 py-5 sm:px-10">
        <div className="flex items-baseline gap-4 sm:gap-5">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight transition-opacity hover:opacity-70"
            aria-label={`${site.name} — home`}
          >
            {site.name}
            <span className="text-[var(--color-link)]">.</span>
          </Link>
          <span
            aria-hidden
            className="text-meta hidden text-[var(--color-fg-muted)] sm:inline"
          >
            Nº{count} · open source
          </span>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-7 sm:gap-10">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-meta transition-colors hover:text-[var(--color-link)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
