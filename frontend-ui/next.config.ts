import type { NextConfig } from "next";

// Backend origin the app proxies /api/* to (server-side). Defaults to the local
// Django dev server. Override with BACKEND_ORIGIN if Django runs elsewhere.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
const isProd = process.env.NODE_ENV === "production";

// Static brand/car/product images change rarely — cache them hard so the browser
// loads each once and serves the rest from its own disk cache (no re-fetch).
const IMMUTABLE_ONE_YEAR = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // How long an optimized image may be reused before the browser revalidates.
    // Long in prod (load once); short in dev so swapped assets show immediately.
    minimumCacheTTL: isProd ? 31536000 : 0,
  },
  // Proxy API calls to Django so the browser only ever talks to this app's own
  // origin. That means no CORS, no mixed-content, and session cookies "just work"
  // — including over a tunnel (ngrok) when testing on a phone.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
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
