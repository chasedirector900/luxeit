"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, MapPin, Package, PackageCheck, Plane, Ship, Star, Truck, Wallet, XCircle } from "lucide-react";
import { OrdersListSkeleton } from "@/components/orders/orders-list-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getOrder, type OrderApi } from "@/lib/auth/api";

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";

// The fulfilment journey, in order. Matches the backend order statuses.
const STAGES = [
  { key: "pending", label: "Order placed", desc: "We received your order", icon: Wallet },
  { key: "queue", label: "Payment confirmed", desc: "Paid — queued to be sourced", icon: Clock },
  { key: "sourcing", label: "Sourcing", desc: "Buying your items from our China hub", icon: Package },
  { key: "transit", label: "In transit", desc: "On its way to you", icon: Truck },
  { key: "delivered", label: "Delivered", desc: "Order completed", icon: PackageCheck },
] as const;

const STAGE_INDEX: Record<string, number> = { pending: 0, queue: 1, sourcing: 2, transit: 3, delivered: 4 };

function money(value: number) {
  return `K${value.toFixed(2)}`;
}

export function OrderTrackingView({ reference }: { reference: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const [order, setOrder] = useState<OrderApi | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=/account/orders/track/${reference}`);
    }
  }, [status, router, reference]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    getOrder(reference)
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, reference]);

  if (status !== "authenticated" || (!order && !missing)) return <OrdersListSkeleton />;

  if (missing || !order) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto w-full max-w-md">
          <BackHeader reference={reference} />
          <div className="mt-10 text-center text-[13px] text-slate-500 dark:text-zinc-400">This order no longer exists.</div>
        </div>
      </main>
    );
  }

  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const currentIndex = STAGE_INDEX[order.status] ?? 0;
  const eventAtByStatus: Record<string, string> = {};
  for (const e of order.events ?? []) eventAtByStatus[e.status] = e.at;

  // One order, possibly several shipments (hub + carrier). Fall back to a single
  // implicit group if the API didn't send shipments.
  const shipments =
    order.shipments && order.shipments.length
      ? order.shipments
      : [{ warehouse: "", carrier: "", label: "", eta: "", subtotal: order.total, items: order.items }];
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const carrierEta =
    order.carrier === "air" ? "Estimated ~2 weeks (Air)" : order.carrier === "sea" ? "Estimated ~2 months (Sea)" : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        <BackHeader reference={reference} />

        {/* Current status banner */}
        <section
          style={{ animationDelay: "60ms" }}
          className={`reveal-up overflow-hidden rounded-2xl p-4 text-white shadow-lg ${
            cancelled
              ? "bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-900/25"
              : delivered
                ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-900/25"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-900/25"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">{order.id}</p>
          <h1 className="mt-1 text-xl font-black leading-tight">{order.statusLabel}</h1>
          <p className="mt-1 text-[13px] text-white/90">
            {cancelled ? "This order was cancelled." : order.statusDescription}
            {carrierEta && !cancelled && !delivered ? ` · ${carrierEta}` : ""}
          </p>
        </section>

        {/* Timeline */}
        <section style={{ animationDelay: "120ms" }} className={`reveal-up ${CARD} p-5`}>
          {cancelled ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <XCircle className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Order cancelled</p>
            </div>
          ) : (
            <ol className="relative">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const done = i < currentIndex || delivered;
                const current = i === currentIndex && !delivered;
                const isLast = i === STAGES.length - 1;
                const at = eventAtByStatus[stage.key];
                return (
                  <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast ? (
                      <span
                        className={`absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-0.5 ${
                          i < currentIndex || delivered ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-800"
                        }`}
                      />
                    ) : null}
                    <span
                      className={`relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20"
                            : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
                      }`}
                    >
                      {done ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : <Icon className="h-[16px] w-[16px]" />}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-bold ${
                            done || current ? "text-slate-900 dark:text-zinc-100" : "text-slate-400 dark:text-zinc-500"
                          }`}
                        >
                          {stage.label}
                        </p>
                        {at ? (
                          <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-zinc-500">{at}</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">{stage.desc}</p>
                      {current ? (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          In progress
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Shipping address */}
        {order.shippingAddress ? (
          <section style={{ animationDelay: "180ms" }} className={`reveal-up ${CARD} flex items-start gap-3 p-4`}>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <MapPin className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Delivering to</p>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-700 dark:text-zinc-300">{order.shippingAddress}</p>
            </div>
          </section>
        ) : null}

        {/* Items + total */}
        <section style={{ animationDelay: "220ms" }} className={`reveal-up ${CARD} p-4`}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            {shipments.length > 1 ? `${shipments.length} shipments · ` : ""}
            {itemCount} item{itemCount > 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {shipments.map((sh, si) => {
              const CarrierIcon = sh.carrier === "air" ? Plane : sh.carrier === "sea" ? Ship : Truck;
              return (
                <div
                  key={`${sh.label}-${si}`}
                  className={sh.label ? "rounded-xl border border-slate-200 p-3 dark:border-zinc-800" : ""}
                >
                  {sh.label ? (
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-zinc-200">
                        <CarrierIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        {sh.label}
                      </span>
                      {sh.eta ? <span className="text-[11px] text-slate-400 dark:text-zinc-500">{sh.eta}</span> : null}
                    </div>
                  ) : null}
                  <div className="space-y-2.5">
                    {sh.items.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800">
                          <Image src={item.image} alt="" width={48} height={48} unoptimized className="h-10 w-10 object-contain" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-200">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Qty {item.quantity} · {money(item.price)}
                          </p>
                        </div>
                        {item.reviewable && item.slug && item.categorySlug ? (
                          <Link
                            href={`/category/${item.categorySlug}/product/${item.slug}/reviews-rating`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 transition-transform active:scale-95 dark:text-indigo-400"
                          >
                            <Star className="h-3.5 w-3.5" />
                            Review
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
            <span className="text-[12px] text-slate-500 dark:text-zinc-400">Total (shipping incl.)</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{money(order.total)}</span>
          </div>
        </section>

        <Link
          href="/account/notifications/support"
          className="reveal-up inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Need help with this order?
        </Link>
      </div>
    </main>
  );
}

function BackHeader({ reference }: { reference: string }) {
  return (
    <header className="reveal-up flex items-center gap-3">
      <Link
        href="/account"
        aria-label="Back to account"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Link>
      <div>
        <h1 className="text-xl font-black leading-none tracking-tight">Track order</h1>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">{reference}</p>
      </div>
    </header>
  );
}
