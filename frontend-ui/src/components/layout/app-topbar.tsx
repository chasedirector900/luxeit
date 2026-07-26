"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Search, ShoppingCart, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useOptionalCart } from "@/hooks/use-cart";
import { useNotifications } from "@/hooks/use-notifications";
import { LuxeitLogo } from "@/components/brand/luxeit-logo";
import { useAuth } from "@/hooks/use-auth";

/**
 * The desktop/tablet top bar (md+). Left: hamburger + Luxeit logo. Centre:
 * search (opens the full-screen search). Right: theme toggle, notifications,
 * cart, account avatar.
 */
export function AppTopbar({ onToggleSidebar, onOpenSearch }: { onToggleSidebar: () => void; onOpenSearch: () => void }) {
  const cart = useOptionalCart();
  const cartCount = cart?.cartCount ?? 0;
  const { totalUnread } = useNotifications();
  const { user, status } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextDark = saved === "auto" || !saved ? prefersDark : saved === "dark";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(nextDark ? "dark" : "light");
      setIsDark(nextDark);
    };
    sync();
    setMounted(true);
    window.addEventListener("luxeit-theme-change", sync);
    return () => window.removeEventListener("luxeit-theme-change", sync);
  }, []);

  function toggleTheme() {
    if (!mounted) return;
    const nextDark = !isDark;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextDark ? "dark" : "light");
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  }

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800";
  const initial = (user?.fullName || user?.email || user?.phone || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur md:flex dark:border-zinc-800 dark:bg-black/95">
      <button type="button" aria-label="Toggle menu" onClick={onToggleSidebar} className={iconBtn}>
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/" aria-label="Luxeit home" className="flex items-center gap-2">
        <LuxeitLogo size={34} priority className="rounded-lg" />
        <span className="font-brand text-[1.3rem] font-black leading-none tracking-tight text-gold-600 dark:text-gold-500">
          LUXE<span className="text-slate-500 dark:text-zinc-300">iT</span>
        </span>
      </Link>

      {/* Search — click opens the full-screen search overlay */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="mx-auto flex h-10 w-full max-w-xl items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 transition-colors hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500 dark:hover:border-zinc-700"
      >
        <Search className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate">Search products, brands, and more…</span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Toggle theme" onClick={toggleTheme} className={iconBtn}>
          {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <Link href="/account/notifications" aria-label="Notifications" className={`relative ${iconBtn}`}>
          <Bell className="h-5 w-5" />
          {totalUnread > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink ring-2 ring-white dark:ring-black">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          ) : null}
        </Link>

        <Link href="/cart" aria-label="Cart" className={`relative ${iconBtn}`}>
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-black">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/account"
          aria-label="Account"
          className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-sm font-bold text-ink shadow-sm"
        >
          {status === "authenticated" ? initial : "?"}
        </Link>
      </div>
    </header>
  );
}
