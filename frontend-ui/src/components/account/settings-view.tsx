"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Mail,
  Palette,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { AccountSkeleton } from "@/components/auth/account-skeleton";
import { ThemeModeChips } from "@/components/theme-mode-chips";
import { useAuth } from "@/hooks/use-auth";
import { getPreferences, updatePreferences, type NotificationPrefs } from "@/lib/auth/api";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";
const ROW_CLASS = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800/50";
const ROW_ICON = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300";
const SECTION = "mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500";

const APP_VERSION = "1.0.0";

const PREF_ROWS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "promotions", label: "Promotions & deals", desc: "Weekly offers and new arrivals" },
  { key: "order_updates", label: "Order updates", desc: "Sourcing, shipping and delivery" },
  { key: "system_alerts", label: "Account & security", desc: "New-device sign-ins and tips" },
];

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { status } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/account/settings");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    getPreferences()
      .then(setPrefs)
      .catch(() => setPrefs(null));
  }, [status]);

  if (status !== "authenticated") return <AccountSkeleton />;

  async function togglePref(key: keyof NotificationPrefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingKey(key);
    try {
      await updatePreferences({ [key]: next[key] });
    } catch {
      setPrefs((p) => (p ? { ...p, [key]: !p[key] } : p)); // revert
      setNotice("Couldn't save that — try again.");
    } finally {
      setSavingKey(null);
    }
  }

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
            <h1 className="text-xl font-black leading-none tracking-tight">Settings</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Manage your app and account</p>
          </div>
        </header>

        {notice ? (
          <p className="reveal-up rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{notice}</p>
        ) : null}

        {/* Appearance */}
        <section style={{ animationDelay: "60ms" }} className="reveal-up">
          <h2 className={SECTION}>Appearance</h2>
          <div className={`${CARD} flex items-center gap-3 px-4 py-3.5`}>
            <span className={ROW_ICON}><Palette className="h-[18px] w-[18px]" strokeWidth={2} /></span>
            <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Theme</span>
            <ThemeModeChips />
          </div>
        </section>

        {/* Notification preferences */}
        <section style={{ animationDelay: "90ms" }} className="reveal-up">
          <h2 className={SECTION}>Notification preferences</h2>
          <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
            {PREF_ROWS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">{label}</span>
                  <span className="block text-[12px] text-slate-500 dark:text-zinc-400">{desc}</span>
                </span>
                {prefs ? (
                  <Toggle on={prefs[key]} disabled={savingKey === key} onClick={() => togglePref(key)} />
                ) : (
                  <span className="h-6 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Account */}
        <section style={{ animationDelay: "120ms" }} className="reveal-up">
          <h2 className={SECTION}>Account</h2>
          <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
            <Link href="/account/settings/contact" className={ROW_CLASS}>
              <span className={ROW_ICON}><Mail className="h-[18px] w-[18px]" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">Email &amp; phone</span>
                <span className="block text-[12px] text-slate-500 dark:text-zinc-400">Change your sign-in contact</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-zinc-600" />
            </Link>
            <Link href="/account/security" className={ROW_CLASS}>
              <span className={ROW_ICON}><ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">Security</span>
                <span className="block text-[12px] text-slate-500 dark:text-zinc-400">Signed-in devices</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-zinc-600" />
            </Link>
          </div>
        </section>

        {/* Support & legal */}
        <section style={{ animationDelay: "150ms" }} className="reveal-up">
          <h2 className={SECTION}>Support &amp; legal</h2>
          <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
            <Link href="/terms" className={ROW_CLASS}>
              <span className={ROW_ICON}><FileText className="h-[18px] w-[18px]" strokeWidth={2} /></span>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Terms of service</span>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
            </Link>
            <Link href="/privacy" className={ROW_CLASS}>
              <span className={ROW_ICON}><FileText className="h-[18px] w-[18px]" strokeWidth={2} /></span>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">Privacy policy</span>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
            </Link>
            {/* Disabled for now — a copy of your data can be requested via support
                (see Privacy Policy §8). Re-enable once the export flow is finalised. */}
            <div className={`${ROW_CLASS} cursor-not-allowed opacity-50`} aria-disabled="true">
              <span className={ROW_ICON}><Download className="h-[18px] w-[18px]" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">Export my data</span>
                <span className="block text-[12px] text-slate-500 dark:text-zinc-400">Temporarily unavailable — contact support for a copy</span>
              </span>
            </div>
          </div>
        </section>

        {/* About */}
        <section style={{ animationDelay: "180ms" }} className="reveal-up">
          <h2 className={SECTION}>About</h2>
          <div className={`${CARD} flex items-center gap-3 px-4 py-3.5`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[13px] font-black text-white">L</span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-200">Luxeit</span>
              <span className="block text-[12px] text-slate-500 dark:text-zinc-400">China imports to Zambia, shipping included</span>
            </span>
            <span className="shrink-0 text-[12px] font-medium text-slate-400 dark:text-zinc-500">v{APP_VERSION}</span>
          </div>
        </section>

        {/* Danger zone */}
        <section style={{ animationDelay: "210ms" }} className="reveal-up">
          <h2 className={SECTION}>Danger zone</h2>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={`${CARD} flex w-full items-center gap-3 px-4 py-3.5 text-left transition-transform duration-100 active:scale-[0.99]`}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-rose-600 dark:text-rose-400">Delete account</span>
              <span className="block text-[12px] text-slate-500 dark:text-zinc-400">Permanently remove your account and data</span>
            </span>
          </button>
        </section>
      </div>

      <DeleteAccountSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </main>
  );
}

function DeleteAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete your account. Try again.");
      setDeleting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Delete account">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={deleting ? undefined : onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md transform-gpu rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-100 active:scale-95 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Delete your account?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
              This permanently removes your account, orders history, saved items and messages. This action
              <span className="font-semibold text-slate-700 dark:text-zinc-200"> can&apos;t be undone.</span>
            </p>

            {error ? (
              <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-md shadow-rose-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
