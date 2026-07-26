"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Search, Tag, TrendingUp } from "lucide-react";
import { PersonalizedFeed } from "@/components/home/personalized-feed";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getSearchTerms, recordSearch, searchProducts } from "@/lib/auth/api";
import type { Product } from "@/types/product";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

type SearchFilter = "all" | "china" | "air" | "sea" | "popular" | "under25";

const FILTER_CHIPS: Array<{ key: SearchFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "china", label: "China" },
  { key: "air", label: "Air Shipping" },
  { key: "sea", label: "Sea Shipping" },
  { key: "popular", label: "Popular" },
  { key: "under25", label: "Under K250" },
];

const TERM_PILL_CLASS =
  "rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-transform duration-100 active:scale-95 md:hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:md:hover:bg-zinc-800";

type SearchPageClientProps = {
  /** Where the back button goes. */
  backHref?: string;
  /** Base path for product detail links on the result cards. */
  productHrefBase?: string;
};

export function SearchPageClient({
  backHref = "/explore",
  productHrefBase = "/explore/search/product",
}: SearchPageClientProps = {}) {
  const searchParams = useSearchParams();
  // Seed the search box from the ?q= URL param so links like
  // /explore/search?q=universal+led+headlight+bulbs run the search on arrival.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");

  // Keep in sync when navigating to a new ?q= while the page stays mounted
  // (e.g. tapping a different category card). Typing only updates local state,
  // never the URL, so this won't clobber what the user is typing.
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const debouncedQuery = useDebouncedValue(query, 250);
  const normalizedDebouncedQuery = normalizeText(debouncedQuery);

  // Real search terms: recent (this user's history) + popular (across everyone).
  const [recentTerms, setRecentTerms] = useState<string[]>([]);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    getSearchTerms().then((t) => {
      if (cancelled) return;
      setRecentTerms(t.recent);
      setPopularTerms(t.popular);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Record a real search once the user pauses on a meaningful query, and show it
  // in "recent" immediately (optimistic).
  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < 2) return;
    void recordSearch(term);
    setRecentTerms((prev) => [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8));
  }, [debouncedQuery]);

  // Server-side search: the backend matches the query; the chips below filter the
  // returned set client-side. An empty query returns a default list (recommended).
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    searchProducts(debouncedQuery)
      .then((data) => !cancelled && setProducts(data))
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setFetching(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const isSearching = normalizeText(query) !== normalizedDebouncedQuery || fetching;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "china") return product.origin === "China" || product.warehouse === "china";
      if (activeFilter === "air") return product.shippingMethod === "air" || Boolean(product.airPrice);
      if (activeFilter === "sea") return product.shippingMethod === "sea";
      if (activeFilter === "popular") return Boolean(product.popularityLabel);
      if (activeFilter === "under25") return product.price < 25;
      return true;
    });
  }, [products, activeFilter]);

  // The server already matched the query; just hand back the chip-filtered set.
  const results = useMemo(
    () => (normalizedDebouncedQuery ? filteredProducts : []),
    [normalizedDebouncedQuery, filteredProducts],
  );

  const showSuggestions = normalizedDebouncedQuery.length === 0;
  const totalProductCount = filteredProducts.length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-8 pt-4 text-slate-900 transition-colors dark:bg-black dark:text-zinc-100 md:px-8">
      <div className="mx-auto w-full max-w-md md:max-w-5xl">
        <div className="reveal-up mb-4 flex items-center gap-3">
          <Link
            href={backHref}
            aria-label="Go back"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">Search</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
              {normalizedDebouncedQuery ? `${results.length} results` : `${totalProductCount.toLocaleString()} products`}
            </p>
          </div>
        </div>

        <div style={{ animationDelay: "60ms" }} className="reveal-up relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.03] outline-none transition-colors placeholder:text-slate-400 focus:border-gold-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-gold-500"
          />
        </div>

        <div style={{ animationDelay: "120ms" }} className="reveal-up mt-3 flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(chip.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${
                  active
                    ? "border-gold-500/60 bg-gold-500/10 text-gold-600 dark:border-gold-400/50 dark:bg-gold-500/15 dark:text-gold-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {showSuggestions ? (
          <section className="reveal-up mt-6 space-y-6" style={{ animationDelay: "180ms" }}>
            {recentTerms.length > 0 ? (
              <div>
                <h2 className="mb-2.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                  <Clock3 className="h-3.5 w-3.5" /> Recent Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentTerms.map((term) => (
                    <button key={term} type="button" onClick={() => setQuery(term)} className={TERM_PILL_CLASS}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="mb-2.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                <TrendingUp className="h-3.5 w-3.5" /> Popular Searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {popularTerms.map((term) => (
                  <button key={term} type="button" onClick={() => setQuery(term)} className={TERM_PILL_CLASS}>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                <Tag className="h-3.5 w-3.5" /> Recommended for you
              </h2>
              <PersonalizedFeed
                card="product"
                limit={6}
                detailHrefBase={productHrefBase}
                className="grid grid-cols-2 gap-3 md:grid-cols-3"
              />
            </div>
          </section>
        ) : (
          <section className="reveal-up mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Results</h2>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                {isSearching ? "Searching..." : `${results.length} found`}
              </span>
            </div>

            {results.length === 0 && !isSearching ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-300">No matching products found</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Try another keyword or switch a filter chip.</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToCart
                  variant="search"
                  detailHrefBase={productHrefBase}
                />
              ))}
              {isSearching
                ? Array.from({ length: 2 }).map((_, idx) => <ProductCardSkeleton key={`sk-${idx}`} />)
                : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
