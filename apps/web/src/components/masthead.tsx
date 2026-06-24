import Link from "next/link";
import { site } from "@/lib/site";
import { CommandHint } from "@/components/command-hint";
import { GithubStar } from "@/components/github-star";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Masthead() {
  return (
    <header className="border-b rule">
      <div className="mx-auto flex max-w-[120rem] items-center justify-between gap-8 px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight transition-opacity hover:opacity-70"
          aria-label={`${site.name} - home`}
        >
          {site.name}
          <span className="text-[var(--color-link)]">.</span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-5 sm:gap-7"
        >
          {site.nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}

          {/* Utilities cluster - one filed unit: a single hairline
              enclosure with hairline dividers between segments (see
              .util-seg in globals.css), so the three controls read as
              one object instead of three boxes with an awkward gap. */}
          <div className="ml-1.5 flex h-8 items-stretch border rule sm:ml-3">
            <GithubStar />
            <CommandHint />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
