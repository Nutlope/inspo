import Link from "next/link";
import { Dateline } from "@/components/dateline";
import { listApiKeys } from "@/lib/api-keys";
import { hasDatabase } from "@inspo/db";
import { requireUser } from "@/lib/session";
import { CreateKeyForm, RevokeButton, SignOutButton } from "./client";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const session = await requireUser();
  const keys = await listApiKeys(session.user.id);

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="Dashboard" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl">
            Hello, <em className="italic">{session.user.name || session.user.email}</em>.
          </h1>
          <p className="mt-6 max-w-[55ch] text-[var(--color-fg-muted)]">
            Manage your API keys here. Each key authenticates an MCP client —
            Claude Code, Cursor, or your own agent — against{" "}
            <code className="font-mono text-[0.95em] text-[var(--color-fg)]">api.inspo</code>.
          </p>
          <div className="mt-6 flex items-center gap-6">
            <p className="text-meta">
              {session.user.email}{" "}
              {(session.user as { role?: string }).role &&
                (session.user as { role?: string }).role !== "member" && (
                  <span className="ml-2 text-[var(--color-link)]">
                    {(session.user as { role?: string }).role}
                  </span>
                )}
            </p>
            <SignOutButton />
          </div>
        </div>
      </section>

      {!hasDatabase() ? (
        <section className="border-t rule pt-10 pb-24">
          <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
            <p className="text-meta lg:col-span-2">No database</p>
            <div className="lg:col-span-10">
              <p className="font-display text-2xl leading-snug text-[var(--color-fg)]">
                <em className="italic">Set <code className="font-mono">DATABASE_URL</code></em> to issue API keys.
              </p>
              <p className="mt-3 max-w-[55ch] text-[var(--color-fg-muted)]">
                Without a database, the gallery still works against fixtures —
                but API keys need a persistent store.{" "}
                <Link href="/mcp" className="hover:text-[var(--color-link)]">
                  See setup →
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Create */}
          <section className="border-t rule pt-10 pb-12">
            <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
              <p className="text-meta lg:col-span-2">Issue a new key</p>
              <div className="lg:col-span-10">
                <CreateKeyForm />
              </div>
            </div>
          </section>

          {/* List */}
          <section className="border-t rule pt-10 pb-24">
            <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
              <p className="text-meta lg:col-span-2">
                Active keys ({keys.length})
              </p>
              <div className="lg:col-span-10">
                {keys.length === 0 ? (
                  <p className="font-display text-xl text-[var(--color-fg-muted)]">
                    No active keys yet — issue one above.
                  </p>
                ) : (
                  <ul className="border-y rule">
                    {keys.map((k) => (
                      <li
                        key={k.id}
                        className="grid grid-cols-1 gap-y-3 border-b rule py-5 last:border-b-0 sm:grid-cols-12 sm:items-baseline sm:gap-x-6"
                      >
                        <div className="sm:col-span-3">
                          <p className="font-display text-lg">{k.label}</p>
                          <p className="text-meta">
                            Created {formatDate(k.createdAt)}
                          </p>
                        </div>
                        <p className="font-mono text-sm sm:col-span-4">
                          {k.keyPrefix}
                          <span className="text-[var(--color-fg-muted)]">
                            …
                          </span>
                        </p>
                        <p className="text-meta sm:col-span-3">
                          Last used: {formatDate(k.lastUsedAt)}
                        </p>
                        <div className="sm:col-span-2 sm:text-right">
                          <RevokeButton id={k.id} label={k.label} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Pointer to MCP page */}
      <section className="border-t rule pt-10 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">Install</p>
          <div className="lg:col-span-10">
            <Link
              href="/mcp"
              className="font-display text-3xl underline-offset-8 hover:text-[var(--color-link)] hover:underline"
            >
              Wire Inspo into your agent →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
