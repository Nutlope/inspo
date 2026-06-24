"use client";

import { useState } from "react";
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
