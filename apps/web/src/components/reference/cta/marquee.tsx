"use client";

/* inspo-reference-component
 * type= cta | genre= editorial | theme= Inspo-paper
 * archetype= Marquee | diversification= motion-led - the action is the
 *   loop, not a button
 * states= default · hover (loop pauses) · prefers-reduced-motion
 * contrast= pass (46-50)
 */

import { useState } from "react";

/**
 * Marquee CTA - a single phrase scrolls left-to-right on infinite
 * loop. The whole strip is clickable. Pauses on hover so the reader
 * can rest their eye; collapses to a static line under reduced-motion.
 */
const PHRASE = "Open the archive - Open the archive - Open the archive -";

export function CtaMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <a
      href="#"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group block overflow-hidden border-y rule bg-[var(--color-accent)] py-8 text-[var(--color-accent-ink)] transition-colors duration-300 hover:bg-[var(--color-fg)]"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
      }}
    >
      <div
        className="flex w-fit gap-12 whitespace-nowrap will-change-transform"
        style={{
          animation: "cta-marquee 18s linear infinite",
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {/* Three copies so the seam is invisible at any width. */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="font-display text-3xl tracking-tight sm:text-5xl"
          >
            {PHRASE}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes cta-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="cta-marquee"] { animation: none !important; }
        }
      `}</style>
    </a>
  );
}
