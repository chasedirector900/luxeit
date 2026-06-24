function SideCardSkeleton({ glowClass }: { glowClass: string }) {
  return (
    <article className="relative hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100 p-5 shadow-xl shadow-slate-200/50 lg:block dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/40">
      <div className={`pointer-events-none absolute inset-0 ${glowClass}`} />
      <div className="relative z-10 flex min-h-[360px] flex-col animate-pulse">
        <div className="h-8 w-48 rounded-md bg-zinc-200/60 dark:bg-white/5" />
        <div className="mt-3 h-4 w-56 rounded-md bg-zinc-200/60 dark:bg-white/5" />
        <div className="mt-5 h-10 w-32 rounded-full bg-zinc-200/70 dark:bg-white/5" />
        <div className="mt-auto h-40 w-full rounded-2xl bg-zinc-200/70 dark:bg-white/5" />
      </div>
    </article>
  );
}

export function PromoBannerSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 w-full px-4 max-w-7xl mx-auto lg:grid-cols-4">
      <div className="lg:col-span-1">
        <SideCardSkeleton glowClass="bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.14),transparent_36%),radial-gradient(circle_at_85%_85%,rgba(148,163,184,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.24),transparent_36%),radial-gradient(circle_at_85%_85%,rgba(148,163,184,0.2),transparent_34%)]" />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300/80 bg-slate-100/90 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.16)] backdrop-blur-md lg:col-span-2 dark:border-indigo-300/20 dark:bg-slate-900/80 dark:shadow-[0_20px_60px_rgba(17,24,39,0.6)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.11),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.1),transparent_40%)] dark:bg-[radial-gradient(circle_at_25%_15%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.16),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.14),transparent_40%)]" />
        <div className="relative z-10 animate-pulse">
          <div className="mx-auto mb-2 h-4 w-20 rounded-full bg-zinc-200/60 dark:bg-white/5" />
          <div className="mx-auto h-8 w-64 rounded-md bg-zinc-200/60 dark:bg-white/5 sm:h-10 sm:w-80" />
          <div className="mt-3 flex justify-center">
            <div className="h-6 w-24 rounded-full bg-zinc-200/60 dark:bg-white/5" />
          </div>

          <div className="relative mt-5 h-44 sm:h-52">
            <div className="absolute bottom-2 left-1/2 h-12 w-[85%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.24),rgba(59,130,246,0.08),transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.35),rgba(59,130,246,0.12),transparent_72%)] blur-md" />
            <div className="absolute inset-0 flex items-end justify-center gap-2 sm:gap-3">
              <div className="z-0 h-30 w-20 translate-y-[6px] rotate-[-5deg] rounded-xl border border-slate-300/70 bg-zinc-200/70 dark:border-white/10 dark:bg-white/5 sm:h-36 sm:w-24" />
              <div className="z-10 h-36 w-24 -translate-y-[8px] scale-105 rounded-xl border border-cyan-300/40 bg-zinc-200/70 dark:border-cyan-200/25 dark:bg-white/5 sm:h-42 sm:w-28" />
              <div className="z-0 h-30 w-20 translate-y-[6px] rotate-[5deg] rounded-xl border border-slate-300/70 bg-zinc-200/70 dark:border-white/10 dark:bg-white/5 sm:h-36 sm:w-24" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="h-7 rounded-full border border-slate-300/70 bg-zinc-200/70 dark:border-white/10 dark:bg-white/5" />
            <div className="h-7 rounded-full border border-slate-300/70 bg-zinc-200/70 dark:border-white/10 dark:bg-white/5" />
            <div className="h-7 rounded-full border border-slate-300/70 bg-zinc-200/70 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            <div className="h-1.5 w-4 rounded-full bg-cyan-300/70 dark:bg-cyan-300/60" />
            <div className="h-1.5 w-4 rounded-full bg-zinc-300 dark:bg-white/20" />
            <div className="h-1.5 w-4 rounded-full bg-zinc-300 dark:bg-white/20" />
          </div>
        </div>
      </section>

      <div className="lg:col-span-1">
        <SideCardSkeleton glowClass="bg-[radial-gradient(circle_at_30%_25%,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_70%_75%,rgba(34,197,94,0.12),transparent_36%)] dark:bg-[radial-gradient(circle_at_30%_25%,rgba(16,185,129,0.3),transparent_36%),radial-gradient(circle_at_70%_75%,rgba(34,197,94,0.2),transparent_36%)]" />
      </div>
    </section>
  );
}

