/**
 * Resolve image URLs returned by the query layer to absolute URLs the
 * agent's client can fetch. In dev that's localhost:3000; in prod it's
 * the deployed gallery / R2.
 */

const BASE = process.env.INSPO_BASE_URL ?? "http://localhost:3000";

export function absolute(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${BASE.replace(/\/$/, "")}${url}`;
  return url;
}
