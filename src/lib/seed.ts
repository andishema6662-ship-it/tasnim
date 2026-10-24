import { applyBrandingDefaults, defaultBrandingSettings, LEGACY_NEWSROOM_NAME } from "./branding";
import { migrateModuleAccessList } from "./nav-migration";
import { CHAT_THREAD_IT_SUPPORT } from "./chat-support";
import { seedChangelogReleases } from "./changelog";
import { IRAN_MAP_CENTER, normalizeEventMapProject, TEHRAN_MAP_CENTER } from "./event-map-geo";
import { DEFAULT_USER_PASSWORD, hashPassword } from "./password";
import { defaultUserIdForRole } from "./session-user";
import { createDefaultRoleModuleAccess, mergeRoleModuleAccess } from "./module-access";
import { defaultTemplateSettings, resolveTemplateSettings } from "./template";
import { normalizeAlbum } from "./albums";
import { createSeedMediaLibrary } from "./media-seed";
import { seedPendingApprovals } from "./payroll-approval";
import type { Album, NewsroomData, ReporterAgendaItem, Settings, Story, User } from "./types";

const iso = (value: string) => new Date(value).toISOString();

function seedReporterAgenda(): ReporterAgendaItem[] {
  const now = new Date();
  const tomorrow10 = new Date(now);
  tomorrow10.setDate(tomorrow10.getDate() + 1);
  tomorrow10.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow10);
  tomorrowEnd.setHours(11, 0, 0, 0);
  const today15 = new Date(now);
  today15.setHours(15, 30, 0, 0);
  const todayEnd = new Date(today15);
  todayEnd.setHours(16, 30, 0, 0);
  const ts = now.toISOString();
  return [
    {
      id: "ag-edu",
      title: "مصاحبه با مدیرکل آموزش و پرورش",
      reporterUserId: "u-sara",
      startAt: tomorrow10.toISOString(),
      endAt: tomorrowEnd.toISOString(),
      location: "سالن کنفرانس وزارت",
      meetingLink: "",
      coordinatorPhone: "۰۹۱۲۱۱۱۲۲۲۲",
      officialContactId: "oc-edu",
      requirements: "ضبط صوت، پرسش‌های آماده درباره بازگشایی مدارس",
      done: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "ag-field",
      title: "گزارش میدانی بازار میوه و تره‌بار",
      reporterUserId: "u-ali",
      startAt: today15.toISOString(),
      endAt: todayEnd.toISOString(),
      location: "میدان تجریش",
      meetingLink: "",
      coordinatorPhone: "۰۲۱-۷۷۷۷۸۸۸۸",
      requirements: "عکاس همراه",
      done: false,
      createdAt: ts,
      updatedAt: ts,
    },
  ];
}

function story(partial: Story): Story {
  return partial;
}

const defaultPasswordHash = hashPassword(DEFAULT_USER_PASSWORD);

function seedUser(partial: Omit<User, "passwordHash"> & { passwordHash?: string }): User {
  return { ...partial, passwordHash: partial.passwordHash ?? defaultPasswordHash };
}

