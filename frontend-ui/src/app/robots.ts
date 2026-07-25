import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Tells crawlers what to index. Public catalog pages are open; private/auth and
// API routes are kept out of the index. Points crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/cart", "/login", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
