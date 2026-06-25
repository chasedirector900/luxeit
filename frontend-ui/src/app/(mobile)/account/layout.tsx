import { requireUser } from "@/lib/auth/server";

// Server-side gate for EVERY page under /account. Validates the real session
// against Django — a stale/expired cookie is redirected to login before any
// account content is rendered.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return <>{children}</>;
}
