"use client";

import { useState } from "react";
import { uid } from "@/lib/id";
import { pinExpiryLabel } from "@/lib/reporter-workspace";
import { useNewsroom } from "@/lib/store";
import type { AnnouncementPriority, AnnouncementTarget, EditorialAnnouncement } from "@/lib/types";
import { canPerm, currentUser } from "@/lib/workflow";
import { faDate } from "@/lib/format";
import { PERSON_KINDS } from "@/lib/people";
import { Button, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

function pinUntilFromPreset(preset: string): string | null {
  if (preset === "forever") return null;
  const days = preset === "1d" ? 1 : preset === "3d" ? 3 : preset === "7d" ? 7 : 0;
  if (!days) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function AnnouncementsScreen() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const allowed = canPerm(data, "publish") || canPerm(data, "review");
  const [flash, setFlash] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [targetType, setTargetType] = useState<"all_reporters" | "editorial_group" | "user">("all_reporters");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetGroup, setTargetGroup] = useState("خبرنگار");
  const [pinPreset, setPinPreset] = useState("3d");
  const [pinCustom, setPinCustom] = useState("");

  const reporters = data.users.filter((u) => data.roles.find((r) => r.id === u.roleId)?.base === "reporter");

  function publish() {
    if (!allowed || !user || !title.trim() || !body.trim()) {
      setFlash("عنوان و متن پیام الزامی است.");
      return;
    }
    let target: AnnouncementTarget = { type: "all_reporters" };
    if (targetType === "user" && targetUserId) target = { type: "user", userId: targetUserId };
    if (targetType === "editorial_group") target = { type: "editorial_group", group: targetGroup };
    const pinnedUntil =
      pinPreset === "custom" && pinCustom
        ? new Date(pinCustom).toISOString()
        : pinUntilFromPreset(pinPreset);
    const roleBase = data.roles.find((r) => r.id === user.roleId)?.base;
    const announcement: EditorialAnnouncement = {
      id: uid("ann"),
      authorUserId: user.id,
      authorName: user.name,
      authorRole: roleBase === "publisher" ? "publisher" : "chief",
      title: title.trim(),
      body: body.trim(),
      priority,
      target,
      pinnedUntil,
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, editorialAnnouncements: [announcement, ...current.editorialAnnouncements] }));
    setTitle("");
    setBody("");
    setFlash("اطلاعیه سنجاق‌شده منتشر شد.");
  }

  return (
    <ModulePage slug="announcements">
      {!allowed ? <Notice>فقط مدیر مسئول و سردبیر می‌توانند اطلاعیه بفرستند.</Notice> : null}
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-2xl border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          publish();
        }}
        data-testid="announcement-form"
      >
        <Field label="عنوان">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={!allowed} />
        </Field>
        <Field label="متن پیام">
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} rows={4} disabled={!allowed} />
        </Field>
        <Field label="درجه اهمیت">
          <Select value={priority} onChange={(event) => setPriority(event.target.value as AnnouncementPriority)} disabled={!allowed}>
            <option value="normal">عادی</option>
            <option value="important">مهم</option>
            <option value="urgent">فوری</option>
          </Select>
        </Field>
        <Field label="مخاطب">
          <Select value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)} disabled={!allowed}>
            <option value="all_reporters">همه خبرنگاران</option>
            <option value="editorial_group">گروه تحریریه</option>
            <option value="user">یک خبرنگار مشخص</option>
          </Select>
        </Field>
        {targetType === "user" ? (
          <Field label="خبرنگار">
            <Select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} disabled={!allowed}>
              <option value="">انتخاب</option>
              {reporters.map((rep) => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        {targetType === "editorial_group" ? (
          <Field label="گروه">
            <Select value={targetGroup} onChange={(event) => setTargetGroup(event.target.value)} disabled={!allowed}>
              {PERSON_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="زمان سنجاق">
          <Select value={pinPreset} onChange={(event) => setPinPreset(event.target.value)} disabled={!allowed}>
            <option value="1d">۱ روز</option>
            <option value="3d">۳ روز</option>
            <option value="7d">۷ روز</option>
            <option value="forever">همیشگی</option>
            <option value="custom">تا تاریخ مشخص</option>
          </Select>
        </Field>
        {pinPreset === "custom" ? (
          <Field label="پایان سنجاق">
            <Input type="datetime-local" value={pinCustom} onChange={(event) => setPinCustom(event.target.value)} disabled={!allowed} />
          </Field>
        ) : null}
        <Button type="submit" disabled={!allowed} data-testid="announcement-publish">ارسال و سنجاق</Button>
      </form>
      <section className="mt-6 space-y-3">
        <h2 className="font-bold">اطلاعیه‌های اخیر</h2>
        {data.editorialAnnouncements.map((item) => (
          <article key={item.id} className="rounded-xl border border-line bg-paper p-4 text-sm" data-testid="announcement-item">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-bold">{item.title}</h3>
              <span className="text-xs text-muted">{item.priority} · {pinExpiryLabel(item.pinnedUntil)}</span>
            </div>
            <p className="mt-2 leading-7">{item.body}</p>
            <p className="mt-2 text-xs text-muted">{item.authorName} · {faDate(item.createdAt)}</p>
          </article>
        ))}
      </section>
    </ModulePage>
  );
}
