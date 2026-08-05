import { site } from "@/lib/site";

/**
 * Masthead CTA → the GitHub repo, with a live star count.
 *
 * Server Component: the count is fetched at build / hourly revalidation
 * (ISR), so there's no client JS and GitHub's API is hit at most once an
 * hour - the fetch is deduped + cached across every page that renders the
 * masthead. Degrades to a plain "Star" CTA if the API is unreachable
 * (rate-limited, offline, private repo).
 */

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
}

async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${site.github.owner}/${site.github.repo}`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/vnd.github+json" },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export async function GithubStar() {
  const stars = await getStarCount();
  return (
    <a
      href={site.github.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars !== null
          ? `Star Inspo on GitHub - ${stars.toLocaleString()} stars`
          : "Star Inspo on GitHub"
      }
      className="util-seg hidden shrink-0 items-center gap-2 px-3 font-mono text-xs leading-none tracking-normal text-[var(--color-fg-muted)] sm:flex"
    >
      <svg
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
      <span className="hidden items-center gap-1 sm:flex">
        <span aria-hidden className="text-[var(--color-link)]">
          ★
        </span>
        <span className="tabular-nums">
          {stars !== null ? formatStars(stars) : "Star"}
        </span>
      </span>
    </a>
  );
}
