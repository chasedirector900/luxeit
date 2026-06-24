"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useAuth();

  const nextParam = params.get("next");
  // Only allow same-app relative redirects (avoid open-redirect to other sites).
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/account";

  // Declarative redirect: leave /login the moment we're authenticated — covers a
  // fresh login here AND an already-signed-in user landing on /login.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(next);
    }
  }, [status, next, router]);

  if (status === "authenticated") {
    return null; // redirecting away — don't flash the form
  }

  return <LoginForm />;
}
