"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { readProfile, writeProfile } from "@/lib/profile/profile-storage";

export type AuthUser = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  address?: { line1: string; city: string; area: string } | null;
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
    emailVerified: u.email_verified,
    phoneVerified: u.phone_verified,
    address: u.address ?? null,
  };
}

// Seed the local profile (name/address store) with the verified contact so the
// account page reflects the real signed-in identity instead of placeholder data.
// The backend is authoritative for name/email/phone — prefer its values and only
// fall back to whatever this device had stored when the backend has none.
function syncProfileContact(u: ApiUser) {
  try {
    const current = readProfile();
    writeProfile({
      ...current,
      email: u.email ?? current.email,
      phone: u.phone ?? current.phone,
      fullName: u.full_name || current.fullName,
      // Backend address is authoritative; keep any local address only if the
      // backend has none stored yet.
      address: u.address ?? current.address,
    });
  } catch {
    // ignore storage errors
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  requestCode: (identifier: string) => Promise<RequestCodeResult>;
  verifyCode: (identifier: string, code: string) => Promise<AuthUser>;
  updateProfile: (data: {
    fullName?: string;
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
    syncProfileContact(u);
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

  // Heal accounts whose name was only ever saved on this device (older builds, or
  // a save that silently failed): if the backend has no name but localStorage
  // does, push it up once so the backend becomes the source of truth.
  const backfilledName = useRef(false);
  useEffect(() => {
    if (status !== "authenticated" || !user || backfilledName.current) return;
    if (user.fullName.trim()) return; // backend already has a name
    let stored = "";
    try {
      stored = readProfile().fullName.trim();
    } catch {
      stored = "";
    }
    if (!stored) return;
    backfilledName.current = true;
    apiUpdateProfile({ fullName: stored })
      .then(applyUser)
      .catch(() => {
        backfilledName.current = false; // allow another attempt next load
      });
  }, [status, user, applyUser]);

  const requestCode = useCallback((identifier: string) => apiRequestCode(identifier), []);

  const verifyCode = useCallback(
    async (identifier: string, code: string) => {
      const u = await apiVerifyCode(identifier, code);
      applyUser(u);
      return toAuthUser(u);
    },
    [applyUser],
  );

  const updateProfile = useCallback(
    async (data: { fullName?: string; address?: { line1: string; city: string; area: string } | null }) => {
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
