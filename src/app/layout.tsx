import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Shell } from "@/components/shell";
import { NewsroomProvider } from "@/lib/store";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "اتاق خبر",
  description: "پنل تحریریه برای تولید، ویرایش و انتشار خبر",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body>
        <NewsroomProvider>
          <Shell>{children}</Shell>
        </NewsroomProvider>
      </body>
    </html>
  );
}
