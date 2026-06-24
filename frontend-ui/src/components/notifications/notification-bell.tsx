"use client";

import Link from "next/link";
import { Bell, BellOff, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { CHANNEL_META } from "@/lib/notifications/notifications";

export function NotificationBell() {
  const { channels, totalUnread, markAllRead, dismissChannel } = useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const recent = channels.slice(0, 5);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} unread` : ""}`}
        aria-haspopup="dialog"
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
      >
        <Bell className="h-[18px] w-[18px]" />
        {totalUnread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-black">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Notifications">
                  <motion.div
                    className="absolute inset-0 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setOpen(false)}
                  />
                  <motion.div
                    className="absolute right-3 top-[4.25rem] flex max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] origin-top-right flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  >
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Notifications</p>
                        {totalUnread > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/10 px-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {totalUnread}
                          </span>
                        ) : null}
                      </div>
                      {totalUnread > 0 ? (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[12px] font-semibold text-indigo-600 transition-colors active:text-indigo-500 dark:text-indigo-400"
                        >
                          Mark all read
                        </button>
                      ) : null}
                    </div>

                    {recent.length > 0 ? (
                      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-800/70">
                        <AnimatePresence initial={false}>
                          {recent.map((channel) => {
                            const meta = CHANNEL_META[channel.type];
                            const Icon = meta.icon;
                            const unread = channel.unreadCount > 0;
                            return (
                              <motion.li
                                key={channel.id}
                                layout
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.18 }}
                                className={unread ? "bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08]" : ""}
                              >
                                <div className="flex items-center gap-2.5 px-3 py-3">
                                  <span className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${meta.solid}`}>
                                    <Icon className="h-5 w-5" />
                                    {unread ? (
                                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                                        {channel.unreadCount}
                                      </span>
                                    ) : null}
                                  </span>
                                  <Link
                                    href={`/account/notifications/${channel.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="min-w-0 flex-1"
                                  >
                                    <span className="flex items-center justify-between gap-2">
                                      <span className={`truncate text-[13px] ${unread ? "font-bold text-slate-900 dark:text-zinc-100" : "font-semibold text-slate-700 dark:text-zinc-300"}`}>
                                        {channel.name}
                                      </span>
                                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">{channel.lastMessage.time}</span>
                                    </span>
                                    <span className={`mt-0.5 line-clamp-1 block text-[12px] ${unread ? "text-slate-600 dark:text-zinc-300" : "text-slate-500 dark:text-zinc-400"}`}>
                                      {channel.lastMessage.text}
                                    </span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => dismissChannel(channel.id)}
                                    aria-label={`Dismiss ${channel.name}`}
                                    className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors active:scale-90 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center px-6 py-10 text-center">
                        <BellOff className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
                        <p className="mt-2 text-[13px] text-slate-500 dark:text-zinc-400">You&apos;re all caught up</p>
                      </div>
                    )}

                    <Link
                      href="/account/notifications"
                      onClick={() => setOpen(false)}
                      className="block shrink-0 border-t border-slate-200 px-4 py-3 text-center text-[13px] font-semibold text-indigo-600 transition-colors active:bg-slate-50 dark:border-zinc-800 dark:text-indigo-400 dark:active:bg-zinc-800/50"
                    >
                      See all notifications
                    </Link>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
