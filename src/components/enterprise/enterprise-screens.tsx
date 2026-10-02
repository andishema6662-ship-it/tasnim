"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { monthlyPayrollForAuthor } from "@/lib/payroll-calc";
import { findPayrollApproval, isPayrollApprovedForReporter, upsertPayrollApproval } from "@/lib/payroll-approval";
import {
  periodStart,
  producedStoriesForReporter,
  reporterPitchStats,
  storiesInPeriod,
  type PeriodKind,
} from "@/lib/reporter-analytics";
import { PayrollSlipView } from "@/components/payroll-slip";
import { DossierPosterField } from "@/components/structure/dossier-poster-field";
import { CoverThumb } from "@/components/cover-thumb";
import { REPORTER_GRADE_LABELS } from "@/lib/reporter-labels";
import { useNewsroom } from "@/lib/store";
import type { AdminLetterTemplate, SpecialDossier } from "@/lib/types";
import { currentRole, currentUser } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea } from "../ui";

export function PitchPerformanceScreen() {
  const { data } = useNewsroom();
  const rows = reporterPitchStats(data);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const modalStories = modalUserId ? producedStoriesForReporter(data, modalUserId) : [];

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
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="font-bold text-accent underline"
                    data-testid="pitch-produced-link"
                    onClick={() => setModalUserId(row.userId)}
                  >
                    {faNum(row.storiesProduced)}
                  </button>
                </td>
                <td className="px-3 py-2">{faNum(row.successRate)}٪</td>
                <td className="px-3 py-2">{faNum(row.onTimeRate)}٪</td>
                <td className="px-3 py-2">{faNum(row.lateCount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="pitch-stories-modal">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-sheet p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">اخبار تولیدی</h3>
              <Button type="button" tone="ghost" onClick={() => setModalUserId(null)}>بستن</Button>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {modalStories.length === 0 ? <li className="text-muted">خبری ثبت نشده است.</li> : null}
              {modalStories.map((story) => (
                <li key={story.id}>
                  <Link href={`/admin/editorial/cartable/${story.id}`} className="font-semibold text-accent hover:underline">
                    {story.title}
                  </Link>
                  <p className="text-xs text-muted">{story.status}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </ModulePage>
  );
}

export function PayrollScreen({ moduleSlug = "payroll" }: { moduleSlug?: string } = {}) {
  const { data, update } = useNewsroom();
  const role = currentRole(data);
  const me = currentUser(data);
  const reporterView = moduleSlug === "my-payroll";
  const canApprove = role.base === "chief" || role.base === "publisher";
  const reporters = data.users.filter((user) => data.roles.find((item) => item.id === user.roleId)?.base === "reporter");
  const now = new Date();
  const [author, setAuthor] = useState(reporters[0]?.name ?? "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [flash, setFlash] = useState("");
  const activeAuthor = reporterView ? me?.name ?? "" : author;
  const activeUser = reporterView ? me : reporters.find((user) => user.name === author);
  const payroll = activeAuthor ? monthlyPayrollForAuthor(data, activeAuthor, year, month) : null;
  const approval = activeUser ? findPayrollApproval(data, activeUser.id, year, month) : undefined;
  const approved = activeUser ? isPayrollApprovedForReporter(data, activeUser, year, month) : false;

  return (
    <ModulePage slug={moduleSlug}>
      <Notice>
        {reporterView
          ? "فقط فیش‌های تأییدشده توسط سردبیر در این صفحه نمایش داده می‌شوند. مبلغ هر خبر بر اساس درجه کیفیت (۱ تا ۳) محاسبه می‌شود."
          : "تعرفه‌ها و فیش بر اساس اخبار منتشرشده و درجه خبر در ماه انتخابی محاسبه می‌شود."}
      </Notice>
      <Flash>{flash}</Flash>
      <section className="rounded-lg border border-line bg-sheet p-4">
        <h2 className="font-bold">تعرفه بر اساس درجه خبر (تومان)</h2>
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
        {!reporterView ? (
          <Field label="خبرنگار">
            <Select value={author} onChange={(event) => setAuthor(event.target.value)}>
              {reporters.map((user) => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="خبرنگار">
            <Input value={activeAuthor} readOnly />
          </Field>
        )}
        <Field label="سال">
          <Input type="number" value={year} onChange={(event) => setYear(Number(event.target.value) || year)} />
        </Field>
        <Field label="ماه">
          <Input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(Number(event.target.value) || month)} />
        </Field>
      </div>
      {approval ? (
        <p className="mt-3 text-sm" data-testid="payroll-approval-status">
          وضعیت فیش: {approval.status === "approved" ? "تأیید شده توسط سردبیر" : "پیش‌نویس / در انتظار تأیید سردبیر"}
        </p>
      ) : null}
      {canApprove && !reporterView && activeUser ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="payroll-approve-btn"
            onClick={() => {
              update((current) => ({
                ...current,
                payrollApprovals: upsertPayrollApproval(current, activeUser.id, year, month, "approved", me?.id),
              }));
              setFlash("فیش حقوقی برای خبرنگار تأیید شد.");
            }}
          >
            تأیید فیش برای خبرنگار
          </Button>
        </div>
      ) : null}
      {payroll && (!reporterView || approved) ? (
        <div className="mt-4 space-y-3" data-testid="payroll-slip-view">
          <PayrollSlipView payroll={payroll} newsroomName={data.settings.newsroomName} />
          <Button type="button" onClick={() => { window.print(); setFlash("پنجره چاپ / PDF باز شد."); }}>چاپ یا ذخیره PDF</Button>
        </div>
      ) : reporterView && payroll && !approved ? (
        <div data-testid="payroll-pending-notice">
          <Empty>فیش این ماه هنوز توسط سردبیر تأیید نشده است.</Empty>
        </div>
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

export function AdminAffairsScreen({ moduleSlug = "admin-affairs" }: { moduleSlug?: string } = {}) {
  const { data, update } = useNewsroom();
  const [selectedUserId, setSelectedUserId] = useState(data.users[0]?.id ?? "");
  const [org, setOrg] = useState("سازمان نمونه");
  const [templateId, setTemplateId] = useState(data.adminTemplates[0]?.id ?? "");
  const [letterBody, setLetterBody] = useState("");
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplDraft, setTplDraft] = useState({ title: "", body: "" });
  const user = data.users.find((item) => item.id === selectedUserId);
  const template = data.adminTemplates.find((item) => item.id === templateId);
  const letterNumber = useMemo(() => {
    const seed = `${templateId}-${selectedUserId}-${letterBody.length}`;
    let n = 0;
    for (let i = 0; i < seed.length; i += 1) n = (n + seed.charCodeAt(i) * (i + 1)) % 1_000_000;
    return faNum(n).padStart(6, "0").slice(-6);
  }, [templateId, selectedUserId, letterBody.length]);

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
    <ModulePage slug={moduleSlug}>
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
          <Button type="button" onClick={() => setLetterBody(template ? renderTemplate(template) : "")}>تولید متن</Button>
          {letterBody ? (
            <>
              <Field label="ویرایش زنده متن نامه">
                <TextArea rows={8} value={letterBody} onChange={(event) => setLetterBody(event.target.value)} data-testid="admin-letter-editor" />
              </Field>
              <div
                className="mx-auto w-full max-w-[148mm] min-h-[210mm] rounded border-2 border-[#1a3a5f] bg-white p-8 text-sm leading-9 shadow-lg print:shadow-none"
                data-testid="admin-letter-output"
              >
                <header className="border-b-2 border-[#8e1e2d] pb-4 text-center">
                  <p className="text-xs text-muted">بسمه تعالی</p>
                  <p className="mt-2 text-lg font-black text-[#8e1e2d]">{data.settings.newsroomName}</p>
                  <p className="text-xs">معاونت روابط عمومی و امور اداری</p>
                </header>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span>تاریخ: {faDate(new Date().toISOString())}</span>
                  <span>شماره: ADM-{letterNumber}</span>
                </div>
                <div className="mt-6 whitespace-pre-wrap">{letterBody}</div>
                <div className="mt-10 flex justify-between text-xs text-muted">
                  <span>مهر و امضا</span>
                  <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed">QR</div>
                </div>
              </div>
              <Button type="button" tone="ghost" onClick={() => window.print()}>چاپ A5</Button>
            </>
          ) : null}
        </section>
        <section className="rounded-lg border border-line bg-sheet p-4">
          <h2 className="font-bold">آرشیو الگونامه</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.adminTemplates.map((item) => (
              <li key={item.id} className="rounded border border-line/70 px-3 py-2">
                {editingTplId === item.id ? (
                  <div className="space-y-2">
                    <Input value={tplDraft.title} onChange={(e) => setTplDraft({ ...tplDraft, title: e.target.value })} />
                    <TextArea rows={3} value={tplDraft.body} onChange={(e) => setTplDraft({ ...tplDraft, body: e.target.value })} />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          update((current) => ({
                            ...current,
                            adminTemplates: current.adminTemplates.map((row) =>
                              row.id === item.id ? { ...row, title: tplDraft.title.trim(), body: tplDraft.body.trim() } : row,
                            ),
                          }));
                          setEditingTplId(null);
                        }}
                      >
                        ذخیره الگو
                      </Button>
                      <Button type="button" tone="ghost" onClick={() => setEditingTplId(null)}>انصراف</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted">{item.kind}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        tone="ghost"
                        onClick={() => {
                          setEditingTplId(item.id);
                          setTplDraft({ title: item.title, body: item.body });
                        }}
                      >
                        ویرایش
                      </Button>
                      <Button
                        type="button"
                        tone="ghost"
                        onClick={() => update((current) => ({ ...current, adminTemplates: current.adminTemplates.filter((row) => row.id !== item.id) }))}
                      >
                        حذف
                      </Button>
                    </div>
                  </>
                )}
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
        <DossierPosterField poster={form.poster ?? "sand"} onPosterChange={(poster) => setForm({ ...form, poster })} testIdPrefix="dossier-create" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featuredOnHome ?? false} onChange={(event) => setForm({ ...form, featuredOnHome: event.target.checked })} />
          نمایش در صفحه اصلی سایت
        </label>
        <Button type="submit" data-testid="dossier-create-submit">ایجاد پرونده</Button>
      </form>
      <ul className="mt-6 space-y-3">
        {data.specialDossiers.map((item) => (
          <li key={item.id} className="rounded-lg border border-line bg-sheet p-4" data-testid="dossier-list-item">
            <div className="flex flex-wrap items-start gap-4">
              <CoverThumb cover={item.poster} className="h-24 w-36 shrink-0 rounded-lg border border-line" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-muted">{faNum(item.storyIds.length)} خبر · {item.featuredOnHome ? "صفحه اصلی" : "فقط صفحه پرونده"}</p>
                <DossierPosterField
                  poster={item.poster}
                  testIdPrefix={`dossier-${item.id}`}
                  onPosterChange={(poster) =>
                    update((current) => ({
                      ...current,
                      specialDossiers: current.specialDossiers.map((row) => (row.id === item.id ? { ...row, poster } : row)),
                    }))
                  }
                />
              </div>
              <Link href={`/dossier/${item.id}`} className="text-sm font-semibold text-accent" target="_blank" data-testid="dossier-site-link">
                مشاهده در سایت
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </ModulePage>
  );
}
