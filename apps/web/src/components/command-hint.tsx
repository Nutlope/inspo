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
      className="util-seg hidden shrink-0 items-center justify-center px-3 font-mono text-xs leading-none text-[var(--color-fg-muted)] sm:flex"
    >
      <span aria-hidden>⌘K</span>
    </button>
  );
}
