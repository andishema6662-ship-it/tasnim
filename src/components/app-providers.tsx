"use client";

import type { ReactNode } from "react";
import { AdminAuthProvider } from "@/lib/admin-auth-context";
import { NewsroomProvider } from "@/lib/store";
import { Shell } from "./shell";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NewsroomProvider>
      <AdminAuthProvider>
        <Shell>{children}</Shell>
      </AdminAuthProvider>
    </NewsroomProvider>
  );
}
