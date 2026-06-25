import { requireUser } from "@/lib/auth/server";

// These routes are per-user and read the session — never statically generated.
export const dynamic = "force-dynamic";

// Server-side gate for EVERY page under /account. Validates the real session
// against Django — a stale/expired cookie is redirected to login before any
// account content is rendered.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return <>{children}</>;
}
