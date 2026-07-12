"use client";

import { useEffect, useState } from "react";
import { HomeTopPickCard } from "@/components/home/home-top-pick-card";
import { ProductCard } from "@/components/product/product-card";
import { fetchFeed } from "@/lib/auth/api";
import type { Product } from "@/types/product";

type PersonalizedFeedProps = {
  /** How many products to request. */
  limit?: number;
  /** Restrict the feed to one category (used on category pages). */
  category?: string;
  /** Which card style to render. */
  card?: "home" | "product";
  /** Base path for detail links (product card only). */
  detailHrefBase?: string;
  /** Products already shown above, so the feed doesn't repeat them. */
  exclude?: string[];
  className?: string;
  /** Server-rendered products to show instantly, then refresh + rotate. */
  initial?: Product[];
};

/**
 * The smart feed. Fetches /api/feed with a fresh random seed on every mount, so
 * it rotates on each reload (YouTube-style) and personalises to the signed-in
 * user (the session cookie rides along through the /api proxy). Renders an
 * instant server-provided set first when given, so there's never a blank flash.
 */
export function PersonalizedFeed({
  limit = 8,
  category,
  card = "product",
  detailHrefBase,
  exclude,
  className = "grid grid-cols-2 gap-3",
  initial = [],
}: PersonalizedFeedProps) {
  const [items, setItems] = useState<Product[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);

  useEffect(() => {
    let cancelled = false;
    fetchFeed({ limit, category, exclude })
      .then((data) => {
        if (!cancelled && data.length) setItems(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // A fresh mount (each page load) re-runs this with a new random seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && items.length === 0) {
    return (
      <div className={className}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((product) =>
        card === "home" ? (
          <HomeTopPickCard key={product.id} product={product} />
        ) : (
          <ProductCard key={product.id} product={product} variant="search" showAddToCart detailHrefBase={detailHrefBase} />
        ),
      )}
    </div>
  );
}
