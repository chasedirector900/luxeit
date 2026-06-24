import type { CategoryConfig, ListingProduct } from "@/lib/category/shared";
import { electronicsConfig } from "@/lib/category/catalogs/electronics";
import { footwearConfig } from "@/lib/category/catalogs/footwear";
import { securityConfig } from "@/lib/category/catalogs/security";
import { watchesConfig } from "@/lib/category/catalogs/watches";

// Config-driven (frontend mock) categories. The car brands and universal parts
// are intentionally NOT here — they're backend-driven: the [category] route
// falls back to fetchCategoryListing() (lib/category/api.ts) when a slug isn't
// found locally, so those listings come from Django.
const CONFIGS: CategoryConfig[] = [footwearConfig, watchesConfig, electronicsConfig, securityConfig];

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
