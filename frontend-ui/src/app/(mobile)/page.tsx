import Link from "next/link";
import { ArrowRight, SearchX, Tag, Truck } from "lucide-react";
import { HomeTopPickCard } from "@/components/home/home-top-pick-card";
import { PersonalizedFeed } from "@/components/home/personalized-feed";
import { MobileHomeHeader } from "@/components/home/mobile-home-header";
import { InlineSearchInput } from "@/components/search/inline-search-input";
import { fetchProducts } from "@/lib/category/api";

type HomePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const isSearching = query.length > 0;

  // Search hits the backend catalogue server-side — the URL (?q=) is the source
  // of truth, so results are SSR'd and the home stays a server component.
  const results = isSearching ? await fetchProducts({ q: query }) : [];
  // Server-rendered seed for the feed so there's an instant first paint; the
  // <PersonalizedFeed> then refreshes + rotates + personalises on the client.
  const feedSeed = isSearching ? [] : (await fetchProducts()).slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-6 pt-3 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="reveal-up">
          <MobileHomeHeader />
        </div>

        <div style={{ animationDelay: "60ms" }} className="reveal-up">
          <InlineSearchInput initialQuery={query} placeholder="Search products, brands, and more" />
        </div>

        {isSearching ? (
          /* Inline search results — the home content filters in place */
          <section className="reveal-up">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Search results</h3>
              <span className="text-[13px] text-slate-500 dark:text-zinc-400">
                {results.length} {results.length === 1 ? "result" : "results"}
              </span>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {results.map((product) => (
                  <HomeTopPickCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                  <SearchX className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-zinc-100">No products found</p>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                  Nothing matches &ldquo;{query}&rdquo;. Try a different keyword.
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            <section
              style={{ animationDelay: "120ms" }}
              className="reveal-up relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-emerald-50 to-amber-50 p-5 shadow-sm shadow-emerald-900/[0.04] dark:border-emerald-900/40 dark:from-emerald-950/50 dark:via-emerald-950/30 dark:to-amber-950/20 dark:shadow-none"
            >
              {/* Decorative glows — pure CSS, transform-gpu, no repaint */}
              <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-emerald-300/30 blur-3xl transform-gpu dark:bg-emerald-500/10" />
              <div className="pointer-events-none absolute -bottom-12 -right-6 h-36 w-36 rounded-full bg-amber-300/30 blur-3xl transform-gpu dark:bg-amber-500/10" />

              <div className="relative max-w-[85%]">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm dark:bg-zinc-900 dark:text-emerald-300 dark:shadow-none">
                  Imported from China
                </span>
                <h2 className="mt-2.5 text-[1.9rem] font-black leading-[1.0] tracking-tight text-emerald-900 dark:text-emerald-50">
                  Smart deals from China
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/75 dark:text-emerald-100/65">
                  Quality products. Affordable prices. Delivered to your door in Zambia.
                </p>
                <Link
                  href="/explore/search"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-bold text-white shadow-md shadow-emerald-900/20 transition-transform duration-100 active:scale-[0.97] dark:bg-emerald-600 dark:shadow-emerald-950/40"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative mt-5 flex items-center gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-emerald-700 dark:bg-emerald-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 dark:bg-emerald-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 dark:bg-emerald-800" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 dark:bg-emerald-800" />
              </div>
            </section>

            <section style={{ animationDelay: "240ms" }} className="reveal-up">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Top Picks for You</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-500">Personalised · refreshes every visit</p>
                </div>
                <Link
                  href="/explore/search"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-800 transition-colors active:text-emerald-600 dark:text-emerald-400"
                >
                  See all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <PersonalizedFeed card="home" limit={8} initial={feedSeed} className="grid grid-cols-2 gap-3" />
            </section>

            <section style={{ animationDelay: "300ms" }} className="reveal-up grid grid-cols-2 gap-3">
              <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-3.5 shadow-sm shadow-emerald-900/[0.04] dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:shadow-none">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/20">
                  <Truck className="h-5 w-5" />
                </span>
                <p className="mt-2.5 text-base font-extrabold leading-tight text-emerald-900 dark:text-emerald-100">Fast delivery</p>
                <p className="mt-0.5 text-[12px] leading-snug text-emerald-900/70 dark:text-emerald-100/65">Across Zambia · 2–5 days</p>
              </article>

              <article className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100 p-3.5 shadow-sm shadow-amber-900/[0.04] dark:border-amber-900/40 dark:from-amber-950/40 dark:to-amber-900/20 dark:shadow-none">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-900/20">
                  <Tag className="h-5 w-5" />
                </span>
                <p className="mt-2.5 text-base font-extrabold leading-tight text-amber-900 dark:text-amber-100">Weekly Deals</p>
                <p className="mt-0.5 text-[12px] leading-snug text-amber-900/70 dark:text-amber-100/65">New every week · Up to 40% off</p>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
