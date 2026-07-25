import type { NextConfig } from "next";

// Backend origin the app proxies /api/* to (server-side). Defaults to the local
// Django dev server. Override with BACKEND_ORIGIN if Django runs elsewhere.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
const isProd = process.env.NODE_ENV === "production";

// Static brand/car/product images change rarely — cache them hard so the browser
// loads each once and serves the rest from its own disk cache (no re-fetch).
const IMMUTABLE_ONE_YEAR = "public, max-age=31536000, immutable";

// Host serving uploaded product photos (Cloudflare R2), e.g. "pub-xxxx.r2.dev"
// or "cdn.luxeit.co.zm". next/image refuses remote hosts that aren't allowlisted,
// so this must match R2_PUBLIC_HOST on the backend. Unset locally, where uploads
// are served from the Django dev server instead.
const MEDIA_HOST = (process.env.MEDIA_HOST ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // How long an optimized image may be reused before the browser revalidates.
    // Long in prod (load once); short in dev so swapped assets show immediately.
    minimumCacheTTL: isProd ? 31536000 : 0,
    // In production Django returns absolute R2 URLs, so that host must be
    // allowlisted. Locally uploads come back as same-origin /media/* paths
    // (proxied below), which need no entry here.
    remotePatterns: MEDIA_HOST ? [{ protocol: "https" as const, hostname: MEDIA_HOST }] : [],
  },
  // Proxy API calls to Django so the browser only ever talks to this app's own
  // origin. That means no CORS, no mixed-content, and session cookies "just work"
  // — including over a tunnel (ngrok) when testing on a phone.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
      // Uploaded product photos while developing locally, where Django serves
      // them from its own media/ folder. In production these live in R2 and the
      // API returns absolute URLs, so this route is never hit.
      { source: "/media/:path*", destination: `${BACKEND_ORIGIN}/media/:path*` },
    ];
  },
  // Immutable caching for our static image folders (prod only — keeps dev hot).
  async headers() {
    if (!isProd) return [];
    return [
      { source: "/brands/:path*", headers: [{ key: "Cache-Control", value: IMMUTABLE_ONE_YEAR }] },
      { source: "/cars/:path*", headers: [{ key: "Cache-Control", value: IMMUTABLE_ONE_YEAR }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: IMMUTABLE_ONE_YEAR }] },
    ];
  },
};

export default nextConfig;
