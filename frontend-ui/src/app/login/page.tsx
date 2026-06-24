import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-zinc-100">
      <Suspense fallback={null}>
        <LoginView />
      </Suspense>
    </main>
  );
}
