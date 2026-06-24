"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { OrdersListSkeleton } from "@/components/orders/orders-list-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { listOrders } from "@/lib/auth/api";
import { getOrderBucket } from "@/lib/orders/order-buckets";
import { ORDER_STATUS_META, type Order } from "@/lib/orders/mock-orders";

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";

function money(value: number) {
  return `K${value.toFixed(2)}`;
}

export function OrdersListView({ slug }: { slug: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const bucket = getOrderBucket(slug);
  const [orders, setOrders] = useState<Order[] | null>(null);

  // Same client-side guard as the account page: confirm the session, bounce to
  // login if it's gone. Real authorization lives on the backend.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=/account/orders/${slug}`);
    }
  }, [status, router, slug]);

  // Fetch this tab's orders from the backend (the API filters by bucket).
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listOrders(slug)
      .then((data) => {
        if (!cancelled) setOrders(data as unknown as Order[]);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [status, slug]);

  if (status !== "authenticated" || !bucket || orders === null) return <OrdersListSkeleton />;

  const Icon = bucket.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="reveal-up flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Back to account"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bucket.ring}`}>
            <Icon className={`h-5 w-5 ${bucket.tint}`} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-black leading-tight tracking-tight">{bucket.title}</h1>
            <p className="truncate text-[12px] text-slate-500 dark:text-zinc-400">{bucket.subtitle}</p>
          </div>
        </header>

        {orders.length === 0 ? (
          <section className={`reveal-up ${CARD} flex flex-col items-center px-6 py-12 text-center`} style={{ animationDelay: "60ms" }}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
              <PackageOpen className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-zinc-200">{bucket.empty}</p>
            <Link
              href="/explore"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-900/25 active:scale-[0.98]"
            >
              Start shopping
            </Link>
          </section>
        ) : (
          <section className="reveal-up space-y-3" style={{ animationDelay: "60ms" }}>
            {orders.map((order, idx) => (
              <OrderCard key={order.id} order={order} bucketSlug={slug} delay={80 + idx * 50} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order, bucketSlug, delay }: { order: Order; bucketSlug: string; delay: number }) {
  const meta = ORDER_STATUS_META[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className={`reveal-up ${CARD} p-4`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">{order.id}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.tint}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
        Placed {order.placedOn} · {itemCount} item{itemCount > 1 ? "s" : ""}
      </p>

      <div className="mt-3 space-y-2.5">
        {order.items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800">
              <Image src={item.image} alt="" width={48} height={48} unoptimized className="h-10 w-10 object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-200">{item.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Qty {item.quantity} · {money(item.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
        <span className="text-[12px] text-slate-500 dark:text-zinc-400">Total (shipping incl.)</span>
        <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{money(order.total)}</span>
      </div>

      <OrderAction bucketSlug={bucketSlug} reference={order.id} />
    </article>
  );
}

function OrderAction({ bucketSlug, reference }: { bucketSlug: string; reference: string }) {
  // Pending orders need payment; everything else opens the tracking timeline.
  const track = `/account/orders/track/${encodeURIComponent(reference)}`;
  const action =
    bucketSlug === "pending"
      ? { label: "Pay now", href: "/account/payment-methods", solid: true }
      : bucketSlug === "delivered"
        ? { label: "View order", href: track, solid: false }
        : { label: "Track order", href: track, solid: false };

  return (
    <Link
      href={action.href}
      className={
        action.solid
          ? "mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-[13px] font-bold text-white shadow-sm shadow-indigo-900/25 transition-transform active:scale-[0.98]"
          : "mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      }
    >
      {action.label}
    </Link>
  );
}
