"use client";

import Link from "next/link";
import { ArrowLeft, BellOff, CheckCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNotifications } from "@/hooks/use-notifications";
import { CHANNEL_META } from "@/lib/notifications/notifications";

export function NotificationsView() {
  const { channels, totalUnread, markAllRead, dismissChannel } = useNotifications();

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="reveal-up flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Back to account"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-200/70 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">Notifications</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
              {totalUnread > 0 ? `${totalUnread} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        {totalUnread > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold-600 transition-colors active:text-gold-500 dark:text-gold-400"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        ) : null}
      </header>

      {channels.length > 0 ? (
        <div
          style={{ animationDelay: "60ms" }}
          className="reveal-up divide-y divide-gold-200/70 overflow-hidden rounded-2xl border border-gold-200/70 bg-white shadow-sm shadow-slate-900/[0.04] dark:divide-gold-900/40 dark:border-gold-900/40 dark:bg-zinc-900/70 dark:shadow-none"
        >
          <AnimatePresence initial={false}>
            {channels.map((channel) => {
              const meta = CHANNEL_META[channel.type];
              const Icon = meta.icon;
              const unread = channel.unreadCount > 0;
              return (
                <motion.div
                  key={channel.id}
                  layout
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-center gap-3 px-3.5 py-3.5 ${unread ? "bg-gold-500/[0.04] dark:bg-gold-500/[0.07]" : ""}`}
                >
                  <span className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${meta.solid}`}>
                    <Icon className="h-6 w-6" />
                    {unread ? (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink ring-2 ring-white dark:ring-zinc-900">
                        {channel.unreadCount}
                      </span>
                    ) : null}
                  </span>
                  <Link href={`/account/notifications/${channel.slug}`} className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${unread ? "font-bold text-slate-900 dark:text-zinc-100" : "font-semibold text-slate-700 dark:text-zinc-300"}`}>
                        {channel.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">{channel.lastMessage.time}</span>
                    </span>
                    <span className={`mt-0.5 line-clamp-1 block text-[13px] ${unread ? "text-slate-700 dark:text-zinc-200" : "text-slate-500 dark:text-zinc-400"}`}>
                      {channel.lastMessage.text}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismissChannel(channel.id)}
                    aria-label={`Dismiss ${channel.name}`}
                    className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors active:scale-90 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="reveal-up flex flex-col items-center rounded-2xl border border-gold-200/70 bg-white px-6 py-16 text-center shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/60 dark:shadow-none">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
            <BellOff className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight">No notifications</h2>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">Updates from Luxeit will show up here.</p>
        </div>
      )}
    </div>
  );
}
