"use client";

import { Suspense } from "react";
import { AdminLoginScreen } from "./admin-login-screen";

/** Shown instead of admin chrome when there is no valid session. */
export function AdminAuthFallback() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-sm text-muted">در حال بارگذاری…</p>}>
      <AdminLoginScreen />
    </Suspense>
  );
}
