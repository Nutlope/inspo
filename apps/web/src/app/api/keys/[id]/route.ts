import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { revokeApiKey } from "@/lib/api-keys";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await ctx.params;
  await revokeApiKey(session.user.id, id);
  return NextResponse.json({ ok: true });
}
