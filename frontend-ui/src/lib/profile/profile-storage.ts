// Lightweight client-side profile persistence (localStorage), mirroring the
// cart-storage pattern. Swap for a real API later — the shape stays the same.

export type Address = {
  line1: string;
  city: string;
  area: string;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  address: Address | null;
};

export const DEFAULT_PROFILE: Profile = {
  fullName: "",
  email: "",
  phone: "",
  address: null,
};

const STORAGE_KEY = "luxeit:profile:v1";

export function readProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      address: parsed.address ?? null,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function writeProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore write errors (private mode, quota, etc.).
  }
}
