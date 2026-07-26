"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, Mail, Pencil, RotateCcw, ShieldCheck } from "lucide-react";
import { LuxeitLogo } from "@/components/brand/luxeit-logo";
import { SocialAuth } from "@/components/auth/social-auth";
import { useAuth } from "@/hooks/use-auth";
import { US, ZA, ZM, KE, NG, GB } from "country-flag-icons/react/3x2";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NUMERIC_ONLY_REGEX = /\D/g;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

// Phone/SMS sign-in is off until an SMS gateway is paid for. Email login is free.
// Flip to true (and the backend PHONE_LOGIN_ENABLED) when SMS is ready.
const PHONE_LOGIN_ENABLED = false;

type CountryOption = {
  code: string;
  dialCode: string;
  label: string;
  Flag: React.ElementType;
  minLen: number;
  maxLen: number;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "ZM", dialCode: "+260", label: "Zambia", Flag: ZM, minLen: 9, maxLen: 9 },
  { code: "ZA", dialCode: "+27", label: "South Africa", Flag: ZA, minLen: 9, maxLen: 9 },
  { code: "KE", dialCode: "+254", label: "Kenya", Flag: KE, minLen: 9, maxLen: 9 },
  { code: "NG", dialCode: "+234", label: "Nigeria", Flag: NG, minLen: 10, maxLen: 11 },
  { code: "US", dialCode: "+1", label: "United States", Flag: US, minLen: 10, maxLen: 10 },
  { code: "GB", dialCode: "+44", label: "United Kingdom", Flag: GB, minLen: 10, maxLen: 10 },
];

const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-zinc-400";
const FIELD_WRAP =
  "flex h-12 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 transition-colors focus-within:border-gold-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-gold-500";

// ── 6-digit code input ──────────────────────────────────────────────────────
type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
};

function OtpInput({ value, onChange, onComplete, disabled }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Keep focus on the next empty box as the value fills/drains.
  useEffect(() => {
    const idx = Math.min(value.length, OTP_LENGTH - 1);
    inputs.current[idx]?.focus();
  }, [value]);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === OTP_LENGTH) onComplete(next);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(NUMERIC_ONLY_REGEX, "").slice(-1);
    if (!digit) return;
    if (index > value.length) return; // keep entry contiguous (left → right)
    commit((value.slice(0, index) + digit + value.slice(index + 1)).slice(0, OTP_LENGTH));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      commit(value.slice(0, -1));
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(NUMERIC_ONLY_REGEX, "").slice(0, OTP_LENGTH);
    if (pasted) commit(pasted);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-full rounded-xl border border-slate-200 bg-white text-center text-xl font-bold text-slate-900 outline-none transition-colors focus:border-gold-400 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-gold-500"
        />
      ))}
    </div>
  );
}

