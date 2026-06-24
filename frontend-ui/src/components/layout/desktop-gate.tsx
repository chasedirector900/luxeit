import { Smartphone } from "lucide-react";

/**
 * Full-screen "use a phone" gate for tablets and desktops.
 *
 * Pure CSS — no JS, no hydration flash: `hidden` below the `md` breakpoint
 * (phones, ~<768px) and shown at `md` and up (tablets/PCs). It sits last in the
 * body with a high z-index so it covers the entire app, including the header.
 */
export function DesktopGate() {
  return (
    <div className="fixed inset-0 z-[9999] hidden flex-col items-center justify-center bg-slate-50 px-8 text-center text-slate-900 md:flex dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-md">
        <p className="text-2xl font-black tracking-[0.35em]">LUXEIT</p>

        <span className="mx-auto mt-10 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/25">
          <Smartphone className="h-10 w-10" strokeWidth={1.75} />
        </span>

        <h1 className="mt-8 text-2xl font-black tracking-tight">Best viewed on mobile</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
          Luxeit is under active development and currently built for phones. Please open it on your
          mobile device for the full experience.
        </p>

        <p className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Tip: on desktop, open your browser&apos;s device toolbar to preview the mobile view.
        </p>
      </div>
    </div>
  );
}
