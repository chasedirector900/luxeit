"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { InlineSearchInput } from "@/components/search/inline-search-input";

/**
 * Home header: search and notifications.
 *
 * The logo lives in the hero card below rather than up here — it's a detailed
 * emblem (ring, wordmark, "ACCESSORIES", country tag), and that detail only
 * survives at a size a header can't give it. Shown large in the hero it reads
 * properly, and the header stays out of the way of the products.
 */
export function MobileHomeHeader({ query = "" }: { query?: string }) {
  return (
    <header className="flex items-center gap-2.5">
      <InlineSearchInput initialQuery={query} placeholder="Search products, brands, and more" />

      <NotificationBell />
    </header>
  );
}
