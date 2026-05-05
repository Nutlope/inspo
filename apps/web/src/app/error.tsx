"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest to the dev console so we can match it to logs.
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[inspo] page error", error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <section className="grid grid-cols-1 gap-y-10 pt-20 pb-32 sm:pt-32 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <p className="text-meta">
            Something broke<br />
            <span className="mt-3 block">
              {error.digest ? `№ ${error.digest.slice(0, 10)}` : ""}
            </span>
          </p>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <h1 className="font-display max-w-[18ch] text-balance text-6xl leading-[0.95] tracking-tight sm:text-7xl">
            That didn&rsquo;t go well.
          </h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-[var(--color-fg-muted)]">
            The page hit an error mid-render. We&rsquo;ve logged it. Try
            again — most of these are transient.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4">
            <button
              type="button"
              onClick={() => reset()}
              className="font-mono text-meta border rule bg-[var(--color-fg)] px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80"
            >
              Try again →
            </button>
            <Link
              href="/"
              className="text-meta hover:text-[var(--color-link)]"
            >
              ← Back to the front
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
