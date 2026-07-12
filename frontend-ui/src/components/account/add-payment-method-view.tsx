"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { getPaymentBrand, type PaymentBrand } from "@/lib/payments/payment-methods";
import { addPaymentMethod } from "@/lib/auth/api";
import { tokenizeCard } from "@/lib/payments/gateway";

const FIELD =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-zinc-400";

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const groupBy4 = (digits: string) => digits.replace(/(.{4})(?=.)/g, "$1 ");

function BrandMark({ brand }: { brand: PaymentBrand }) {
  if (brand === "visa") {
    return <span className="text-lg font-black italic tracking-tight text-white/90">VISA</span>;
  }
  if (brand === "mastercard") {
    return (
      <span className="flex items-center">
        <span className="h-6 w-6 rounded-full bg-red-500/90" />
        <span className="-ml-2.5 h-6 w-6 rounded-full bg-amber-400/90 mix-blend-screen" />
      </span>
    );
  }
  return null;
}

export function AddPaymentMethodView({ brand }: { brand: PaymentBrand }) {
  const router = useRouter();
  const meta = getPaymentBrand(brand);
  const kind = meta.kind;

  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [phone, setPhone] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardDigits = onlyDigits(cardNumber);

  const valid = useMemo(() => {
    if (kind === "card") {
      return cardDigits.length >= 13 && holder.trim().length > 1 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3;
    }
    return onlyDigits(phone).length >= 9; // mobile money
  }, [kind, cardDigits, holder, expiry, cvv, phone]);

  function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
    setCardNumber(groupBy4(onlyDigits(e.target.value).slice(0, 16)));
    if (error) setError(null);
  }

  function handleExpiry(e: React.ChangeEvent<HTMLInputElement>) {
    const d = onlyDigits(e.target.value).slice(0, 4);
    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
    if (error) setError(null);
  }

  async function handleSave() {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // The method is stored on the ACCOUNT (backend) — masked detail + gateway
      // token only. Raw card numbers and CVVs never touch our systems.
      if (saveInfo) {
        if (kind === "card") {
          // Hand the card to the gateway for tokenization. The PAN + CVV go only
          // to the gateway and are never stored by us — we keep the token + last4.
          const t = await tokenizeCard({ number: cardNumber, cvv, expiry });
          await addPaymentMethod({
            brand,
            detail: `•••• ${t.last4}`,
            token: t.token,
            expMonth: t.expMonth,
            expYear: t.expYear,
          });
        } else {
          await addPaymentMethod({ brand, detail: `••• ${onlyDigits(phone).slice(-3)}` });
        }
      }
      // Defensive: drop the sensitive values from memory once tokenized.
      setCardNumber("");
      setCvv("");
      router.push("/account/payment-methods");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your payment method. Please try again.");
      setSubmitting(false);
    }
  }

  const previewNumber = cardDigits ? groupBy4(cardDigits.padEnd(16, "•")) : "•••• •••• •••• ••••";

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="reveal-up flex items-center gap-3">
        <Link
          href="/account/payment-methods"
          aria-label="Back to payment methods"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <div>
          <h1 className="text-xl font-black leading-none tracking-tight">Add {meta.label}</h1>
          <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">{meta.desc}</p>
        </div>
      </header>

      {/* Live card preview (card brands only) */}
      {kind === "card" ? (
        <div
          style={{ animationDelay: "60ms" }}
          className={`reveal-up relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-5 text-white shadow-lg shadow-indigo-900/25`}
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl transform-gpu" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">{meta.label} card</span>
              <span className="text-sm font-black tracking-tight">
                Luxe<span className="text-white/70">it</span>
              </span>
            </div>
            <div className="h-7 w-10 rounded-md bg-white/30 ring-1 ring-inset ring-white/30" />
            <p className="font-mono text-[1.05rem] tracking-[0.2em]">{previewNumber}</p>
            <div className="flex items-end justify-between">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-white/60">Card holder</p>
                <p className="max-w-[11rem] truncate text-sm font-semibold uppercase">{holder || "YOUR NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wide text-white/60">Expires</p>
                <p className="text-sm font-semibold">{expiry || "MM/YY"}</p>
              </div>
              <BrandMark brand={brand} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Form */}
      <section
        style={{ animationDelay: "120ms" }}
        className="reveal-up space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none"
      >
        {kind === "card" ? (
          <>
            <div>
              <label htmlFor="card-number" className={LABEL}>Card Number</label>
              <input id="card-number" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={handleCardNumber} placeholder="1234 5678 9000 0000" className={FIELD} />
            </div>
            <div>
              <label htmlFor="card-holder" className={LABEL}>Account Holder Name</label>
              <input id="card-holder" autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name on card" className={FIELD} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="card-expiry" className={LABEL}>Expiry Date</label>
                <input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={handleExpiry} placeholder="MM/YY" className={FIELD} />
              </div>
              <div>
                <label htmlFor="card-cvv" className={LABEL}>CVV</label>
                <input id="card-cvv" inputMode="numeric" autoComplete="cc-csc" value={cvv} onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))} placeholder="123" className={FIELD} />
              </div>
            </div>
          </>
        ) : null}

        {kind === "mobile" ? (
          <div>
            <label htmlFor="pay-phone" className={LABEL}>Mobile money number</label>
            <input id="pay-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 97 123 4567" className={FIELD} />
          </div>
        ) : null}

        {/* Save info toggle */}
        <button
          type="button"
          onClick={() => setSaveInfo((v) => !v)}
          className="flex w-full items-center gap-2.5 pt-1 text-left"
        >
          <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              saveInfo ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 dark:border-zinc-600"
            }`}
          >
            {saveInfo ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
          </span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-zinc-300">
            Save {kind === "card" ? "card" : "payment"} information
          </span>
        </button>

        {error ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!valid || submitting}
        style={{ animationDelay: "180ms" }}
        className="reveal-up inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {submitting ? "Saving…" : "Save"}
      </button>

      <p className="reveal-up flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500 dark:text-zinc-400" style={{ animationDelay: "220ms" }}>
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Your details are encrypted and stored securely.
      </p>
    </div>
  );
}
