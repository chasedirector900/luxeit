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

/** A single product in the rich detail shape used by the product page. */
export async function fetchProductDetail(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/products/${slug}/`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}
