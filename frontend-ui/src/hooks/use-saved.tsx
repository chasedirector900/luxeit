"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { listSaved, saveItem, unsaveItem } from "@/lib/auth/api";
import type { SavedItem } from "@/lib/saved/saved-storage";
import { useAuth } from "@/hooks/use-auth";

type SavedContextValue = {
  items: SavedItem[];
  savedCount: number;
  /** False when signed out — hearts are hidden and toggles are no-ops. */
  enabled: boolean;
  isSaved: (id: string) => boolean;
  toggleSaved: (item: SavedItem) => void;
  removeSaved: (id: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const enabled = status === "authenticated";

  // The wishlist lives on the ACCOUNT (backend), not on the device — it follows
  // the user across phones and can never leak to the next person to log in.
  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    let cancelled = false;
    listSaved()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const toggleSaved = useCallback(
    (item: SavedItem) => {
      if (!enabled) return;
      setItems((prev) => {
        const exists = prev.some((entry) => entry.id === item.id);
        // Optimistic flip; revert if the server disagrees.
        void (exists ? unsaveItem(item.slug) : saveItem(item.slug)).catch(() => {
          setItems((current) =>
            exists ? [item, ...current.filter((e) => e.id !== item.id)] : current.filter((e) => e.id !== item.id),
          );
        });
        return exists ? prev.filter((entry) => entry.id !== item.id) : [item, ...prev];
      });
    },
    [enabled],
  );

  const removeSaved = useCallback(
    (id: string) => {
      if (!enabled) return;
      setItems((prev) => {
        const entry = prev.find((e) => e.id === id);
        if (entry) void unsaveItem(entry.slug).catch(() => setItems((current) => [entry, ...current]));
        return prev.filter((e) => e.id !== id);
      });
    },
    [enabled],
  );

  const value = useMemo<SavedContextValue>(() => {
    const ids = new Set(items.map((item) => item.id));
    return {
      items,
      savedCount: items.length,
      enabled,
      isSaved: (id: string) => enabled && ids.has(id),
      toggleSaved,
      removeSaved,
    };
  }, [items, enabled, toggleSaved, removeSaved]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used within SavedProvider");
  }
  return context;
}
