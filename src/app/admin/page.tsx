"use client";

import { Dashboard } from "@/components/dashboard";
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function AdminDashboardPage() {
  const { authenticated, ready } = useAdminAuth();
  if (!ready || !authenticated) return null;
  return <Dashboard />;
}
