import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// Server-side auth gate. Unlike the proxy (which only checks the cookie EXISTS),
// this validates the session against Django — so a stale/expired cookie can't
// grant access. Used by the /account and /cart/checkout layouts.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
const SESSION_COOKIE = "luxeit_session";

/** Returns the authenticated user, or null if the session is missing/invalid. */
export async function getServerUser(): Promise<{ id: number } | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${session}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: number };
  } catch {
    return null;
  }
}

/** Require a valid session or redirect to /login (preserving where they were). */
export async function requireUser(fallbackNext = "/account"): Promise<{ id: number }> {
  const user = await getServerUser();
  if (user) return user;
  const path = (await headers()).get("x-pathname") || fallbackNext;
  redirect(`/login?next=${encodeURIComponent(path)}`);
}
