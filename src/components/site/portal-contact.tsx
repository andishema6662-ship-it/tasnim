"use client";

import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { useNewsroom } from "@/lib/store";
import { PortalLayout } from "./portal-layout";

export function SiteContactView() {
  const { data } = useNewsroom();
  const page = data.contactPage;

  return (
    <PortalLayout>
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-[var(--portal-primary)]">خانه</Link>
        <span className="mx-2">›</span>
        <span>تماس با ما</span>
      </nav>
      <header className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-sm" data-testid="site-contact-intro">
        <h1 className="text-2xl font-black text-slate-800">تماس با ما</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{page.intro}</p>
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          <li>تلفن: {page.phones}</li>
          <li>آدرس: {page.address}</li>
          <li dir="ltr" className="text-right">ایمیل: {page.email}</li>
        </ul>
      </header>
      <div className="mt-6 max-w-xl">
        <ContactForm testId="site-contact-form" />
      </div>
    </PortalLayout>
  );
}
