import type { Metadata } from "next";
import { ShamsehNotFoundScreen } from "@/components/not-found/shamseh-not-found-screen";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ShamsehNotFoundScreen />;
}
