import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center gap-3">
          <Link
            href="/account/settings"
            aria-label="Back to settings"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-200/70 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">{title}</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Last updated {updated}</p>
          </div>
        </header>

        <div className="space-y-5 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-zinc-100">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
