"use client";

/**
 * Floating compare-set dock. Pinned to the bottom-right.
 *
 * State lives in localStorage under `inspo:compare`. The dock listens
 * for storage events (so multiple tabs stay in sync) and dispatches a
 * custom event when items change (so the AddToCompare button on the
 * same page reflects state without a full reload).
 *
 * The dock is hidden when the set is empty so it never claims screen
 * real-estate from new visitors who don't know what compare is yet.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const KEY = "inspo:compare";
const MAX = 4;
const EVT = "inspo:compare:change";

export interface CompareItem {
  slug: string;
  title: string;
}

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CompareItem =>
          !!x &&
          typeof x === "object" &&
          typeof (x as { slug?: unknown }).slug === "string" &&
          typeof (x as { title?: unknown }).title === "string",
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore quota / private-browsing errors */
  }
}

/** Pure helpers used by AddToCompare too. */
export function compareGet(): CompareItem[] {
  return read();
}
export function compareHas(slug: string): boolean {
  return read().some((x) => x.slug === slug);
}
export function compareToggle(item: CompareItem): boolean {
  const cur = read();
  const i = cur.findIndex((x) => x.slug === item.slug);
  if (i >= 0) {
    cur.splice(i, 1);
    write(cur);
    return false;
  }
  if (cur.length >= MAX) return true; // signal "at capacity"
  cur.push(item);
  write(cur);
  return true;
}
export function compareRemove(slug: string) {
  write(read().filter((x) => x.slug !== slug));
}
export function compareClear() {
  write([]);
}

export function useCompareSet() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const sync = useCallback(() => setItems(read()), []);
  useEffect(() => {
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    const onCustom = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, onCustom as EventListener);
    };
  }, [sync]);
  return items;
}

export function CompareDock() {
  const items = useCompareSet();
  if (items.length === 0) return null;
  const href = `/compare?slugs=${items.map((i) => encodeURIComponent(i.slug)).join(",")}`;
  return (
    <div
      className="fixed bottom-6 right-6 z-40 max-w-[min(36rem,92vw)] border rule bg-[var(--color-bg)] shadow-[0_8px_36px_rgba(0,0,0,0.12)]"
      role="region"
      aria-label="Compare set"
    >
      <div className="flex items-center justify-between gap-4 border-b rule px-4 py-2">
        <p className="text-meta">
          Compare set · {items.length}/{MAX}
        </p>
        <button
          type="button"
          onClick={() => compareClear()}
          className="text-meta hover:text-[var(--color-link)]"
        >
          Clear
        </button>
      </div>
      <ul className="flex flex-col">
        {items.map((it) => (
          <li
            key={it.slug}
            className="flex items-center justify-between gap-3 border-b rule px-4 py-2 last:border-b-0"
          >
            <Link
              href={`/screens/${it.slug}`}
              className="truncate text-sm hover:text-[var(--color-link)]"
            >
              {it.title}
            </Link>
            <button
              type="button"
              onClick={() => compareRemove(it.slug)}
              aria-label={`Remove ${it.title} from compare set`}
              className="text-meta text-[var(--color-fg-muted)] hover:text-[var(--color-link)]"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="
          block w-full text-center
          font-mono text-[10px] uppercase tracking-wider
          bg-[var(--color-fg)] !text-white
          dark:!text-[var(--color-bg)]
          px-5 py-3 transition-opacity hover:opacity-90
        "
      >
        Compare {items.length === 1 ? "this site" : `these ${items.length} sites`} →
      </Link>
    </div>
  );
}
