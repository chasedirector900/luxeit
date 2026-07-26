"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type InlineSearchInputProps = {
  initialQuery: string;
  placeholder?: string;
};

// Reusable inline search box. The current page's URL (`?q=`) is the source of
// truth — the server component reads it and filters in place, so results are
// SSR'd and shareable. This island keeps the URL in sync (debounced) and shows
// a pending state via useTransition for instant, native-feeling feedback.
export function InlineSearchInput({ initialQuery, placeholder = "Search products..." }: InlineSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const debounced = useDebouncedValue(value.trim(), 200);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const current = (searchParams.get("q") ?? "").trim();
    if (debounced === current) return;

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (debounced) params.set("q", debounced);
    else params.delete("q");

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }, [debounced, pathname, router, searchParams]);

  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-gold-200/70 bg-white pl-11 pr-10 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.03] outline-none transition-colors placeholder:text-slate-400 focus:border-gold-400 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-gold-500"
      />
      {isPending ? (
        <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 animate-spin text-slate-400 dark:text-zinc-500" />
      ) : value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-transform duration-100 active:scale-90 dark:text-zinc-500"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      ) : null}
    </div>
  );
}
