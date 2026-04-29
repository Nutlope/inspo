import { NextResponse } from "next/server";
import {
  hasDatabase,
  updateScreenCuratorNote,
  updateScreenStatus,
} from "@inspo/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  // Authz: in DB mode require curator/admin role; in fixtures mode allow
  // (so the demo curator queue is interactive in dev).
  if (hasDatabase()) {
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "curator" && role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const { slug } = await ctx.params;
  const { action, note } = (await req.json().catch(() => ({}))) as {
    action: "approve" | "reject";
    note?: string;
  };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "bad action" }, { status: 400 });
  }

  await updateScreenStatus(
    slug,
    action === "approve" ? "published" : "rejected",
  );
  if (note) await updateScreenCuratorNote(slug, note);

  return NextResponse.json({ ok: true, slug, status: action === "approve" ? "published" : "rejected" });
}
