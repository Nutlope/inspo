"use client";

/**
 * ⌘K hint in the masthead. Clicking dispatches a Cmd+K keydown so the same
 * code path opens the palette as keyboard. Sized to match <ThemeToggle> -
 * same height, same border treatment, same colour transitions.
 */

export function CommandHint() {
  const open = () => {
    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toLowerCase().includes("mac");
    const ev = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    });
    window.dispatchEvent(ev);
  };
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open command palette"
      className="
        hidden h-7 shrink-0 items-center justify-center gap-0.5
        border rule px-2
        font-mono text-[0.7rem] leading-none tracking-wider
        text-[var(--color-fg-muted)]
        transition-colors duration-200
        hover:border-[var(--color-link)] hover:text-[var(--color-link)]
        sm:inline-flex
      "
    >
      <span aria-hidden>⌘</span>
      <span aria-hidden>K</span>
    </button>
  );
}
