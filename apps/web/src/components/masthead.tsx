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

          {/* Utilities cluster - tighter gap than the nav links above
              and a leading spacer so the cluster reads as a distinct group. */}
          <div className="ml-1 flex items-center gap-1.5 sm:ml-2">
            <GithubStar />
            <CommandHint />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
