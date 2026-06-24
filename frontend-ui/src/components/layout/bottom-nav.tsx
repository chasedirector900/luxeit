"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Grid2x2, House, Search, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useMemo, useState } from "react";

const mobileNavItems = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Explore", href: "/explore", icon: "search" },
  { label: "Category", href: "/category", icon: "grid" },
  { label: "Cart", href: "/cart", icon: "cart" },
  { label: "Account", href: "/account", icon: "user" },
] as const;

type NavIconName = (typeof mobileNavItems)[number]["icon"];
type SectionKey = "home" | "explore" | "category" | "cart" | "account";

const ROUTE_MEMORY_KEY = "luxeit:tab-route-memory:v1";

const sectionRoots: Record<SectionKey, string> = {
  home: "/",
  explore: "/explore",
  category: "/category",
  cart: "/cart",
  account: "/account",
};

function resolveSection(pathname: string): SectionKey | null {
  // Home tab owns the inline search, plus the /product/* detail + reviews flow.
  if (
    pathname === "/" ||
    pathname.startsWith("/?") ||
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname === "/product" ||
    pathname.startsWith("/product/")
  ) {
    return "home";
  }
  if (pathname === "/explore" || pathname.startsWith("/explore/")) {
    return "explore";
  }
  if (pathname === "/category" || pathname.startsWith("/category/")) return "category";
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return "cart";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "account";
  return null;
}

function safeReadRouteMemory(): Partial<Record<SectionKey, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(ROUTE_MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<SectionKey, string>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteRouteMemory(memory: Partial<Record<SectionKey, string>>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ROUTE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Ignore storage write errors to avoid blocking navigation.
  }
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "home") return <House className="h-5 w-5" strokeWidth={1.8} />;
  if (name === "search") return <Search className="h-5 w-5" strokeWidth={1.8} />;
  if (name === "grid") return <Grid2x2 className="h-5 w-5" strokeWidth={1.8} />;
  if (name === "cart") return <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />;
  return <UserRound className="h-5 w-5" strokeWidth={1.8} />;
}

function isActivePath(pathname: string, href: string) {
  // The /search and /product flows belong to the Home tab in the SPA tab model.
  if (href === "/") {
    return (
      pathname === "/" ||
      pathname === "/search" ||
      pathname.startsWith("/search/") ||
      pathname === "/product" ||
      pathname.startsWith("/product/")
    );
  }
  if (href === "/explore") {
    return pathname === "/explore" || pathname.startsWith("/explore/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cartCount } = useCart();
  const [routeMemory, setRouteMemory] = useState<Partial<Record<SectionKey, string>>>({});

  useEffect(() => {
    setRouteMemory(safeReadRouteMemory());
  }, []);

  useEffect(() => {
    const section = resolveSection(pathname);
    if (!section) return;
    // Home tab always returns to "/", never a remembered deep /search route.
    if (section === "home") return;

    const query = searchParams.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    const root = sectionRoots[section];

    if (!fullPath.startsWith(root)) return;

    setRouteMemory((prev) => {
      if (prev[section] === fullPath) return prev;
      const next = { ...prev, [section]: fullPath };
      safeWriteRouteMemory(next);
      return next;
    });
  }, [pathname, searchParams]);

  const navTargetByHref = useMemo(() => {
    const targets = new Map<string, string>();
    for (const item of mobileNavItems) {
      const section = resolveSection(item.href);
      if (!section) {
        targets.set(item.href, item.href);
        continue;
      }
      const remembered = routeMemory[section];
      targets.set(item.href, remembered && remembered.startsWith(sectionRoots[section]) ? remembered : item.href);
    }
    return targets;
  }, [routeMemory]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur md:hidden dark:border-white/10 dark:bg-surface/95"
    >
      <ul
        className="mx-auto grid w-full max-w-md grid-cols-5 gap-0.5 px-1 py-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4px)" }}
      >
        {mobileNavItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.label}>
              <Link
                href={navTargetByHref.get(item.href) ?? item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl transition ${
                  active
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-background/70 dark:hover:text-foreground"
                }`}
              >
                <span aria-hidden="true">
                  <span className="relative inline-flex">
                    <NavIcon name={item.icon} />
                    {item.icon === "cart" && cartCount > 0 ? (
                      <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="mt-1 text-[0.65rem] font-medium leading-none tracking-[0.01em]">
                  {item.label}
                </span>
                <span
                  className={`mt-1 h-0.5 w-5 rounded-full ${
                    active ? "bg-amber-600 dark:bg-amber-400" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
