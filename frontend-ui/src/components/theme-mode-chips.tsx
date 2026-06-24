"use client";

import { useEffect, useState } from "react";

type ThemeMode = "auto" | "light" | "dark";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "auto" ? prefersDark : mode === "dark";
  root.classList.remove("light", "dark");
  root.classList.add(isDark ? "dark" : "light");
  localStorage.setItem("theme", mode);
  window.dispatchEvent(new CustomEvent("luxeit-theme-change", { detail: { mode, isDark } }));
}

export function ThemeModeChips() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const nextMode: ThemeMode =
      saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
    setMode(nextMode);
    applyTheme(nextMode);
  }, []);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/70">
      {(["auto", "light", "dark"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => {
            setMode(item);
            applyTheme(item);
          }}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize leading-5 transition-colors ${
            mode === item
              ? "bg-slate-900 text-white dark:bg-white dark:text-black"
              : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
