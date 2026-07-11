"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { ContactSkeleton } from "@/components/account/contact-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { requestContactChange, verifyContactChange } from "@/lib/auth/api";

const FIELD =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-zinc-400";
const ONLY_DIGITS = /\D/g;

export function ChangeContactView() {
  const router = useRouter();
  const { status, user, refresh } = useAuth();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [step, setStep] = useState<"identify" | "verify">("identify");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/account/settings/contact");
  }, [status, router]);

  // Only offer to change the contact methods the user actually has. A
  // passwordless user always has at least one (their sign-in contact), so an
  // email-only account never sees a "phone" tab for a number we don't have.
  const hasEmail = Boolean(user?.email);
  const hasPhone = Boolean(user?.phone);
  const availableModes = ([
    hasEmail ? "email" : null,
    hasPhone ? "phone" : null,
  ] as const).filter((m): m is "email" | "phone" => m !== null);

  useEffect(() => {
    if (availableModes.length && !availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEmail, hasPhone]);

  if (status !== "authenticated") return <ContactSkeleton />;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const identifier = value.trim();
    if (!identifier) {
      setError(`Enter your new ${mode}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await requestContactChange(identifier);
      setDestination(res.destination);
      setCode("");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyContactChange(value.trim(), code.trim());
      await refresh();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  const current = mode === "email" ? user?.email : user?.phone;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="reveal-up flex items-center gap-3">
          <Link
            href="/account/settings"
            aria-label="Back to settings"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">
              {availableModes.length > 1 ? "Change email or phone" : `Change your ${availableModes[0] ?? "email"}`}
            </h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">We&apos;ll verify the new one with a code</p>
          </div>
        </header>

        {done ? (
          <section className="reveal-up rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <h2 className="mt-4 text-base font-extrabold">Your {mode} was updated</h2>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">{destination} is now your sign-in {mode}.</p>
            <Link
              href="/account/settings"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 active:scale-[0.98]"
            >
              Back to settings
            </Link>
          </section>
        ) : step === "identify" ? (
          <form onSubmit={sendCode} className="reveal-up space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            {availableModes.length > 1 ? (
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                {availableModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setValue("");
                      setError(null);
                    }}
                    className={`h-9 rounded-lg text-xs font-bold capitalize transition-colors ${
                      mode === m ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : null}

            {current ? (
              <p className="text-[12px] text-slate-500 dark:text-zinc-400">
                Current {mode}: <span className="font-semibold text-slate-700 dark:text-zinc-200">{current}</span>
              </p>
            ) : null}

            <div>
              <label className={LABEL}>New {mode === "email" ? "email address" : "phone number"}</label>
              <div className="flex h-12 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-indigo-500">
                {mode === "email" ? (
                  <Mail className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-zinc-500" />
                ) : (
                  <Phone className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-zinc-500" />
                )}
                <input
                  type={mode === "email" ? "email" : "tel"}
                  inputMode={mode === "email" ? "email" : "tel"}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={mode === "email" ? "name@domain.com" : "+260 97 123 4567"}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
              {mode === "phone" ? (
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">Include the country code, e.g. +260.</p>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 active:scale-[0.98] disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="reveal-up space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <p className="text-[13px] text-slate-600 dark:text-zinc-300">
              Enter the 6-digit code we sent to <span className="font-semibold text-slate-900 dark:text-zinc-100">{destination}</span>.
            </p>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(ONLY_DIGITS, "").slice(0, 6));
                if (error) setError(null);
              }}
              placeholder="••••••"
              className={`${FIELD} text-center text-lg font-bold tracking-[0.5em]`}
            />
            {error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Verifying…" : "Verify & update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("identify");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-[12px] font-semibold text-slate-500 dark:text-zinc-400"
            >
              Use a different {mode}
            </button>
          </form>
        )}

        <p className="reveal-up flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Changing your sign-in contact requires verifying the new one.
        </p>
      </div>
    </main>
  );
}
