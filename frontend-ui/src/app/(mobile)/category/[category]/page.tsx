import { notFound } from "next/navigation";
import { CategoryListingView } from "@/components/category/category-listing-view";
import { fetchCategoryListing } from "@/lib/category/api";
import { getCategoryConfig, getCategorySlugs } from "@/lib/category/registry";

type CategoryListingPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; type?: string; sort?: string; price?: string; view?: string }>;
};

export function generateStaticParams() {
  return getCategorySlugs().map((category) => ({ category }));
}

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
