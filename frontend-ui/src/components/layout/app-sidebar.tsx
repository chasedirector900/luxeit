"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, Heart, House, Search, Settings, ShoppingCart, UserRound } from "lucide-react";
import type { ComponentType } from "react";

type NavItem = { label: string; href: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }> };

// Primary navigation (top group) + account group, YouTube-style.
const PRIMARY: NavItem[] = [
  { label: "Home", href: "/", Icon: House },
  { label: "Explore", href: "/explore", Icon: Search },
  { label: "Category", href: "/category", Icon: Grid2x2 },
  { label: "Cart", href: "/cart", Icon: ShoppingCart },
  { label: "Saved", href: "/account/saved", Icon: Heart },
];
const ACCOUNT: NavItem[] = [
  { label: "Account", href: "/account", Icon: UserRound },
  { label: "Settings", href: "/account/settings", Icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/product");
  }
  if (href === "/account") {
    // "Account" is the account root only — sub-pages (saved/settings) own themselves.
    return pathname === "/account";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The desktop/tablet left rail. Shown at `md` and up; the mobile bottom nav
 * handles phones. Collapses to an icon-only rail like YouTube.
 */
export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  const renderItem = ({ label, href, Icon }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center rounded-xl transition-colors ${
          collapsed ? "mx-auto h-16 w-16 flex-col justify-center gap-1" : "h-11 gap-4 px-3"
        } ${
          active
            ? "bg-slate-100 font-semibold text-slate-900 dark:bg-zinc-800/80 dark:text-zinc-50"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
        }`}
      >
        <Icon className={collapsed ? "h-6 w-6" : "h-[22px] w-[22px]"} strokeWidth={active ? 2.2 : 1.8} />
        <span className={collapsed ? "text-[10px] leading-none" : "text-sm"}>{label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-14 z-40 hidden h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto border-r border-gold-200/70 bg-white px-2 py-3 transition-[width] duration-200 md:flex dark:border-gold-900/40 dark:bg-black ${
        collapsed ? "w-[76px]" : "w-56"
      }`}
    >
      <nav className="flex flex-col gap-1">{PRIMARY.map(renderItem)}</nav>
      <div className="my-3 border-t border-gold-200/70 dark:border-gold-900/40" />
      <nav className="flex flex-col gap-1">{ACCOUNT.map(renderItem)}</nav>

      {!collapsed ? (
        <p className="mt-auto px-3 pt-4 text-[11px] leading-relaxed text-slate-400 dark:text-zinc-600">
          Luxeit · China imports to Zambia, shipping included.
        </p>
      ) : null}
    </aside>
  );
}
