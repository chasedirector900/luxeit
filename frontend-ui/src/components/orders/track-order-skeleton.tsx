const CARD = "rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70";
const GHOST = "rounded bg-slate-200 dark:bg-zinc-800";

function ShipmentCardSkeleton() {
  return (
    <div className={`${CARD} p-4`}>
      {/* Carrier label + status pill */}
      <div className="flex items-center justify-between gap-2">
        <div className={`h-4 w-36 ${GHOST}`} />
        <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-zinc-800" />
      </div>
      {/* Timeline steps */}
      <div className="mt-4 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="h-7 w-7 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className={`h-3.5 w-28 ${GHOST}`} />
              <div className={`h-3 w-40 ${GHOST}`} />
            </div>
            <div className={`h-3 w-10 shrink-0 ${GHOST}`} />
          </div>
        ))}
      </div>
      {/* Items */}
      <div className="mt-4 space-y-3 border-t border-gold-100/70 pt-4 dark:border-gold-900/40">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className={`h-3.5 w-40 ${GHOST}`} />
              <div className={`h-3 w-24 ${GHOST}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors the order-tracking page — back header, status banner, address card,
 *  then per-shipment timeline cards. */
export function TrackOrderSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Back + title header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className={`h-5 w-32 ${GHOST}`} />
            <div className={`h-3 w-20 ${GHOST}`} />
          </div>
        </div>

        {/* Status banner */}
        <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />

        {/* Delivering-to card */}
        <div className={`${CARD} flex items-start gap-3 p-4`}>
          <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div className={`h-3 w-24 ${GHOST}`} />
            <div className={`h-3.5 w-52 ${GHOST}`} />
          </div>
        </div>

        {/* Per-shipment tracking cards */}
        <ShipmentCardSkeleton />
        <ShipmentCardSkeleton />
      </div>
    </main>
  );
}
