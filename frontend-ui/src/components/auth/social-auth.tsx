"use client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.8H12Z"
      />
      <path fill="#34A853" d="M2 12c0 2 0.8 3.8 2.1 5.2l3-2.3c-.8-.7-1.3-1.8-1.3-2.9s.5-2.2 1.3-2.9l-3-2.3A9.9 9.9 0 0 0 2 12Z" />
      <path fill="#4A90E2" d="M12 22c2.7 0 5-0.9 6.7-2.5l-3.1-2.5c-.8.6-2 1.1-3.6 1.1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3C5.6 19.8 8.6 22 12 22Z" />
      <path fill="#FBBC05" d="M6.9 14.3A6 6 0 0 1 6.3 12c0-.8.2-1.6.5-2.3l-3-2.3A10 10 0 0 0 2 12c0 1.6.4 3 1.2 4.3l3.7-2Z" />
    </svg>
  );
}

type SocialAuthProps = {
  onGoogle?: () => void;
};

const BUTTON =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] md:hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:md:hover:bg-zinc-800";

// Apple sign-in was removed for launch — Zambia has very low iOS share and it
// needs a paid Apple Developer account. Google is kept as the single social
// option; the handler is wired up once Google OAuth is configured.
export function SocialAuth({ onGoogle }: SocialAuthProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
      </div>

      <button type="button" onClick={onGoogle} className={BUTTON}>
        <GoogleMark />
        Google
      </button>
    </div>
  );
}
