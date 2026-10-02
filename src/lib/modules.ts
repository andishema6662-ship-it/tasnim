export type GroupId =
  | "editorial"
  | "reporters"
  | "media"
  | "audience"
  | "reports"
  | "structure"
  | "template"
  | "admin"
  | "infra";

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
  { id: "editorial", title: "تحریریه و تولید محتوا", priority: "deep" },
  { id: "reporters", title: "خبرنگاران", priority: "deep" },
  { id: "media", title: "رسانه‌های مکمل و چندکاناله", priority: "deep" },
  { id: "audience", title: "تعامل با مخاطب و ارتباطات", priority: "light" },
  { id: "reports", title: "تحلیل، گزارش و پایش", priority: "light" },
  { id: "structure", title: "ساختاردهی و انتشار محتوا", priority: "deep" },
  { id: "admin", title: "مدیریت و کاربران", priority: "light" },
  { id: "template", title: "تنظیمات قالب", priority: "deep" },
  { id: "infra", title: "زیرساخت", priority: "light" },
];

export const modules: ModuleInfo[] = [
  { group: "infra", slug: "system", title: "اطلاعات سیستم", description: "وضعیت همین نسخه و داده ذخیره‌شده در مرورگر." },
  { group: "infra", slug: "settings", title: "تنظیمات سیستم", description: "نام اتاق خبر و اندازه فهرست‌ها." },
  { group: "infra", slug: "monitoring", title: "مانیتورینگ سرور", description: "سنجه‌های محیط محلی مرورگر، نه یک سرور سازمانی." },
  { group: "infra", slug: "backup", title: "مدیریت بک‌آپ", description: "خروجی، ورودی و بازگردانی داده محلی." },
  { group: "infra", slug: "portal", title: "اتصال به پورتال", description: "نگهداری مشخصات اتصال. از این پنل تماسی با پورتال برقرار نمی‌شود." },

  { group: "admin", slug: "users", title: "مدیریت کاربران", description: "تعریف کاربران تحریریه و نسبت دادنشان به نقش." },
  { group: "admin", slug: "access", title: "کنترل دسترسی محتوا", description: "دسترسی منو و بخش‌ها برای هر نقش، و ویرایش و انتشار هر دسته." },
  { group: "admin", slug: "roles", title: "نقش‌ها و دسترسی", description: "سطح دسترسی مدیر مسئول، سردبیر، خبرنگار و نقش‌های تازه." },
  { group: "admin", slug: "chat", title: "گفتگو و پیام‌رسان تحریریه", description: "چت شخصی و گروهی بین خبرنگاران، سردبیر و مدیر مسئول." },
  { group: "admin", slug: "comms", title: "میز ارتباطات ویژه", description: "پیام‌های داخلی بین اعضای تحریریه." },
  { group: "admin", slug: "official-contacts", title: "دفترچه تلفن مسئولین", description: "مخاطبین رسمی، سمت، تماس و یادداشت‌های تحریریه." },
  { group: "admin", slug: "admin-affairs", title: "امور اداری خبرنگاران", description: "کارت خبرنگاری، معرفی‌نامه، گواهی و الگونامه." },
  { group: "admin", slug: "announcements", title: "اطلاعیه و سنجاق پیام", description: "پیام مدیر یا سردبیر به خبرنگاران با زمان سنجاق." },

  { group: "template", slug: "theme", title: "مدیریت قالب", description: "رنگ، چیدمان صفحه اصلی، هدر، فوتر و تایپوگرافی پورتال عمومی." },
  { group: "template", slug: "menus", title: "مدیریت منو", description: "چینش منوی اصلی سایت." },
  { group: "template", slug: "pages", title: "صفحه‌ساز", description: "چیدن صفحه با بلوک تیتر، متن و خبر منتخب." },
  { group: "template", slug: "forms", title: "مدیریت فرم‌ها", description: "فرم‌های تماس و عضویت و فیلدهایشان." },
  { group: "template", slug: "subsites", title: "زیرسایت نامحدود", description: "ثبت رکورد زیرسایت. از اینجا سایتی منتشر نمی‌شود." },
  { group: "template", slug: "rss", title: "فیدخوان", description: "منابع خوراک، نمونه محلی، و انتقال یک مورد به پیش‌نویس." },
  { group: "template", slug: "email", title: "مدیریت ایمیل", description: "صندوق محلی نامه، بدون سرور پست الکترونیک." },
  { group: "template", slug: "newsletter", title: "خبرنامه و مخاطبان", description: "مخاطبان و شماره‌های خبرنامه در صف محلی." },
  { group: "template", slug: "social", title: "انتشار در شبکه‌ها", description: "پیش‌نویس انتشار. به شبکه اجتماعی فرستاده نمی‌شود." },
  { group: "template", slug: "logos", title: "مدیریت لوگوها", description: "نسخه‌های نشانه برای کاربردهای مختلف." },

  { group: "editorial", slug: "ai", title: "تحریریه هوشمند", description: "دستیار محلی برای پیش‌نویس، عنوان، خلاصه، برچسب، تصویر و صوت." },
  { group: "editorial", slug: "ai-hub", title: "خدمات هوش مصنوعی", description: "تبدیل صوت به متن، ویرایش هوشمند، ردیابی منبع انتشار و ابزارهای تکمیلی." },
  { group: "editorial", slug: "cartable", title: "کارتابل و سردبیری", description: "فهرست خبر، ویرایش و صف تأیید تا انتشار." },
  { group: "editorial", slug: "pitches", title: "سوژه‌های خبری", description: "تعریف سوژه برای خبرنگاران، پیگیری مهلت و گزارش اخبار متصل." },
  { group: "editorial", slug: "agenda", title: "تقویم و برنامه‌های کاری", description: "مصاحبه، نشست و گزارش میدانی با یادآوری در پیشخوان." },
  { group: "editorial", slug: "process", title: "فرایندساز خبر", description: "گام‌ها و گذارهای گردش کار و نقش مسئول هر گذار." },
  { group: "editorial", slug: "submissions", title: "مدیریت ارسال خبر", description: "ارسال خبر به دبیر و پذیرش یا رد آن در کارتابل." },
  { group: "editorial", slug: "order", title: "ترتیب اخبار", description: "چیدمان اخبار منتشرشده؛ ردیف اول تیتر یک است." },
  { group: "editorial", slug: "suggestions", title: "اخبار پیشنهادی", description: "پیشنهاد خبر منتشرشده برای سرویس دیگر." },

  { group: "reporters", slug: "my-profile", title: "پروفایل کاربری", description: "اطلاعات شخصی، عکس، تماس و آمار نقش فعال شما (مدیر، سردبیر یا خبرنگار)." },
  { group: "reporters", slug: "my-news", title: "اخبار من", description: "کارتابل محدود به خبرهای نوشته‌شده توسط شما." },
  { group: "reporters", slug: "my-payroll", title: "حق‌الزحمه و فیش", description: "تعرفه، کارکرد و پیش‌نمایش فیش حقوقی خبرنگار." },
  { group: "reporters", slug: "my-admin-affairs", title: "نامه‌های اداری", description: "کارت خبرنگاری، معرفی‌نامه و گواهی‌ها." },
  { group: "reporters", slug: "my-pitches", title: "سوژه‌های من", description: "سوژه‌های محول‌شده یا در دست اقدام شما." },
  { group: "reporters", slug: "my-agenda", title: "برنامه‌ها و مصاحبه‌ها", description: "مصاحبه‌ها و برنامه‌های پیش‌روی شما." },
  { group: "reporters", slug: "my-tasks", title: "کارهای من", description: "فهرست کار شخصی با سررسید و اولویت." },
  { group: "reporters", slug: "my-notes", title: "یادداشت‌های من", description: "یادداشت‌های رنگی با برچسب شخصی، کاری، مهم و فوری." },
  { group: "reporters", slug: "file-manager", title: "مدیریت فایل", description: "پوشه‌ها، سهمیه فضا و اشتراک فایل با تحریریه." },

  { group: "media", slug: "library", title: "کتابخانه رسانه", description: "بارگذاری، برش، کپی پیوند و گالری پرونده‌های چندرسانه‌ای." },
  { group: "media", slug: "albums", title: "آلبوم تصاویر", description: "گزارش تصویری با تیتر، عکاس، بارگذاری چندتایی و محل انتشار." },
  { group: "media", slug: "videos", title: "محتوای ویدئویی", description: "ثبت مشخصات ویدئو. فایل روی سرور بارگذاری نمی‌شود." },
  { group: "media", slug: "people", title: "همکاران رسانه‌ای", description: "کارت همکاران تحریریه — مدیر مسئول، سردبیر، خبرنگاران و عکاسان." },
  { group: "media", slug: "event-map", title: "نقشه رویداد و مسیر", description: "ترسیم مسیر راهپیمایی و دریافت کد ابزارک برای بدنه خبر." },

  { group: "audience", slug: "comments", title: "مدیریت نظرات", description: "بازبینی، تأیید و رد نظر مخاطبان." },
  { group: "audience", slug: "polls", title: "نظرسنجی", description: "ساخت نظرسنجی و ثبت رأی محلی." },
  { group: "audience", slug: "contact", title: "تماس با ما", description: "پیام‌های رسیده و تغییر وضعیت رسیدگی." },
  { group: "audience", slug: "forum", title: "تالار گفتگو", description: "رشته‌های داخلی و پاسخ به آن‌ها." },

  { group: "reports", slug: "news-report", title: "گزارش کامل خبری", description: "فهرست خبرها با خروجی CSV از داده همین مرورگر." },
  { group: "reports", slug: "views", title: "گزارش بازدید اخبار", description: "شمارنده محلی بازدید، با عدد نمونه اولیه." },
  { group: "reports", slug: "staff", title: "عملکرد راهبران", description: "جمع خبرهای هر نویسنده از روی کارتابل." },
  { group: "reports", slug: "traffic", title: "آمار بازدید سایت", description: "فعالیت ثبت‌شده در همین پنل. آمار سایت عمومی وصل نیست." },
  { group: "reports", slug: "pitch-performance", title: "عملکرد سوژه‌ها", description: "جدول عملکرد خبرنگاران در سوژه‌های دریافتی و به‌موقع بودن." },
  { group: "reports", slug: "payroll", title: "حق‌الزحمه و فیش", description: "تعرفه محتوا، کارکرد ماهانه و پیش‌نمایش فیش حقوقی." },
  { group: "reports", slug: "reporter-period", title: "گزارش دوره‌ای خبرنگاران", description: "مقایسه ۳۰ روزه، فصلی و سالانه با نمودار و جدول." },

  { group: "structure", slug: "categories", title: "دسته‌بندی خبر", description: "میزها و دسته‌هایی که خبر به آن‌ها می‌چسبد." },
  { group: "structure", slug: "services", title: "سرویس‌های خبری", description: "سرویس‌هایی مثل فوری، گزارش و چندرسانه‌ای." },
  { group: "structure", slug: "tables", title: "جدول‌ساز", description: "جدول خبری با ستون و ردیف قابل ویرایش." },
  { group: "structure", slug: "ads", title: "مدیریت تبلیغات", description: "تبلیغ با تصویر، جایگاه، پیوند و وضعیت فعال." },
  { group: "structure", slug: "banners", title: "بنرها و اعلانات", description: "اعلان بالای صفحه، ستون یا میان‌متن." },
  { group: "structure", slug: "ticker", title: "پیام متحرک", description: "متن‌های نوار خبر فوری و پیش‌نمایش حرکت." },
  { group: "structure", slug: "calendar", title: "تقویم رویداد", description: "رویدادهای تحریریه و پوشش خبری." },
  { group: "structure", slug: "dossiers", title: "پرونده ویژه", description: "ایجاد پرونده، اتصال اخبار و جانمایی در سایت عمومی." },
  { group: "structure", slug: "links", title: "مدیریت پیوندها", description: "پیوندهای ثابت پاصفحه و ستون کناری." },
];

export function moduleBySlug(slug: string): ModuleInfo | undefined {
  return modules.find((item) => item.slug === slug);
}

export function hrefFor(group: string, slug: string): string {
  return `/${group}/${slug}`;
}

export function moduleKey(module: ModuleInfo): string {
  return `${module.group}/${module.slug}`;
}

export function moduleKeyFromParts(group: string, slug: string): string {
  return `${group}/${slug}`;
}

export function allModuleKeys(): string[] {
  return modules.map((item) => moduleKey(item));
}
