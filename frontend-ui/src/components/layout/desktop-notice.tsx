"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

// Flip this on (set NEXT_PUBLIC_DESKTOP_READY=true in Vercel) to retire the
// notice when the big-screen UI is finished — no code change needed.
const DESKTOP_READY = process.env.NEXT_PUBLIC_DESKTOP_READY === "true";
const DISMISS_KEY = "luxeit:desktop-preview";

// The "Continue to desktop preview" escape hatch only exists while developing
// locally (`npm run dev`). On the live site (production build) there's no way
// past the notice — big-screen visitors are asked to use their phone. Retire
// the whole notice by setting NEXT_PUBLIC_DESKTOP_READY=true when it's ready.
const ALLOW_PREVIEW = process.env.NODE_ENV !== "production";

/**
 * "Best on mobile for now" gate for tablets & desktops (md+).
 *
 * The desktop/tablet shell is still under development, so big-screen visitors
 * see this instead. It's dismissible ("Continue to desktop preview") — the
 * choice is remembered for the session — so the team can still work on and
 * preview the desktop UI. Hidden entirely on phones (CSS `md:flex`).
 */
export function DesktopNotice() {
  // When desktop is ready, start dismissed so nothing ever flashes.
  const [dismissed, setDismissed] = useState(DESKTOP_READY);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9998] hidden flex-col items-center justify-center bg-slate-50 px-8 text-center text-slate-900 md:flex dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-md">
        <p className="text-2xl font-black tracking-[0.35em]">
          LUXE<span className="text-amber-500">IT</span>
        </p>

        <span className="mx-auto mt-10 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/25">
          <Smartphone className="h-10 w-10" strokeWidth={1.75} />
        </span>

        <h1 className="mt-8 text-2xl font-black tracking-tight">Best experienced on your phone</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
          We&apos;re still polishing Luxeit for larger screens. For the full experience right now,
          please open it on your phone.
        </p>

        {ALLOW_PREVIEW ? (
          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.setItem(DISMISS_KEY, "1");
              } catch {
                // ignore storage errors
              }
              setDismissed(true);
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Continue to desktop preview →
          </button>
        ) : null}
      </div>
    </div>
  );
}
