import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createApiKey } from "@/lib/api-keys";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { label?: string };
  const label = (body.label ?? "default").trim();
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });

  try {
    const issued = await createApiKey(session.user.id, label);
    return NextResponse.json({ id: issued.id, prefix: issued.prefix, key: issued.key });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
