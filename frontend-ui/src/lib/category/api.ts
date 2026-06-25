import type { CategoryConfig } from "@/lib/category/shared";
import type { Product } from "@/types/product";

// Server-side data access for backend-driven categories (e.g. the car brands).
// These run in Server Components and talk to Django directly (server-to-server),
// bypassing the browser's /api proxy. The products API is public (AllowAny).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
const REVALIDATE_SECONDS = 300; // load once, refresh in the background every 5 min

/** Full listing payload (chrome + products) for a backend-driven category. */
export async function fetchCategoryListing(slug: string): Promise<CategoryConfig | null> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/categories/${slug}/`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as CategoryConfig;
  } catch {
    return null;
  }
}

/** A filtered list of products (card shape). Query params mirror the API:
 *  category, type, warehouse, sub, q. Server-side, cached. */
export async function fetchProducts(params?: Record<string, string>): Promise<Product[]> {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : "";
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/products${qs}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch {
    return [];
  }
}

/** Related products for a detail page: same category, excluding the current one. */
export async function fetchRelated(categorySlug: string | undefined, excludeSlug: string, limit = 4): Promise<Product[]> {
  const list = await fetchProducts(categorySlug ? { category: categorySlug } : undefined);
  return list.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

/** A single product in the rich detail shape used by the product page.
 *  Pass { fresh: true } to bypass the cache — used by the reviews page so a
 *  newly posted review shows immediately after router.refresh(). */
export async function fetchProductDetail(slug: string, opts?: { fresh?: boolean }): Promise<Product | null> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/products/${slug}/`, {
      cache: opts?.fresh ? "no-store" : undefined,
      next: opts?.fresh ? undefined : { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}
