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
  { brand: "visa", label: "Visa", desc: "Credit / debit card", kind: "card", icon: CreditCard, tint: "text-blue-600 dark:text-blue-400", ring: "bg-blue-500/10", gradient: "from-blue-600 to-gold-700" },
  { brand: "mastercard", label: "Mastercard", desc: "Credit / debit card", kind: "card", icon: CreditCard, tint: "text-orange-600 dark:text-orange-400", ring: "bg-orange-500/10", gradient: "from-orange-500 to-red-600" },
  { brand: "airtel", label: "Airtel Money", desc: "Mobile money", kind: "mobile", icon: Smartphone, tint: "text-red-600 dark:text-red-400", ring: "bg-red-500/10", gradient: "from-red-500 to-rose-600" },
  { brand: "mtn", label: "MTN MoMo", desc: "Mobile money", kind: "mobile", icon: Smartphone, tint: "text-gold-600 dark:text-gold-400", ring: "bg-gold-500/10", gradient: "from-gold-400 to-yellow-500" },
];

export function getPaymentBrand(brand: PaymentBrand): PaymentBrandMeta {
  return PAYMENT_BRANDS.find((entry) => entry.brand === brand) ?? PAYMENT_BRANDS[0];
}

// NOTE: saved payment methods live on the BACKEND per account (see
// /api/auth/payment-methods and lib/auth/api.ts) — masked detail + gateway
// token only, and never in device storage. This module now carries only the
// brand presentation metadata shared across screens.
