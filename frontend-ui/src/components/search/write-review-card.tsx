"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, ShieldCheck, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMyReview, submitReview } from "@/lib/auth/api";

const CARD =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none";

export function WriteReviewCard({ productSlug }: { productSlug: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [reviewDate, setReviewDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getMyReview(productSlug)
      .then((data) => {
        if (cancelled) return;
        setCanReview(data.canReview);
        setHasReview(data.hasReviewed);
        // Existing review -> start in the collapsed "your review" view; otherwise
        // open the form straight away.
        setEditing(!data.hasReviewed);
        if (data.review) {
          setRating(data.review.rating);
          setText(data.review.text);
          setReviewDate(data.review.date);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, productSlug]);

  // Only verified buyers see anything here.
  if (loading || status !== "authenticated" || !canReview) return null;

  async function handleSubmit() {
    if (rating < 1) {
      setError("Tap a star to rate (1–5).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const saved = await submitReview(productSlug, { rating, text: text.trim() });
      setReviewDate(saved.date);
      setHasReview(true);
      setEditing(false); // collapse the form
      router.refresh(); // re-render the server component so the review list updates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Collapsed view: the customer has a review and isn't editing it ──────────
  if (hasReview && !editing) {
    return (
      <section className={CARD}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">Your review</h2>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-2.5 w-2.5" />
                Verified
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-gold-400" : "text-slate-300 dark:text-zinc-600"}`} />
                ))}
              </div>
              {reviewDate ? (
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">{reviewDate}</span>
              ) : null}
            </div>
            {text ? <p className="mt-2 text-[13px] leading-relaxed text-slate-700 dark:text-zinc-300">{text}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </section>
    );
  }

  // ── Edit / write view ───────────────────────────────────────────────────────
  const shown = hover || rating;
  return (
    <section className={CARD}>
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3 w-3" />
          Verified buyer
        </span>
      </div>
      <h2 className="text-base font-extrabold tracking-tight">{hasReview ? "Edit your review" : "Write a review"}</h2>
      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">You bought this — share how it went.</p>

      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-90"
          >
            <Star className={`h-7 w-7 ${n <= shown ? "fill-amber-400 text-gold-400" : "text-slate-300 dark:text-zinc-600"}`} />
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="What did you like or dislike? (optional)"
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-gold-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-gold-500"
      />

      {error ? <p className="mt-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold-500 text-sm font-bold text-ink shadow-md shadow-gold-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {submitting ? "Posting…" : hasReview ? "Update review" : "Post review"}
        </button>
        {hasReview ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-transform active:scale-95 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
