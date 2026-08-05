import Link from "next/link";
import { site } from "@/lib/site";
import { CommandHint } from "@/components/command-hint";
import { GithubStar } from "@/components/github-star";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Floating capsule masthead. The bar detaches from the page edge and
 * hovers as one rounded unit (gallery-style), staying put on scroll.
 * Backdrop blur + a translucent paper wash keep the screenshots
 * readable as they pass underneath.
 */
export function Masthead() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex max-w-[110rem] items-center justify-between gap-4 rounded-full border rule bg-[color-mix(in_oklab,var(--color-bg)_82%,transparent)] py-2 pl-5 pr-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-8 sm:pl-7 sm:pr-2.5">
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
          className="flex items-center gap-1 sm:gap-1.5"
        >
          {site.nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}

          {/* Utilities cluster - one capsule with pill segments inside. */}
          <div className="ml-1 flex h-9 items-stretch gap-0.5 rounded-full border rule p-0.5 sm:ml-2.5">
            <GithubStar />
            <CommandHint />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
