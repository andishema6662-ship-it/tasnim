"use client";

import Link from "next/link";
import { AdminAffairsScreen, PayrollScreen } from "@/components/enterprise/enterprise-screens";
import { CartableScreen } from "@/components/editorial/cartable";
import { ReporterAgendaScreen } from "@/components/editorial/contacts-agenda-screens";
import { PitchesScreen } from "@/components/editorial/pitches-screen";
import { PersonProfileView } from "@/components/people/person-ui";
import { personForUser } from "@/lib/people";
import { useNewsroom } from "@/lib/store";
import { currentUser } from "@/lib/workflow";
import { ReporterPerformancePanel } from "./reporter-performance-panel";
import { ModulePage, Notice } from "../ui";

export function ReporterMyProfileScreen() {
  const { data } = useNewsroom();
  const user = currentUser(data);
  const person = user ? personForUser(data, user.id, user.name) : undefined;

  if (!person) {
    return (
      <ModulePage slug="my-profile">
        <Notice>پروفایل همکار رسانه‌ای برای کاربر فعلی پیدا نشد. از بخش همکاران رسانه‌ای یک رکورد با نام همین کاربر بسازید.</Notice>
        <Link href="/media/people" className="text-sm font-medium text-primary hover:underline">رفتن به همکاران رسانه‌ای</Link>
      </ModulePage>
    );
  }

  return (
    <ModulePage slug="my-profile">
      <PersonProfileView
        data={data}
        person={person}
        mode="admin"
        canEditAvatar={Boolean(user)}
        avatarUserId={user?.id}
      />
      {user ? <ReporterPerformancePanel data={data} user={user} /> : null}
    </ModulePage>
  );
}

export function ReporterMyNewsScreen() {
  return <CartableScreen lockAuthorToCurrentUser moduleSlug="my-news" />;
}

export function ReporterPayrollScreen() {
  return <PayrollScreen moduleSlug="my-payroll" />;
}

export function ReporterAdminAffairsScreen() {
  return <AdminAffairsScreen moduleSlug="my-admin-affairs" />;
}

export function ReporterMyPitchesScreen() {
  return <PitchesScreen moduleSlug="my-pitches" />;
}

export function ReporterMyAgendaScreen() {
  return <ReporterAgendaScreen moduleSlug="my-agenda" />;
}
