"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ListingChip } from "@/lib/category/shared";
import { resolveListingIcon } from "@/lib/category/icons";

type ListingChipsProps = {
  chips: ListingChip[];
};

export function ListingChips({ chips }: ListingChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type") ?? "all";

  // Optimistic highlight so the tapped chip lights up instantly.
  const [active, setActive] = useState(urlType);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setActive(urlType);
  }, [urlType]);

  function select(key: string) {
    setActive(key);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (key === "all") params.delete("type");
    else params.set("type", key);
    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-2.5 transform-gpu">
        {chips.map(({ key, label, icon }) => {
          const Icon = resolveListingIcon(icon);
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(key)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors duration-150 active:scale-95 ${
                isActive
                  ? "border-gold-500/60 bg-gold-500/10 text-gold-600 dark:border-gold-400/50 dark:bg-gold-500/15 dark:text-gold-300"
                  : "border-gold-200/70 bg-white text-slate-700 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
