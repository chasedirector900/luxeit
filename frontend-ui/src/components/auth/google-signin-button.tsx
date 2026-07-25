"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

// The public OAuth *web* client ID (safe to expose). Set NEXT_PUBLIC_GOOGLE_CLIENT_ID
// in Vercel + .env.local. When absent, the button renders nothing (email login only).
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = { credential?: string };

// Minimal shape of the bits of Google Identity Services we call.
type GoogleId = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleId;
  }
}

/**
 * "Continue with Google" — renders Google's official button (required by their
 * branding rules) and, on success, exchanges the returned ID token for a Luxeit
 * session. When it works, the auth status flips to "authenticated" and the
 * LoginView redirects, same as the OTP path.
 */
export function GoogleSignInButton() {
  const { googleLogin } = useAuth();
  const holderRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google || !holderRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: async (response) => {
          if (!response.credential) return;
          setError(null);
          try {
            await googleLogin(response.credential);
            // Success: auth status flips to authenticated → LoginView redirects.
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't sign in with Google.");
          }
        },
      });
      // Width must be a fixed pixel value; track the card width (Google caps at 400).
      const width = Math.min(holderRef.current.offsetWidth || 320, 400);
      window.google.accounts.id.renderButton(holderRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "center",
        width,
      });
    }

    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById("google-gsi-client") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
    };
  }, [googleLogin]);

  // No client ID configured → email-only, render nothing.
  if (!CLIENT_ID) return null;

  return (
    <div>
      {/* Google injects its button here. Centered to match the card. */}
      <div ref={holderRef} className="flex min-h-[44px] w-full justify-center [color-scheme:light]" />
      {error ? (
        <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-[12px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
