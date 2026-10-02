"use client";

import { Suspense } from "react";
import { ModuleScreen } from "@/components/registry";

export function ModuleRouteClient() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">در حال بارگذاری بخش…</p>}>
      <ModuleScreen />
    </Suspense>
  );
}
