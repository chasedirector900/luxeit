import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, SearchX, Sparkles } from "lucide-react";
import { HeaderCartButton } from "@/components/layout/header-cart-button";
import { InlineSearchInput } from "@/components/search/inline-search-input";
import { ListingChips } from "@/components/category/listing-chips";
import { ListingFilterSheet } from "@/components/category/listing-filter-sheet";
import { ListingProductCard } from "@/components/category/listing-product-card";
import { type CategoryConfig, filterListing } from "@/lib/category/shared";
import { resolveListingIcon } from "@/lib/category/icons";

const POPULAR_LIMIT = 6;

export type CategoryListingParams = {
  q?: string;
  type?: string;
  sort?: string;
  price?: string;
  view?: string;
};

type CategoryListingViewProps = {
  config: CategoryConfig;
  params: CategoryListingParams;
};

export function CategoryListingView({ config, params }: CategoryListingViewProps) {
  const query = (params.q ?? "").trim();
  const normalized = query.toLowerCase();
  const type = params.type ?? "all";
  const sort = params.sort ?? "featured";
  const price = params.price ?? "all";
  const view = params.view ?? "";

  const detailHrefBase = `/category/${config.slug}/product`;

  const results = filterListing(config.products, { query: normalized, type, sort, price });
  const isBrowsing = !query && type === "all" && sort === "featured" && price === "all" && view !== "all";
  const popularPicks = config.products.slice(0, POPULAR_LIMIT);
  const gridProducts = isBrowsing ? popularPicks : results;

  const activeChip = config.chips.find((chip) => chip.key === type);
  const heading = query
    ? "Search results"
    : type !== "all"
      ? (activeChip?.label ?? config.title)
      : isBrowsing
        ? `Popular ${config.title}`
        : `All ${config.title}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Header */}
        <header className="reveal-up space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/category"
              aria-label="Back to categories"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <HeaderCartButton />
          </div>
          <div>
            <h1 className="text-[2rem] font-black leading-none tracking-tight">{config.title}</h1>
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">{config.subtitle}</p>
          </div>
        </header>

        {/* Search + Filter */}
        <div style={{ animationDelay: "60ms" }} className="reveal-up flex gap-2.5">
          <InlineSearchInput initialQuery={params.q?.trim() ?? ""} placeholder={config.searchPlaceholder} />
          <ListingFilterSheet />
        </div>

        {/* Sub-category chips */}
        <div style={{ animationDelay: "120ms" }} className="reveal-up">
          <ListingChips chips={config.chips} />
        </div>

        {/* Hero — only in the pure browse view */}
        {isBrowsing ? (
          <section
            style={{ animationDelay: "180ms" }}
            className="reveal-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-900/25"
          >
            <div className="pointer-events-none absolute -right-6 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-white/20 blur-3xl transform-gpu" />
            <div className="relative max-w-[62%]">
              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                {config.hero.badge}
              </span>
              <h2 className="mt-3 text-[1.7rem] font-black leading-[1.05]">{config.hero.title}</h2>
              <p className="mt-2 text-[13px] text-white/90">{config.hero.subtitle}</p>
              <a
                href="#listing-products"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-indigo-700 shadow-md transition-transform duration-100 active:scale-95"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <span className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </span>
          </section>
        ) : null}

        {/* Product grid */}
        <section
          id="listing-products"
          style={{ animationDelay: isBrowsing ? "240ms" : "180ms" }}
          className="reveal-up scroll-mt-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">{heading}</h3>
            {isBrowsing ? (
              <Link
                href={`/category/${config.slug}?view=all`}
                scroll={false}
                className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-indigo-600 transition-colors active:text-indigo-500 dark:text-indigo-400"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-[13px] text-slate-500 dark:text-zinc-400">
                {gridProducts.length} {gridProducts.length === 1 ? "result" : "results"}
              </span>
            )}
          </div>

          {gridProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {gridProducts.map((product) => (
                <ListingProductCard key={product.id} product={product} detailHrefBase={detailHrefBase} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                <SearchX className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-zinc-100">No products found</p>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">Try a different category, keyword, or filter.</p>
            </div>
          )}
        </section>

        {/* Feature strip — only in the pure browse view */}
        {isBrowsing ? (
          <section
            style={{ animationDelay: "300ms" }}
            className="reveal-up grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {config.features.map(({ icon, title, subtitle, tint, ring }) => {
              const Icon = resolveListingIcon(icon);
              return (
              <div key={title} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:text-left">
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ring}`}>
                  <Icon className={`h-[18px] w-[18px] ${tint}`} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight text-slate-900 dark:text-zinc-100">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-zinc-500">{subtitle}</p>
                </div>
              </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
