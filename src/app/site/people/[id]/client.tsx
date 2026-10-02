"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PersonProfileView } from "@/components/people/person-ui";
import { PortalLayout } from "@/components/site/portal-layout";
import { useNewsroom } from "@/lib/store";

export function SitePersonProfileClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data } = useNewsroom();
  const person = data.people.find((item) => item.id === id && item.visible);

  if (!person) {
    return (
      <PortalLayout>
        <p className="text-center text-sm text-muted">پروفایل در دسترس نیست.</p>
        <Link href="/site/people" className="mt-4 block text-center text-sm text-[var(--portal-primary)]">بازگشت</Link>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <nav className="text-sm text-muted">
        <Link href="/site" className="hover:text-[var(--portal-primary)]">خانه</Link>
        <span className="mx-2">›</span>
        <Link href="/site/people" className="hover:text-[var(--portal-primary)]">همکاران رسانه‌ای</Link>
        <span className="mx-2">›</span>
        <span>{person.name}</span>
      </nav>
      <div className="mt-4">
        <PersonProfileView data={data} person={person} mode="portal" />
      </div>
    </PortalLayout>
  );
}
