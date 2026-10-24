import type { Metadata } from "next";
import { ADMIN_PRELOAD_GATE_SCRIPT } from "@/lib/admin-preload-gate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_PRELOAD_GATE_SCRIPT }} />
      {children}
    </>
  );
}