// ── Login / sign-up (passwordless OTP) ───────────────────────────────────────
export function LoginForm() {
  const { requestCode, verifyCode } = useAuth();

  const [step, setStep] = useState<"identify" | "verify">("identify");
  const [identifierMode, setIdentifierMode] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("ZM");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);

  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Guards against a double verify (auto-submit + button tap) consuming the code twice.
  const verifyingRef = useRef(false);

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode) || COUNTRY_OPTIONS[0],
    [selectedCountryCode],
  );
  const SelectedFlag = selectedCountry.Flag;

  // Resend cooldown timer.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const buildCredential = () =>
    identifierMode === "email" ? email.trim() : `${selectedCountry.dialCode}${phoneLocal}`;

  const phoneDisabled = identifierMode === "phone" && !PHONE_LOGIN_ENABLED;

  const validateIdentifier = (): string | null => {
    if (identifierMode === "email") {
      if (!email || !EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
    } else if (!PHONE_LOGIN_ENABLED) {
      return "Phone sign-in isn't available yet — please use your email.";
    } else if (!phoneLocal || phoneLocal.length < selectedCountry.minLen) {
      return `Phone number must be ${selectedCountry.minLen} digits.`;
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanNumbers = e.target.value.replace(NUMERIC_ONLY_REGEX, "");
    if (cleanNumbers.length <= selectedCountry.maxLen) {
      setPhoneLocal(cleanNumbers);
      if (error) setError(null);
    }
  };

  const sendCode = async () => {
    const validationError = validateIdentifier();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await requestCode(buildCredential());
      setDestination(result.destination);
      setCode("");
      setStep("verify");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleVerify = async (fullCode: string) => {
    if (verifyingRef.current) return; // ref guard: survives the same render tick
    verifyingRef.current = true;
    setError(null);
    setSubmitting(true);
    try {
      await verifyCode(buildCredential(), fullCode);
      // Success: auth status flips to "authenticated" → LoginView redirects.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
      setCode("");
      setSubmitting(false);
      verifyingRef.current = false;
    }
  };

  const submitVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code.");
      return;
    }
    void handleVerify(code);
  };

  const editIdentifier = () => {
    setStep("identify");
    setCode("");
    setError(null);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-12">
      {/* Exit without logging in / back a step */}
      {step === "identify" ? (
        <Link
          href="/"
          aria-label="Back to home"
          className="reveal-up absolute left-5 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={editIdentifier}
          aria-label="Go back"
          className="reveal-up absolute left-5 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
      )}

      {/* Brand + heading */}
      <div className="mb-7 text-center">
        <LuxeitLogo size={72} priority className="mx-auto rounded-2xl" />
        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
          {step === "identify" ? "Sign in or sign up" : "Enter your code"}
        </h1>
        <p className="mx-auto mt-1 max-w-[17rem] text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
          {step === "identify" ? (
            "Sign in with your email — we'll send a one-time code. No password needed."
          ) : (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{destination}</span>.
            </>
          )}
        </p>
      </div>

      {step === "identify" ? (
        <form
          onSubmit={submitIdentify}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none"
        >
          {/* Email / Phone segmented control — only shown once phone/SMS sign-in
              is live. While it's off, the page is email-only with no hint that
              phone is missing (flip PHONE_LOGIN_ENABLED to bring it back). */}
          {PHONE_LOGIN_ENABLED ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {(["email", "phone"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setIdentifierMode(mode);
                    setError(null);
                  }}
                  className={`relative h-9 rounded-lg text-xs font-bold capitalize transition-colors ${
                    identifierMode === mode
                      ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : null}

          {/* Email or phone */}
          <div>
            <label className={LABEL}>{identifierMode === "email" ? "Email address" : "Phone number"}</label>
            {phoneDisabled ? (
              <div className="rounded-xl border border-gold-500/30 bg-gold-500/[0.07] px-3.5 py-3 text-[12px] leading-relaxed text-gold-800 dark:border-gold-400/25 dark:text-gold-300">
                <span className="font-bold">Phone sign-in is coming soon.</span> We&apos;re setting up SMS
                delivery, which needs a paid SMS service. For now, please sign in with your{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifierMode("email");
                    setError(null);
                  }}
                  className="font-bold underline underline-offset-2"
                >
                  email
                </button>
                .
              </div>
            ) : identifierMode === "email" ? (
              <div className={FIELD_WRAP}>
                <Mail className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            ) : (
              <div className={`${FIELD_WRAP} gap-0 px-2`}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryPickerOpen((prev) => !prev)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-slate-700 transition-colors active:scale-95 dark:text-zinc-200"
                  >
                    <SelectedFlag className="h-3 w-[18px] shrink-0 rounded-[2px] object-cover" />
                    <span className="text-xs font-bold">{selectedCountry.dialCode}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                  </button>
                  {isCountryPickerOpen ? (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                      {COUNTRY_OPTIONS.map((c) => {
                        const Flag = c.Flag;
                        const active = c.code === selectedCountryCode;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountryCode(c.code);
                              setPhoneLocal("");
                              setError(null);
                              setIsCountryPickerOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                              active
                                ? "bg-gold-500/10 text-gold-600 dark:text-gold-300"
                                : "text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <Flag className="h-3.5 w-5 rounded-[2px]" />
                            <span className="font-medium">{c.label}</span>
                            <span className="ml-auto text-[11px] text-slate-400 dark:text-zinc-500">{c.dialCode}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <span className="mx-1 h-5 w-px shrink-0 bg-slate-200 dark:bg-zinc-800" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="977 123 456"
                  value={phoneLocal}
                  onChange={handlePhoneChange}
                  className="w-full bg-transparent px-1 text-sm font-medium tracking-wide text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            )}
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || phoneDisabled}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-500 text-sm font-bold text-ink shadow-md shadow-gold-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Sending code…" : "Send code"}
            {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>

          <p className="text-center text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            New to Luxeit? Just enter your details above — no separate sign-up, your
            account is created automatically.
          </p>

          <SocialAuth />
        </form>
      ) : (
        <form
          onSubmit={submitVerify}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none"
        >
          <div className="mb-1 flex justify-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-300">
              <ShieldCheck className="h-6 w-6" />
            </span>
          </div>

          <OtpInput value={code} onChange={setCode} onComplete={handleVerify} disabled={submitting} />

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || code.length !== OTP_LENGTH}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-500 text-sm font-bold text-ink shadow-md shadow-gold-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Verifying…" : "Verify & continue"}
          </button>

          <div className="flex items-center justify-between text-[12px]">
            <button
              type="button"
              onClick={editIdentifier}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-500 transition-colors active:text-slate-700 dark:text-zinc-400"
            >
              <Pencil className="h-3.5 w-3.5" />
              Change
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || submitting}
              onClick={() => void sendCode()}
              className="inline-flex items-center gap-1.5 font-semibold text-gold-600 transition-colors active:text-gold-500 disabled:text-slate-400 dark:text-gold-400 dark:disabled:text-zinc-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <p className="mt-5 text-center text-[11px] text-slate-400 dark:text-zinc-600">
        Secured by Luxeit · your details stay private
      </p>
    </div>
  );
}
