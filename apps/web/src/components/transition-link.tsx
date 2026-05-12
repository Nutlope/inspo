"use client";

/**
 * A Link wrapper that runs router.push inside document.startViewTransition
 * when the browser supports it. The current page fades out, the new page
 * fades in, and any matching view-transition-name properties on elements
 * morph between positions. Falls back to a normal navigation in browsers
 * without the View Transitions API (Firefox <134 has it behind a flag).
 *
 * Use as a drop-in for next/link on internal nav. The browser handles
 * the crossfade automatically; no extra CSS needed for basic cases.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

export function TransitionLink({
  href,
  children,
  className,
  prefetch,
  scroll,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  scroll?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const router = useRouter();
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    // Allow modifier-clicks / right-clicks / external targets to fall through.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition !== "function") return;
    e.preventDefault();
    doc.startViewTransition(() => {
      router.push(href);
    });
  }
  return (
    <Link
      href={href}
      prefetch={prefetch}
      scroll={scroll}
      className={className}
      onClick={handle}
    >
      {children}
    </Link>
  );
}
