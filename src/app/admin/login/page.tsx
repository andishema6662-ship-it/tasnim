"use client";

import { Suspense } from "react";
import { AdminLoginScreen } from "@/components/admin/admin-login-screen";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-sm text-muted">در حال بارگذاری…</p>}>
      <AdminLoginScreen />
    </Suspense>
  );
}
