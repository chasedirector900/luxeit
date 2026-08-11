import Link from "next/link";
import { ArrowRight, SearchX, Tag, Truck } from "lucide-react";
import { LuxeitLogo } from "@/components/brand/luxeit-logo";
import { HomeTopPickCard } from "@/components/home/home-top-pick-card";
import { PersonalizedFeed } from "@/components/home/personalized-feed";
import { MobileHomeHeader } from "@/components/home/mobile-home-header";
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
    <main className="min-h-screen bg-slate-50 px-3 pb-6 pt-3 text-slate-900 md:px-6 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5 md:max-w-6xl">
        {/* Brand, search and bell share one row. The desktop top bar owns all
            three on md+, so this whole block is mobile-only. */}
        <div className="reveal-up md:hidden">
          <MobileHomeHeader query={query} />
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((product) => (
                  <HomeTopPickCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-gold-200/70 bg-white px-6 py-12 text-center dark:border-gold-900/40 dark:bg-zinc-900/60">
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
              className="reveal-up relative overflow-hidden rounded-[1.75rem] border border-gold-600/30 bg-gradient-to-br from-ink via-ink to-gold-950 p-5 shadow-sm shadow-black/20 dark:border-gold-600/40 dark:shadow-none"
            >
              {/* Decorative glows — pure CSS, transform-gpu, no repaint */}
              <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-gold-500/20 blur-3xl transform-gpu" />
              <div className="pointer-events-none absolute -bottom-12 -right-6 h-36 w-36 rounded-full bg-gold-600/15 blur-3xl transform-gpu" />

              {/* The full emblem lives here rather than in the header: at this
                  size its detail ("ACCESSORIES", the country tag) actually
                  reads, and the glows above sit behind it like a spotlight. */}
              <LuxeitLogo
                variant="full"
                size={132}
                priority
                className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-[1.5rem] min-[340px]:block md:right-8 md:size-44"
              />

              {/* Full width on the narrowest phones, where the emblem is hidden
                  and the copy should use the space it frees. */}
              <div className="relative max-w-full min-[340px]:max-w-[58%] md:max-w-[70%]">
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-300 ring-1 ring-inset ring-gold-500/30">
                  Imported from China
                </span>
                <h2 className="mt-2.5 text-[1.6rem] font-black leading-[1.05] tracking-tight text-white md:text-[2.1rem]">
                  Smart deals from <span className="text-gold-400">China</span>
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-300/80">
                  Quality products. Affordable prices. Delivered to your door in Zambia.
                </p>
                <Link
                  href="/explore/search"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink shadow-md shadow-gold-900/30 transition-transform duration-100 active:scale-[0.97]"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative mt-5 flex items-center gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-gold-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500/30" />
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500/30" />
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500/30" />
              </div>
            </section>

            <section style={{ animationDelay: "240ms" }} className="reveal-up">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Top Picks for You</h3>
                <Link
                  href="/explore/search"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-gold-700 transition-colors active:text-gold-500 dark:text-gold-400"
                >
                  See all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <PersonalizedFeed card="home" limit={12} initial={feedSeed} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
            </section>

            <section style={{ animationDelay: "300ms" }} className="reveal-up grid grid-cols-2 gap-3">
              <article className="rounded-2xl border border-gold-200/70 bg-gradient-to-br from-gold-50 to-gold-100 p-3.5 shadow-sm shadow-gold-900/[0.04] dark:border-gold-800/40 dark:from-gold-950/50 dark:to-gold-900/20 dark:shadow-none">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-ink shadow-md shadow-gold-900/25">
                  <Truck className="h-5 w-5" />
                </span>
                <p className="mt-2.5 text-base font-extrabold leading-tight text-gold-900 dark:text-gold-100">Fast delivery</p>
                <p className="mt-0.5 text-[12px] leading-snug text-gold-900/70 dark:text-gold-100/60">Across Zambia · 2–5 days</p>
              </article>

              <article className="rounded-2xl border border-gold-200/70 bg-gradient-to-br from-gold-50 to-gold-100 p-3.5 shadow-sm shadow-gold-900/[0.04] dark:border-gold-800/40 dark:from-gold-950/50 dark:to-gold-900/20 dark:shadow-none">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-ink shadow-md shadow-gold-900/25">
                  <Tag className="h-5 w-5" />
                </span>
                <p className="mt-2.5 text-base font-extrabold leading-tight text-gold-900 dark:text-gold-100">Weekly Deals</p>
                <p className="mt-0.5 text-[12px] leading-snug text-gold-900/70 dark:text-gold-100/60">New every week · Up to 40% off</p>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
