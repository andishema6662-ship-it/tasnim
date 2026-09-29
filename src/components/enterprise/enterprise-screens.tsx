"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { monthlyPayrollForAuthor } from "@/lib/payroll-calc";
import {
  periodStart,
  reporterPitchStats,
  storiesInPeriod,
  type PeriodKind,
} from "@/lib/reporter-analytics";
import { REPORTER_GRADE_LABELS } from "@/lib/reporter-labels";
import { useNewsroom } from "@/lib/store";
import type { AdminLetterTemplate, EventMapPoint, SpecialDossier } from "@/lib/types";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

export function PitchPerformanceScreen() {
  const { data } = useNewsroom();
  const rows = reporterPitchStats(data);
  return (
    <ModulePage slug="pitch-performance">
      <Notice>آمار از سوژه‌های ثبت‌شده و اخبار متصل در همین مرورگر محاسبه می‌شود.</Notice>
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full min-w-[48rem] text-sm" data-testid="pitch-performance-table">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-right">خبرنگار</th>
              <th className="px-3 py-2 text-right">سوژه دریافتی</th>
              <th className="px-3 py-2 text-right">خبر تولیدی</th>
              <th className="px-3 py-2 text-right">درصد موفقیت</th>
              <th className="px-3 py-2 text-right">به‌موقع</th>
              <th className="px-3 py-2 text-right">تأخیر</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">{faNum(row.pitchesReceived)}</td>
                <td className="px-3 py-2">{faNum(row.storiesProduced)}</td>
                <td className="px-3 py-2">{faNum(row.successRate)}٪</td>
                <td className="px-3 py-2">{faNum(row.onTimeRate)}٪</td>
                <td className="px-3 py-2">{faNum(row.lateCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}

export function PayrollScreen() {
  const { data, update } = useNewsroom();
  const reporters = data.users.filter((user) => data.roles.find((role) => role.id === user.roleId)?.base === "reporter");
  const now = new Date();
  const [author, setAuthor] = useState(reporters[0]?.name ?? "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [flash, setFlash] = useState("");
  const payroll = author ? monthlyPayrollForAuthor(data, author, year, month) : null;

  return (
    <ModulePage slug="payroll">
      <Notice>تعرفه‌ها و فیش بر اساس اخبار منتشرشده در ماه انتخابی محاسبه می‌شود.</Notice>
      <Flash>{flash}</Flash>
      <section className="rounded-lg border border-line bg-sheet p-4">
        <h2 className="font-bold">تعرفه پایه (به ریال)</h2>
        <div className="mt-3 space-y-2">
          {(data.payrollRates ?? []).map((rate) => (
            <div key={rate.id} className="grid gap-2 sm:grid-cols-[1fr_8rem]">
              <span className="text-sm">{rate.label}</span>
              <Input
                type="number"
                value={rate.amount}
                onChange={(event) => {
                  const amount = Number(event.target.value) || 0;
                  update((current) => ({
                    ...current,
                    payrollRates: current.payrollRates.map((item) => (item.id === rate.id ? { ...item, amount } : item)),
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </section>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="خبرنگار">
          <Select value={author} onChange={(event) => setAuthor(event.target.value)}>
            {reporters.map((user) => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="سال">
          <Input type="number" value={year} onChange={(event) => setYear(Number(event.target.value) || year)} />
        </Field>
        <Field label="ماه">
          <Input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(Number(event.target.value) || month)} />
        </Field>
      </div>
      {payroll ? (
        <section className="mt-4 rounded-lg border border-line bg-sheet p-4" data-testid="payroll-slip">
          <h2 className="text-lg font-bold">پیش‌نمایش فیش — {payroll.monthLabel}</h2>
          <p className="text-sm text-muted">نام: {payroll.author}</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 text-right">عنوان خبر</th>
                <th className="py-2 text-right">نوع</th>
                <th className="py-2 text-right">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {payroll.lines.map((line) => (
                <tr key={line.storyId} className="border-b border-line/60">
                  <td className="py-2">{line.title}</td>
                  <td className="py-2">{line.label}</td>
                  <td className="py-2">{faNum(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between"><dt>جمع کارکرد</dt><dd>{faNum(payroll.gross)}</dd></div>
            <div className="flex justify-between"><dt>پاداش</dt><dd>{faNum(payroll.bonus)}</dd></div>
            <div className="flex justify-between"><dt>کسورات</dt><dd>{faNum(payroll.deduction)}</dd></div>
            <div className="flex justify-between font-bold"><dt>خالص</dt><dd>{faNum(payroll.net)}</dd></div>
          </dl>
          <Button type="button" className="mt-3" onClick={() => { window.print(); setFlash("پنجره چاپ باز شد."); }}>چاپ فیش</Button>
        </section>
      ) : (
        <Empty>خبرنگاری انتخاب نشده است.</Empty>
      )}
    </ModulePage>
  );
}

const PERIOD_LABELS: Record<PeriodKind, string> = {
  "30d": "۳۰ روز اخیر",
  quarter: "فصل اخیر",
  year: "۱۲ ماه اخیر",
};

export function ReporterPeriodScreen() {
  const { data } = useNewsroom();
  const reporters = data.users.filter((user) => data.roles.find((role) => role.id === user.roleId)?.base === "reporter");
  const [period, setPeriod] = useState<PeriodKind>("30d");
  const stats = useMemo(
    () =>
      reporters.map((user) => ({
        name: user.name,
        count: storiesInPeriod(data, user.name, period).length,
        views: storiesInPeriod(data, user.name, period).reduce((sum, story) => sum + story.views, 0),
      })),
    [data, reporters, period],
  );
  const maxCount = Math.max(1, ...stats.map((item) => item.count));

  return (
    <ModulePage slug="reporter-period">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodKind[]).map((key) => (
          <Button key={key} type="button" tone={period === key ? "primary" : "ghost"} onClick={() => setPeriod(key)}>
            {PERIOD_LABELS[key]}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted">از {faDate(periodStart(period).toISOString())} تا امروز</p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full text-sm" data-testid="reporter-period-table">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-3 py-2 text-right">خبرنگار</th>
              <th className="px-3 py-2 text-right">اخبار منتشرشده</th>
              <th className="px-3 py-2 text-right">بازدید</th>
              <th className="px-3 py-2 text-right">نمودار</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr key={row.name} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{faNum(row.count)}</td>
                <td className="px-3 py-2">{faNum(row.views)}</td>
                <td className="px-3 py-2">
                  <div className="h-3 rounded bg-sand">
                    <div className="h-3 rounded bg-accent" style={{ width: `${Math.round((row.count / maxCount) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}

export function AdminAffairsScreen() {
  const { data, update } = useNewsroom();
  const [selectedUserId, setSelectedUserId] = useState(data.users[0]?.id ?? "");
  const [org, setOrg] = useState("سازمان نمونه");
  const [templateId, setTemplateId] = useState(data.adminTemplates[0]?.id ?? "");
  const [output, setOutput] = useState("");
  const user = data.users.find((item) => item.id === selectedUserId);
  const template = data.adminTemplates.find((item) => item.id === templateId);

  function renderTemplate(tpl: AdminLetterTemplate) {
    if (!user) return "";
    const grade = user.reporterGrade ? REPORTER_GRADE_LABELS[user.reporterGrade] : "خبرنگار";
    return tpl.body
      .replace(/\{name\}/g, user.name)
      .replace(/\{grade\}/g, grade)
      .replace(/\{newsroom\}/g, data.settings.newsroomName)
      .replace(/\{organization\}/g, org)
      .replace(/\{period\}/g, "مهر ۱۴۰۵");
  }

  return (
    <ModulePage slug="admin-affairs">
      <Notice>خروجی‌ها برای چاپ محلی آماده می‌شوند؛ QR و تصویر در نسخه بعدی به پرونده کاربر وصل می‌شود.</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-sheet p-4 space-y-3">
          <h2 className="font-bold">صدور نامه و کارت</h2>
          <Field label="کاربر">
            <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              {data.users.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="دستگاه مقصد (معرفی‌نامه)">
            <Input value={org} onChange={(event) => setOrg(event.target.value)} />
          </Field>
          <Field label="الگو">
            <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {data.adminTemplates.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </Select>
          </Field>
          <Button type="button" onClick={() => setOutput(template ? renderTemplate(template) : "")}>تولید متن</Button>
          {output ? (
            <div className="rounded border border-line bg-paper p-4 text-sm leading-8 whitespace-pre-wrap" data-testid="admin-letter-output">
              <div className="mb-4 flex items-center gap-3 border-b border-line pb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded bg-sand text-xs">QR</div>
                <div>
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-xs text-muted">{data.settings.newsroomName}</p>
                </div>
              </div>
              {output}
            </div>
          ) : null}
        </section>
        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="font-bold">آرشیو الگونامه</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.adminTemplates.map((item) => (
              <li key={item.id} className="rounded border border-line/70 px-3 py-2">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted">{item.kind}</p>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const title = (event.currentTarget.elements.namedItem("tpl-title") as HTMLInputElement).value.trim();
              const body = (event.currentTarget.elements.namedItem("tpl-body") as HTMLTextAreaElement).value.trim();
              if (!title || !body) return;
              update((current) => ({
                ...current,
                adminTemplates: [...current.adminTemplates, { id: uid("adm"), title, body, kind: "letter" }],
              }));
              event.currentTarget.reset();
            }}
          >
            <Field label="عنوان الگوی تازه">
              <Input name="tpl-title" />
            </Field>
            <Field label="متن">
              <TextArea name="tpl-body" rows={4} />
            </Field>
            <Button type="submit">افزودن الگو</Button>
          </form>
        </section>
      </div>
    </ModulePage>
  );
}

export function DossiersScreen() {
  const { data, update } = useNewsroom();
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState<Partial<SpecialDossier>>({
    title: "",
    description: "",
    poster: "sand",
    tags: [],
    storyIds: [],
    featuredOnHome: true,
  });

  return (
    <ModulePage slug="dossiers">
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.title?.trim()) return;
          const dossier: SpecialDossier = {
            id: uid("dos"),
            title: form.title.trim(),
            description: form.description?.trim() ?? "",
            poster: form.poster ?? "sand",
            tags: (form.tags as string[]) ?? [],
            storyIds: form.storyIds ?? [],
            featuredOnHome: form.featuredOnHome ?? false,
          };
          update((current) => ({ ...current, specialDossiers: [dossier, ...current.specialDossiers] }));
          setFlash("پرونده ویژه ثبت شد.");
          setForm({ title: "", description: "", poster: "sand", tags: [], storyIds: [], featuredOnHome: true });
        }}
      >
        <Field label="عنوان پرونده">
          <Input value={form.title ?? ""} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="توضیحات">
          <TextArea rows={3} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Field label="برچسب‌ها (با ویرگول)">
          <Input
            value={(form.tags as string[])?.join("، ") ?? ""}
            onChange={(event) => setForm({ ...form, tags: event.target.value.split(/[،,]/).map((item) => item.trim()).filter(Boolean) })}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featuredOnHome ?? false} onChange={(event) => setForm({ ...form, featuredOnHome: event.target.checked })} />
          نمایش در صفحه اصلی سایت
        </label>
        <Button type="submit">ایجاد پرونده</Button>
      </form>
      <ul className="mt-6 space-y-3">
        {data.specialDossiers.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-sheet p-4">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-muted">{faNum(item.storyIds.length)} خبر · {item.featuredOnHome ? "صفحه اصلی" : "فقط صفحه پرونده"}</p>
            </div>
            <Link href={`/site/dossier/${item.id}`} className="text-sm font-semibold text-accent" target="_blank">مشاهده در سایت</Link>
          </li>
        ))}
      </ul>
    </ModulePage>
  );
}

export function EventMapScreen() {
  const { data, update } = useNewsroom();
  const [activeId, setActiveId] = useState(data.eventMaps[0]?.id ?? "");
  const project = data.eventMaps.find((item) => item.id === activeId) ?? data.eventMaps[0];
  const [flash, setFlash] = useState("");

  function addPoint() {
    if (!project) return;
    const point: EventMapPoint = { x: 50, y: 50, label: "نقطه تازه" };
    update((current) => ({
      ...current,
      eventMaps: current.eventMaps.map((item) => (item.id === project.id ? { ...item, points: [...item.points, point] } : item)),
    }));
  }

  return (
    <ModulePage slug="event-map">
      <Flash>{flash}</Flash>
      <Field label="پروژه نقشه">
        <Select value={activeId} onChange={(event) => setActiveId(event.target.value)}>
          {data.eventMaps.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </Select>
      </Field>
      {project ? (
        <>
          <div className="relative mt-4 h-72 overflow-hidden rounded-lg border border-line bg-gradient-to-br from-emerald-100 to-sky-100" data-testid="event-map-canvas">
            {project.points.map((point, index) => (
              <button
                key={`${point.x}-${point.y}-${index}`}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-2 py-1 text-xs text-sheet shadow"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={point.label}
              >
                {point.label}
              </button>
            ))}
          </div>
          <Button type="button" className="mt-2" onClick={addPoint}>افزودن ایستگاه</Button>
          <div className="mt-4">
            <Field label="کد درج در خبر">
              <TextArea readOnly rows={2} value={project.embedCode} data-testid="event-map-embed" />
            </Field>
          </div>
          <Button type="button" tone="ghost" onClick={() => { navigator.clipboard?.writeText(project.embedCode); setFlash("کد ابزارک کپی شد."); }}>
            کپی کد
          </Button>
        </>
      ) : (
        <Empty>پروژه‌ای تعریف نشده است.</Empty>
      )}
    </ModulePage>
  );
}
