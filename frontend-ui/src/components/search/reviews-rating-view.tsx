"use client";

import Link from "next/link";
import { ArrowLeft, Check, Search, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductRatings } from "@/types/product";

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none";

const SORTS = [
  { key: "relevant", label: "Most relevant" },
  { key: "rating", label: "Rating" },
  { key: "latest", label: "Latest" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];
type Vote = "up" | "down";

type ReviewsRatingViewProps = {
  title: string;
  ratings: ProductRatings;
  backHref: string;
};

export function ReviewsRatingView({ title, ratings, backHref }: ReviewsRatingViewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevant");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<string, Vote>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const hasFilters = normalizedQuery.length > 0 || ratingFilter !== null;

  const visibleReviews = useMemo(() => {
    let list = ratings.reviews;
    if (ratingFilter !== null) {
      list = list.filter((review) => review.rating === ratingFilter);
    }
    if (normalizedQuery) {
      list = list.filter((review) =>
        `${review.userName} ${review.text}`.toLowerCase().includes(normalizedQuery),
      );
    }
    const sorted = [...list];
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === "latest") sorted.sort((a, b) => b.date.localeCompare(a.date));
    else sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
    return sorted;
  }, [ratings.reviews, ratingFilter, normalizedQuery, sort]);

  // TODO(backend): replace with an API call (POST helpful vote).
  function vote(reviewId: string, dir: Vote) {
    setVotes((prev) => {
      const next = { ...prev };
      if (next[reviewId] === dir) delete next[reviewId];
      else next[reviewId] = dir;
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setRatingFilter(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-4 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-3">
        <header className="reveal-up flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
            aria-label="Back to product details"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-none tracking-tight">Ratings and Reviews</h1>
            <p className="mt-1 line-clamp-1 text-[12px] text-slate-500 dark:text-zinc-400">{title}</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reviews"
            aria-label="Search reviews"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.03] outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-transform active:scale-90 dark:text-zinc-500"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          ) : null}
        </div>

        {/* Topic tags — tapping searches that topic */}
        {ratings.reviewTags.length > 0 ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ratings.reviewTags.map((tag) => {
              const active = normalizedQuery === tag.label.toLowerCase();
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setQuery(active ? "" : tag.label)}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${
                    active
                      ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400/50 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "border-slate-200 bg-white text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {tag.label} {tag.count}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORTS.map((option) => {
            const active = sort === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(option.key)}
                className={`whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${
                  active
                    ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400/50 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Summary + clickable breakdown */}
        <section className={CARD_CLASS}>
          <h2 className="mb-3 text-base font-extrabold tracking-tight">Ratings and reviews</h2>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <div>
              <p className="text-4xl font-black leading-none">{ratings.ratingAverage.toFixed(1)}</p>
              <div className="mt-1.5 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const filled = idx < Math.round(ratings.ratingAverage);
                  return (
                    <Star
                      key={idx}
                      className={`h-3.5 w-3.5 ${filled ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-zinc-600"}`}
                    />
                  );
                })}
              </div>
              <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                {ratings.ratingCount.toLocaleString()} ratings
              </p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((level) => {
                const count = ratings.ratingBreakdown[level as 1 | 2 | 3 | 4 | 5] ?? 0;
                const width = ratings.ratingCount > 0 ? (count / ratings.ratingCount) * 100 : 0;
                const active = ratingFilter === level;
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRatingFilter(active ? null : level)}
                    className="grid w-full grid-cols-[12px_1fr] items-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    <span className={`text-[11px] font-semibold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-zinc-400"}`}>
                      {level}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                      <span
                        className={`block h-full rounded-full ${active ? "bg-indigo-600 dark:bg-indigo-400" : "bg-indigo-500/70 dark:bg-indigo-500/60"}`}
                        style={{ width: `${Math.max(2, width)}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Results header */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[12px] text-slate-500 dark:text-zinc-400">
            {visibleReviews.length} {visibleReviews.length === 1 ? "review" : "reviews"}
            {ratingFilter !== null ? ` · ${ratingFilter}★` : ""}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 transition-transform active:scale-95 dark:text-indigo-400"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Reviews */}
        {visibleReviews.length > 0 ? (
          <div className="space-y-3">
            {visibleReviews.map((review) => {
              const userVote = votes[review.id];
              const helpfulCount = review.helpfulCount + (userVote === "up" ? 1 : 0);
              return (
                <article key={review.id} className={CARD_CLASS}>
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                      {review.avatarInitial ?? review.userName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{review.userName}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-3 w-3 ${idx < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-zinc-600"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">{review.date}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[13px] leading-relaxed text-slate-700 dark:text-zinc-300">{review.text}</p>
                  <p className="mt-2 text-[12px] text-slate-500 dark:text-zinc-400">
                    {helpfulCount} {helpfulCount === 1 ? "person" : "people"} found this helpful
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[12px] text-slate-600 dark:text-zinc-400">Was this review helpful?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={userVote === "up"}
                        onClick={() => vote(review.id, "up")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${
                          userVote === "up"
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}
                      >
                        {userVote === "up" ? <Check className="h-3.5 w-3.5" /> : null}
                        Yes
                      </button>
                      <button
                        type="button"
                        aria-pressed={userVote === "down"}
                        onClick={() => vote(review.id, "down")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${
                          userVote === "down"
                            ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {review.sellerReply ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">{review.sellerReply.author}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">{review.sellerReply.date}</p>
                      </div>
                      <p className="text-[13px] text-slate-700 dark:text-zinc-300">{review.sellerReply.text}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
              <Search className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-zinc-100">No matching reviews</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">Try a different keyword or rating filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}
