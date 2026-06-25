import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Server-side gate: checkout requires a valid session (not just a cookie).
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/cart/checkout");
  return <>{children}</>;
}
