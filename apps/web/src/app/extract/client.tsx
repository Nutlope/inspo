"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExtractClient({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    setStage("queueing capture…");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ??
            "You've hit today's extract limit. Try again tomorrow, or self-host the project to remove the cap.",
        );
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Extract failed (HTTP ${res.status}).`);
      }

      setStage("captured. routing to result…");
      const body = (await res.json()) as { slug: string };
      router.push(`/screens/${body.slug}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setStage("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-meta">URL</span>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          autoFocus
          disabled={busy}
          className="mt-2 block w-full border rule bg-transparent px-4 py-3 font-mono text-base outline-none focus:border-[var(--color-link)] disabled:opacity-50"
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="submit"
          disabled={busy || !url}
          className="font-mono text-meta border rule bg-[var(--color-fg)] px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {busy ? "Capturing…" : "Extract design system →"}
        </button>
        {stage && (
          <span className="text-meta italic text-[var(--color-fg-muted)]">
            {stage}
          </span>
        )}
      </div>
      <p className="text-meta text-[var(--color-fg-muted)]">
        Takes ~30 seconds. Limited to 5 extracts per day per signed-in user.
      </p>

      {err && (
        <p className="border-l-2 border-[var(--color-link)] pl-3 text-sm text-[var(--color-link)]">
          {err}
        </p>
      )}
    </form>
  );
}
