"use client";

import { AdminAffairsScreen, PayrollScreen } from "@/components/enterprise/enterprise-screens";
import { CartableScreen } from "@/components/editorial/cartable";
import { ReporterAgendaScreen } from "@/components/editorial/contacts-agenda-screens";
import { PitchesScreen } from "@/components/editorial/pitches-screen";
import { MyProfileScreen } from "./my-profile-screen";

export function ReporterMyProfileScreen() {
  return <MyProfileScreen />;
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
