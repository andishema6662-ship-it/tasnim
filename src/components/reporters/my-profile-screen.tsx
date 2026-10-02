"use client";

import { PersonProfileView } from "@/components/people/person-ui";
import { applyPersonContact, ensurePersonForUser } from "@/lib/person-profile";
import { useNewsroom } from "@/lib/store";
import { currentRole, currentUser } from "@/lib/workflow";
import { ModulePage } from "../ui";
import { ChiefEditorialStatsPanel, PublisherOverviewPanel } from "./role-profile-stats";
import { ReporterPerformancePanel } from "./reporter-performance-panel";

export function MyProfileScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const role = currentRole(data);

  if (!user) {
    return (
      <ModulePage slug="my-profile">
        <p className="text-sm text-muted">کاربر فعال پیدا نشد.</p>
      </ModulePage>
    );
  }

  const person = ensurePersonForUser(data, user);
  const persisted = data.people.find((item) => item.userId === user.id || item.id === person.id) ?? person;

  return (
    <ModulePage slug="my-profile">
      <div data-testid="my-profile-page">
      <PersonProfileView
        data={data}
        person={persisted}
        mode="admin"
        roleBase={role.base}
        canEditAvatar
        avatarUserId={user.id}
        canEditContact
        onSaveContact={(patch) => update((current) => applyPersonContact(current, user, patch))}
      />
      {role.base === "chief" ? <ChiefEditorialStatsPanel data={data} user={user} /> : null}
      {role.base === "publisher" ? <PublisherOverviewPanel data={data} user={user} /> : null}
      {role.base === "reporter" ? <ReporterPerformancePanel data={data} user={user} /> : null}
      </div>
    </ModulePage>
  );
}
