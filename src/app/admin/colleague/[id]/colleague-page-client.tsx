"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PersonProfileView } from "@/components/people/person-ui";
import { adminModulePath } from "@/lib/routes";
import { useNewsroom } from "@/lib/store";
import { canPerm, currentUser } from "@/lib/workflow";
import { Page } from "@/components/ui";

export default function AdminColleagueProfilePageClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, update } = useNewsroom();
  const person = data.people.find((item) => item.id === id);
  const canEditTier = canPerm(data, "review") || canPerm(data, "publish");
  const me = currentUser(data);
  const canEditAvatar = Boolean(me && person && person.userId === me.id);
  const peopleListHref = adminModulePath("media", "people");

  if (!person) {
    return (
      <Page title="پروفایل پیدا نشد" description="این شناسه در فهرست همکاران رسانه‌ای ثبت نشده است.">
        <Link href={peopleListHref} className="text-sm font-medium text-primary hover:underline">بازگشت به همکاران رسانه‌ای</Link>
      </Page>
    );
  }

  return (
    <Page eyebrow="همکاران رسانه‌ای" title={person.name} description={person.title}>
      <Link href={peopleListHref} className="mb-4 inline-block text-sm text-primary hover:underline">← فهرست همکاران</Link>
      <PersonProfileView
        data={data}
        person={person}
        mode="admin"
        canEditTier={canEditTier}
        canEditAvatar={canEditAvatar}
        avatarUserId={me?.id}
        onSaveTier={(tier, note) =>
          update((current) => ({
            ...current,
            people: current.people.map((item) =>
              item.id === person.id ? { ...item, reporterTier: tier, tierNote: note || undefined } : item,
            ),
          }))
        }
      />
    </Page>
  );
}
