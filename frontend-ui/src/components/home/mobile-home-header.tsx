"use client";

import { LuxeitLogo } from "@/components/brand/luxeit-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { InlineSearchInput } from "@/components/search/inline-search-input";

/**
 * Home header: brand, search and notifications on a single row.
 *
 * The logo leads at a size that actually registers, and the search field takes
 * whatever width is left beside it — so the brand visibly claims its space
 * rather than sitting as a small mark above a full-width form. Collapsing the
 * two rows into one also keeps products closer to the top of the screen.
 */
export function MobileHomeHeader({ query = "" }: { query?: string }) {
  return (
    <header className="flex items-center gap-2.5">
      <LuxeitLogo size={80} priority className="shrink-0 rounded-2xl" />

      <InlineSearchInput initialQuery={query} placeholder="Search products" />

      <NotificationBell />
    </header>
  );
}
