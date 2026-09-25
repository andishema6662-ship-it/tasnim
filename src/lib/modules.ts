export type GroupId = "core" | "editorial" | "media" | "audience" | "reports" | "structure";

export interface GroupInfo {
  id: GroupId;
  title: string;
  priority: "deep" | "light";
}

export interface ModuleInfo {
  group: GroupId;
  slug: string;
  title: string;
  description: string;
}

export const groups: GroupInfo[] = [
  { id: "core", title: "هسته مدیریتی و زیرساخت", priority: "light" },
  { id: "editorial", title: "تحریریه و تولید محتوا", priority: "deep" },
  { id: "media", title: "رسانه‌های مکمل و چندکاناله", priority: "deep" },
  { id: "audience", title: "تعامل با مخاطب و ارتباطات", priority: "light" },
  { id: "reports", title: "تحلیل، گزارش و پایش", priority: "light" },
  { id: "structure", title: "ساختاردهی و انتشار محتوا", priority: "deep" },
];

export const modules: ModuleInfo[] = [
  { group: "core", slug: "system", title: "اطلاعات سیستم", description: "وضعیت همین نسخه و داده ذخیره‌شده در مرورگر." },
  { group: "core", slug: "users", title: "مدیریت کاربران", description: "تعریف کاربران تحریریه و نسبت دادنشان به نقش." },
  { group: "core", slug: "access", title: "کنترل دسترسی محتوا", description: "ویرایش و انتشار هر دسته برای هر نقش." },
  { group: "core", slug: "settings", title: "تنظیمات سیستم", description: "نام اتاق خبر و اندازه فهرست‌ها." },
  { group: "core", slug: "monitoring", title: "مانیتورینگ سرور", description: "سنجه‌های محیط محلی مرورگر، نه یک سرور سازمانی." },
  { group: "core", slug: "backup", title: "مدیریت بک‌آپ", description: "خروجی، ورودی و بازگردانی داده محلی." },
  { group: "core", slug: "tickets", title: "تیکتینگ", description: "درخواست‌های داخلی تحریریه و تغییر وضعیتشان." },
  { group: "core", slug: "comms", title: "میز ارتباطات ویژه", description: "پیام‌های داخلی بین اعضای تحریریه." },
  { group: "core", slug: "subsites", title: "زیرسایت نامحدود", description: "ثبت رکورد زیرسایت. از اینجا سایتی منتشر نمی‌شود." },
  { group: "core", slug: "links", title: "مدیریت پیوندها", description: "پیوندهای ثابت پاصفحه و ستون کناری." },
  { group: "core", slug: "logos", title: "مدیریت لوگوها", description: "نسخه‌های نشانه برای کاربردهای مختلف." },
  { group: "core", slug: "forms", title: "مدیریت فرم‌ها", description: "فرم‌های تماس و عضویت و فیلدهایشان." },
  { group: "core", slug: "menus", title: "مدیریت منوها", description: "چینش منوی اصلی سایت." },
  { group: "core", slug: "roles", title: "نقش‌ها و دسترسی", description: "سطح دسترسی مدیر مسئول، سردبیر، خبرنگار و نقش‌های تازه." },
  { group: "core", slug: "portal", title: "اتصال به پورتال", description: "نگهداری مشخصات اتصال. از این پنل تماسی با پورتال برقرار نمی‌شود." },
  { group: "editorial", slug: "ai", title: "تحریریه هوشمند", description: "دستیار محلی برای پیش‌نویس، عنوان، خلاصه، برچسب، تصویر و صوت." },
  { group: "editorial", slug: "cartable", title: "کارتابل و سردبیری", description: "فهرست خبر، ویرایش و صف تأیید تا انتشار." },
  { group: "editorial", slug: "process", title: "فرایندساز خبر", description: "گام‌ها و گذارهای گردش کار و نقش مسئول هر گذار." },
  { group: "editorial", slug: "submissions", title: "مدیریت ارسال خبر", description: "ارسال خبر به دبیر و پذیرش یا رد آن در کارتابل." },
  { group: "editorial", slug: "order", title: "ترتیب اخبار", description: "چیدمان اخبار منتشرشده؛ ردیف اول تیتر یک است." },
  { group: "editorial", slug: "suggestions", title: "اخبار پیشنهادی", description: "پیشنهاد خبر منتشرشده برای سرویس دیگر." },
  { group: "media", slug: "albums", title: "آلبوم تصاویر", description: "ساخت آلبوم و افزودن تصویر با نشانی یا طرح آماده." },
  { group: "media", slug: "videos", title: "محتوای ویدئویی", description: "ثبت مشخصات ویدئو. فایل روی سرور بارگذاری نمی‌شود." },
  { group: "media", slug: "rss", title: "فیدخوان", description: "منابع خوراک، نمونه محلی، و انتقال یک مورد به پیش‌نویس." },
  { group: "media", slug: "newsletter", title: "خبرنامه و مخاطبان", description: "مخاطبان و شماره‌های خبرنامه در صف محلی." },
  { group: "media", slug: "social", title: "انتشار در شبکه‌ها", description: "پیش‌نویس انتشار. به شبکه اجتماعی فرستاده نمی‌شود." },
  { group: "media", slug: "email", title: "مدیریت ایمیل", description: "صندوق محلی نامه، بدون سرور پست الکترونیک." },
  { group: "media", slug: "people", title: "معرفی افراد", description: "صفحه معرفی مدیر مسئول، سردبیر، خبرنگاران و عکاسان." },
  { group: "audience", slug: "comments", title: "مدیریت نظرات", description: "بازبینی، تأیید و رد نظر مخاطبان." },
  { group: "audience", slug: "polls", title: "نظرسنجی", description: "ساخت نظرسنجی و ثبت رأی محلی." },
  { group: "audience", slug: "contact", title: "تماس با ما", description: "پیام‌های رسیده و تغییر وضعیت رسیدگی." },
  { group: "audience", slug: "forum", title: "تالار گفتگو", description: "رشته‌های داخلی و پاسخ به آن‌ها." },
  { group: "reports", slug: "news-report", title: "گزارش کامل خبری", description: "فهرست خبرها با خروجی CSV از داده همین مرورگر." },
  { group: "reports", slug: "views", title: "گزارش بازدید اخبار", description: "شمارنده محلی بازدید، با عدد نمونه اولیه." },
  { group: "reports", slug: "staff", title: "عملکرد راهبران", description: "جمع خبرهای هر نویسنده از روی کارتابل." },
  { group: "reports", slug: "traffic", title: "آمار بازدید سایت", description: "فعالیت ثبت‌شده در همین پنل. آمار سایت عمومی وصل نیست." },
  { group: "structure", slug: "categories", title: "دسته‌بندی خبر", description: "میزها و دسته‌هایی که خبر به آن‌ها می‌چسبد." },
  { group: "structure", slug: "services", title: "سرویس‌های خبری", description: "سرویس‌هایی مثل فوری، گزارش و چندرسانه‌ای." },
  { group: "structure", slug: "pages", title: "صفحه‌ساز", description: "چیدن صفحه با بلوک تیتر، متن و خبر منتخب." },
  { group: "structure", slug: "tables", title: "جدول‌ساز", description: "جدول خبری با ستون و ردیف قابل ویرایش." },
  { group: "structure", slug: "banners", title: "بنرها و اعلانات", description: "اعلان بالای صفحه، ستون یا میان‌متن." },
  { group: "structure", slug: "ticker", title: "پیام متحرک", description: "متن‌های نوار خبر فوری و پیش‌نمایش حرکت." },
  { group: "structure", slug: "calendar", title: "تقویم رویداد", description: "رویدادهای تحریریه و پوشش خبری." },
];

export function moduleBySlug(slug: string): ModuleInfo | undefined {
  return modules.find((item) => item.slug === slug);
}

export function hrefFor(group: string, slug: string): string {
  return `/${group}/${slug}`;
}
