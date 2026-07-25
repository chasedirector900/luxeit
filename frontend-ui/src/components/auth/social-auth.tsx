"use client";

import { GoogleSignInButton } from "@/components/auth/google-signin-button";

// Apple sign-in was removed for launch (very low iOS share in Zambia, needs a
// paid Apple Developer account). Google is the sole social option, rendered by
// Google Identity Services. If NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't set, the
// Google button renders nothing and this section hides itself entirely.
export function SocialAuth() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
      </div>

      <GoogleSignInButton />
    </div>
  );
}
