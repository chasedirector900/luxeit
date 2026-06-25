"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, CreditCard, MapPin, PackageCheck, Plane, Plus, Ship, Truck, Warehouse } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { createOrder } from "@/lib/auth/api";
import { formatKwacha } from "@/lib/currency";
import { WAREHOUSE_META } from "@/lib/products/warehouse";
import { DEFAULT_PROFILE, readProfile, writeProfile, type Profile } from "@/lib/profile/profile-storage";
import { addAddress, ensureSeeded, readAddresses, setDefaultAddress, type SavedAddress } from "@/lib/profile/addresses";
import { getPaymentBrand, readPaymentMethods, type PaymentMethod } from "@/lib/payments/payment-methods";
import type { CartItem, ShippingMethod } from "@/types/cart";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none";
const FIELD =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500";

function formatAddress(a: SavedAddress): string {
  return [a.line1, a.city, a.area].filter(Boolean).join(", ");
}

function ItemThumbs({ items }: { items: CartItem[] }) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="mt-3 flex items-center gap-2">
      {items.slice(0, 4).map((item) => (
        <div
          key={`${item.productId}-${item.variantId ?? "default"}`}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800"
        >
          <Image src={item.image} alt={item.title} fill sizes="44px" className="object-cover" />
        </div>
      ))}
      <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400">
        {count} {count === 1 ? "item" : "items"}
      </span>
    </div>
  );
}

// Unit price for the chosen carrier: China dual-shipping items re-price by
// carrier; everything else uses its stored price.
function unitPriceFor(item: CartItem, carrier: ShippingMethod): number {
  if (item.shippingPrices && (item.warehouse ?? "china") === "china") {
    return item.shippingPrices[carrier];
  }
  return item.price;
}

