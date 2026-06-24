import { notFound } from "next/navigation";
import { SearchProductDetailClient } from "@/components/search/search-product-detail-client";
import { fetchCategoryListing, fetchProductDetail } from "@/lib/category/api";
import { findListingProduct } from "@/lib/category/registry";
import { listingToProduct } from "@/lib/category/shared";

type CategoryProductPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function CategoryListingProductPage({ params }: CategoryProductPageProps) {
  const { category, slug } = await params;

  // Local config-driven categories first.
  const found = findListingProduct(category, slug);
  if (found) {
    const { config, product } = found;
    const mapped = listingToProduct(product, config.title);
    const related = config.products
      .filter((item) => item.slug !== slug)
      .slice(0, 4)
      .map((item) => listingToProduct(item, config.title));

    return (
      <SearchProductDetailClient
        product={mapped}
        related={related}
        backHref={`/category/${category}`}
        productHrefBase={`/category/${category}/product`}
      />
    );
  }

  // Backend-driven categories (car brands + universal parts).
  const product = await fetchProductDetail(slug);
  if (!product) {
    notFound();
  }
  const listing = await fetchCategoryListing(category);
  const related = (listing?.products ?? [])
    .filter((item) => item.slug !== slug)
    .slice(0, 4)
    .map((item) => listingToProduct(item, listing?.title ?? product.category ?? ""));

  return (
    <SearchProductDetailClient
      product={product}
      related={related}
      backHref={`/category/${category}`}
      productHrefBase={`/category/${category}/product`}
    />
  );
}
