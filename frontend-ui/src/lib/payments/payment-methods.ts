import type { ComponentType } from "react";
import { CreditCard, Smartphone } from "lucide-react";

export type PaymentBrand = "visa" | "mastercard" | "airtel" | "mtn";
export type PaymentKind = "card" | "mobile";

export type PaymentBrandMeta = {
  brand: PaymentBrand;
  label: string;
  desc: string;
  kind: PaymentKind;
  icon: ComponentType<{ className?: string }>;
  tint: string;
  ring: string;
  /** Gradient used for the saved-method card. */
  gradient: string;
};

export const PAYMENT_BRANDS: PaymentBrandMeta[] = [
  { brand: "visa", label: "Visa", desc: "Credit / debit card", kind: "card", icon: CreditCard, tint: "text-blue-600 dark:text-blue-400", ring: "bg-blue-500/10", gradient: "from-blue-600 to-indigo-700" },
  { brand: "mastercard", label: "Mastercard", desc: "Credit / debit card", kind: "card", icon: CreditCard, tint: "text-orange-600 dark:text-orange-400", ring: "bg-orange-500/10", gradient: "from-orange-500 to-red-600" },
  { brand: "airtel", label: "Airtel Money", desc: "Mobile money", kind: "mobile", icon: Smartphone, tint: "text-red-600 dark:text-red-400", ring: "bg-red-500/10", gradient: "from-red-500 to-rose-600" },
  { brand: "mtn", label: "MTN MoMo", desc: "Mobile money", kind: "mobile", icon: Smartphone, tint: "text-amber-600 dark:text-amber-400", ring: "bg-amber-500/10", gradient: "from-amber-400 to-yellow-500" },
];

export function getPaymentBrand(brand: PaymentBrand): PaymentBrandMeta {
  return PAYMENT_BRANDS.find((entry) => entry.brand === brand) ?? PAYMENT_BRANDS[0];
}

export type PaymentMethod = {
  id: string;
  brand: PaymentBrand;
  label: string;
  /** Masked summary, e.g. "•••• 4242" or "••• 210". Safe to store. */
  detail: string;
  // Card-only, non-sensitive display metadata (safe to store).
  expMonth?: number;
  expYear?: number;
  // Opaque gateway vault token representing the saved instrument. The raw card
  // number and CVV are NEVER stored — only this token. (See lib/payments/gateway.)
  token?: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "luxeit:payments:v1";

export function readPaymentMethods(): PaymentMethod[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PaymentMethod[]) : [];
  } catch {
    return [];
  }
}

export function writePaymentMethods(methods: PaymentMethod[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
  } catch {
    // Ignore write errors.
  }
}