export function CheckoutClient() {
  const { items, cartCount, clearCart } = useCart();
  const { updateProfile } = useAuth();
  // Default to sea (the cheaper "From" price shown across the app).
  const [carrier, setCarrier] = useState<ShippingMethod>("sea");
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Saved address book + selection.
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);

  // Saved payment methods + selection.
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  useEffect(() => {
    const p = readProfile();
    setProfile(p);

    const book = ensureSeeded(p.address);
    setAddresses(book);
    setSelectedAddressId((book.find((a) => a.isDefault) ?? book[0])?.id ?? null);

    const saved = readPaymentMethods();
    setMethods(saved);
    setSelectedMethodId((saved.find((m) => m.isDefault) ?? saved[0])?.id ?? null);
  }, []);

  const { chinaItems, zambiaItems } = useMemo(() => {
    return {
      chinaItems: items.filter((item) => (item.warehouse ?? "china") === "china"),
      zambiaItems: items.filter((item) => item.warehouse === "zambia"),
    };
  }, [items]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const selectedMethod = methods.find((m) => m.id === selectedMethodId) ?? null;
  const hasAddress = Boolean(selectedAddress);
  const hasPayment = Boolean(selectedMethod);
  const canPlace = hasAddress && hasPayment;

  const isLusaka = (selectedAddress?.city ?? "").trim().toLowerCase().includes("lusaka");
  const zambiaEta = isLusaka ? "Within 24 hours" : "About 48 hours";
  const chinaEta = carrier === "air" ? "About 2 weeks (Air)" : "About 2 months (Sea)";

  // Carrier-aware order total — flipping Air/Sea re-prices the China items.
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + unitPriceFor(item, carrier) * item.quantity, 0),
    [items, carrier],
  );
  // Does switching carrier actually change anything? (Any dual-priced item.)
  const hasDualItems = useMemo(
    () => items.some((item) => item.shippingPrices && item.shippingPrices.air !== item.shippingPrices.sea),
    [items],
  );

  function persistPrimaryAddress(addr: { line1: string; city: string; area: string }) {
    // Mirror the chosen address to the account profile + backend so it's saved
    // server-side (the user record carries the primary delivery address).
    const next = { ...profile, address: { line1: addr.line1, city: addr.city, area: addr.area } };
    setProfile(next);
    writeProfile(next);
    void updateProfile({ address: next.address }).catch(() => {});
  }

  function handleSaveAddress(addr: { line1: string; city: string; area: string }) {
    const { list, saved } = addAddress(addr);
    setAddresses(list);
    setSelectedAddressId(saved.id);
    setAddressSheetOpen(false);
    persistPrimaryAddress(addr);
  }

  function chooseAddress(id: string) {
    setSelectedAddressId(id);
    setAddresses(setDefaultAddress(id));
    const chosen = addresses.find((a) => a.id === id);
    if (chosen) persistPrimaryAddress({ line1: chosen.line1, city: chosen.city, area: chosen.area });
  }

  async function placeOrder() {
    if (!canPlace || placing || !selectedAddress) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      await createOrder({
        items: items.map((it) => ({
          title: it.title,
          image: it.image,
          price: it.price,
          quantity: it.quantity,
          warehouse: it.warehouse,
          slug: it.slug,
        })),
        carrier: chinaItems.length > 0 ? carrier : undefined,
        address: { line1: selectedAddress.line1, city: selectedAddress.city, area: selectedAddress.area },
        payment: selectedMethod ? { brand: selectedMethod.brand, detail: selectedMethod.detail } : null,
      });
      clearCart();
      setPlaced(true);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Couldn't place your order. Try again.");
    } finally {
      setPlacing(false);
    }
  }

  // Success state
  if (placed) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-md flex-col items-center justify-center text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
          <PackageCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Order placed!</h1>
        <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
          Your order is now in the queue. We&apos;ll source it and keep you updated — shipping is already included.
        </p>
        <div className="mt-6 flex w-full max-w-[18rem] flex-col gap-2.5">
          <Link
            href="/account/orders/queue"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98]"
          >
            View my orders
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-5">
        <Header />
        <div className={`${CARD} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
            <Truck className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight">Nothing to check out</h2>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">Add items to your cart first.</p>
          <Link
            href="/explore"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-95"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <Header />

      {/* Deliver to — choose a saved address or add one */}
      <section style={{ animationDelay: "60ms" }} className={`reveal-up ${CARD} p-4`}>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Deliver to</h2>
          {addresses.length > 0 ? (
            <button
              type="button"
              onClick={() => setAddressSheetOpen(true)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add new
            </button>
          ) : null}
        </div>

        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((addr) => {
              const active = addr.id === selectedAddressId;
              return (
                <button
                  key={addr.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseAddress(addr.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-transform active:scale-[0.99] ${
                    active
                      ? "border-indigo-500/60 bg-indigo-500/10 dark:border-indigo-400/50 dark:bg-indigo-500/15"
                      : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                    <MapPin className="h-[17px] w-[17px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-zinc-100">{profile.fullName || "Delivery address"}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate-600 dark:text-zinc-300">{formatAddress(addr)}</span>
                    {profile.phone ? <span className="mt-0.5 block text-[12px] text-slate-500 dark:text-zinc-400">{profile.phone}</span> : null}
                  </span>
                  {active ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <button type="button" onClick={() => setAddressSheetOpen(true)} className="flex w-full items-center gap-3 text-left">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300">
              <MapPin className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Add a delivery address</p>
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">Required before placing your order</p>
            </div>
          </button>
        )}
      </section>

      {/* Payment method — choose a saved method or add one */}
      <section style={{ animationDelay: "100ms" }} className={`reveal-up ${CARD} p-4`}>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Payment method</h2>
          {methods.length > 0 ? (
            <Link href="/account/payment-methods" className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400">
              <Plus className="h-3.5 w-3.5" />
              Add new
            </Link>
          ) : null}
        </div>

        {methods.length > 0 ? (
          <div className="space-y-2">
            {methods.map((method) => {
              const meta = getPaymentBrand(method.brand);
              const Icon = meta.icon;
              const active = method.id === selectedMethodId;
              return (
                <button
                  key={method.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-transform active:scale-[0.99] ${
                    active
                      ? "border-indigo-500/60 bg-indigo-500/10 dark:border-indigo-400/50 dark:bg-indigo-500/15"
                      : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.ring}`}>
                    <Icon className={`h-[17px] w-[17px] ${meta.tint}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {meta.label}
                      {method.isDefault ? <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">Default</span> : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-slate-500 dark:text-zinc-400">{method.detail}</span>
                  </span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <Link href="/account/payment-methods" className="flex w-full items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300">
              <CreditCard className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Add a payment method</p>
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">Card or mobile money — required to pay</p>
            </div>
          </Link>
        )}
      </section>

      {/* Lusaka hub shipment */}
      {zambiaItems.length > 0 ? (
        <section style={{ animationDelay: "140ms" }} className={`reveal-up ${CARD} p-4`}>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${WAREHOUSE_META.zambia.badge}`}>
              <Warehouse className="h-3 w-3" />
              {WAREHOUSE_META.zambia.label} Hub
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Truck className="h-3.5 w-3.5" />
              {zambiaEta}
            </span>
          </div>
          <ItemThumbs items={zambiaItems} />
          <p className="mt-3 text-[12px] text-slate-500 dark:text-zinc-400">
            Stocked locally in Lusaka — no carrier needed. Delivery is included.
          </p>
        </section>
      ) : null}

      {/* China hub shipment — carrier choice */}
      {chinaItems.length > 0 ? (
        <section style={{ animationDelay: "180ms" }} className={`reveal-up ${CARD} p-4`}>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${WAREHOUSE_META.china.badge}`}>
              <Warehouse className="h-3 w-3" />
              {WAREHOUSE_META.china.label} Hub
            </span>
            <span className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400">{chinaEta}</span>
          </div>
          <ItemThumbs items={chinaItems} />

          {/* Carrier choice only when the cart has air-eligible items; otherwise
              these goods are sea-only and we say so. */}
          {hasDualItems ? (
            <>
              <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Carrier</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { key: "sea", label: "Sea", note: "~2 months · cheaper", icon: Ship },
                  { key: "air", label: "Air", note: "~2 weeks · faster", icon: Plane },
                ] as const).map(({ key, label, note, icon: Icon }) => {
                  const active = carrier === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCarrier(key)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-transform active:scale-[0.98] ${
                        active
                          ? "border-indigo-500/60 bg-indigo-500/10 dark:border-indigo-400/50 dark:bg-indigo-500/15"
                          : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-zinc-400"}`} />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-zinc-100"}`}>{label}</span>
                        <span className="block text-[11px] text-slate-500 dark:text-zinc-400">{note}</span>
                      </span>
                      {active ? <Check className="ml-auto h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
                Air applies only to air-eligible items — sea-only items always ship by sea.
              </p>
            </>
          ) : (
            <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-zinc-300">
              <Ship className="h-3.5 w-3.5" /> Sea freight · about 2 months
            </p>
          )}
        </section>
      ) : null}

      {/* Summary */}
      <section style={{ animationDelay: "240ms" }} className={`reveal-up ${CARD} p-4`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Items ({cartCount})</span>
          <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatKwacha(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Delivery ({carrier === "air" ? "Air" : "Sea"})</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included</span>
        </div>
        {hasDualItems ? (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
            China items are priced for {carrier === "air" ? "air (faster)" : "sea (cheaper)"} — switch the carrier above to compare.
          </p>
        ) : null}
        <div className="my-3 border-t border-slate-200 dark:border-zinc-800" />
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Total</span>
          <span className="text-2xl font-black leading-none text-slate-900 dark:text-zinc-100">{formatKwacha(subtotal)}</span>
        </div>
      </section>

      <div className="space-y-2">
        <button
          type="button"
          onClick={placeOrder}
          disabled={!canPlace || placing}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {placing ? "Placing order…" : `Place order · ${formatKwacha(subtotal)}`}
        </button>
        {placeError ? (
          <p className="text-center text-[12px] font-semibold text-rose-600 dark:text-rose-400">{placeError}</p>
        ) : !canPlace ? (
          <p className="text-center text-[12px] text-slate-500 dark:text-zinc-400">
            {!hasAddress ? "Add a delivery address to place your order." : "Add a payment method to place your order."}
          </p>
        ) : null}
      </div>

      <AddressSheet open={addressSheetOpen} onClose={() => setAddressSheetOpen(false)} onSave={handleSaveAddress} />
    </div>
  );
}

function AddressSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (addr: { line1: string; city: string; area: string }) => void;
}) {
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the sheet opens.
  useEffect(() => {
    if (open) {
      setLine1("");
      setCity("");
      setArea("");
      setError(null);
    }
  }, [open]);

  function submit() {
    if (!line1.trim() || !city.trim()) {
      setError("Street address and city are required.");
      return;
    }
    onSave({ line1: line1.trim(), city: city.trim(), area: area.trim() });
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Add delivery address">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md transform-gpu rounded-t-3xl border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <h2 className="mb-3 text-base font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Add delivery address</h2>
            <div className="space-y-3">
              <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Street address (e.g. Plot 123, Great East Rd)" className={FIELD} />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / town (e.g. Lusaka)" className={FIELD} />
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / suburb (optional)" className={FIELD} />
              {error ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={submit}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98]"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Header() {
  return (
    <header className="reveal-up flex items-center gap-3">
      <Link
        href="/cart"
        aria-label="Back to cart"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Link>
      <div>
        <h1 className="text-xl font-black leading-none tracking-tight">Checkout</h1>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Review delivery, payment & carrier</p>
      </div>
    </header>
  );
}
