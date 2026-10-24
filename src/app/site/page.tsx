"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy bookmark: /site → public home */
export default function LegacySiteRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <p className="p-6 text-center text-sm text-muted">در حال انتقال به صفحه اصلی…</p>;
}
