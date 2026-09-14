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
  // (so the demo curator queue is interactive in dev). Production checks
  // regardless, so a missing DATABASE_URL can never open this up.
  if (hasDatabase() || process.env.NODE_ENV === "production") {
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "curator" && role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const { slug } = await ctx.params;
  const { action, note } = (await req.json().catch(() => ({}))) as {
    action: "approve" | "reject" | "unpublish";
    note?: string;
  };

  // "unpublish" takes an already-published screen back out of the public
  // archive (the DMCA / takedown lever); it maps to the same "rejected"
  // status as a fresh reject.
  if (action !== "approve" && action !== "reject" && action !== "unpublish") {
    return NextResponse.json({ error: "bad action" }, { status: 400 });
  }

  const status = action === "approve" ? "published" : "rejected";
  await updateScreenStatus(slug, status);
  if (note) await updateScreenCuratorNote(slug, note);

  return NextResponse.json({ ok: true, slug, status });
}
