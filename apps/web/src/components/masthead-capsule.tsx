"use client";

/**
 * The floating capsule around the masthead content. Client-side for
 * one reason: on scroll it narrows from full content width to a snug
 * centered pill and back, in one smooth max-width transition. The
 * children (logo, nav, utils - including the server-rendered GitHub
 * star) stream in from the server component that renders this.
 *
 * Shadow stays feather-light: none at rest, a soft short throw once
 * detached from the top so the capsule reads as floating, not heavy.
 */

import { useEffect, useState } from "react";

export function MastheadCapsule({ children }: { children: React.ReactNode }) {
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    // No rAF indirection: scroll events are already frame-coalesced,
    // and React drops the re-render when the boolean doesn't change.
    const onScroll = () => setShrunk(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`masthead-capsule mx-auto flex items-center justify-between gap-2 rounded-full border rule py-1.5 pl-3 pr-1.5 backdrop-blur-xl transition-[max-width,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:gap-6 sm:py-2 sm:pl-6 sm:pr-2.5 ${
        shrunk
          ? "max-w-[46rem] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)]"
          : "max-w-[110rem] bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] shadow-none"
      }`}
    >
      {children}
    </div>
  );
}
