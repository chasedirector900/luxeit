"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, Lock, MoreVertical, Send, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications, type ResolvedMessage } from "@/hooks/use-notifications";
import { CHANNEL_META, type NotificationType } from "@/lib/notifications/notifications";

export function NotificationThreadView({ slug }: { slug: string }) {
  const { channels, loading, markChannelRead, dismissMessage, sendMessage, ensureThread, refresh } = useNotifications();
  const channel = channels.find((entry) => entry.slug === slug);
  const [ensuring, setEnsuring] = useState(false);

  // If the thread isn't in the list yet (e.g. opening live support fresh),
  // fetch it — "support" is created on the server on demand.
  useEffect(() => {
    if (channel || loading) return;
    let cancelled = false;
    setEnsuring(true);
    ensureThread(slug)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEnsuring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channel, loading, slug, ensureThread]);

  const [actionMessage, setActionMessage] = useState<ResolvedMessage | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Mark read on open AND whenever new unread messages arrive while viewing.
  const channelId = channel?.id;
  const unread = channel?.unreadCount ?? 0;
  useEffect(() => {
    if (channelId && unread > 0) markChannelRead(channelId);
  }, [markChannelRead, channelId, unread]);

  // Support chats poll faster so staff replies appear (near) live, tab-visible only.
  const canReply = channel?.canReply ?? false;
  useEffect(() => {
    if (!canReply) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5_000);
    return () => window.clearInterval(id);
  }, [canReply, refresh]);

  const messages = channel?.messages ?? [];
  const groups = useMemo(() => {
    const result: { date: string; messages: ResolvedMessage[] }[] = [];
    for (const message of messages) {
      const last = result[result.length - 1];
      if (last && last.date === message.date) last.messages.push(message);
      else result.push({ date: message.date, messages: [message] });
    }
    return result;
  }, [messages]);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setActionMessage(null);
      }, 700);
    } catch {
      setActionMessage(null);
    }
  }

  function handleDelete(id: string) {
    dismissMessage(id);
    setActionMessage(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(slug, body);
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  }

  // Loading / not-found states.
  if (!channel) {
    const busy = loading || ensuring;
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-md flex-col">
        <BackHeader title={busy ? "Loading…" : "Conversation"} subtitle="" />
        <div className="flex flex-1 items-center justify-center">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">This conversation no longer exists.</p>
          )}
        </div>
      </div>
    );
  }

  const meta = CHANNEL_META[channel.type as NotificationType] ?? CHANNEL_META.system;
  const Icon = meta.icon;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-md flex-col">
      <header className="reveal-up flex items-center gap-3">
        <Link
          href="/account/notifications"
          aria-label="Back to notifications"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${meta.solid}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold leading-tight tracking-tight">{channel.name}</h1>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            {channel.canReply ? "Live support" : "Official notifications"}
          </p>
        </div>
      </header>

      {/* Thread */}
      <div className="reveal-up mt-5 flex-1 space-y-4" style={{ animationDelay: "60ms" }}>
        {groups.map((group) => (
          <div key={group.date} className="space-y-2">
            <div className="flex justify-center">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                {group.date}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {group.messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-end gap-1 ${message.fromUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={
                      message.fromUser
                        ? "max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2.5 text-white shadow-sm"
                        : "max-w-[80%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm shadow-slate-900/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                    }
                  >
                    {!message.fromUser && message.agentName ? (
                      <p className="mb-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        {message.agentName}
                      </p>
                    ) : null}
                    <p className={`text-[14px] leading-relaxed ${message.fromUser ? "text-white" : "text-slate-700 dark:text-zinc-200"}`}>
                      {message.text}
                    </p>
                    <p className={`mt-1 text-right text-[10px] ${message.fromUser ? "text-white/70" : "text-slate-400 dark:text-zinc-500"}`}>
                      {message.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionMessage(message)}
                    aria-label="Message actions"
                    className="mb-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors active:scale-90 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Reply box (support) or can't-reply footer */}
      {channel.canReply ? (
        <form onSubmit={handleSend} className="sticky bottom-0 mt-4 pb-[env(safe-area-inset-bottom)]">
          {sendError ? (
            <p className="mb-2 text-center text-[11px] font-semibold text-rose-600 dark:text-rose-400">{sendError}</p>
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message to support…"
              className="h-10 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-[12px] text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <Lock className="h-3.5 w-3.5" />
          You can&apos;t reply to these messages
        </div>
      )}

      <MessageActionsSheet
        message={actionMessage}
        copied={copied}
        onClose={() => setActionMessage(null)}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />
    </div>
  );
}

function BackHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex items-center gap-3">
      <Link
        href="/account/notifications"
        aria-label="Back to notifications"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-extrabold leading-tight tracking-tight">{title}</h1>
        {subtitle ? <p className="text-[11px] text-slate-500 dark:text-zinc-400">{subtitle}</p> : null}
      </div>
    </header>
  );
}

function MessageActionsSheet({
  message,
  copied,
  onClose,
  onCopy,
  onDelete,
}: {
  message: ResolvedMessage | null;
  copied: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!message) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [message]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {message ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Message actions">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md transform-gpu rounded-t-3xl border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <p className="mb-3 line-clamp-2 px-1 text-[12px] text-slate-500 dark:text-zinc-400">{message.text}</p>

            <button
              type="button"
              onClick={() => onCopy(message.text)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-800 transition-colors active:bg-slate-100 dark:text-zinc-200 dark:active:bg-zinc-800/60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                {copied ? <Check className="h-[18px] w-[18px] text-emerald-500" /> : <Copy className="h-[18px] w-[18px]" />}
              </span>
              {copied ? "Copied" : "Copy text"}
            </button>

            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition-colors active:bg-rose-50 dark:text-rose-400 dark:active:bg-rose-500/10"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
                <Trash2 className="h-[18px] w-[18px]" />
              </span>
              Delete message
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
