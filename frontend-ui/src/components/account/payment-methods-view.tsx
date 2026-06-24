"use client";

import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  PAYMENT_BRANDS,
  getPaymentBrand,
  readPaymentMethods,
  writePaymentMethods,
  type PaymentMethod,
} from "@/lib/payments/payment-methods";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";

export function PaymentMethodsView() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMethods(readPaymentMethods());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writePaymentMethods(methods);
  }, [hydrated, methods]);

  function removeMethod(id: string) {
    setMethods((prev) => {
      const removed = prev.find((m) => m.id === id);
      let next = prev.filter((m) => m.id !== id);
      if (removed?.isDefault && next.length > 0) {
        next = next.map((m, idx) => ({ ...m, isDefault: idx === 0 }));
      }
      return next;
    });
  }

  function setDefault(id: string) {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  }

  return (
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
          <h1 className="text-xl font-black leading-none tracking-tight">Payment methods</h1>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Manage how you pay</p>
        </div>
      </header>

      {/* Saved methods */}
      <section style={{ animationDelay: "60ms" }} className="reveal-up">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Your methods</h2>
        {methods.length > 0 ? (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {methods.map((method) => {
                const meta = getPaymentBrand(method.brand);
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={method.id}
                    layout
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.18 }}
                    className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm shadow-slate-900/[0.04] dark:bg-zinc-900/70 dark:shadow-none ${
                      method.isDefault ? "border-indigo-500/50 ring-1 ring-indigo-500/30" : "border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${meta.gradient}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-zinc-100">{method.label}</p>
                        {method.isDefault ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[13px] tracking-wider text-slate-500 dark:text-zinc-400">{method.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!method.isDefault ? (
                        <button
                          type="button"
                          onClick={() => setDefault(method.id)}
                          className="rounded-lg px-2 py-1 text-[12px] font-semibold text-indigo-600 transition-colors active:scale-95 dark:text-indigo-400"
                        >
                          Set default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeMethod(method.id)}
                        aria-label={`Remove ${method.label}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-transform active:scale-90 hover:bg-slate-100 hover:text-rose-500 dark:text-zinc-500 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`${CARD} flex flex-col items-center px-6 py-10 text-center`}>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Wallet className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h3 className="mt-4 text-base font-extrabold tracking-tight">No payment method yet</h3>
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">Add one below to check out faster.</p>
          </div>
        )}
      </section>

      {/* Add a method */}
      <section style={{ animationDelay: "120ms" }} className="reveal-up">
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Add a payment method</h2>
        <div className={`${CARD} divide-y divide-slate-200 dark:divide-zinc-800`}>
          {PAYMENT_BRANDS.map(({ brand, label, desc, icon: Icon, tint, ring }) => (
            <Link
              key={brand}
              href={`/account/payment-methods/${brand}`}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800/50"
            >
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ring}`}>
                <Icon className={`h-5 w-5 ${tint}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</span>
                <span className="block text-[12px] text-slate-500 dark:text-zinc-400">{desc}</span>
              </span>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300">
                <Plus className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="reveal-up flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500 dark:text-zinc-400" style={{ animationDelay: "180ms" }}>
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Payments are secured · you&apos;re only charged once your order is sourced.
      </p>
    </div>
  );
}