export function createSeed(): NewsroomData {
  const categories = [
    { id: "cat-politics", name: "سیاست", description: "نهادهای عمومی و تصمیم‌های شهری و ملی" },
    { id: "cat-economy", name: "اقتصاد", description: "بازار، تولید و معیشت" },
    { id: "cat-sports", name: "ورزش", description: "رقابت، باشگاه و ورزش همگانی" },
    { id: "cat-culture", name: "فرهنگ و هنر", description: "کتاب، سینما، موسیقی و نمایشگاه" },
    { id: "cat-science", name: "علم و فناوری", description: "پژوهش، فضا و ابزارهای تازه" },
    { id: "cat-society", name: "جامعه", description: "شهر، خدمات و زندگی روزمره" },
  ];
  const roleIds = ["publisher", "chief", "reporter"] as const;
  const access = roleIds.flatMap((roleId) =>
    categories.map((category) => ({
      roleId,
      categoryId: category.id,
      edit: !(roleId === "reporter" && category.id === "cat-politics"),
      publish: roleId !== "reporter",
    })),
  );

  const seed: NewsroomData = {
    currentRoleId: "reporter",
    currentUserId: "u-sara",
    sessionStartedAt: new Date().toISOString(),
    settings: {
      ...defaultBrandingSettings(),
      pageSize: 20,
    },
    templateSettings: defaultTemplateSettings(),
    roles: [
      {
        id: "publisher",
        name: "مدیر مسئول",
        base: "publisher",
        permissions: { write: true, review: true, publish: true, archive: true, manageUsers: true, manageStructure: true },
      },
      {
        id: "chief",
        name: "سردبیر",
        base: "chief",
        permissions: { write: true, review: true, publish: false, archive: false, manageUsers: false, manageStructure: true },
      },
      {
        id: "reporter",
        name: "خبرنگار",
        base: "reporter",
        permissions: { write: true, review: false, publish: false, archive: false, manageUsers: false, manageStructure: false },
      },
    ],
    roleModuleAccess: createDefaultRoleModuleAccess([
      { id: "publisher", base: "publisher" },
      { id: "chief", base: "chief" },
      { id: "reporter", base: "reporter" },
    ]),
    userModuleAccess: {},
    users: [
      seedUser({ id: "u-leila", name: "محمدحسین شمسایی", username: "shamsaei", roleId: "publisher", active: true }),
      seedUser({ id: "u-kamran", name: "علیرضا رضایی", username: "rezaei", roleId: "chief", active: true }),
      seedUser({ id: "u-sara", name: "سارا محمدی", username: "sara", roleId: "reporter", active: true, reporterGrade: "senior" }),
      seedUser({ id: "u-pouria", name: "مهدی پوریا", username: "pouria", roleId: "reporter", active: true, reporterGrade: "junior" }),
      seedUser({ id: "u-ali", name: "علی رضایی", username: "ali", roleId: "reporter", active: true, reporterGrade: "junior" }),
      seedUser({ id: "u-narges", name: "نرگس کاظمی", username: "narges", roleId: "reporter", active: true, reporterGrade: "trainee" }),
    ],
    access,
    categories,
    services: [
      { id: "srv-urgent", name: "فوری", description: "خبر کوتاه با اولویت بالا", active: true },
      { id: "srv-report", name: "گزارش", description: "شرح میدانی و پس‌زمینه", active: true },
      { id: "srv-talk", name: "گفت‌وگو", description: "مصاحبه و نقل‌قول", active: true },
      { id: "srv-multi", name: "چندرسانه‌ای", description: "عکس، ویدئو و صوت در کنار متن", active: true },
    ],
    steps: [
      { status: "draft", label: "پیش‌نویس", note: "خبرنگار متن را می‌نویسد و به میز ویرایش می‌فرستد." },
      { status: "editing", label: "ویرایش", note: "سردبیر لید، سندیت و تیتر را درست می‌کند." },
      { status: "review", label: "بازبینی", note: "سردبیر نسخه را برای انتشار تأیید یا برمی‌گرداند." },
      { status: "ready", label: "آماده انتشار", note: "خبر منتظر دستور مدیر مسئول است." },
      { status: "published", label: "منتشرشده", note: "خبر روی خروجی نشسته و در ترتیب صفحه جا دارد." },
      { status: "archived", label: "آرشیو", note: "از خروجی برداشته شده و برای سابقه مانده است." },
    ],
    transitions: [
      { id: "t-edit", from: "draft", to: "editing", label: "ارسال به ویرایش", actor: "reporter", enabled: true },
      { id: "t-skip", from: "draft", to: "review", label: "ارسال به بازبینی", actor: "reporter", enabled: true },
      { id: "t-review", from: "editing", to: "review", label: "ارسال به بازبینی", actor: "chief", enabled: true },
      { id: "t-back-draft", from: "editing", to: "draft", label: "بازگشت به خبرنگار", actor: "chief", enabled: true },
      { id: "t-ready", from: "review", to: "ready", label: "تأیید برای انتشار", actor: "chief", enabled: true },
      { id: "t-back-edit", from: "review", to: "editing", label: "بازگشت به ویرایش", actor: "chief", enabled: true },
      { id: "t-publish", from: "ready", to: "published", label: "انتشار", actor: "publisher", enabled: true },
      { id: "t-back-review", from: "ready", to: "review", label: "بازگشت به بازبینی", actor: "publisher", enabled: true },
      { id: "t-archive", from: "published", to: "archived", label: "انتقال به آرشیو", actor: "publisher", enabled: true },
      { id: "t-restore", from: "archived", to: "draft", label: "بازگشت به پیش‌نویس", actor: "publisher", enabled: true },
    ],
    homeOrder: ["s-karaj", "s-film", "s-bus"],
    stories: [
      story({
        id: "s-solar",
        title: "ظرفیت نیروگاه‌های خورشیدی یزد تا پایان سال دو برابر می‌شود",
        lead: "مدیرعامل برق منطقه‌ای یزد گفت با ورود چهار سایت تازه، توان تولید خورشیدی استان تا اسفند به ۴۸۰ مگاوات می‌رسد.",
        body: "یزد در دو سال گذشته میزبان چند مزرعه خورشیدی کوچک بوده است. حالا شرکت برق منطقه‌ای می‌گوید زیرساخت اتصال به شبکه برای سایت‌های تازه آماده شده و پیمانکاران از آبان کار نصب پنل را شروع می‌کنند. مدیرعامل این برنامه را بخشی از جبران اوج مصرف تابستان آینده دانست و تأکید کرد زمان‌بندی هنوز به تأمین تجهیزات وابسته است.",
        cover: "dawn",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-economy",
        serviceId: "srv-report",
        tags: ["انرژی", "یزد", "خورشیدی"],
        status: "draft",
        author: "سارا محمدی",
        views: 4,
        createdAt: iso("2026-09-25T06:10:00Z"),
        updatedAt: iso("2026-09-25T06:40:00Z"),
        pitchId: "pitch-yazd",
      }),
      story({
        id: "s-ink",
        title: "نمایشگاه «مرکب و سکوت» در موزه هنرهای معاصر گشایش یافت",
        lead: "چهل اثر از خوشنویسان جوان تا پایان مهر در موزه به نمایش درمی‌آید و سه‌شنبه‌ها نشست گفت‌وگو برگزار می‌شود.",
        body: "نمایشگاه با چهل اثر از خوشنویسان جوان گشایش یافت. موزه اعلام کرد بازدید تا پایان مهر هر روز از ساعت ده تا هجده برقرار است. مسئول برگزاری گفت هدف نمایش، دیدن خط معاصر بیرون از قاب مسابقه است و فروش اثر در برنامه این دوره نیست.",
        cover: "ink",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-culture",
        serviceId: "srv-talk",
        tags: ["خوشنویسی", "موزه"],
        status: "draft",
        author: "علی رضایی",
        views: 2,
        createdAt: iso("2026-09-25T05:00:00Z"),
        updatedAt: iso("2026-09-25T05:20:00Z"),
      }),
      story({
        id: "s-volley",
        title: "ایران در دیدار تدارکاتی والیبال از برزیل جلو افتاد",
        lead: "تیم ملی ست نخست را ۲۵ بر ۲۲ برد و سرمربی ترکیب بازی هفته بعد را هنوز قطعی ندانست.",
        body: "تیم ملی در ست نخست با نتیجه ۲۵ بر ۲۲ پیش افتاد. سرمربی تعویض‌ها را محتاطانه خواند و گفت ترکیب اصلی برای مسابقه هفته بعد هنوز قطعی نیست. سالن میزبان اعلام کرد بلیت ست‌های باقی‌مانده همچنان در گیشه است.",
        cover: "sea",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-sports",
        serviceId: "srv-urgent",
        tags: ["والیبال", "تیم ملی"],
        status: "editing",
        author: "نرگس کاظمی",
        views: 18,
        createdAt: iso("2026-09-24T14:00:00Z"),
        updatedAt: iso("2026-09-24T16:10:00Z"),
      }),
      story({
        id: "s-tajrish",
        title: "بهسازی پیاده‌روهای بازار تجریش از هفته آینده آغاز می‌شود",
        lead: "شهرداری منطقه یک می‌گوید سنگفرش آسیب‌دیده از ابتدای بازار تا میدان عوض می‌شود و مسیر عابران جدا شده است.",
        body: "شهرداری منطقه یک اعلام کرد سنگفرش آسیب‌دیده از ابتدای بازار تا میدان تجریش تعویض می‌شود. کسبه خواسته‌اند کار شبانه باشد تا رفت‌وآمد روزانه تعطیل نشود. معاون عمران گفت برنامه شبانه در دست بررسی است و مسیر جایگزین برای عابران مشخص شده است.",
        cover: "sand",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-society",
        serviceId: "srv-report",
        tags: ["تجریش", "شهرداری"],
        status: "editing",
        author: "سارا محمدی",
        views: 11,
        createdAt: iso("2026-09-24T08:00:00Z"),
        updatedAt: iso("2026-09-24T12:30:00Z"),
        pitchId: "pitch-tajrish",
      }),
      story({
        id: "s-sat",
        title: "ماهواره «پارس ۲» در مدار زمین قرار گرفت",
        lead: "سازمان فضایی گفت ماهواره‌بر داخلی بامداد دیروز ماهواره را در مدار گذاشت و نخستین سیگنال دریافت شد.",
        body: "ماهواره بامداد دیروز با ماهواره‌بر داخلی به مدار رفت و نخستین سیگنال را فرستاد. سازمان فضایی گفت داده‌های سنجش از دور پس از کالیبراسیون در اختیار مراکز پژوهشی قرار می‌گیرد. مدیر پروژه زمان انتشار نخستین تصویر را هفته آینده اعلام کرد.",
        cover: "sea",
        imagePrompt: "عکس مستند از سکوی پرتاب در روشنایی بامداد، بدون نشان",
        audioScript: "",
        categoryId: "cat-science",
        serviceId: "srv-urgent",
        tags: ["ماهواره", "فضا"],
        status: "review",
        author: "علی رضایی",
        views: 40,
        createdAt: iso("2026-09-23T20:00:00Z"),
        updatedAt: iso("2026-09-25T04:10:00Z"),
      }),
      story({
        id: "s-food",
        title: "تورم ماهانه خوراکی‌ها برای دومین ماه پیاپی کم شد",
        lead: "مرکز آمار می‌گوید رشد ماهانه خوراکی‌ها کندتر شده، اما گروه گوشت هنوز بالاتر از میانگین سال است.",
        body: "مرکز آمار اعلام کرد شاخص خوراکی‌ها در ماه گذشته نسبت به ماه قبل رشد کمتری داشته است. کارشناسان این تغییر را شکننده می‌دانند و هشدار می‌دهند گروه گوشت هنوز بالاتر از میانگین سال حرکت می‌کند. گزارش کامل عصر امروز روی خروجی اقتصاد می‌نشیند.",
        cover: "dawn",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-economy",
        serviceId: "srv-report",
        tags: ["تورم", "خوراکی"],
        status: "ready",
        author: "نرگس کاظمی",
        views: 22,
        createdAt: iso("2026-09-22T09:00:00Z"),
        updatedAt: iso("2026-09-25T03:00:00Z"),
      }),
      story({
        id: "s-karaj",
        title: "مجموعه ورزشی انقلاب کرج پس از نوسازی بازگشایی شد",
        lead: "سالن چندمنظوره و استخر تمرین پس از چهارده ماه کار دوباره باز است و عضویت محله‌ای از هفته بعد شروع می‌شود.",
        body: "مجموعه پس از چهارده ماه نوسازی با سالن چندمنظوره و استخر تمرین بازگشایی شد. مدیر مجموعه گفت عضویت محله‌ای از هفته آینده آغاز می‌شود و سانس بانوان طبق برنامه پیشین حفظ شده است. شهرداری کرج هزینه را از ردیف عمران ورزشی اعلام کرد.",
        cover: "pine",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-sports",
        serviceId: "srv-report",
        tags: ["کرج", "ورزش همگانی"],
        status: "published",
        author: "سارا محمدی",
        views: 1284,
        createdAt: iso("2026-09-18T08:00:00Z"),
        updatedAt: iso("2026-09-20T10:00:00Z"),
        publishedAt: iso("2026-09-20T10:00:00Z"),
      }),
      story({
        id: "s-film",
        title: "خانه هنرمندان میزبان هفته فیلم کوتاه است",
        lead: "بیست فیلم کوتاه از شهرستان‌ها اکران می‌شود و امسال بخش نقد مردمی هم به برنامه اضافه شده است.",
        body: "هفته فیلم کوتاه با نمایش بیست اثر از شهرستان‌ها آغاز شد. دبیر جشنواره گفت امسال بخش نقد مردمی هم به برنامه اضافه شده و بلیت‌ها در سایت خانه هنرمندان است. نشست فیلم‌سازان اول هر عصر پس از آخرین سانس برگزار می‌شود.",
        cover: "ink",
        imagePrompt: "سالن نیمه‌روشن سینما، صندلی‌های پارچه‌ای، نور گرم پروژکتور",
        audioScript: "",
        categoryId: "cat-culture",
        serviceId: "srv-multi",
        tags: ["فیلم کوتاه", "خانه هنرمندان"],
        status: "published",
        author: "علی رضایی",
        views: 860,
        createdAt: iso("2026-09-19T11:00:00Z"),
        updatedAt: iso("2026-09-21T15:00:00Z"),
        publishedAt: iso("2026-09-21T15:00:00Z"),
        pitchId: "pitch-film-week",
      }),
      story({
        id: "s-bus",
        title: "لایحه حمایت از حمل‌ونقل عمومی در شورا بررسی شد",
        lead: "لایحه نوسازی ناوگان و اولویت مسیرهای کم‌برخوردار به جلسه علنی بعد موکول شد.",
        body: "لایحه برای نوسازی ناوگان فرسوده و اولویت مسیرهای کم‌برخوردار به شورا رفت. دو عضو شورا خواستار پیوست مالی روشن شدند و بررسی به جلسه علنی بعد موکول شد. معاون حمل‌ونقل گفت تا آن جلسه عدد دقیق اتوبوس‌های از رده خارج را می‌آورد.",
        cover: "sand",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-politics",
        serviceId: "srv-report",
        tags: ["حمل‌ونقل", "شورای شهر"],
        status: "published",
        author: "نرگس کاظمی",
        views: 640,
        createdAt: iso("2026-09-20T07:30:00Z"),
        updatedAt: iso("2026-09-22T09:40:00Z"),
        publishedAt: iso("2026-09-22T09:40:00Z"),
      }),
      story({
        id: "s-rain",
        title: "گزارش تصویری بارش‌های بهاری در دامنه‌های البرز",
        lead: "بهار پارسال چند هفته پوشش گیاهی دامنه‌ها را سبز کرد. این فایل فقط در آرشیو میز جامعه مانده است.",
        body: "بهار پارسال بارش در دامنه‌های البرز پوشش گیاهی را برای چند هفته سبز کرد. این گزارش تصویری از آرشیو میز جامعه بازگردانده نشده و فقط برای سابقه در آرشیو مانده است. عکس‌ها در آلبوم باران نگهداری می‌شوند.",
        cover: "pine",
        imagePrompt: "",
        audioScript: "",
        categoryId: "cat-society",
        serviceId: "srv-multi",
        tags: ["البرز", "باران"],
        status: "archived",
        author: "علی رضایی",
        views: 2100,
        createdAt: iso("2026-05-12T08:00:00Z"),
        updatedAt: iso("2026-09-01T08:00:00Z"),
        publishedAt: iso("2026-05-12T12:00:00Z"),
      }),
    ],
    pitches: [
      {
        id: "pitch-yazd",
        title: "پوشش توسعه نیروگاه‌های خورشیدی در یزد",
        topic: "انرژی تجدیدپذیر و ظرفیت‌سازی استانی",
        categoryId: "cat-economy",
        description:
          "با مدیرعامل برق منطقه‌ای تماس بگیرید. عدد ظرفیت فقط در صورت تأیید رسمی در تیتر بیاید. یک گزارش میدانی از سایت مهریز و یک مصاحبه کوتاه با پیمانکار کافی است.",
        audience: "all_reporters",
        deadline: iso("2026-10-05T12:00:00Z"),
        priority: "high",
        status: "active",
        contentType: "field-report",
        createdBy: "کامران شفیعی",
        createdAt: iso("2026-09-24T08:00:00Z"),
        updatedAt: iso("2026-09-25T06:15:00Z"),
      },
      {
        id: "pitch-tajrish",
        title: "بهسازی پیاده‌رو بازار تجریش",
        topic: "شهر و عبور عابران در بازارهای تاریخی",
        categoryId: "cat-society",
        description: "عکاس پویا کرمی هماهنگ است. تأکید بر زمان‌بندی شبانه و نظر کسبه. از شایعه تعطیلی بازار دوری کنید.",
        audience: "specific",
        assigneeUserId: "u-sara",
        deadline: iso("2026-09-30T12:00:00Z"),
        priority: "normal",
        status: "active",
        contentType: "photo-report",
        createdBy: "کامران شفیعی",
        createdAt: iso("2026-09-23T10:00:00Z"),
        updatedAt: iso("2026-09-24T08:30:00Z"),
      },
      {
        id: "pitch-film-week",
        title: "هفته فیلم کوتاه — اکران و گفت‌وگو",
        topic: "فرهنگ و رویدادهای سینمایی",
        categoryId: "cat-culture",
        description: "پوشش افتتاحیه و یک گزارش از نشست سه‌شنبه. خبر منتشرشده s-film را می‌توان برای سرویس فوری هم پیشنهاد داد.",
        audience: "specific",
        assigneeUserId: "u-ali",
        priority: "low",
        status: "completed",
        createdBy: "لیلا نوری",
        createdAt: iso("2026-09-18T09:00:00Z"),
        updatedAt: iso("2026-09-22T11:00:00Z"),
      },
    ],
    submissions: [
      {
        id: "sub-book",
        title: "ثبت‌نام نمایشگاه کتاب استانی در یزد از شنبه شروع می‌شود",
        lead: "اداره فرهنگ و ارشاد یزد زمان غرفه‌بندی را اعلام کرد.",
        body: "ثبت‌نام ناشران از شنبه در سامانه استانی باز می‌شود و نمایشگاه اواخر مهر در محل دائمی برگزار خواهد شد. هنوز فهرست مهمان‌ها نهایی نیست.",
        categoryId: "cat-culture",
        author: "علی رضایی",
        status: "new",
        note: "",
        createdAt: iso("2026-09-25T07:00:00Z"),
      },
      {
        id: "sub-metro",
        title: "شایعه تعطیلی خط مترو",
        lead: "پیام‌های فضای مجازی از تعطیلی یک خط خبر می‌دهند.",
        body: "متن ارسالی منبع رسمی ندارد و با اعلام شرکت بهره‌برداری هم‌خوان نیست.",
        categoryId: "cat-society",
        author: "سارا محمدی",
        status: "rejected",
        note: "منبع نامعتبر است و خبر تأیید نشده.",
        createdAt: iso("2026-09-23T18:00:00Z"),
      },
    ],
    suggestions: [
      {
        id: "sug-film",
        storyId: "s-film",
        serviceId: "srv-urgent",
        note: "اکران افتتاحیه را برای سرویس فوری فرهنگ هم بگذارید.",
        status: "pending",
        createdAt: iso("2026-09-24T19:00:00Z"),
      },
      {
        id: "sug-karaj",
        storyId: "s-karaj",
        serviceId: "srv-multi",
        note: "گزارش تصویری مجموعه به سرویس چندرسانه‌ای رفت.",
        status: "accepted",
        createdAt: iso("2026-09-21T11:00:00Z"),
      },
    ],
    mediaLibrary: createSeedMediaLibrary(),
    albums: [
      normalizeAlbum({
        id: "alb-film",
        title: "هفته فیلم کوتاه — گزارش تصویری",
        description: "سالن، پوستر و گفت‌وگوی حاشیه‌ای شب افتتاح.",
        photographer: "پویا کرمی",
        placement: "home_featured",
        serviceId: "srv-multi",
        status: "published",
        createdAt: iso("2026-09-21T10:00:00Z"),
        updatedAt: iso("2026-09-21T15:00:00Z"),
        publishedAt: iso("2026-09-21T15:00:00Z"),
        photos: [
          { id: "ph-1", caption: "سالن اصلی پیش از سانس اول", src: "ink" },
          { id: "ph-2", caption: "پوستر ورودی", src: "dawn" },
          { id: "ph-3", caption: "میز گفت‌وگو", src: "sand" },
        ],
      }),
      normalizeAlbum({
        id: "alb-karaj",
        title: "بازگشایی مجموعه کرج",
        description: "سالن نوسازی‌شده و استخر تمرین در روز بازگشایی.",
        photographer: "پویا کرمی",
        placement: "dedicated",
        serviceId: "srv-report",
        status: "published",
        createdAt: iso("2026-09-21T11:00:00Z"),
        updatedAt: iso("2026-09-21T12:00:00Z"),
        publishedAt: iso("2026-09-21T12:00:00Z"),
        photos: [
          { id: "ph-4", caption: "سالن چندمنظوره", src: "pine" },
          { id: "ph-5", caption: "ورودی مجموعه", src: "sea" },
        ],
      }),
    ],
    videos: [
      {
        id: "vid-karaj",
        title: "بازدید از سالن نوسازی‌شده کرج",
        url: "https://example.com/video/karaj",
        duration: "۰۲:۱۰",
        summary: "تصویر تمرینی از سالن، بدون مصاحبه.",
        published: true,
      },
      {
        id: "vid-sat",
        title: "توضیح کوتاه پرتاب پارس ۲",
        url: "https://example.com/video/pars",
        duration: "۰۱:۰۵",
        summary: "قطعه خام؛ هنوز برای انتشار تأیید نشده.",
        published: false,
      },
    ],
    feeds: [
      {
        id: "feed-science",
        title: "نمونه خوراک علم",
        url: "https://example.com/rss/science",
        items: [
          { id: "fi-1", title: "آزمایش میدانی شبکه لرزه‌نگاری در شرق تهران", summary: "نمونه محلی. از منبع زنده خوانده نشده است." },
          { id: "fi-2", title: "گزارش آزمایشگاهی درباره باتری‌های سدیمی", summary: "عنوان تمرینی برای انتقال به کارتابل." },
        ],
      },
    ],
    subscribers: [
      { id: "subr-1", name: "مریم احمدی", email: "maryam@example.com", active: true },
      { id: "subr-2", name: "حسین مرادی", email: "hossein@example.com", active: true },
      { id: "subr-3", name: "نگار شمس", email: "negar@example.com", active: false },
    ],
    issues: [
      {
        id: "iss-1",
        subject: "صبح خبر؛ پنجشنبه",
        body: "تیتر یک: بازگشایی مجموعه کرج. در فرهنگ، هفته فیلم کوتاه شروع شده است.",
        status: "draft",
        createdAt: iso("2026-09-25T05:30:00Z"),
      },
    ],
    social: [
      {
        id: "soc-1",
        channel: "تلگرام",
        text: "خانه هنرمندان میزبان هفته فیلم کوتاه است. بیست اثر از شهرستان‌ها اکران می‌شود.",
        storyId: "s-film",
        status: "draft",
        createdAt: iso("2026-09-21T16:00:00Z"),
      },
    ],
    mail: [
      {
        id: "mail-1",
        folder: "inbox",
        from: "reader@example.com",
        to: "desk@newsroom.local",
        subject: "اصلاح نام سالن در خبر کرج",
        body: "در پاراگراف دوم نام سالن قدیمی آمده است. نام تازه روی تابلو «انقلاب» است.",
        read: false,
        createdAt: iso("2026-09-22T08:12:00Z"),
      },
      {
        id: "mail-2",
        folder: "inbox",
        from: "photo@newsroom.local",
        to: "desk@newsroom.local",
        subject: "عکس‌های تجریش آماده است",
        body: "هشت فریم از پیاده‌رو در آلبوم شهر نشسته. برای گزارش انتخاب کنید.",
        read: true,
        createdAt: iso("2026-09-24T13:00:00Z"),
      },
      {
        id: "mail-3",
        folder: "outbox",
        from: "desk@newsroom.local",
        to: "archive@newsroom.local",
        subject: "درخواست سابقه بارش البرز",
        body: "فایل آرشیو بهار برای میز جامعه لازم است.",
        read: true,
        createdAt: iso("2026-09-01T09:00:00Z"),
      },
    ],
    people: [
      {
        id: "p-shamsaei",
        name: "محمدحسین شمسایی",
        title: "مدیر مسئول",
        bio: "مسئولیت انتشار، خط‌مشی تحریریه و پاسخ‌گویی محتوای خبرگزاری شمسه.",
        kind: "مدیر مسئول",
        visible: true,
        editorialRank: "الف",
        joinedAt: iso("2020-03-21T08:00:00Z"),
        phone: "021-88776655",
        email: "desk@shamseh.news",
        desk: "اتاق ۱۰۱ — مدیریت",
        userId: "u-leila",
        reporterTier: 5,
        tierNote: "رهبری تحریریه و خط‌مشی انتشار.",
      },
      {
        id: "p-rezaei",
        name: "علیرضا رضایی",
        title: "سردبیر",
        bio: "هماهنگی میز تحریریه، صف سردبیری و تأیید نسخه‌های حساس.",
        kind: "سردبیر",
        visible: true,
        editorialRank: "الف",
        joinedAt: iso("2021-01-15T08:00:00Z"),
        phone: "021-88776656",
        email: "chief@shamseh.news",
        desk: "میز سردبیری",
        userId: "u-kamran",
        reporterTier: 5,
      },
      {
        id: "p-kazemi",
        name: "نرگس کاظمی",
        title: "دبیر سرویس سیاسی",
        bio: "برنامه‌ریزی پوشش مجلس، دولت و تحولات منطقه‌ای.",
        kind: "دبیر سرویس",
        visible: true,
        editorialRank: "ب",
        joinedAt: iso("2022-06-01T08:00:00Z"),
        userId: "u-narges",
        phone: "09121234567",
        email: "narges@shamseh.news",
        desk: "میز سیاسی — طبقه ۲",
        reporterTier: 4,
        interviewCount: 3,
      },
      {
        id: "p-sara",
        name: "سارا محمدی",
        title: "خبرنگار ارشد",
        bio: "گزارش‌های تحلیلی اقتصاد و جامعه؛ تمرکز بر معیشت و خدمات شهری.",
        kind: "خبرنگار ارشد",
        visible: true,
        editorialRank: "ب",
        joinedAt: iso("2023-02-10T08:00:00Z"),
        userId: "u-sara",
        phone: "09129876543",
        email: "sara@shamseh.news",
        desk: "میز اقتصاد",
        reporterTier: 4,
        tierNote: "عملکرد قوی در گزارش‌های میدانی و تحلیل.",
        interviewCount: 5,
      },
      {
        id: "p-pouria",
        name: "مهدی پوریا",
        title: "عکاس خبری",
        bio: "پوشش تصویری میدانی، راهپیمایی‌ها و رویدادهای ورزشی.",
        kind: "عکاس خبری",
        visible: true,
        editorialRank: "ج",
        joinedAt: iso("2023-09-01T08:00:00Z"),
        phone: "021-88776658",
        email: "photo@shamseh.news",
        desk: "اتاق عکاسی",
        userId: "u-pouria",
        reporterTier: 3,
      },
      {
        id: "p-graphic",
        name: "پریسا انصاری",
        title: "طراح گرافیک و چندرسانه‌ای",
        bio: "اینفوگرافیک، قالب خبر و بسته‌های چندرسانه‌ای برای خروجی دیجیتال.",
        kind: "طراح گرافیک و چندرسانه‌ای",
        visible: true,
        editorialRank: "ج",
        joinedAt: iso("2024-01-20T08:00:00Z"),
        phone: "021-88776659",
        email: "design@shamseh.news",
        desk: "استودیو گرافیک",
        reporterTier: 3,
      },
    ],
    contactPage: {
      intro:
        "راه ارتباطی با تحریریه خبر شمسه: تلفن‌های دفتر، آدرس پستی و ایمیل تحریریه. پیام شما پس از بررسی کپچا در صندوق تماس ذخیره می‌شود.",
      phones: "۰۲۱-۸۸۷۷۶۶۵۵ (داخلی ۱۰۱)",
      address: "تهران، خیابان مطهری، ساختمان شمسه، طبقه ۳ — تحریریه",
      email: "contact@shamseh.news",
    },
    pages: [
      {
        id: "page-home",
        title: "صفحه ویژه هفته فرهنگ",
        blocks: [
          { id: "b1", type: "heading", text: "هفته فرهنگ در شهر", storyId: "" },
          { id: "b2", type: "text", text: "این صفحه محلی است و از بلوک‌های تحریریه چیده شده.", storyId: "" },
          { id: "b3", type: "story", text: "", storyId: "s-film" },
        ],
      },
    ],
    tables: [
      {
        id: "tbl-volley",
        title: "جدول تمرینی گروه والیبال",
        columns: ["تیم", "برد", "باخت", "امتیاز"],
        rows: [
          ["ایران", "۲", "۰", "۶"],
          ["برزیل", "۱", "۱", "۳"],
          ["ژاپن", "۰", "۲", "۰"],
        ],
        placement: "service-sports",
      },
      {
        id: "tbl-jihadi",
        title: "گزارش جهادی",
        columns: ["ردیف", "عنوان فعالیت", "مسئول", "وضعیت"],
        rows: [
          ["۱", "توزیع بسته معیشتی", "گروه جهادی الف", "انجام شد"],
          ["۲", "بازدید از مناطق آسیب‌دیده", "گروه جهادی ب", "در حال اقدام"],
        ],
        placement: "dedicated-page",
      },
    ],
    ads: [
      {
        id: "ad-leaderboard",
        title: "بنر بالای سایت",
        placement: "بالای صفحه",
        image:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="728" height="90" viewBox="0 0 728 90"><rect fill="#ebe4d6" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6f685f" font-family="Tahoma" font-size="20">تبلیغ 728×90</text></svg>',
          ),
        href: "#",
        active: true,
      },
      {
        id: "ad-mid",
        title: "بنر میان صفحه",
        placement: "میان‌متن",
        image:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="728" height="90" viewBox="0 0 728 90"><rect fill="#f3efe6" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8e1e2d" font-family="Tahoma" font-size="18">جایگاه تبلیغاتی خبرگزاری</text></svg>',
          ),
        href: "#",
        active: true,
      },
    ],
    banners: [
      { id: "bn-1", title: "هفته فیلم", text: "اکران رایگان سانس صبح در خانه هنرمندان", href: "/admin/editorial/cartable/s-film", placement: "بالای صفحه", active: true },
      { id: "bn-2", title: "عضویت مجموعه کرج", text: "ثبت‌نام محله‌ای از شنبه", href: "/admin/editorial/cartable/s-karaj", placement: "ستون", active: false },
    ],
    tickers: [
      { id: "tk-1", text: "ماهواره پارس ۲ سیگنال فرستاد؛ خبر در صف بازبینی است", active: true },
      { id: "tk-2", text: "بهسازی پیاده‌رو بازار تجریش از هفته آینده", active: true },
      { id: "tk-3", text: "سانس اضافه فیلم کوتاه برای عصر جمعه", active: false },
    ],
    events: [
      { id: "ev-1", title: "نشست فیلم‌سازان کوتاه", date: "2026-09-26", place: "خانه هنرمندان", note: "پس از سانس آخر" },
      { id: "ev-2", title: "بازدید میدانی تجریش", date: "2026-09-28", place: "بازار تجریش", note: "عکاس: پویا کرمی" },
      { id: "ev-3", title: "جلسه علنی شورا", date: "2026-10-02", place: "شورای شهر", note: "پیگیری لایحه حمل‌ونقل" },
      { id: "ev-4", title: "افتتاح سایت خورشیدی", date: "2026-10-06", place: "مهریز", note: "هماهنگی با برق منطقه‌ای" },
    ],
    upcomingEvents: [
      {
        id: "uev-1",
        title: "نشست خبری وزارت آموزش",
        kind: "press-brief",
        organizer: "وزارت آموزش و پرورش",
        place: "سالن همایش‌های وزارت",
        startsAt: iso("2026-10-03T09:00:00Z"),
        status: "approved",
        createdByUserId: "u-kamran",
        createdByName: "کامران شفیعی",
        approvedByUserId: "u-kamran",
        approvedAt: iso("2026-09-28T10:00:00Z"),
        createdAt: iso("2026-09-27T08:00:00Z"),
      },
      {
        id: "uev-2",
        title: "نمایشگاه انرژی‌های تجدیدپذیر",
        kind: "exhibition",
        organizer: "سازمان انرژی‌های نو",
        place: "نمایشگاه بین‌المللی تهران",
        startsAt: iso("2026-10-08T07:30:00Z"),
        status: "approved",
        createdByUserId: "u-leila",
        createdByName: "لیلا نوری",
        approvedByUserId: "u-leila",
        approvedAt: iso("2026-09-29T11:00:00Z"),
        createdAt: iso("2026-09-28T12:00:00Z"),
      },
      {
        id: "uev-3",
        title: "همایش شهر هوشمند",
        kind: "conference",
        organizer: "شهرداری تهران",
        place: "مرکز همایش‌های بین‌المللی",
        startsAt: iso("2026-11-15T10:00:00Z"),
        status: "approved",
        createdByUserId: "u-kamran",
        createdByName: "کامران شفیعی",
        approvedByUserId: "u-kamran",
        approvedAt: iso("2026-10-01T08:00:00Z"),
        createdAt: iso("2026-09-30T09:00:00Z"),
      },
    ],
    tickets: [
      { id: "tk-photo", title: "دسترسی آلبوم شهر برای خبرنگار تازه‌کار", body: "لازم است علی رضایی هم آلبوم تجریش را ببیند.", status: "open", author: "سارا محمدی", recipient: "chief", createdAt: iso("2026-09-24T09:00:00Z") },
      { id: "tk-font", title: "فاصله تیتر در پیش‌نمایش صفحه", body: "در صفحه‌ساز، تیتر به متن چسبیده دیده می‌شود.", status: "pending", author: "کامران شفیعی", recipient: "it-support", createdAt: iso("2026-09-23T11:20:00Z") },
      { id: "tk-desk", title: "پیشنهاد میز انرژی", body: "خبرهای خورشیدی بهتر است دسته جدا داشته باشند.", status: "closed", author: "لیلا نوری", recipient: "publisher", createdAt: iso("2026-09-18T10:00:00Z") },
    ],
    notes: [
      { id: "nt-1", from: "کامران شفیعی", to: "سارا محمدی", body: "لید خبر یزد را کوتاه‌تر کن و عدد مگاوات را در تیتر نیاور اگر هنوز قطعی نیست.", read: false, createdAt: iso("2026-09-25T06:50:00Z") },
      { id: "nt-2", from: "لیلا نوری", to: "کامران شفیعی", body: "خبر خوراکی آماده انتشار است. عصر چک می‌کنم.", read: true, createdAt: iso("2026-09-25T03:20:00Z") },
    ],
    subsites: [
      { id: "site-sport", name: "ورزش", slug: "varzesh", active: true },
      { id: "site-province", name: "استان‌ها", slug: "ostanha", active: true },
    ],
    links: [
      { id: "ln-1", title: "درباره تحریریه", url: "/template/pages", group: "پاصفحه" },
      { id: "ln-2", title: "تماس", url: "/audience/contact", group: "پاصفحه" },
      { id: "ln-3", title: "آرشیو", url: "/admin/editorial/cartable?status=archived", group: "ستون" },
      { id: "ln-4", title: "خبرنامه", url: "/media/newsletter", group: "ستون" },
    ],
    logos: [
      { id: "lg-1", name: "نشانه اصلی", usage: "سرصفحه", color: "#8e1e2d" },
      { id: "lg-2", name: "تک‌رنگ تیره", usage: "چاپ", color: "#141210" },
      { id: "lg-3", name: "نسخه روشن", usage: "زمینه تیره", color: "#f3efe6" },
    ],
    forms: [
      { id: "fm-1", name: "تماس با تحریریه", fields: ["نام", "ایمیل", "پیام"], active: true },
      { id: "fm-2", name: "عضویت خبرنامه", fields: ["نام", "ایمیل"], active: true },
    ],
    menus: [
      { id: "mn-1", label: "سیاست", href: "/cat-politics" },
      { id: "mn-2", label: "اقتصاد", href: "/cat-economy" },
      { id: "mn-3", label: "ورزش", href: "/cat-sports" },
      { id: "mn-4", label: "فرهنگ", href: "/cat-culture" },
      { id: "mn-5", label: "علم", href: "/cat-science" },
      { id: "mn-6", label: "جامعه", href: "/cat-society" },
    ],
    portal: {
      url: "",
      note: "",
      enabled: false,
      lastCheck: "هنوز بررسی نشده است.",
    },
    comments: [
      { id: "c-1", storyId: "s-karaj", author: "رضا", body: "سانس بانوان در جدول سایت هنوز ساعت قدیمی را نشان می‌دهد.", status: "pending", createdAt: iso("2026-09-22T12:00:00Z") },
      { id: "c-2", storyId: "s-karaj", author: "هدی", body: "گزارش دقیق بود. کاش عکس ورودی هم بود.", status: "approved", createdAt: iso("2026-09-21T18:00:00Z") },
      { id: "c-3", storyId: "s-film", author: "کیوان", body: "فیلم شهرستان ما در فهرست نیست. اصلاح می‌کنید؟", status: "pending", createdAt: iso("2026-09-23T09:30:00Z") },
      { id: "c-4", storyId: "s-bus", author: "ناشناس", body: "این خبر تبلیغ یک شرکت خاص است.", status: "rejected", createdAt: iso("2026-09-22T11:00:00Z") },
      { id: "c-5", storyId: "s-film", author: "مینا", body: "نقد مردمی ایده خوبی است اگر وقت کافی باشد.", status: "approved", createdAt: iso("2026-09-23T20:00:00Z") },
    ],
    polls: [
      {
        id: "poll-1",
        question: "کدام قالب برای خبر فوری مناسب‌تر است؟",
        options: [
          { id: "op-1", label: "تیتر و دو خط", votes: 18 },
          { id: "op-2", label: "لید به‌اضافه نقل‌قول", votes: 11 },
          { id: "op-3", label: "متن کوتاه با ویدئو", votes: 7 },
        ],
        closed: false,
        shortCode: "poll-urgent",
        showOnHomepage: true,
      },
    ],
    contacts: [
      {
        id: "ct-1",
        name: "شهرام نیک‌پی",
        email: "shahram@example.com",
        subject: "درخواست مصاحبه",
        body: "برای مصاحبه درباره پیاده‌رو تجریش وقت می‌خواهم.",
        status: "new",
        createdAt: iso("2026-09-24T15:00:00Z"),
      },
      {
        id: "ct-2",
        name: "کتابخانه محله",
        email: "lib@example.com",
        subject: "درخواست پوستر",
        body: "پوستر هفته فیلم را برای تابلو می‌خواهیم.",
        status: "seen",
        createdAt: iso("2026-09-22T10:00:00Z"),
      },
      {
        id: "ct-3",
        name: "فرهاد",
        email: "farhad@example.com",
        subject: "اشکال در آرشیو",
        body: "خبر آرشیو باران را پیدا نمی‌کنم.",
        status: "closed",
        createdAt: iso("2026-09-12T10:00:00Z"),
      },
    ],
    threads: [
      {
        id: "th-1",
        title: "تیتر خبر فوری چند کلمه باشد؟",
        posts: [
          { id: "fp-1", author: "کامران شفیعی", body: "برای فوری بیشتر از دوازده کلمه نروید مگر عدد ضروری باشد.", createdAt: iso("2026-09-20T09:00:00Z") },
          { id: "fp-2", author: "سارا محمدی", body: "در انرژی گاهی عدد همان خبر است. استثنا بماند؟", createdAt: iso("2026-09-20T09:40:00Z") },
        ],
      },
      {
        id: "th-2",
        title: "نام عکاس در آلبوم",
        posts: [
          { id: "fp-3", author: "پویا کرمی", body: "زیر هر فریم نام عکاس بیاید، نه فقط در توضیح آلبوم.", createdAt: iso("2026-09-21T14:00:00Z") },
        ],
      },
    ],
    aiTaskLogs: [],
    payrollRates: [
      { id: "rate-grade-1", contentType: "grade-1", label: "خبر درجه ۱ (تحلیلی / اختصاصی)", amount: 700_000 },
      { id: "rate-grade-2", contentType: "grade-2", label: "خبر درجه ۲ (تولیدی / پوششی)", amount: 450_000 },
      { id: "rate-grade-3", contentType: "grade-3", label: "خبر درجه ۳ (تنظیمی / کوتاه)", amount: 250_000 },
      { id: "rate-news", contentType: "news", label: "خبر عادی (مرجع)", amount: 850_000 },
      { id: "rate-note", contentType: "note", label: "یادداشت", amount: 1_200_000 },
      { id: "rate-exclusive", contentType: "exclusive-report", label: "گزارش اختصاصی", amount: 2_500_000 },
      { id: "rate-interview", contentType: "interview", label: "مصاحبه و گفتگو", amount: 1_800_000 },
      { id: "rate-photo", contentType: "photo-report", label: "گزارش تصویری", amount: 1_100_000 },
    ],
    payrollApprovals: [],
    socialChannels: [
      { id: "sch-tg", channel: "telegram", enabled: true, template: "{title}\n{lead}\n{hashtags}\n{link}" },
      { id: "sch-bale", channel: "bale", enabled: true, template: "{title}\n{lead}\n{link}" },
      { id: "sch-eitaa", channel: "eitaa", enabled: true, template: "{title}\n{link}" },
      { id: "sch-rubika", channel: "rubika", enabled: false, template: "{title}\n{lead}" },
      { id: "sch-x", channel: "x", enabled: true, template: "{title}\n{link} {hashtags}" },
    ],
    productChangelog: seedChangelogReleases(),
    systemVersion: "2.4.0",
    versionHistory: [
      {
        id: "ver-1",
        version: "1.4.0",
        releasedAt: iso("2026-09-20T08:00:00Z"),
        notes: "خدمات هوش مصنوعی، قالب پورتال، جایگاه‌های صفحه اصلی و کارتابل یکپارچه.",
      },
      {
        id: "ver-2",
        version: "1.5.0",
        releasedAt: iso("2026-09-28T08:00:00Z"),
        notes: "حق‌الزحمه، گزارش سوژه، انتشار شبکه‌های اجتماعی، پرونده ویژه، نقشه رویداد و ویجت‌های زنده.",
      },
    ],
    adminTemplates: [
      {
        id: "adm-press",
        title: "کارت خبرنگاری",
        kind: "press-card",
        body: "این کارت گواهی می‌کند {name} با سمت {grade} در {newsroom} فعالیت می‌کند.",
      },
      {
        id: "adm-intro",
        title: "معرفی‌نامه اداری",
        kind: "letter",
        body: "مدیریت محترم {organization}\nبا سلام و احترام، {name} جهت پوشش خبری معرفی می‌گردد.",
      },
      {
        id: "adm-cert",
        title: "گواهی فعالیت مطبوعاتی",
        kind: "certificate",
        body: "گواهی می‌شود {name} در بازه {period} در تولید محتوای {newsroom} فعال بوده است.",
      },
    ],
    specialDossiers: [
      {
        id: "dos-1",
        title: "پرونده ویژه: حمل‌ونقل شهری",
        poster: "sand",
        description: "پیگیری لایحه، اعتراضات و اصلاحات سازمان حمل‌ونقل در پاییز ۱۴۰۵.",
        tags: ["شهر", "حمل‌ونقل", "مجلس"],
        storyIds: ["s-bus", "s-karaj"],
        featuredOnHome: true,
      },
    ],
    eventMapDefaults: { defaultRegionId: "iran" },
    eventMaps: [
      {
        id: "map-1",
        title: "راهپیمایی میدان انقلاب تا آزادی — تهران",
        description: "مسیر نمونه برای پوشش راهپیمایی شهری در تهران.",
        eventDate: "2026-10-02",
        regionId: "tehran",
        centerLat: TEHRAN_MAP_CENTER.lat,
        centerLng: TEHRAN_MAP_CENTER.lng,
        mapZoom: 14,
        viewLocked: true,
        viewCenterLat: TEHRAN_MAP_CENTER.lat,
        viewCenterLng: TEHRAN_MAP_CENTER.lng,
        viewZoom: 14,
        points: [
          { id: "pt-1", x: 0, y: 0, lat: 35.7009, lng: 51.3912, label: "میدان انقلاب", kind: "origin" },
          { id: "pt-2", x: 0, y: 0, lat: 35.6995, lng: 51.3678, label: "خیابان کارگر", kind: "waypoint" },
          { id: "pt-3", x: 0, y: 0, lat: 35.6997, lng: 51.3381, label: "میدان آزادی", kind: "destination" },
        ],
        routeOrder: ["pt-1", "pt-2", "pt-3"],
        embedCode: '<div data-event-map="map-1" class="event-map-widget" data-animated="1"></div>',
      },
    ],
    officialContacts: [
      {
        id: "oc-edu",
        fullName: "دکتر مریم احمدی",
        organization: "وزارت آموزش و پرورش",
        position: "مدیرکل روابط عمومی",
        mobile: "۰۹۱۲۱۱۱۲۲۲۲",
        officePhone: "۰۲۱-۸۸۹۹۰۰۱۱",
        email: "pr@medu.gov.local",
        editorialNotes: "ترجیح می‌دهد پرسش‌ها از قبل ایمیل شود؛ مصاحبه‌های عصر به‌موقع‌تر است.",
        tags: ["آموزش", "مصاحبه"],
      },
      {
        id: "oc-muni",
        fullName: "مهدی کریمی",
        organization: "شهرداری تهران",
        position: "معاون ارتباطات",
        mobile: "۰۹۱۹۳۳۳۴۴۴۴",
        officePhone: "۰۲۱-۱۲۳۴۵۶۷۸",
        email: "media@tehran.ir",
        editorialNotes: "برای نشست‌های خبری حداقل ۲۴ ساعت قبل هماهنگ کنید.",
        tags: ["شهری", "نشست خبری"],
      },
    ],
    reporterAgenda: seedReporterAgenda(),
    reporterTodos: [
      {
        id: "todo-1",
        userId: "u-sara",
        title: "تکمیل لید گزارش معیشت",
        done: false,
        favorite: true,
        priority: "high",
        sortOrder: 0,
        dueAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        createdAt: iso("2026-09-30T08:00:00Z"),
      },
      {
        id: "todo-2",
        userId: "u-sara",
        title: "آپلود عکس‌های میدانی",
        done: true,
        favorite: false,
        priority: "normal",
        sortOrder: 1,
        dueAt: iso("2026-09-28T18:00:00Z"),
        createdAt: iso("2026-09-27T08:00:00Z"),
      },
    ],
    reporterStickyNotes: [
      {
        id: "sn-1",
        userId: "u-sara",
        title: "تماس با منبع شهرداری",
        body: "پیگیری آمار ناوگان اتوبوسرانی تا فردا.",
        label: "work",
        color: "work",
        favorite: true,
        createdAt: iso("2026-09-29T10:00:00Z"),
        updatedAt: iso("2026-09-29T10:00:00Z"),
      },
      {
        id: "sn-2",
        userId: "u-sara",
        title: "یادآوری شخصی",
        body: "کلاس خبر نویسی پیشرفته چهارشنبه.",
        label: "personal",
        color: "personal",
        favorite: false,
        createdAt: iso("2026-09-25T10:00:00Z"),
        updatedAt: iso("2026-09-25T10:00:00Z"),
      },
    ],
    reporterFiles: [
      {
        id: "fld-root-sara",
        ownerUserId: "u-sara",
        parentId: null,
        name: "گزارش‌های میدانی",
        kind: "folder",
        sizeBytes: 0,
        mime: "",
        sharedWith: [],
        createdAt: iso("2026-09-01T08:00:00Z"),
      },
      {
        id: "fil-draft-1",
        ownerUserId: "u-sara",
        parentId: "fld-root-sara",
        name: "پیش‌نویس-معیشت.docx",
        kind: "file",
        sizeBytes: 450 * 1024 * 1024,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sharedWith: [],
        createdAt: iso("2026-09-24T12:00:00Z"),
      },
    ],
    reporterStorageQuotas: [
      { userId: "u-sara", quotaBytes: 2 * 1024 * 1024 * 1024 },
      { userId: "u-ali", quotaBytes: 1 * 1024 * 1024 * 1024 },
    ],
    editorialAnnouncements: [
      {
        id: "ann-1",
        authorUserId: "u-kamran",
        authorName: "کامران شفیعی",
        authorRole: "chief",
        title: "اولویت پوشش جلسه علنی مجلس",
        body: "تیم سیاسی تا پایان هفته گزارش تحلیلی آماده کند. تیترها با دبیر سرویس هماهنگ شود.",
        priority: "urgent",
        target: { type: "all_reporters" },
        pinnedUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: iso("2026-09-30T07:00:00Z"),
      },
    ],
    chatThreads: [
      {
        id: CHAT_THREAD_IT_SUPPORT,
        kind: "group",
        title: "پشتیبانی فنی و IT",
        participantIds: ["u-sara", "u-kamran", "u-leila", "u-ali", "u-narges"],
        lastPreview: "درخواست دسترسی یا گزارش خطای فنی را اینجا بنویسید.",
        lastAt: iso("2026-10-01T08:00:00Z"),
      },
      {
        id: "cht-sara-chief",
        kind: "direct",
        title: "کامران شفیعی (سردبیر)",
        participantIds: ["u-sara", "u-kamran"],
        lastPreview: "لطفاً لید را تا ۱۸:۰۰ بفرست.",
        lastAt: iso("2026-10-01T14:30:00Z"),
      },
      {
        id: "cht-sara-pub",
        kind: "direct",
        title: "لیلا نوری (مدیر مسئول)",
        participantIds: ["u-sara", "u-leila"],
        lastPreview: "نسخه نهایی را ببین.",
        lastAt: iso("2026-09-30T16:00:00Z"),
      },
      {
        id: "cht-desk",
        kind: "group",
        title: "میز تحریریه — صبح",
        participantIds: ["u-sara", "u-kamran", "u-leila", "u-narges", "u-ali"],
        lastPreview: "جلسه ست ۹:۳۰ در اتاق سردبیری",
        lastAt: iso("2026-10-01T06:00:00Z"),
      },
    ],
    chatMessages: [
      { id: "msg-1", threadId: "cht-sara-chief", senderUserId: "u-kamran", body: "سلام سارا، وضعیت گزارش معیشت؟", createdAt: iso("2026-10-01T14:00:00Z") },
      { id: "msg-2", threadId: "cht-sara-chief", senderUserId: "u-sara", body: "در حال جمع‌آوری آمار نهایی هستم.", createdAt: iso("2026-10-01T14:15:00Z") },
      { id: "msg-3", threadId: "cht-sara-chief", senderUserId: "u-kamran", body: "لطفاً لید را تا ۱۸:۰۰ بفرست.", createdAt: iso("2026-10-01T14:30:00Z") },
      { id: "msg-4", threadId: "cht-sara-pub", senderUserId: "u-leila", body: "نسخه نهایی را ببین.", createdAt: iso("2026-09-30T16:00:00Z") },
      { id: "msg-5", threadId: "cht-desk", senderUserId: "u-kamran", body: "جلسه ست ۹:۳۰ در اتاق سردبیری", createdAt: iso("2026-10-01T06:00:00Z") },
    ],
    chatReadCursors: [{ userId: "u-sara", threadId: "cht-sara-pub", lastReadAt: iso("2026-09-30T17:00:00Z") }],
    socialBots: {
      telegram: { token: "", channelId: "@shamseh_news" },
      bale: { token: "", channelId: "@shamseh" },
      eitaa: { token: "", channelId: "@shamseh" },
      rubika: { token: "", channelId: "shamseh_channel" },
      twitter: { apiKey: "", bearerToken: "" },
      messageTemplate: "{title}\n{lead}\n{hashtags}\n{link}",
    },
    activity: [
      { id: "act-1", at: iso("2026-09-25T06:40:00Z"), text: "پیش‌نویس خورشیدی یزد به‌روز شد" },
      { id: "act-2", at: iso("2026-09-25T04:10:00Z"), text: "خبر ماهواره به بازبینی رفت" },
      { id: "act-3", at: iso("2026-09-22T09:40:00Z"), text: "لایحه حمل‌ونقل منتشر شد" },
      { id: "act-4", at: iso("2026-09-20T10:00:00Z"), text: "خبر مجموعه کرج منتشر شد" },
    ],
  };
  seed.payrollApprovals = seedPendingApprovals(seed);
  seed.eventMaps = seed.eventMaps.map((map) => normalizeEventMapProject(map));
  return seed;
}

