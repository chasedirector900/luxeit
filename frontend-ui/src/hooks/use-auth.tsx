"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  deleteAccount as apiDeleteAccount,
  fetchMe,
  logout as apiLogout,
  requestCode as apiRequestCode,
  updateProfile as apiUpdateProfile,
  verifyCode as apiVerifyCode,
  type ApiUser,
  type RequestCodeResult,
} from "@/lib/auth/api";
// Per-user data (profile, addresses, payment methods, saved items) lives on
// the BACKEND only. The device keeps just the cart (by design) and theme.
// This purge runs on logout and on every fresh sign-in, so switching accounts
// on a shared phone can never show one person's data to the next.
const DEVICE_KEYS_TO_KEEP = new Set(["luxeit:cart:v1"]);

function purgePerUserStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("luxeit:") && !DEVICE_KEYS_TO_KEEP.has(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore storage errors (private mode, quota, ...)
  }
}

export type AuthUser = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  /** Contact/delivery number (unverified, editable on the profile). */
  contactPhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  address?: { line1: string; city: string; area: string } | null;
  /** ISO date the account was created — drives "Member since …". */
  joined?: string;
};
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// The proxy (middleware) checks the `luxeit_session` cookie to gate routes.
// That cookie is set httpOnly by Django and is the real source of truth; this
// guard is optimistic UX only. Older builds set a non-httpOnly mock cookie of
// the same name — we clear that here so a dead session can't pass the proxy.
const SESSION_COOKIE = "luxeit_session";

function hasClientReadableSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return new RegExp(`(?:^|; )${SESSION_COOKIE}=`).test(document.cookie);
}

function clearStaleSessionCookie() {
  if (typeof document === "undefined") return;
  // Only JS-set (non-httpOnly) cookies are reachable here — i.e. the legacy mock.
  if (hasClientReadableSessionCookie()) {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function toAuthUser(u: ApiUser): AuthUser {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    contactPhone: u.contact_phone ?? "",
    emailVerified: u.email_verified,
    phoneVerified: u.phone_verified,
    address: u.address ?? null,
    joined: u.date_joined,
  };
}

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  requestCode: (identifier: string) => Promise<RequestCodeResult>;
  verifyCode: (identifier: string, code: string) => Promise<AuthUser>;
  updateProfile: (data: {
    fullName?: string;
    contactPhone?: string;
    address?: { line1: string; city: string; area: string } | null;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applyUser = useCallback((u: ApiUser) => {
    setUser(toAuthUser(u));
    setStatus("authenticated");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const u = await fetchMe();
      if (u) {
        applyUser(u);
      } else {
        clearStaleSessionCookie();
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      // Network/backend error — treat as signed out for gating purposes.
      setUser(null);
      setStatus("unauthenticated");
    }
  }, [applyUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCode = useCallback((identifier: string) => apiRequestCode(identifier), []);

  const verifyCode = useCallback(
    async (identifier: string, code: string) => {
      const u = await apiVerifyCode(identifier, code);
      // Fresh sign-in on this device: drop anything a previous user left behind
      // BEFORE exposing the new session to the app.
      purgePerUserStorage();
      applyUser(u);
      return toAuthUser(u);
    },
    [applyUser],
  );

  const updateProfile = useCallback(
    async (data: { fullName?: string; contactPhone?: string; address?: { line1: string; city: string; area: string } | null }) => {
      const u = await apiUpdateProfile(data);
      applyUser(u);
      return toAuthUser(u);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Even if the network call fails, drop local state.
    }
    clearStaleSessionCookie();
    purgePerUserStorage(); // leave nothing personal behind on this device
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    clearStaleSessionCookie();
    // Wipe this device's local app data (profile, cart, saved, payments, ...).
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("luxeit:")) window.localStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      requestCode,
      verifyCode,
      updateProfile,
      logout,
      deleteAccount,
      refresh,
    }),
    [user, status, requestCode, verifyCode, updateProfile, logout, deleteAccount, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
