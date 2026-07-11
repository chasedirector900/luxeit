import { SectionSkeleton } from "@/components/layout/section-skeleton";

// Branch boundary: fronts EVERY /category/* page during cross-tab navigation
// (listing, product detail, reviews) — so it must stay neutral. The specific
// skeletons live in the deeper segments' loading.tsx.
export default function CategoryLoading() {
  return <SectionSkeleton />;
}
