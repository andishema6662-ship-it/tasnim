import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { SHAMSEH_APP_TITLE, SHAMSEH_TAGLINE } from "@/lib/branding";
import { Shell } from "@/components/shell";
import { NewsroomProvider } from "@/lib/store";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: {
    default: SHAMSEH_APP_TITLE,
    template: `%s · ${SHAMSEH_APP_TITLE}`,
  },
  description: `${SHAMSEH_APP_TITLE} — ${SHAMSEH_TAGLINE}`,
  applicationName: SHAMSEH_APP_TITLE,
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
