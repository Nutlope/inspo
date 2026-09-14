import Link from "next/link";
import { requireRole } from "@/lib/session";
import { hasDatabase } from "@inspo/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Without a DB, role gating is best-effort (memory adapter loses sessions
  // across restart). Allow access in dev so the curator UI is testable.
  // Production always checks the role, so a deploy that lost its
  // DATABASE_URL fails closed instead of opening the curator queue.
  if (hasDatabase() || process.env.NODE_ENV === "production") {
    await requireRole("curator");
  }

  return (
    <div className="border-t-2 border-[var(--color-link)]">
      <div className="mx-auto max-w-[120rem] px-6 py-4 sm:px-10">
        <p className="text-meta">
          <span className="text-[var(--color-link)]">●</span> Admin -{" "}
          <Link href="/admin/curator" className="hover:text-[var(--color-link)]">
            Curator queue
          </Link>
        </p>
      </div>
      {children}
    </div>
  );
}
