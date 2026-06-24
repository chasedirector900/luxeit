"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readSaved, writeSaved, type SavedItem } from "@/lib/saved/saved-storage";

type SavedContextValue = {
  items: SavedItem[];
  savedCount: number;
  isSaved: (id: string) => boolean;
  toggleSaved: (item: SavedItem) => void;
  removeSaved: (id: string) => void;
  clearSaved: () => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readSaved().items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeSaved({ items });
  }, [hydrated, items]);

  const value = useMemo<SavedContextValue>(() => {
    const ids = new Set(items.map((item) => item.id));
    return {
      items,
      savedCount: items.length,
      isSaved: (id: string) => ids.has(id),
      toggleSaved: (item: SavedItem) =>
        setItems((prev) =>
          prev.some((entry) => entry.id === item.id)
            ? prev.filter((entry) => entry.id !== item.id)
            : [item, ...prev],
        ),
      removeSaved: (id: string) => setItems((prev) => prev.filter((entry) => entry.id !== id)),
      clearSaved: () => setItems([]),
    };
  }, [items]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used within SavedProvider");
  }
  return context;
}
