import type { CategoryConfig, ListingProduct } from "@/lib/category/shared";

// All shop categories are now backend-driven: the [category] route falls back
// to fetchCategoryListing() (lib/category/api.ts) when a slug isn't found here,
// and every category (footwear, watches, electronics, security, the car brands,
// universal parts) is served from Django. This registry stays as the seam for
// any future frontend-only (mock) category.
const CONFIGS: CategoryConfig[] = [];

const CONFIG_BY_SLUG: Record<string, CategoryConfig> = Object.fromEntries(
  CONFIGS.map((config) => [config.slug, config]),
);

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CONFIG_BY_SLUG[slug];
}

export function getCategorySlugs(): string[] {
  return CONFIGS.map((config) => config.slug);
}

export function findListingProduct(
  categorySlug: string,
  productSlug: string,
): { config: CategoryConfig; product: ListingProduct } | undefined {
  const config = CONFIG_BY_SLUG[categorySlug];
  if (!config) return undefined;
  const product = config.products.find((item) => item.slug === productSlug);
  if (!product) return undefined;
  return { config, product };
}
