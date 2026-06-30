"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CuratorActions({
  slug,
  sourceUrl,
}: {
  slug: string;
  sourceUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(action: "approve" | "reject", note?: string) {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch(`/api/curator/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMsg(action === "approve" ? "✓ approved - published" : "✓ rejected");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? `⚠ ${e.message}` : "failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => act("approve")}
          disabled={busy !== null}
          className="font-mono text-meta border rule bg-[var(--color-fg)] px-4 py-2 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {busy === "approve" ? "Approving…" : "Approve →"}
        </button>
        <button
          onClick={() => {
            const note = prompt("Reason for reject (optional):") ?? undefined;
            act("reject", note);
          }}
          disabled={busy !== null}
          className="font-mono text-meta border rule px-4 py-2 transition-colors hover:text-[var(--color-link)] disabled:opacity-40"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(`pnpm capture ${sourceUrl}`);
            setMsg("✓ copied - paste into a worker terminal to re-capture");
          }}
          className="font-mono text-meta border rule px-4 py-2 transition-colors hover:text-[var(--color-link)]"
        >
          Copy re-capture cmd
        </button>
      </div>
      {msg && <p className="text-meta">{msg}</p>}
    </div>
  );
}

/**
 * Take down an already-published screen by slug (the DMCA / takedown
 * lever). Maps to the curator route's new "unpublish" action, which sets
 * the screen status to "rejected" so it drops out of the public archive.
 */
export function TakedownForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function unpublish(e: FormEvent) {
    e.preventDefault();
    const s = slug.trim().toLowerCase();
    if (!s) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/curator/${encodeURIComponent(s)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unpublish", note: "takedown" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMsg(`✓ unpublished "${s}" - removed from the public archive`);
      setSlug("");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? `⚠ ${err.message}` : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={unpublish} className="flex flex-wrap items-center gap-3">
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="screen-slug-to-take-down"
        aria-label="Screen slug to unpublish"
        className="min-w-0 flex-1 border rule bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-link)]"
      />
      <button
        type="submit"
        disabled={busy || !slug.trim()}
        className="font-mono text-meta border rule px-4 py-2 transition-colors hover:text-[var(--color-link)] disabled:opacity-40"
      >
        {busy ? "Unpublishing…" : "Unpublish"}
      </button>
      {msg && <p className="text-meta w-full">{msg}</p>}
    </form>
  );
}
