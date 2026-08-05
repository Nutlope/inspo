import Link from "next/link";
import { site } from "@/lib/site";
import { CommandHint } from "@/components/command-hint";
import { GithubStar } from "@/components/github-star";
import { MastheadCapsule } from "@/components/masthead-capsule";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Floating capsule masthead. Sticky; the capsule itself narrows to a
 * snug centered pill once the user scrolls (see <MastheadCapsule>).
 */
export function Masthead() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <MastheadCapsule>
        <Link
          href="/"
          className="font-display text-lg tracking-tight transition-opacity hover:opacity-70 sm:text-2xl"
          aria-label={`${site.name} - home`}
        >
          {site.name}
          <span className="text-[var(--color-link)]">.</span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-0.5 sm:gap-1"
        >
          {site.nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}

          {/* Utilities cluster - one capsule with pill segments inside. */}
          <div className="ml-0.5 flex h-8 items-stretch gap-0.5 rounded-full border rule p-0.5 sm:ml-2 sm:h-9">
            <GithubStar />
            <CommandHint />
            <ThemeToggle />
          </div>
        </nav>
      </MastheadCapsule>
    </header>
  );
}
