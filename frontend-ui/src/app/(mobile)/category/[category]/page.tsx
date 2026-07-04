import { notFound } from "next/navigation";
import { CategoryListingView } from "@/components/category/category-listing-view";
import { fetchCategoryListing } from "@/lib/category/api";
import { getCategoryConfig } from "@/lib/category/registry";

type CategoryListingPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; type?: string; sort?: string; price?: string; view?: string }>;
};

// No generateStaticParams here on purpose: this page reads searchParams (a
// request-time API) for filtering/sorting, which makes it dynamic. Statically
// prerendering it caused DYNAMIC_SERVER_USAGE errors on every ISR revalidation
// in production. Product data fetches are still cached (revalidate: 300).

export default async function CategoryListingPage({ params, searchParams }: CategoryListingPageProps) {
  const { category } = await params;

  // Local config-driven categories first (footwear, watches, ...); otherwise
  // fall back to a backend-driven category (the car brands + universal parts).
  const config = getCategoryConfig(category) ?? (await fetchCategoryListing(category));

  if (!config) {
    notFound();
  }

  const sp = await searchParams;
  return <CategoryListingView config={config} params={sp} />;
}
