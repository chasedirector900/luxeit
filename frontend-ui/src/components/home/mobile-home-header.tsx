"use client";

import { MapPin } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function MobileHomeHeader() {
  return (
    <header className="flex items-center justify-between gap-2">
      <p className="text-[1.7rem] font-black leading-none tracking-tight text-emerald-900 dark:text-emerald-300">
        Luxe<span className="text-amber-500">it</span>
      </p>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40">
        <MapPin className="h-3.5 w-3.5" />
        <span>Delivering across Zambia</span>
      </div>

      <NotificationBell />
    </header>
  );
}
