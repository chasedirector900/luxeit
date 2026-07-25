import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// The backend origin the Next server proxies to (same var the app data layer
// uses). On Vercel this is https://api.luxeit.co.zm.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";

type Listed = { slug?: string };

async function fetchList(path: string): Promise<Listed[]> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}${path}`, {
      // Revalidate hourly so new products/categories enter the sitemap without
      // a redeploy, but we don't hammer the API on every crawl.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/category`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const [products, categories] = await Promise.all([
    fetchList("/api/products"),
    fetchList("/api/categories"),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
