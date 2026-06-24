"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, LogOut, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { AccountSkeleton } from "@/components/auth/account-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { listSessions, logoutOtherSessions, revokeSession, type DeviceSession } from "@/lib/auth/api";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function isMobile(label: string): boolean {
  return /iOS|Android|iPhone|iPad/i.test(label);
}

export function SecurityView() {
  const router = useRouter();
  const { status } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyOthers, setBusyOthers] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/account/security");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await listSessions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  async function handleRevoke(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log out that device.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogoutOthers() {
    setBusyOthers(true);
    setError(null);
    try {
      await logoutOtherSessions();
      setSessions((prev) => prev.filter((s) => s.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log out other devices.");
    } finally {
      setBusyOthers(false);
    }
  }

  if (status !== "authenticated") return <AccountSkeleton />;

  const hasOthers = sessions.some((s) => !s.current);

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
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">Security</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Devices signed in to your account</p>
          </div>
        </header>

        <section style={{ animationDelay: "60ms" }} className="reveal-up">
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            Your devices
          </h2>

          {loading ? (
            <div className={`${CARD} flex items-center justify-center py-10`}>
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
              {sessions.map((s) => {
                const Icon = isMobile(s.deviceLabel) ? Smartphone : Monitor;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-zinc-100">{s.deviceLabel}</p>
                        {s.current ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                            This device
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
                        {relativeTime(s.lastSeen)}
                        {s.ip ? ` · ${s.ip}` : ""}
                      </p>
                    </div>
                    {!s.current ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(s.id)}
                        disabled={busyId === s.id}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold text-rose-600 transition-transform active:scale-95 disabled:opacity-50 dark:text-rose-400"
                      >
                        {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                        Log out
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}
        </section>

        {hasOthers ? (
          <button
            type="button"
            onClick={handleLogoutOthers}
            disabled={busyOthers}
            style={{ animationDelay: "120ms" }}
            className="reveal-up inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-rose-600 transition-transform duration-100 active:scale-[0.99] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-rose-400"
          >
            {busyOthers ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Log out all other devices
          </button>
        ) : null}

        <p className="reveal-up flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500 dark:text-zinc-400" style={{ animationDelay: "160ms" }}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          We alert you by email or SMS when a new device signs in.
        </p>
      </div>
    </main>
  );
}
