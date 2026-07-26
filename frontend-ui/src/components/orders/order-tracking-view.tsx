"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Clock, MapPin, Package, PackageCheck, Plane, Ship, Star, Truck, Wallet, XCircle } from "lucide-react";
import { TrackOrderSkeleton } from "@/components/orders/track-order-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getOrder, type OrderApi, type OrderApiShipment } from "@/lib/auth/api";

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";

// The fulfilment journey, in order. Matches the backend statuses — note the
// "sourcing" status means the goods are already BOUGHT and waiting to ship, so
// it reads as "Sourced" here (the buying itself happens during "queue").
// Wording is hub-aware: China goods wait to leave China, local stock doesn't.
function stagesFor(warehouse?: string) {
  const china = warehouse === "china";
  return [
    { key: "pending", label: "Order placed", desc: "We received your order", icon: Wallet },
    { key: "queue", label: "Sourcing", desc: "Paid — we're buying your items", icon: Clock },
    {
      key: "sourcing",
      label: "Sourced",
      desc: china ? "Bought — waiting to leave China" : "Bought — preparing for delivery",
      icon: Package,
    },
    {
      key: "transit",
      label: "In transit",
      desc: china ? "Left China — on its way to you" : "On its way to you",
      icon: Truck,
    },
    {
      key: "delivered",
      label: "Delivered",
      desc: china ? "Arrived — ready for collection" : "Completed",
      icon: PackageCheck,
    },
  ];
}

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
      .then((o) => !cancelled && setOrder(o))
      .catch(() => !cancelled && setMissing(true));
    return () => {
      cancelled = true;
    };
  }, [status, reference]);

  if (status !== "authenticated" || (!order && !missing)) return <TrackOrderSkeleton />;

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

  // Each shipment tracks itself. Fall back to a single implicit shipment if the
  // API somehow didn't send any.
  const shipments: OrderApiShipment[] =
    order.shipments && order.shipments.length
      ? order.shipments
      : [
          {
            warehouse: "",
            carrier: "",
            label: "Your order",
            eta: "",
            status: order.status,
            statusLabel: order.statusLabel,
            statusDescription: order.statusDescription,
            subtotal: order.total,
            items: order.items,
            events: [],
          },
        ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        <BackHeader reference={reference} />

        {/* Order status banner (rolled up from the shipments) */}
        <section
          style={{ animationDelay: "60ms" }}
          className={`reveal-up overflow-hidden rounded-2xl p-4 text-white shadow-lg ${
            cancelled
              ? "bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-900/25"
              : delivered
                ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-900/25"
                : "bg-gold-500 shadow-gold-900/25"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">{order.id}</p>
          <h1 className="mt-1 text-xl font-black leading-tight">{order.statusLabel}</h1>
          <p className="mt-1 text-[13px] text-white/90">
            {cancelled ? "This order was cancelled." : order.statusDescription}
            {shipments.length > 1 ? ` · ${shipments.length} shipments` : ""}
          </p>
        </section>

        {/* Shipping address */}
        {order.shippingAddress ? (
          <section style={{ animationDelay: "100ms" }} className={`reveal-up ${CARD} flex items-start gap-3 p-4`}>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500 dark:text-gold-400">
              <MapPin className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Delivering to</p>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-700 dark:text-zinc-300">{order.shippingAddress}</p>
            </div>
          </section>
        ) : null}

        {/* One tracking card per shipment, each with its own timeline */}
        {shipments.map((sh, si) => {
          const CarrierIcon = sh.carrier === "air" ? Plane : sh.carrier === "sea" ? Ship : Truck;
          const shDelivered = sh.status === "delivered";
          const shCancelled = sh.status === "cancelled";
          return (
            <section key={`${sh.label}-${si}`} style={{ animationDelay: `${140 + si * 60}ms` }} className={`reveal-up ${CARD} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                  <CarrierIcon className="h-4 w-4 text-gold-500 dark:text-gold-400" />
                  {sh.label || "Your order"}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    shDelivered
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : shCancelled
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-gold-500/10 text-gold-600 dark:text-gold-400"
                  }`}
                >
                  {sh.statusLabel}
                </span>
              </div>
              {sh.eta && !shDelivered && !shCancelled ? (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">{sh.eta}</p>
              ) : null}

              <div className="mt-3.5">
                <ShipmentTimeline events={sh.events ?? []} currentStatus={sh.status} warehouse={sh.warehouse} />
              </div>

              {/* Items in this shipment */}
              <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-zinc-800">
                {sh.items.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800">
                      <Image src={item.image} alt="" width={44} height={44} unoptimized className="h-9 w-9 object-contain" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-200">{item.title}</p>
                      {item.variantLabel ? (
                        <p className="truncate text-[11px] font-medium text-slate-600 dark:text-zinc-300">{item.variantLabel}</p>
                      ) : null}
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Qty {item.quantity} · {money(item.price)}
                      </p>
                    </div>
                    {item.reviewable && item.slug && item.categorySlug ? (
                      <Link
                        href={`/category/${item.categorySlug}/product/${item.slug}/reviews-rating`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-1.5 text-[11px] font-bold text-gold-600 transition-transform active:scale-95 dark:text-gold-400"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Review
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-zinc-400">Shipment subtotal</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{money(sh.subtotal)}</span>
              </div>
            </section>
          );
        })}

        {/* Order total */}
        <section style={{ animationDelay: "320ms" }} className={`reveal-up ${CARD} flex items-center justify-between p-4`}>
          <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Order total (shipping incl.)</span>
          <span className="text-lg font-black text-slate-900 dark:text-zinc-100">{money(order.total)}</span>
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

function ShipmentTimeline({
  events,
  currentStatus,
  warehouse,
}: {
  events: Array<{ status: string; at: string }>;
  currentStatus: string;
  warehouse?: string;
}) {
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <XCircle className="h-4 w-4" />
        <span className="text-[13px] font-semibold">Shipment cancelled</span>
      </div>
    );
  }
  const delivered = currentStatus === "delivered";
  const currentIndex = STAGE_INDEX[currentStatus] ?? 0;
  const stages = stagesFor(warehouse);
  const at: Record<string, string> = {};
  for (const e of events) at[e.status] = e.at;

  return (
    <ol className="relative">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const done = i < currentIndex || delivered;
        const current = i === currentIndex && !delivered;
        const isLast = i === stages.length - 1;
        const stamp = at[stage.key];
        return (
          <li key={stage.key} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[13px] top-8 h-[calc(100%-1.25rem)] w-0.5 ${
                  done ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-800"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                done
                  ? "bg-emerald-500 text-white"
                  : current
                    ? "bg-gold-500 text-ink ring-4 ring-gold-500/20"
                    : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-[14px] w-[14px]" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[13px] font-bold ${done || current ? "text-slate-900 dark:text-zinc-100" : "text-slate-400 dark:text-zinc-500"}`}>
                  {stage.label}
                </p>
                {stamp ? <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-zinc-500">{stamp}</span> : null}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">{stage.desc}</p>
              {current ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold text-gold-600 dark:text-gold-400">
                  In progress
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
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
