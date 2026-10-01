"use client";

import { useState } from "react";
import { JalaliDateTimePicker } from "@/components/jalali-datetime-picker";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { EditorialUpcomingEvent, UpcomingEventKind, UpcomingEventRange } from "@/lib/types";
import {
  canApproveUpcomingEvents,
  formatUpcomingEventWhen,
  initialEventStatus,
  pendingUpcomingEvents,
  UPCOMING_EVENT_KIND_LABELS,
  UPCOMING_EVENT_RANGE_LABELS,
  upcomingEventsForDashboard,
} from "@/lib/upcoming-events";
import { currentUser } from "@/lib/workflow";
import { Button, Field, Flash, Input, Select } from "../ui";

export function DashboardUpcomingEventsWidget() {
  const { data, update } = useNewsroom();
  const user = currentUser(data);
  const canApprove = canApproveUpcomingEvents(data);
  const [range, setRange] = useState<UpcomingEventRange>("week");
  const [flash, setFlash] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    kind: "press-brief" as UpcomingEventKind,
    organizer: "",
    place: "",
    startsAt: "",
  });

  const items = upcomingEventsForDashboard(data, range, 10);
  const pending = canApprove ? pendingUpcomingEvents(data) : [];

  function submitEvent() {
    if (!user || !form.title.trim() || !form.startsAt) {
      setFlash("عنوان و زمان رویداد الزامی است.");
      return;
    }
    const status = initialEventStatus(data);
    const event: EditorialUpcomingEvent = {
      id: uid("uev"),
      title: form.title.trim(),
      kind: form.kind,
      organizer: form.organizer.trim() || "—",
      place: form.place.trim() || "—",
      startsAt: form.startsAt,
      status,
      createdByUserId: user.id,
      createdByName: user.name,
      approvedByUserId: status === "approved" ? user.id : undefined,
      approvedAt: status === "approved" ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, upcomingEvents: [...(current.upcomingEvents ?? []), event] }));
    setForm({ title: "", kind: "press-brief", organizer: "", place: "", startsAt: "" });
    setFormOpen(false);
    setFlash(status === "approved" ? "رویداد در لیست رسمی ثبت شد." : "رویداد ثبت شد و در انتظار تأیید سردبیر است.");
  }

  function approveEvent(id: string) {
    if (!user || !canApprove) return;
    update((current) => ({
      ...current,
      upcomingEvents: (current.upcomingEvents ?? []).map((event) =>
        event.id === id
          ? { ...event, status: "approved", approvedByUserId: user.id, approvedAt: new Date().toISOString() }
          : event,
      ),
    }));
    setFlash("رویداد تأیید و به فهرست پیش‌رو اضافه شد.");
  }

  return (
    <section className="rounded-2xl border border-line bg-sheet p-5 shadow-sm" data-testid="dashboard-upcoming-events">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink">رویدادهای پیش‌رو</h2>
          <p className="mt-1 text-xs text-muted">نشست خبری، نمایشگاه، همایش و رویدادهای آتی تحریریه</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(UPCOMING_EVENT_RANGE_LABELS) as UpcomingEventRange[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${range === key ? "bg-primary text-white" : "bg-paper text-muted"}`}
              onClick={() => setRange(key)}
              data-testid={`upcoming-range-${key}`}
            >
              {UPCOMING_EVENT_RANGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      <Flash>{flash}</Flash>
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? <li className="text-sm text-muted">رویداد تأییدشده‌ای در این بازه نیست.</li> : null}
        {items.map((event) => (
          <li key={event.id} className="rounded-xl border border-line bg-paper px-4 py-3 text-sm" data-testid="upcoming-event-item">
            <p className="text-xs font-semibold text-primary">{UPCOMING_EVENT_KIND_LABELS[event.kind]}</p>
            <h3 className="mt-1 font-bold">{event.title}</h3>
            <p className="mt-1 text-muted">
              {formatUpcomingEventWhen(event.startsAt)} · {event.place}
            </p>
            <p className="text-xs text-muted">برگزارکننده: {event.organizer}</p>
          </li>
        ))}
      </ul>
      {user ? (
        <div className="mt-4 border-t border-line pt-4">
          <Button type="button" tone="ghost" className="text-sm" onClick={() => setFormOpen((v) => !v)} data-testid="upcoming-event-add-toggle">
            {formOpen ? "بستن فرم" : "ثبت رویداد جدید"}
          </Button>
          {formOpen ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="upcoming-event-form">
              <Field label="عنوان رویداد">
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </Field>
              <Field label="نوع رویداد">
                <Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as UpcomingEventKind })}>
                  {(Object.keys(UPCOMING_EVENT_KIND_LABELS) as UpcomingEventKind[]).map((key) => (
                    <option key={key} value={key}>{UPCOMING_EVENT_KIND_LABELS[key]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="برگزارکننده">
                <Input value={form.organizer} onChange={(event) => setForm({ ...form, organizer: event.target.value })} />
              </Field>
              <Field label="مکان">
                <Input value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <JalaliDateTimePicker label="تاریخ و ساعت (شمسی)" value={form.startsAt} onChange={(iso) => setForm({ ...form, startsAt: iso })} testId="upcoming-event-starts" />
              </div>
              <Button type="button" onClick={submitEvent} data-testid="upcoming-event-submit">ثبت رویداد</Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {pending.length > 0 && canApprove ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3" data-testid="upcoming-events-pending">
          <p className="text-sm font-bold text-amber-950">در انتظار تأیید سردبیر</p>
          <ul className="mt-2 space-y-2 text-sm">
            {pending.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2">
                <span>{event.title} — {event.createdByName}</span>
                <Button type="button" className="text-xs" onClick={() => approveEvent(event.id)} data-testid="upcoming-event-approve">
                  تأیید
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
