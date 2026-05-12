"use client";

/**
 * Tiny ⌘K hint in the masthead. Clicking it dispatches a Cmd+K keydown
 * (the palette listens for that), so the same code path opens whether
 * the user typed the shortcut or clicked the chip. Works on touch too.
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
      className="text-meta hidden items-center gap-1 border rule px-2 py-1 leading-none text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)] sm:inline-flex"
    >
      <span aria-hidden>⌘K</span>
    </button>
  );
}
