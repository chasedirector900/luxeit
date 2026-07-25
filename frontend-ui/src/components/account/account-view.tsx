"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronRight,
  Circle,
  CreditCard,
  Gift,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Pencil,
  Settings,
  Share2,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountSkeleton } from "@/components/auth/account-skeleton";
import { EditProfileSheet } from "@/components/account/edit-profile-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { listOrders, type OrderApi } from "@/lib/auth/api";
import { ORDER_BUCKETS, bucketCount } from "@/lib/orders/order-buckets";
import type { Order } from "@/lib/orders/mock-orders";
import type { Profile } from "@/lib/profile/profile-storage";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";
const ROW_CLASS = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800/50";
const ROW_ICON = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300";

export function AccountView() {
  const router = useRouter();
  const { logout, status, user, updateProfile } = useAuth();
  const { totalUnread } = useNotifications();
  const [editing, setEditing] = useState<"profile" | "address" | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState(false);

  // Load the user's orders so the My Orders tabs show live counts.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listOrders()
      .then((data: OrderApi[]) => {
        if (!cancelled) {
          setOrders(data as unknown as Order[]);
          setOrdersError(false);
        }
      })
      .catch(() => {
        // Never fail silently: the tiles would show zeros and lie.
        if (!cancelled) {
          setOrders([]);
          setOrdersError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Client-side guard: the proxy is optimistic, so confirm the real session and
  // bounce to login if it's missing or expired. Real authz is on the backend.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/account");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return <AccountSkeleton />;
  }

  // The profile shown is ALWAYS the signed-in account from the backend — never
  // anything stored on this device, so a shared phone can't show the previous
  // user's name or address.
  const profile: Profile = {
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    // The editable phone here is the CONTACT/delivery number, not the login
    // identifier (which changes only via the OTP flow).
    phone: user?.contactPhone ?? "",
    address: user?.address ?? null,
  };

  function save(next: Profile) {
    setEditing(null);
    // Persist the display name, contact phone, and delivery address to the
    // backend (the login email/phone stay as identifiers, changed via the OTP
    // flow). The auth context refreshes `user`, re-rendering with saved values.
    void updateProfile({
      fullName: next.fullName.trim(),
      contactPhone: next.phone.trim(),
      address: next.address ?? null,
    }).catch(() => {});
  }

  const contact = profile.email || profile.phone;
  // "Member since Jun 2026" — a real fact beats a generic "Member" sticker.
  const joined = user?.joined ? new Date(user.joined) : null;
  const memberSince =
    joined && !Number.isNaN(joined.getTime())
      ? `Member since ${joined.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
      : "Member";
  // Verification is a property of the backend account; show it only when the
  // displayed contact still matches the channel the backend marked verified.
  const emailVerified = Boolean(
    user?.emailVerified && user.email && profile.email.trim().toLowerCase() === user.email.toLowerCase(),
  );
  const phoneVerified = Boolean(
    user?.phoneVerified && user.phone && profile.phone.trim() === user.phone,
  );
  const contactVerified = profile.email.trim() ? emailVerified : phoneVerified;
  const initial = (profile.fullName.trim().charAt(0) || "?").toUpperCase();
  const addressLines = profile.address
    ? [profile.address.line1, profile.address.city, profile.address.area].filter(Boolean)
    : [];
  const addressSummary = addressLines.length > 0 ? addressLines.join(", ") : "Add your delivery address";

  // Profile completeness as a checklist, driven by the real saved profile.
  const checklist = [
    { key: "name", label: "Full name", done: Boolean(profile.fullName.trim()), verified: false, onAdd: () => setEditing("profile") },
    { key: "email", label: "Email", done: Boolean(profile.email.trim()), verified: emailVerified, onAdd: () => setEditing("profile") },
    { key: "phone", label: "Phone number", done: Boolean(profile.phone.trim()), verified: phoneVerified, onAdd: () => setEditing("profile") },
    { key: "address", label: "Shipping address", done: Boolean(profile.address), verified: false, onAdd: () => setEditing("address") },
  ];
  const completedSteps = checklist.filter((item) => item.done).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="reveal-up">
        <h1 className="text-[2rem] font-black leading-none tracking-tight">Account</h1>
      </header>

      {/* Hero profile — centered */}
      <section
        style={{ animationDelay: "60ms" }}
        className={`reveal-up relative overflow-hidden px-6 pb-6 pt-7 text-center rounded-3xl ${CARD}`}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-3xl transform-gpu" />
        <div className="relative">
          <div className="relative mx-auto h-20 w-20">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg shadow-indigo-900/25 ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900">
              {initial}
            </span>
            <button
              type="button"
              onClick={() => setEditing("profile")}
              aria-label="Edit profile"
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-white shadow-md ring-2 ring-white transition-transform duration-100 active:scale-95 dark:ring-zinc-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          <h2 className="mt-3.5 truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
            {profile.fullName.trim() || "Welcome"}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-zinc-400">
            {contact || "Add your contact details"}
          </p>

          <div className="mt-3.5 flex items-center justify-center gap-1.5">
            {contact && contactVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-2.5 py-[5px] text-[11px] font-semibold text-emerald-600 dark:border-emerald-400/20 dark:text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-500/[0.07] px-2.5 py-[5px] text-[11px] font-semibold text-indigo-600 dark:border-indigo-400/20 dark:text-indigo-400">
              <Star className="h-3.5 w-3.5" />
              {memberSince}
            </span>
          </div>
        </div>
      </section>

      {/* Complete your profile — checklist with live progress */}
      {completedSteps < checklist.length ? (
        <section style={{ animationDelay: "100ms" }} className={`reveal-up ${CARD} divide-y divide-slate-100 dark:divide-zinc-800/70`}>
          <div className="px-4 pb-3.5 pt-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Complete your profile</p>
              <span className="text-[12px] font-semibold tabular-nums text-slate-500 dark:text-zinc-400">
                {completedSteps} of {checklist.length}
              </span>
            </div>
            {/* Progress bar — instantly shows how close they are */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={completedSteps} aria-label="Profile completion">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500 ease-out"
                style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
              />
            </div>
          </div>
          {checklist.map((item) =>
            item.done ? (
              <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-zinc-200">{item.label}</span>
                {item.verified ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>
            ) : (
              // Whole row is tappable — a bigger target than the old "Add" text.
              <button
                key={item.key}
                type="button"
                onClick={item.onAdd}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800/50"
              >
                <Circle className="h-5 w-5 shrink-0 text-slate-300 dark:text-zinc-600" />
                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-zinc-200">{item.label}</span>
                <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400">Add</span>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
              </button>
            ),
          )}
        </section>
      ) : null}

      {/* My Orders */}
      <section style={{ animationDelay: "140ms" }} className="reveal-up">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">My Orders</h2>
          <Link
            href="/account/orders/queue"
            className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-indigo-600 transition-colors active:text-indigo-500 dark:text-indigo-400"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {ordersError ? (
          <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 dark:text-amber-400">
            We couldn&apos;t load your order counts — check your connection and pull to refresh.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2.5">
          {ORDER_BUCKETS.map(({ slug, label, note, icon: Icon, tint, ring }) => {
            const count = bucketCount(slug, orders);
            return (
              <Link
                key={slug}
                href={`/account/orders/${slug}`}
                className={`${CARD} flex items-center gap-3 p-3.5 text-left transition-transform duration-100 active:scale-[0.98]`}
              >
                <span className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ring}`}>
                  <Icon className={`h-5 w-5 ${tint}`} strokeWidth={2} />
                  {count > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white dark:ring-zinc-900">
                      {count}
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold leading-tight text-slate-900 dark:text-zinc-100">{label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-zinc-400">{note}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Refer & earn — restrained card with a warm gold accent (premium, not loud) */}
      <section
        style={{ animationDelay: "180ms" }}
        className={`reveal-up relative overflow-hidden ${CARD} p-4`}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-500/15 blur-3xl transform-gpu dark:bg-amber-400/10" />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-900/20">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-slate-900 dark:text-zinc-100">Refer &amp; earn</p>
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
              Invite friends — you both get <span className="font-bold text-amber-600 dark:text-amber-400">K50 off</span>.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-3.5 text-xs font-bold text-white shadow-md shadow-amber-900/20 transition-transform duration-100 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            Invite
          </button>
        </div>
      </section>

      {/* Account section */}
      <section style={{ animationDelay: "220ms" }} className="reveal-up">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Account</h2>
        <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
          <Link href="/account/saved" className={ROW_CLASS}>
            <span className={ROW_ICON}><Heart className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Saved items</span>
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>

          <button type="button" onClick={() => setEditing("address")} className={ROW_CLASS}>
            <span className={ROW_ICON}><MapPin className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">Delivery address</span>
              <span className="block truncate text-[12px] text-slate-500 dark:text-zinc-400">{addressSummary}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-zinc-600" />
          </button>

          <Link href="/account/payment-methods" className={ROW_CLASS}>
            <span className={ROW_ICON}><CreditCard className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Payment methods</span>
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>

          <Link href="/account/notifications" className={ROW_CLASS}>
            <span className={`relative ${ROW_ICON}`}>
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
              {totalUnread > 0 ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
              ) : null}
            </span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Notifications</span>
            {totalUnread > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[11px] font-bold text-white">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>
        </div>
      </section>

      {/* More section */}
      <section style={{ animationDelay: "260ms" }} className="reveal-up">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">More</h2>
        <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
          <Link href="/account/notifications/support" className={ROW_CLASS}>
            <span className={ROW_ICON}><HelpCircle className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Help &amp; support</span>
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>
          <Link href="/account/settings" className={ROW_CLASS}>
            <span className={ROW_ICON}><Settings className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Settings</span>
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
          </Link>
        </div>
      </section>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        style={{ animationDelay: "300ms" }}
        className="reveal-up inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-rose-600 transition-transform duration-100 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-rose-400"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      <EditProfileSheet
        open={editing !== null}
        mode={editing ?? "profile"}
        profile={profile}
        emailVerified={emailVerified}
        phoneVerified={phoneVerified}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
    </main>
  );
}
