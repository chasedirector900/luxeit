export default function NotificationThreadLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="mx-auto h-4 w-16 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="h-16 w-[82%] rounded-2xl rounded-tl-md bg-slate-200 dark:bg-zinc-800" />
          <div className="h-20 w-[82%] rounded-2xl rounded-tl-md bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
