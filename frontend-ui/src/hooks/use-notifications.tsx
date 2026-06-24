"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getThread,
  listThreads,
  markAllThreadsRead,
  markThreadRead,
  sendThreadMessage,
  type InboxThread,
} from "@/lib/auth/api";
import {
  EMPTY_NOTIFICATION_STATE,
  readNotificationState,
  writeNotificationState,
  type NotificationType,
} from "@/lib/notifications/notifications";

export type ResolvedMessage = {
  id: string;
  text: string;
  date: string;
  time: string;
  read: boolean;
  sender: string;
  fromUser: boolean;
  agentName?: string | null;
};

export type ResolvedChannel = {
  id: string;
  slug: string;
  name: string;
  type: NotificationType;
  canReply: boolean;
  messages: ResolvedMessage[];
  unreadCount: number;
  lastMessage: ResolvedMessage;
};

type NotificationsContextValue = {
  channels: ResolvedChannel[];
  totalUnread: number;
  loading: boolean;
  markChannelRead: (channelId: string) => void;
  markAllRead: () => void;
  dismissChannel: (channelId: string) => void;
  dismissMessage: (messageId: string) => void;
  sendMessage: (slug: string, body: string) => Promise<void>;
  ensureThread: (slug: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  // Dismissals stay client-side (cosmetic hide); read state lives on the backend.
  const [dismissed, setDismissed] = useState({ channels: [] as string[], messages: [] as string[] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readNotificationState();
    setDismissed({ channels: s.dismissed, messages: s.dismissedMessages });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeNotificationState({ ...EMPTY_NOTIFICATION_STATE, dismissed: dismissed.channels, dismissedMessages: dismissed.messages });
  }, [hydrated, dismissed]);

  const refresh = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      void refresh();
    } else if (status === "unauthenticated") {
      setThreads([]);
      setLoading(false);
    }
  }, [status, refresh]);

  // Light background polling so new messages/alerts appear without a reload.
  // Only while signed in AND the tab is visible (saves data on mobile).
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, refresh]);

  const markChannelRead = useCallback((channelId: string) => {
    let slug: string | undefined;
    setThreads((prev) =>
      prev.map((t) => {
        if (String(t.id) !== channelId) return t;
        slug = t.slug;
        if (t.messages.every((m) => m.read)) return t;
        return { ...t, messages: t.messages.map((m) => (m.read ? m : { ...m, read: true })) };
      }),
    );
    if (slug) void markThreadRead(slug).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setThreads((prev) => prev.map((t) => ({ ...t, messages: t.messages.map((m) => ({ ...m, read: true })) })));
    void markAllThreadsRead().catch(() => {});
  }, []);

  const dismissChannel = useCallback((channelId: string) => {
    setDismissed((prev) =>
      prev.channels.includes(channelId) ? prev : { ...prev, channels: [...prev.channels, channelId] },
    );
  }, []);

  const dismissMessage = useCallback((messageId: string) => {
    setDismissed((prev) =>
      prev.messages.includes(messageId) ? prev : { ...prev, messages: [...prev.messages, messageId] },
    );
  }, []);

  const sendMessage = useCallback(async (slug: string, body: string) => {
    const updated = await sendThreadMessage(slug, body);
    setThreads((prev) => {
      const exists = prev.some((t) => t.slug === slug);
      return exists ? prev.map((t) => (t.slug === slug ? updated : t)) : [updated, ...prev];
    });
  }, []);

  // Open (and, for "support", create on the server) a thread that may not be in the list yet.
  const ensureThread = useCallback(async (slug: string) => {
    const thread = await getThread(slug);
    setThreads((prev) => {
      const exists = prev.some((t) => t.slug === slug);
      return exists ? prev.map((t) => (t.slug === slug ? thread : t)) : [thread, ...prev];
    });
  }, []);

  const { channels, totalUnread } = useMemo(() => {
    const dismissedChannels = new Set(dismissed.channels);
    const dismissedMessages = new Set(dismissed.messages);

    const resolved: ResolvedChannel[] = [];
    for (const thread of threads) {
      const id = String(thread.id);
      if (dismissedChannels.has(id)) continue;
      const messages = thread.messages.filter((m) => !dismissedMessages.has(m.id));
      if (messages.length === 0) continue;
      const unreadCount = messages.filter((m) => !m.read && !m.fromUser).length;
      resolved.push({
        id,
        slug: thread.slug,
        name: thread.name,
        type: thread.type as NotificationType,
        canReply: thread.canReply,
        messages,
        unreadCount,
        lastMessage: messages[messages.length - 1],
      });
    }
    return { channels: resolved, totalUnread: resolved.reduce((sum, c) => sum + c.unreadCount, 0) };
  }, [threads, dismissed]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      channels,
      totalUnread,
      loading,
      markChannelRead,
      markAllRead,
      dismissChannel,
      dismissMessage,
      sendMessage,
      ensureThread,
      refresh,
    }),
    [channels, totalUnread, loading, markChannelRead, markAllRead, dismissChannel, dismissMessage, sendMessage, ensureThread, refresh],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
