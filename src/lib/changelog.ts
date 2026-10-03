/** نسخه فعلی سامانه شمسه (نمایش در فوتر و changelog) */
export const SYSTEM_VERSION = "2.4.0";

export const SYSTEM_PRODUCT_NAME = "سامانه جامع تحریریه خبر شمسه";

export const CHANGELOG_HREF = "/admin/infra/changelog";

export type ChangelogChangeKind = "new" | "updated" | "fixed";

export interface ChangelogChange {
  kind: ChangelogChangeKind;
  text: string;
}

export interface ChangelogRelease {
  releaseId?: string;
  version: string;
  releasedAt: string;
  /** برچسب تاریخ شمسی برای نمایش (مثلاً مهر ۱۴۰۵) */
  jalaliPeriod: string;
  summary?: string;
  changes: ChangelogChange[];
  /** نسخه‌های ثبت‌شده توسط سردبیر — قابل ویرایش و حذف */
  editable?: boolean;
}

export const CHANGELOG_KIND_LABEL: Record<ChangelogChangeKind, string> = {
  new: "جدید",
  updated: "به‌روزرسانی شد",
  fixed: "رفع شد",
};

export const PRODUCT_CHANGELOG: ChangelogRelease[] = [
  {
    version: "2.4.0",
    releasedAt: "2026-09-22T08:00:00Z",
    jalaliPeriod: "مهر ۱۴۰۵",
    summary: "قالب هگزا دش، پیام‌رسان تحریریه، نامه‌های اداری و مدیریت فایل.",
    changes: [
      { kind: "new", text: "مدیریت رمز کاربران در «مدیریت کاربران» و تغییر رمز شخصی در پروفایل" },
      { kind: "new", text: "ورود به پنل مدیریت با نام کاربری و رمز (هش SHA-256؛ محدودیت تلاش در مرورگر — احراز هویت سرور در نسخه‌های بعد)" },
      { kind: "new", text: "قالب پیشخوان و نمودارها بر اساس HexaDash" },
      { kind: "new", text: "گفتگو و پیام‌رسان تحریریه (جایگزین تیکتینگ)" },
      { kind: "new", text: "نامه‌های اداری و کارتابل امور اداری خبرنگاران" },
      { kind: "new", text: "مدیریت فایل با پوشه و سهمیه فضا" },
      { kind: "updated", text: "ماژول نقشه رویداد: انتخاب استان، جریان دو مرحله‌ای، چند مسیر و پیش‌نمایش متحرک" },
      { kind: "updated", text: "تقویم شمسی و انتخابگر تاریخ جلالی در فرم‌ها" },
      { kind: "fixed", text: "هم‌ترازی کارت‌های پیشخوان و اعلان‌های سنجاق‌شده" },
    ],
  },
  {
    version: "2.3.0",
    releasedAt: "2026-08-10T08:00:00Z",
    jalaliPeriod: "مرداد ۱۴۰۵",
    summary: "حق‌الزحمه، رتبه‌بندی خبرنگاران و رویدادهای پیش‌رو.",
    changes: [
      { kind: "new", text: "سیستم تعرفه و فیش حقوقی خبرنگاران با تأیید سردبیر" },
      { kind: "new", text: "رتبه‌بندی و کارنامه عملکرد خبرنگار (درجه ۱ تا ۳)" },
      { kind: "new", text: "ربات‌های انتشار در شبکه‌های اجتماعی (پیکربندی محلی)" },
      { kind: "new", text: "ویجت رویدادهای پیش‌رو در پیشخوان" },
      { kind: "updated", text: "گزارش عملکرد سوژه‌ها و دوره‌ای خبرنگاران" },
    ],
  },
  {
    version: "2.2.0",
    releasedAt: "2026-06-15T08:00:00Z",
    jalaliPeriod: "خرداد ۱۴۰۵",
    summary: "همکاران رسانه‌ای، تماس با ما و پرونده ویژه.",
    changes: [
      { kind: "new", text: "ماژول همکاران رسانه‌ای بر اساس قالب contact-2 / HexaDash" },
      { kind: "new", text: "فرم تماس با ما در سایت عمومی با کپچا" },
      { kind: "new", text: "پرونده‌های ویژه و صفحه عمومی پرونده" },
      { kind: "updated", text: "پروفایل همکار با کارت تماس و شبکه‌های اجتماعی" },
    ],
  },
  {
    version: "2.1.0",
    releasedAt: "2026-04-01T08:00:00Z",
    jalaliPeriod: "فروردین ۱۴۰۵",
    summary: "نقشه رویداد، کتابخانه رسانه و اسپلش شمسه.",
    changes: [
      { kind: "new", text: "نقشه رویداد و مسیر راهپیمایی با ابزارک embed" },
      { kind: "new", text: "کتابخانه رسانه و برش تصویر در ویرایشگر" },
      { kind: "new", text: "اسپلش اختصاصی شمسه هنگام ورود به پنل" },
      { kind: "fixed", text: "بهبود بارگذاری چندتایی آلبوم تصاویر" },
    ],
  },
  {
    version: "2.0.0",
    releasedAt: "2026-01-20T08:00:00Z",
    jalaliPeriod: "بهمن ۱۴۰۴",
    summary: "بازطراحی کامل پورتال و پیشخوان تحریریه.",
    changes: [
      { kind: "new", text: "بازطراحی قالب خبرگزاری اردیبهشت و پورتال عمومی" },
      { kind: "new", text: "ماژول سوژه‌های خبری و پیگیری مهلت" },
      { kind: "new", text: "پیشخوان تحریریه با KPI و میانبرهای میز" },
      { kind: "updated", text: "کارتابل و گردش کار سردبیری تا انتشار" },
    ],
  },
];

export function latestRelease(): ChangelogRelease {
  return PRODUCT_CHANGELOG[0];
}

export function versionDisplay(version: string): string {
  return version.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d);
}

export function seedChangelogReleases(): ChangelogRelease[] {
  return PRODUCT_CHANGELOG.map((release) => ({
    ...release,
    releaseId: `rel-${release.version}`,
    editable: false,
  }));
}

export function resolveProductChangelog(data: { productChangelog?: ChangelogRelease[] }): ChangelogRelease[] {
  if (data.productChangelog?.length) return data.productChangelog;
  return seedChangelogReleases();
}

export function resolveSystemVersion(data: { productChangelog?: ChangelogRelease[]; systemVersion?: string }): string {
  if (data.systemVersion) return data.systemVersion;
  return resolveProductChangelog(data)[0]?.version ?? SYSTEM_VERSION;
}

export function sortChangelogReleases(releases: ChangelogRelease[]): ChangelogRelease[] {
  return [...releases].sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
}
