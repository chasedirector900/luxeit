"use client";

import { MapPin } from "lucide-react";
import { LuxeitLogo } from "@/components/brand/luxeit-logo";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function MobileHomeHeader() {
  return (
    <header className="flex items-center justify-between gap-2">
      <LuxeitLogo size={44} priority className="shrink-0 rounded-xl" />

      <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-[11px] font-semibold text-gold-800 ring-1 ring-inset ring-gold-200 dark:bg-gold-950/40 dark:text-gold-200 dark:ring-gold-900/50">
        <MapPin className="h-3.5 w-3.5" />
        <span>Delivering across Zambia</span>
      </div>

      <NotificationBell />
    </header>
  );
}
