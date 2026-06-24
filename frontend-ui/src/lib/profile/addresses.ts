// Saved delivery addresses (client-side, localStorage) — a multi-address book
// mirroring the payment-methods store. The single `profile.address` remains the
// "primary" address for the account page; this list lets checkout offer a choice
// and add new ones. Swap for a real API later — the shape stays the same.

import type { Address } from "@/lib/profile/profile-storage";

export type SavedAddress = Address & {
  id: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "luxeit:addresses:v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

export function writeAddresses(list: SavedAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore write errors (private mode, quota, etc.).
  }
}

function isMeaningful(addr: Address | null | undefined): addr is Address {
  return Boolean(addr && (addr.line1.trim() || addr.city.trim()));
}

function sameAddress(a: Address, b: Address): boolean {
  return a.line1.trim() === b.line1.trim() && a.city.trim() === b.city.trim() && a.area.trim() === b.area.trim();
}

/** Seed the book from the account's primary address the first time, so existing
 *  users immediately see their saved address as a selectable option. */
export function ensureSeeded(primary: Address | null | undefined): SavedAddress[] {
  const list = readAddresses();
  if (list.length > 0 || !isMeaningful(primary)) return list;
  const seeded: SavedAddress[] = [{ ...primary, id: newId(), isDefault: true }];
  writeAddresses(seeded);
  return seeded;
}

/** Add an address (de-duped). Returns the updated list and the saved entry. */
export function addAddress(addr: Address): { list: SavedAddress[]; saved: SavedAddress } {
  const list = readAddresses();
  const existing = list.find((a) => sameAddress(a, addr));
  if (existing) return { list, saved: existing };
  const saved: SavedAddress = { ...addr, id: newId(), isDefault: list.length === 0 };
  const next = [...list, saved];
  writeAddresses(next);
  return { list: next, saved };
}

export function setDefaultAddress(id: string): SavedAddress[] {
  const next = readAddresses().map((a) => ({ ...a, isDefault: a.id === id }));
  writeAddresses(next);
  return next;
}
