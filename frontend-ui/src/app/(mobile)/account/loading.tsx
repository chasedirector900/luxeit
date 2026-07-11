import { SectionSkeleton } from "@/components/layout/section-skeleton";

// Branch boundary: fronts EVERY /account/* page (orders, settings, saved, …)
// during cross-tab navigation — neutral by design (see SectionSkeleton).
// The account home page shows its own matching AccountSkeleton client-side.
export default function AccountLoading() {
  return <SectionSkeleton />;
}
