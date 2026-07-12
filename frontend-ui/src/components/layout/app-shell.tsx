"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { FullScreenSearch } from "@/components/layout/full-screen-search";

/**
 * Responsive app frame.
 *
 * Phones (< md): no chrome here — pages keep their own headers and the mobile
 * bottom nav. Tablets & desktops (md+): a fixed top bar + a collapsible left
 * sidebar (YouTube-style), with the page content offset to the right of the
 * sidebar and below the bar. The offset is applied only at md+, so mobile is
 * untouched.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <AppTopbar onToggleSidebar={() => setCollapsed((c) => !c)} onOpenSearch={() => setSearchOpen(true)} />
      <AppSidebar collapsed={collapsed} />

      {/* Content: no offset on mobile; on md+ it clears the fixed top bar and the
          sidebar (whose width tracks the collapse state). */}
      <div className={`md:pt-14 ${collapsed ? "md:pl-[76px]" : "md:pl-56"} transition-[padding] duration-200`}>
        {children}
      </div>

      <FullScreenSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
