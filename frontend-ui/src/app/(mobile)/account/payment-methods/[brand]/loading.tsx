export default function Loading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="aspect-[1.586/1] w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        <div className="space-y-4 rounded-2xl border border-gold-200/70 bg-white p-5 dark:border-gold-900/40 dark:bg-zinc-900/70">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
