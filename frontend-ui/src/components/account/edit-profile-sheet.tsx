"use client";

import { BadgeCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "@/lib/profile/profile-storage";

type EditProfileSheetProps = {
  open: boolean;
  /** "profile" edits name/email/phone; "address" edits the delivery address. */
  mode: "profile" | "address";
  profile: Profile;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
};

const FIELD_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500";
const LABEL_TEXT = "text-[12px] font-semibold text-slate-600 dark:text-zinc-400";
const LABEL_CLASS = `mb-1.5 block ${LABEL_TEXT}`;

function VerifiedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

function RecommendedPill() {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
      Recommended
    </span>
  );
}

export function EditProfileSheet({
  open,
  mode,
  profile,
  emailVerified = false,
  phoneVerified = false,
  onClose,
  onSave,
}: EditProfileSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [line1, setLine1] = useState(profile.address?.line1 ?? "");
  const [city, setCity] = useState(profile.address?.city ?? "");
  const [area, setArea] = useState(profile.address?.area ?? "");

  useEffect(() => setMounted(true), []);

  // Re-seed the form from the current profile each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setLine1(profile.address?.line1 ?? "");
    setCity(profile.address?.city ?? "");
    setArea(profile.address?.area ?? "");
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function handleSave() {
    const trimmedLine1 = line1.trim();
    const trimmedCity = city.trim();
    const trimmedArea = area.trim();
    const hasAddress = Boolean(trimmedLine1 || trimmedCity || trimmedArea);

    onSave({
      fullName: fullName.trim() || profile.fullName,
      email: email.trim(),
      phone: phone.trim(),
      address: hasAddress ? { line1: trimmedLine1, city: trimmedCity, area: trimmedArea } : null,
    });
  }

  // Keep the "Verified" badge only while the field still matches the value the
  // backend verified — editing it to something new clears the badge.
  const emailStillVerified = emailVerified && email.trim().toLowerCase() === profile.email.trim().toLowerCase();
  const phoneStillVerified = phoneVerified && phone.trim() === profile.phone.trim();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={mode === "address" ? "Edit delivery address" : "Edit profile"}>
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] w-full max-w-md transform-gpu flex-col rounded-t-3xl border-t border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="shrink-0 px-5 pt-3">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
                  {mode === "address" ? "Delivery address" : "Edit profile"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:text-zinc-400"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-2">
              {mode === "profile" ? (
                <>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="profile-name" className={LABEL_TEXT}>Full name</label>
                      {!fullName.trim() ? <RecommendedPill /> : null}
                    </div>
                    <input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className={FIELD_CLASS} />
                    {!fullName.trim() ? (
                      <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                        Add your name so we can personalize your orders and delivery.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="profile-email" className={LABEL_TEXT}>Email</label>
                      {emailStillVerified ? <VerifiedPill /> : null}
                    </div>
                    <input id="profile-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" className={FIELD_CLASS} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="profile-phone" className={LABEL_TEXT}>Phone (for delivery)</label>
                      {phoneStillVerified ? <VerifiedPill /> : null}
                    </div>
                    <input id="profile-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 97 123 4567" className={FIELD_CLASS} />
                    <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                      So couriers can reach you about your orders. Include the country code, e.g. +260.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="addr-line1" className={LABEL_CLASS}>Street / area</label>
                    <input id="addr-line1" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House no, street, township" className={FIELD_CLASS} />
                  </div>
                  <div>
                    <label htmlFor="addr-city" className={LABEL_CLASS}>City / town</label>
                    <input id="addr-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lusaka" className={FIELD_CLASS} />
                  </div>
                  <div>
                    <label htmlFor="addr-area" className={LABEL_CLASS}>Province / region</label>
                    <input id="addr-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lusaka Province" className={FIELD_CLASS} />
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:border-zinc-800">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98]"
              >
                Save changes
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
