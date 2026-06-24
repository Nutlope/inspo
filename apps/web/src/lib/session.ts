/**
 * Server-side session helpers - call from Server Components / route handlers.
 * Auth-related routes set `dynamic = "force-dynamic"` so reading headers is safe.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return session;
}

export async function requireRole(role: "curator" | "admin") {
  const session = await requireUser();
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== role && userRole !== "admin") redirect("/");
  return session;
}
