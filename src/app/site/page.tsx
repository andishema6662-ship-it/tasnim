"use client";

import { Suspense } from "react";
import { SiteHomeView } from "@/components/site/site-views";

export default function PublicSitePage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-sm">در حال بارگذاری سایت…</p>}>
      <SiteHomeView />
    </Suspense>
  );
}
