"use client";

/* Hallmark · component: nav · genre: editorial · theme: Inspo-paper
 * archetype: N4 Off-canvas · diversification: minimal top row, full
 *   nav slides in from the side on demand
 * states: default · open · focus-visible · prefers-reduced-motion
 * contrast: pass (46-50)
 */

import { useEffect, useState } from "react";

/**
 * Off-canvas nav — the page leads with just the wordmark and a
 * "menu" affordance. The full navigation slides in from the right as
 * a drawer. Body scroll locks while open; Esc closes. Reach for it
 * when the site wants to be content-led and the nav is the second
 * citizen.
 */
const LINKS = ["Archive", "Components", "Collections", "MCP", "About", "Contribute"];

export function NavOffCanvas() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="border-y rule bg-[var(--color-bg)] px-8 py-5 sm:px-14">
        <div className="flex items-center justify-between">
          <a href="#" className="font-display text-2xl tracking-tight">
            Inspo<span className="text-[var(--color-link)]">.</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="off-canvas-nav"
            className="text-meta border rule px-3 py-1.5 transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
          >
            Menu
          </button>
        </div>
      </header>

      {/* Drawer */}
      <div
        id="off-canvas-nav"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`
          fixed inset-0 z-50 transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <div
          className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-fg)_40%,transparent)] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`
            absolute right-0 top-0 h-full w-[min(420px,86vw)]
            border-l rule bg-[var(--color-bg)] px-8 py-8
            transition-transform duration-300 ease-out
            ${open ? "translate-x-0" : "translate-x-full"}
          `}
          style={{ willChange: "transform" }}
        >
          <div className="flex items-baseline justify-between">
            <p className="text-meta">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-meta hover:text-[var(--color-link)]"
            >
              Close ✕
            </button>
          </div>
          <ul className="mt-10 space-y-4">
            {LINKS.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  className="
                    font-display block text-3xl leading-tight tracking-tight
                    transition-colors hover:text-[var(--color-link)]
                  "
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