export function mergeSeed(raw: Partial<NewsroomData>): NewsroomData {
  const base = createSeed();
  const next: NewsroomData = { ...base };
  (Object.keys(base) as (keyof NewsroomData)[]).forEach((key) => {
    const value = raw[key];
    if (value !== undefined) next[key] = value as never;
  });
  if (!next.roles.some((role) => role.id === next.currentRoleId)) next.currentRoleId = "reporter";
  if (!next.currentUserId) {
    next.currentUserId = defaultUserIdForRole(next, next.currentRoleId);
  }
  next.people = next.people.map((person) => {
    if (person.id === "p-shamsaei" && !person.userId) return { ...person, userId: "u-leila" };
    if (person.id === "p-rezaei" && !person.userId) return { ...person, userId: "u-kamran" };
    if (person.id === "p-pouria" && !person.userId) return { ...person, userId: "u-pouria" };
    return person;
  });
  if (raw.settings) next.settings = normalizeSettings({ ...base.settings, ...raw.settings });
  else next.settings = normalizeSettings(next.settings);
  if (!Array.isArray(next.ads) || next.ads.length === 0) next.ads = base.ads;
  if (!Array.isArray(next.pitches)) next.pitches = base.pitches;
  if (!Array.isArray(next.mediaLibrary) || next.mediaLibrary.length === 0) next.mediaLibrary = base.mediaLibrary;
  next.albums = (next.albums ?? []).map((album) => normalizeAlbum(album as Album));
  if (next.albums.length === 0) next.albums = base.albums;
  next.roleModuleAccess = mergeRoleModuleAccess(base.roleModuleAccess, raw.roleModuleAccess, next.roles);
  const themeModuleKey = "template/theme";
  next.roles.forEach((role) => {
    if (role.base !== "chief" && role.base !== "publisher") return;
    const list = next.roleModuleAccess[role.id] ?? [];
    if (!list.includes(themeModuleKey)) {
      next.roleModuleAccess[role.id] = [...list, themeModuleKey];
    }
  });
  next.templateSettings = resolveTemplateSettings({ ...next, templateSettings: raw.templateSettings ?? next.templateSettings });
  if (!Array.isArray(next.aiTaskLogs)) next.aiTaskLogs = base.aiTaskLogs;
  if (!Array.isArray(next.payrollRates) || next.payrollRates.length === 0) next.payrollRates = base.payrollRates;
  else if (!next.payrollRates.some((rate) => rate.contentType === "grade-1")) {
    next.payrollRates = [...base.payrollRates.filter((rate) => rate.contentType.startsWith("grade-")), ...next.payrollRates];
  }
  if (!Array.isArray(next.payrollApprovals) || next.payrollApprovals.length === 0) {
    next.payrollApprovals = seedPendingApprovals(next);
  }
  next.stories = next.stories.map((story, index) => ({
    ...story,
    grade: story.grade ?? ((index % 3) + 1) as 1 | 2 | 3,
  }));
  next.pitches = (next.pitches ?? []).map((pitch) => ({
    ...pitch,
    contentType: pitch.contentType ?? "field-report",
  }));
  if (!Array.isArray(next.socialChannels) || next.socialChannels.length === 0) next.socialChannels = base.socialChannels;
  if (!Array.isArray(next.versionHistory) || next.versionHistory.length === 0) next.versionHistory = base.versionHistory;
  if (!Array.isArray(next.productChangelog) || next.productChangelog.length === 0) {
    next.productChangelog = base.productChangelog;
  }
  if (!next.systemVersion) {
    next.systemVersion = next.productChangelog?.[0]?.version ?? base.systemVersion;
  }
  if (!Array.isArray(next.adminTemplates) || next.adminTemplates.length === 0) next.adminTemplates = base.adminTemplates;
  if (!Array.isArray(next.specialDossiers)) next.specialDossiers = base.specialDossiers;
  if (!Array.isArray(next.eventMaps)) next.eventMaps = base.eventMaps;
  if (!Array.isArray(next.officialContacts) || next.officialContacts.length === 0) next.officialContacts = base.officialContacts;
  if (!Array.isArray(next.reporterAgenda) || next.reporterAgenda.length === 0) next.reporterAgenda = base.reporterAgenda;
  next.tables = (next.tables ?? []).map((table) => ({
    ...table,
    placement: table.placement ?? "story-attach",
  }));
  for (const seedTable of base.tables) {
    if (!next.tables.some((table) => table.id === seedTable.id)) {
      next.tables.push(seedTable);
    }
  }
  next.polls = (next.polls ?? []).map((poll) => ({
    ...poll,
    shortCode: poll.shortCode ?? poll.id.replace(/^poll-/, "poll-"),
    showOnHomepage: poll.showOnHomepage ?? false,
  }));
  next.tickets = (next.tickets ?? []).map((ticket) => ({
    ...ticket,
    recipient: ticket.recipient ?? "chief",
  }));
  next.eventMaps = (next.eventMaps ?? []).map((map) => {
    const points = map.points.map((point, index) => ({
      id: point.id ?? `pt-${map.id}-${index}`,
      x: point.x,
      y: point.y,
      label: point.label,
      kind: point.kind,
      lat: point.lat,
      lng: point.lng,
    }));
    const routeOrder = map.routeOrder?.length ? map.routeOrder : points.map((p) => p.id);
    const withMeta = {
      ...map,
      regionId: map.regionId ?? (map.mapZoom != null && map.mapZoom >= 10 ? "tehran" : "iran"),
      centerLat: map.centerLat ?? IRAN_MAP_CENTER.lat,
      centerLng: map.centerLng ?? IRAN_MAP_CENTER.lng,
      mapZoom: map.mapZoom ?? IRAN_MAP_CENTER.zoom,
      points,
      routeOrder,
      embedCode: map.embedCode?.includes("data-animated")
        ? map.embedCode
        : `<div data-event-map="${map.id}" class="event-map-widget" data-animated="1"></div>`,
    };
    return normalizeEventMapProject(withMeta);
  });
  if (!next.eventMapDefaults?.defaultRegionId) {
    next.eventMapDefaults = base.eventMapDefaults ?? { defaultRegionId: "iran" };
  }
  const changelogModuleKey = "infra/changelog";
  next.roles.forEach((role) => {
    const list = next.roleModuleAccess[role.id] ?? [];
    if (!list.includes(changelogModuleKey)) {
      next.roleModuleAccess[role.id] = [...list, changelogModuleKey];
    }
  });
  if (!next.chatThreads.some((thread) => thread.id === CHAT_THREAD_IT_SUPPORT)) {
    const support = base.chatThreads.find((thread) => thread.id === CHAT_THREAD_IT_SUPPORT);
    if (support) next.chatThreads = [support, ...next.chatThreads];
  }
  next.users = next.users.map((user) => ({
    ...user,
    reporterGrade: user.reporterGrade ?? (user.roleId === "reporter" ? "junior" : undefined),
  }));
  const aiHubKey = "editorial/ai-hub";
  const chiefEnterpriseKeys = [
    aiHubKey,
    "media/people",
    "reports/pitch-performance",
    "reports/payroll",
    "reports/reporter-period",
    "admin/admin-affairs",
    "structure/dossiers",
    "media/event-map",
    "admin/official-contacts",
    "admin/announcements",
    "editorial/agenda",
  ];
  next.roles.forEach((role) => {
    const list = next.roleModuleAccess[role.id] ?? [];
    const keys = role.base === "reporter" ? [aiHubKey] : role.base === "chief" || role.base === "publisher" ? chiefEnterpriseKeys : [];
    let merged = list;
    keys.forEach((key) => {
      if (!merged.includes(key)) merged = [...merged, key];
    });
    next.roleModuleAccess[role.id] = merged;
  });
  if (!raw.userModuleAccess || typeof raw.userModuleAccess !== "object") next.userModuleAccess = base.userModuleAccess;
  else next.userModuleAccess = { ...base.userModuleAccess, ...raw.userModuleAccess };
  next.roleModuleAccess = Object.fromEntries(
    Object.entries(next.roleModuleAccess).map(([roleId, keys]) => [roleId, migrateModuleAccessList(keys)]),
  );
  next.userModuleAccess = Object.fromEntries(
    Object.entries(next.userModuleAccess).map(([userId, keys]) => [userId, migrateModuleAccessList(keys)]),
  );
  const legacyPeople = next.people.some((person) => person.id === "p-leila" || person.id === "p-kamran");
  if (legacyPeople || next.people.length === 0) next.people = base.people;
  next.people = next.people.map((person) => {
    const seedPerson = base.people.find((item) => item.id === person.id);
    return {
      ...person,
      joinedAt: person.joinedAt ?? seedPerson?.joinedAt,
      editorialRank: person.editorialRank ?? seedPerson?.editorialRank ?? "",
      phone: person.phone ?? seedPerson?.phone,
      email: person.email ?? seedPerson?.email,
      desk: person.desk ?? seedPerson?.desk,
      userId: person.userId ?? seedPerson?.userId,
      reporterTier: person.reporterTier ?? seedPerson?.reporterTier,
      tierNote: person.tierNote ?? seedPerson?.tierNote,
      interviewCount: person.interviewCount ?? seedPerson?.interviewCount,
    };
  });
  if (!next.contactPage?.intro) next.contactPage = base.contactPage;
  next.contacts = (next.contacts ?? []).map((message) => ({
    ...message,
    subject: message.subject?.trim() || "بدون عنوان",
  }));
  if (!Array.isArray(next.reporterTodos)) next.reporterTodos = base.reporterTodos;
  if (!Array.isArray(next.reporterStickyNotes)) next.reporterStickyNotes = base.reporterStickyNotes;
  if (!Array.isArray(next.reporterFiles)) next.reporterFiles = base.reporterFiles;
  if (!Array.isArray(next.reporterStorageQuotas)) next.reporterStorageQuotas = base.reporterStorageQuotas;
  if (!Array.isArray(next.editorialAnnouncements)) next.editorialAnnouncements = base.editorialAnnouncements;
  if (!Array.isArray(next.chatThreads)) next.chatThreads = base.chatThreads;
  if (!Array.isArray(next.chatMessages)) next.chatMessages = base.chatMessages;
  if (!Array.isArray(next.upcomingEvents) || next.upcomingEvents.length === 0) next.upcomingEvents = base.upcomingEvents;
  if (!Array.isArray(next.chatReadCursors)) next.chatReadCursors = base.chatReadCursors;
  if (!next.socialBots?.messageTemplate) next.socialBots = base.socialBots;
  const reporterHubKeys = [
    "reporters/my-profile",
    "reporters/my-news",
    "reporters/my-payroll",
    "reporters/my-admin-affairs",
    "reporters/my-pitches",
    "reporters/my-agenda",
    "reporters/my-tasks",
    "reporters/my-notes",
    "reporters/file-manager",
  ];
  next.roles.forEach((role) => {
    if (role.base !== "reporter" && role.base !== "chief" && role.base !== "publisher") return;
    const list = next.roleModuleAccess[role.id] ?? [];
    let merged = list;
    reporterHubKeys.forEach((key) => {
      if (!merged.includes(key)) merged = [...merged, key];
    });
    next.roleModuleAccess[role.id] = merged;
  });
  return next;
}

export function normalizeSettings(settings: Partial<Settings> & Pick<Settings, "newsroomName" | "tagline" | "pageSize">): Settings {
  const defaults = defaultBrandingSettings();
  const normalized: Settings = {
    newsroomName: settings.newsroomName?.trim() || defaults.newsroomName,
    tagline: settings.tagline ?? defaults.tagline,
    pageSize: settings.pageSize ?? 20,
    mediaName: settings.mediaName ?? defaults.mediaName,
    mediaDisplayTitle: settings.mediaDisplayTitle ?? defaults.mediaDisplayTitle,
    brandMark: settings.brandMark ?? defaults.brandMark,
  };
  if (normalized.newsroomName === LEGACY_NEWSROOM_NAME && !settings.mediaName?.trim()) {
    return applyBrandingDefaults(normalized);
  }
  return applyBrandingDefaults(normalized);
}
