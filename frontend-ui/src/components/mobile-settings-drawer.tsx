"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Globe, Languages, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type MobileSettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileSettingsDrawer({ open, onClose }: MobileSettingsDrawerProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch bugs
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Glass Layer Blur Overlay */}
          <motion.div
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm dark:bg-black/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Premium Bottom Sheet Drawer Dock */}
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[80] max-h-[85vh] rounded-t-[24px] border-t border-gold-200/70/80 bg-white/95 p-5 pb-8 shadow-2xl backdrop-blur-xl dark:border-gold-900/40/60 dark:bg-zinc-950/90 text-neutral-900 dark:text-white lg:hidden"
          >
            {/* Visual Pull Handle Indicator bar for native mobile feel */}
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />

            {/* Header Container Area */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gold-100/70 dark:border-zinc-900/60">
              <div className="flex flex-col">
                <h2 className="text-[15px] font-bold tracking-tight uppercase">Quick Settings</h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Configure app environment</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border border-gold-200/70 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-gold-900/40 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stack Settings Row Matrix */}
            <div className="mt-4 flex flex-col gap-1.5">
              {/* Option Row: Mode Shift Trigger */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gold-100/70 bg-slate-50/50 hover:bg-slate-100/60 dark:border-zinc-900/30 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 transition-all text-left group"
              >
                <span className="inline-flex items-center gap-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                      isDark ? "bg-gold-500/10 text-gold-400" : "bg-gold-500/10 text-gold-600"
                    }`}
                  >
                    {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Light Mode</span>
                </span>
                <span className="rounded-md border border-gold-200/70 bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 dark:border-gold-900/50 dark:bg-zinc-800 dark:text-zinc-300 uppercase">
                  {theme}
                </span>
              </button>

              {/* Option Row: Region Picker Slot */}
              <button className="flex w-full items-center justify-between p-3 rounded-xl border border-gold-100/70 bg-slate-50/50 hover:bg-slate-100/60 dark:border-zinc-900/30 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 transition-all text-left group">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Region</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                  Global
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Option Row: Language Selector */}
              <button className="flex w-full items-center justify-between p-3 rounded-xl border border-gold-100/70 bg-slate-50/50 hover:bg-slate-100/60 dark:border-zinc-900/30 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 transition-all text-left group">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400">
                    <Languages className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-200">Language</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                  🇬🇧 English
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
