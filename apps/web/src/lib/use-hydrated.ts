import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during server render and hydration, `true` once the client
 * has taken over. The store-based form of the old "set mounted in an
 * effect" pattern: React renders the server snapshot while hydrating
 * and re-renders with the client one straight after, so the markup
 * never mismatches and no effect is needed.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
