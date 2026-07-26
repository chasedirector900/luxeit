import type { ComponentType } from "react";
import { Gift, MessageCircle, Package, Sparkles, Truck } from "lucide-react";
export type NotificationType = "order" | "delivery" | "promo" | "system" | "support";
export type ChannelMessage = {
  id: string;
  text: string;
  /** Day-group label, e.g. "Today", "Yesterday", "Jun 10". */
  date: string;
  /** Clock time, e.g. "09:39". */
  time: string;
  /** Base read flag; the store can additionally mark messages read. */
  read?: boolean;
};

export type NotificationChannel = {
  id: string;
  /** Readable URL segment for the thread. */
  slug: string;
  name: string;
  type: NotificationType;
  /** Messages oldest -> newest (thread order). */
  messages: ChannelMessage[];
};

type ChannelMeta = { icon: ComponentType<{ className?: string }>; solid: string; tint: string; ring: string };

export const CHANNEL_META: Record<NotificationType, ChannelMeta> = {
  order: { icon: Package, solid: "bg-gold-500", tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  delivery: { icon: Truck, solid: "bg-gold-500", tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  promo: { icon: Gift, solid: "bg-rose-500", tint: "text-rose-500 dark:text-rose-400", ring: "bg-rose-500/10" },
  system: { icon: Sparkles, solid: "bg-sky-500", tint: "text-sky-500 dark:text-sky-400", ring: "bg-sky-500/10" },
  support: { icon: MessageCircle, solid: "bg-emerald-500", tint: "text-emerald-500 dark:text-emerald-400", ring: "bg-emerald-500/10" },
};

export const DEFAULT_CHANNELS: NotificationChannel[] = [
  {
    id: "shipping",
    slug: "luxeit-shipping",
    name: "Luxeit Shipping",
    type: "delivery",
    messages: [
      { id: "s1", text: "Order LX-2025 has been packed and is ready to leave the Lusaka hub.", date: "Jun 12", time: "16:20", read: true },
      { id: "s2", text: "Your China-hub order LX-2038 cleared customs and is now in transit by air.", date: "Yesterday", time: "08:10", read: true },
      { id: "s3", text: "Order LX-2025 is on the way — out for delivery from the Lusaka hub. Arriving within 24 hours in Lusaka, ~48 hours for other cities.", date: "Today", time: "14:15" },
    ],
  },
  {
    id: "orders",
    slug: "luxeit-orders",
    name: "Luxeit Orders",
    type: "order",
    messages: [
      { id: "o1", text: "Order LX-1999 was delivered — your leather sling bag arrived. Enjoy!", date: "Jun 11", time: "10:15", read: true },
      { id: "o2", text: "Order LX-2038 confirmed — PS5 Cooling Dock + RGB Mousepad. We're sourcing it from the China hub now.", date: "Yesterday", time: "17:40", read: true },
      { id: "o3", text: "Order LX-2041 is in the queue. Payment received and we're sourcing it from the China hub — shipping is already included.", date: "Today", time: "09:39" },
    ],
  },
  {
    id: "promotions",
    slug: "luxeit-promotions",
    name: "Luxeit Promotions",
    type: "promo",
    messages: [
      { id: "p1", text: "Flash sale: PS5 accessories up to 30% off this weekend only.", date: "Jun 9", time: "12:00", read: true },
      { id: "p2", text: "New arrivals just landed in the China hub — fresh gadgets, watches and home picks.", date: "Jun 12", time: "10:00", read: true },
      { id: "p3", text: "Weekly deals are live — up to 40% off fresh China imports. Tap Explore to shop before they're gone.", date: "Yesterday", time: "11:30" },
    ],
  },
  {
    id: "luxeit",
    slug: "luxeit",
    name: "Luxeit",
    type: "system",
    messages: [
      { id: "l1", text: "Welcome to Luxeit! We bring quality China imports straight to your door in Zambia — with shipping always included in the price.", date: "Jun 5", time: "09:00", read: true },
      { id: "l2", text: "Tip: tap the heart on any product to save it — find everything later under Account → Saved items.", date: "Jun 10", time: "13:00", read: true },
      { id: "l3", text: "Your profile is almost complete. Add a delivery address to check out faster.", date: "Yesterday", time: "18:05" },
    ],
  },
];

export function findChannelBySlug(slug: string): NotificationChannel | undefined {
  return DEFAULT_CHANNELS.find((channel) => channel.slug === slug);
}

export function getChannelSlugs(): string[] {
  return DEFAULT_CHANNELS.map((channel) => channel.slug);
}

// --- read / dismissed persistence ----------------------------------------

export type NotificationState = { read: string[]; dismissed: string[]; dismissedMessages: string[] };

export const EMPTY_NOTIFICATION_STATE: NotificationState = { read: [], dismissed: [], dismissedMessages: [] };
const STORAGE_KEY = "luxeit:notif:v4";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

export function readNotificationState(): NotificationState {
  if (typeof window === "undefined") return EMPTY_NOTIFICATION_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_NOTIFICATION_STATE;
    const parsed = JSON.parse(raw) as { read?: unknown; dismissed?: unknown; dismissedMessages?: unknown };
    return {
      read: toStringArray(parsed.read),
      dismissed: toStringArray(parsed.dismissed),
      dismissedMessages: toStringArray(parsed.dismissedMessages),
    };
  } catch {
    return EMPTY_NOTIFICATION_STATE;
  }
}

export function writeNotificationState(state: NotificationState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors.
  }
}
