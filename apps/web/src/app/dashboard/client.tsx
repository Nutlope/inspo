"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function CreateKeyForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { key: string };
      setIssuedKey(j.key);
      setLabel("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-meta">Label</span>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="laptop · macbook · cursor · …"
            className="mt-2 block w-72 border rule bg-transparent px-4 py-3 font-mono text-sm outline-none focus:border-[var(--color-link)]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !label}
          className="font-mono text-meta border rule bg-[var(--color-fg)] px-5 py-3 text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {busy ? "Issuing…" : "Issue key →"}
        </button>
      </form>

      {err && (
        <p className="mt-4 border-l-2 border-[var(--color-link)] pl-3 text-sm text-[var(--color-link)]">
          {err}
        </p>
      )}

      {issuedKey && (
        <div className="mt-6 border rule px-5 py-4">
          <p className="text-meta">
            Copy now — this key is shown only once.
          </p>
          <pre className="mt-3 overflow-x-auto font-mono text-base text-[var(--color-fg)]">
            <code>{issuedKey}</code>
          </pre>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              className="text-meta hover:text-[var(--color-link)]"
              onClick={async () => {
                await navigator.clipboard.writeText(issuedKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "✓ Copied" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              className="text-meta hover:text-[var(--color-link)]"
              onClick={() => setIssuedKey(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RevokeButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!confirm(`Revoke "${label}"? Any client using it will stop working.`))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("revoke failed");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={revoke}
      disabled={busy}
      className="text-meta hover:text-[var(--color-link)] disabled:opacity-40"
    >
      {busy ? "Revoking…" : "Revoke"}
    </button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.push("/");
      }}
      disabled={busy}
      className="text-meta hover:text-[var(--color-link)] disabled:opacity-40"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
