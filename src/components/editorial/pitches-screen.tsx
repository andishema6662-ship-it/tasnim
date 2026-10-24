"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import {
  assigneeLabel,
  canManagePitches,
  pitchReportSummary,
  pitchStoryReport,
  pitchVisibleToUser,
  PITCH_PRIORITY_LABEL,
  PITCH_STATUS_LABEL,
  reporterUsers,
} from "@/lib/pitches";
import { useNewsroom } from "@/lib/store";
import { PITCH_CONTENT_LABELS } from "@/lib/pitch-content";
import type { NewsPitch, PitchAudience, PitchContentType, PitchPriority, PitchStatus } from "@/lib/types";
import { categoryName, currentRole, currentUser, statusLabel } from "@/lib/workflow";
import { Button, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

const emptyForm = (categoryId: string): Omit<NewsPitch, "id" | "createdAt" | "updatedAt" | "createdBy"> => ({
  title: "",
  topic: "",
  categoryId,
  description: "",
  audience: "all_reporters",
  assigneeUserId: "",
  deadline: "",
  priority: "normal",
  status: "active",
  contentType: "field-report",
});

export function PitchesScreen({ moduleSlug = "pitches" }: { moduleSlug?: string } = {}) {
  const path = usePathname();
  const mineOnly = moduleSlug === "my-pitches" || path.includes("/reporters/my-pitches");
  const { data, update } = useNewsroom();
  const role = currentRole(data);
  const user = currentUser(data);
  const manage = canManagePitches(data) && !mineOnly;
  const reporters = reporterUsers(data);
  const defaultCategory = data.categories[0]?.id ?? "";
  const [flash, setFlash] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyForm(defaultCategory));

  const visiblePitches = useMemo(() => {
    let list = data.pitches.filter((pitch) => pitchVisibleToUser(data, pitch));
    if (mineOnly && user) list = list.filter((pitch) => pitch.assigneeUserId === user.id);
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data, mineOnly, user]);

  function loadPitch(pitch: NewsPitch) {
    setEditingId(pitch.id);
    setForm({
      title: pitch.title,
      topic: pitch.topic,
      categoryId: pitch.categoryId,
      description: pitch.description,
      audience: pitch.audience,
      assigneeUserId: pitch.assigneeUserId ?? "",
      deadline: pitch.deadline?.slice(0, 10) ?? "",
      priority: pitch.priority,
      status: pitch.status,
      contentType: pitch.contentType ?? "field-report",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(defaultCategory));
  }

  function savePitch() {
    if (!manage) return;
    if (!form.title.trim()) {
      setFlash("عنوان سوژه را بنویسید.");
      return;
    }
    if (form.audience === "specific" && !form.assigneeUserId) {
      setFlash("برای مخاطب «یک خبرنگار»، نام خبرنگار را انتخاب کنید.");
      return;
    }
    const ts = new Date().toISOString();
    const payload: NewsPitch = {
      id: editingId ?? uid("pitch"),
      title: form.title.trim(),
      topic: form.topic.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
      audience: form.audience,
      assigneeUserId: form.audience === "specific" ? form.assigneeUserId : undefined,
      deadline: form.deadline ? new Date(`${form.deadline}T12:00:00`).toISOString() : undefined,
      priority: form.priority,
      status: form.status,
      contentType: form.contentType,
      createdBy: editingId ? data.pitches.find((item) => item.id === editingId)?.createdBy ?? user?.name ?? role.name : user?.name ?? role.name,
      createdAt: editingId ? data.pitches.find((item) => item.id === editingId)?.createdAt ?? ts : ts,
      updatedAt: ts,
    };
    update((current) => ({
      ...current,
      pitches: editingId
        ? current.pitches.map((item) => (item.id === editingId ? payload : item))
        : [payload, ...current.pitches],
    }));
    setFlash(editingId ? "سوژه به‌روز شد." : "سوژه تازه ثبت شد.");
    resetForm();
  }

  function removePitch(id: string) {
    if (!manage) return;
    update((current) => ({
      ...current,
      pitches: current.pitches.filter((item) => item.id !== id),
    }));
    if (editingId === id) resetForm();
    setFlash("سوژه حذف شد.");
  }

  return (
    <ModulePage slug={moduleSlug}>
      <Flash>{flash}</Flash>
      {!manage ? (
        <Notice>سوژه‌هایی که به شما یا به همه خبرنگاران خطاب شده‌اند اینجا دیده می‌شوند. برای ثبت خبر روی دکمه «ثبت خبر بر اساس این سوژه» بزنید.</Notice>
      ) : (
        <Notice>سردبیر و مدیر مسئول می‌توانند سوژه تعریف کنند، مخاطب مشخص کنند و از روی اخبار متصل گزارش بگیرند.</Notice>
      )}

      {manage ? (
        <form
          className="space-y-3 rounded-lg border border-line bg-sheet p-4"
          onSubmit={(event) => {
            event.preventDefault();
            savePitch();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">{editingId ? "ویرایش سوژه" : "سوژه خبری تازه"}</h2>
            {editingId ? (
              <button type="button" className="text-sm text-muted" onClick={resetForm}>
                انصراف از ویرایش
              </button>
            ) : null}
          </div>
          <Field label="عنوان سوژه">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="تیتر یا عنوان سوژه" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="موضوع">
              <Input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="مثلاً انرژی خورشیدی یزد" />
            </Field>
            <Field label="دسته‌بندی">
              <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="توضیحات / دستور کار">
            <TextArea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="زاویه، منابع پیشنهادی و نکات تحریریه" />
          </Field>
          <Field label="نوع محتوای درخواستی">
            <Select
              value={form.contentType ?? "field-report"}
              data-testid="pitch-content-type"
              onChange={(event) => setForm({ ...form, contentType: event.target.value as PitchContentType })}
            >
              {(Object.keys(PITCH_CONTENT_LABELS) as PitchContentType[]).map((key) => (
                <option key={key} value={key}>{PITCH_CONTENT_LABELS[key]}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="مخاطب سوژه">
              <Select
                value={form.audience}
                onChange={(event) => setForm({ ...form, audience: event.target.value as PitchAudience, assigneeUserId: "" })}
              >
                <option value="all_reporters">همه خبرنگاران</option>
                <option value="specific">یک خبرنگار مشخص</option>
              </Select>
            </Field>
            {form.audience === "specific" ? (
              <Field label="خبرنگار">
                <Select value={form.assigneeUserId} onChange={(event) => setForm({ ...form, assigneeUserId: event.target.value })}>
                  <option value="">انتخاب کنید</option>
                  {reporters.map((reporter) => (
                    <option key={reporter.id} value={reporter.id}>
                      {reporter.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="مهلت انجام">
                <Input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
              </Field>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {form.audience === "specific" ? (
              <Field label="مهلت انجام">
                <Input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
              </Field>
            ) : null}
            <Field label="اولویت">
              <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as PitchPriority })}>
                {(Object.keys(PITCH_PRIORITY_LABEL) as PitchPriority[]).map((key) => (
                  <option key={key} value={key}>
                    {PITCH_PRIORITY_LABEL[key]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="وضعیت سوژه">
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PitchStatus })}>
                {(Object.keys(PITCH_STATUS_LABEL) as PitchStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {PITCH_STATUS_LABEL[key]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit">{editingId ? "ذخیره تغییرات" : "ثبت سوژه"}</Button>
        </form>
      ) : null}

      <div className="space-y-4">
        {visiblePitches.length === 0 ? (
          <p className="text-sm text-muted">سوژه‌ای برای نمایش نیست.</p>
        ) : (
          visiblePitches.map((pitch) => {
            const report = pitchStoryReport(data, pitch.id);
            return (
              <article key={pitch.id} className="rounded-lg border border-line bg-sheet p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">
                      {PITCH_STATUS_LABEL[pitch.status]} · اولویت {PITCH_PRIORITY_LABEL[pitch.priority]} · {assigneeLabel(data, pitch)}
                    </p>
                    <h3 className="mt-1 text-lg font-bold leading-8">{pitch.title}</h3>
                    {pitch.topic ? <p className="text-sm text-rule">موضوع: {pitch.topic}</p> : null}
                    {pitch.contentType ? (
                      <p className="text-sm font-medium text-primary" data-testid="pitch-content-label">
                        نوع محتوا: {PITCH_CONTENT_LABELS[pitch.contentType]}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">
                      دسته {categoryName(data, pitch.categoryId)}
                      {pitch.deadline ? ` · مهلت ${new Date(pitch.deadline).toLocaleDateString("fa-IR")}` : ""}
                    </p>
                  </div>
                  {manage ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm" onClick={() => loadPitch(pitch)}>
                        ویرایش
                      </button>
                      <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm text-rule" onClick={() => removePitch(pitch.id)}>
                        حذف
                      </button>
                    </div>
                  ) : null}
                </div>
                {pitch.description ? <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">{pitch.description}</p> : null}
                <div className="mt-4 rounded-md bg-paper px-3 py-2 text-sm">
                  <p className="font-semibold">تعداد اخبار کار شده برای این سوژه: {faNum(report.total)}</p>
                  <p className="mt-1 text-muted">{pitchReportSummary(data, pitch.id)}</p>
                  {report.linked.length ? (
                    <ul className="mt-2 space-y-1">
                      {report.linked.map((story) => (
                        <li key={story.id}>
                          <Link href={`/admin/editorial/cartable/${story.id}`} className="text-rule hover:underline">
                            {story.title}
                          </Link>
                          <span className="text-muted"> — {statusLabel(data, story.status)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {pitch.status === "active" && role.base === "reporter" ? (
                  <Link
                    href={`/admin/editorial/cartable/new?pitch=${pitch.id}`}
                    className="mt-4 inline-block rounded-md bg-ink px-3 py-2 text-sm text-sheet"
                  >
                    ثبت خبر بر اساس این سوژه
                  </Link>
                ) : null}
                {manage && pitch.status === "active" ? (
                  <Link href={`/admin/editorial/cartable/new?pitch=${pitch.id}`} className="mt-4 ml-2 inline-block text-sm text-rule">
                    پیش‌نویس نمونه برای این سوژه
                  </Link>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </ModulePage>
  );
}
