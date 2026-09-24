// Seed domain data derived from the project specification (طرح).
// Two educational camp complexes with dormitory rooms, suites/villas,
// classrooms, halls, an amphitheater, a pool and a dining hall.

const BED_RATE = 800000; // ریال / تخت / شب — used to derive dormitory room prices
const SUITE_RATE = 6000000; // ریال / شب برای سوئیت/ویلا

// وعده‌های غذایی (سالن غذاخوری بر اساس «وعده» ظرفیت دارد، نه شب)
export const MEAL_SLOTS = [
  { id: "breakfast", label: "صبحانه", pricePerPerson: 250000 },
  { id: "lunch", label: "ناهار", pricePerPerson: 650000 },
  { id: "dinner", label: "شام", pricePerPerson: 600000 },
  { id: "snack", label: "میان‌وعده / پذیرایی", pricePerPerson: 180000 },
];

// تایم‌اسلات‌های استفاده از سالن‌ها و کلاس‌ها (رزرو انحصاری بر اساس بازه)
export const TIME_SLOTS = [
  { id: "morning", label: "صبح (۸ تا ۱۲)" },
  { id: "afternoon", label: "بعدازظهر (۱۳ تا ۱۷)" },
  { id: "evening", label: "عصر (۱۷ تا ۲۱)" },
];

// سطوح دسترسی کاربران
export const ROLES = [
  { id: "camps_admin", title: "مدیریت اردوگاه‌ها", level: "مدیریت کل" },
  { id: "camp_manager", title: "مدیر اردوگاه", level: "مدیریت" },
  { id: "reception", title: "مسئول پذیرش اردوگاه", level: "عملیاتی" },
  { id: "dining_manager", title: "مدیر سالن پذیرایی", level: "عملیاتی" },
  { id: "finance_manager", title: "مدیر مالی اردوگاه", level: "مالی" },
  { id: "supervisor", title: "نظارتی", level: "نظارت" },
  { id: "customer", title: "مشتری / مجری دوره", level: "مشتری" },
];

// تخفیف‌ها
export const DISCOUNTS = [
  { code: "FARMANDEHI", title: "تخفیف فرماندهی", percent: 50 },
  { code: "MOAVEN", title: "تخفیف معاون اردوئی", percent: 40 },
  { code: "BASIJ", title: "تخفیف کارکنان سازمان و نواحی بسیج دانشجویی", percent: 30 },
  { code: "SEPAH", title: "تخفیف کارکنان رده‌های سپاه", percent: 20 },
];

export const TAX_RATE = 0.09; // مالیات بر ارزش افزوده

export const CAMPS = [
  {
    id: "sayyed-abali",
    name: "مجتمع فرهنگی-آموزشی سیدالشهدا (ع) — آبعلی",
    location: "استان تهران، آبعلی",
  },
  {
    id: "shohada-mashhad",
    name: "مجتمع آموزشی شهدای دانشجو — مشهد مقدس",
    location: "استان خراسان رضوی، مشهد مقدس",
  },
];

// اتاق‌های خوابگاهی ساختمان شهید سلیمانی (آبعلی) — ظرفیت هر اتاق به تخت
const SOLEIMANI_FLOORS = {
  اول: { 101: 12, 102: 8, 103: 8, 104: 8, 105: 8, 106: 8, 107: 8, 108: 12, 110: 6, 112: 8, 113: 8, 114: 8, 115: 12 },
  دوم: { 201: 4, 202: 8, 203: 8, 204: 8, 205: 8, 206: 8, 207: 8, 209: 6, 210: 6, 211: 8, 212: 8, 213: 8, 214: 10 },
  سوم: { 301: 12, 302: 8, 303: 8, 304: 8, 305: 8, 306: 8, 307: 8, 308: 12, 309: 12, 310: 6, 311: 6, 312: 8, 313: 8, 314: 8, 315: 12 },
  چهارم: { 401: 12, 402: 8, 403: 6, 404: 8, 405: 8, 406: 8, 407: 6, 408: 12, 409: 14, 410: 6, 411: 6, 412: 8, 413: 8, 414: 8, 415: 12 },
  پنجم: { 501: 12, 502: 8, 503: 8, 504: 8, 505: 8, 506: 8, 507: 8, 508: 12, 509: 8, 510: 6, 511: 8, 512: 8, 513: 8, 514: 12 },
  ششم: { 601: 14, 602: 8, 603: 8, 604: 8, 605: 8, 606: 8, 607: 8, 608: 14, 609: 14, 610: 6, 611: 6, 612: 8, 613: 8, 614: 8, 615: 12 },
  هفتم: { 701: 14, 702: 10, 703: 8, 704: 8, 705: 8, 706: 8, 708: 14, 709: 14, 710: 6, 711: 6, 712: 8, 713: 8, 714: 10, 715: 14 },
};

// کلاس‌های ساختمان میثاق (آبعلی)
const MISAGH_CLASSES = {
  101: 85, 201: 40, 202: 40, 203: 40, 206: 40, 301: 40, 302: 40, 303: 40, 304: 10,
  305: 10, 306: 40, 401: 40, 402: 40, 403: 40, 404: 10, 405: 10, 406: 40,
};

function buildResources() {
  const resources = [];

  // ---- آبعلی: خوابگاه شهید سلیمانی ----
  for (const [floor, rooms] of Object.entries(SOLEIMANI_FLOORS)) {
    for (const [roomNo, capacity] of Object.entries(rooms)) {
      resources.push({
        id: `abali-sol-${roomNo}`,
        campId: "sayyed-abali",
        building: "ساختمان شهید سلیمانی",
        type: "room",
        bookingUnit: "night",
        name: `اتاق ${roomNo}`,
        floor,
        capacity,
        pricePerNight: capacity * BED_RATE,
        amenities: ["تخت‌خواب", "سرویس بهداشتی", "سیستم سرمایش/گرمایش"],
      });
    }
  }

  // ---- آبعلی: سوئیت‌ها و ویلاها ----
  const abaliSuiteAmenities = [
    "تخت دو نفره", "۴ عدد مبل تخت‌شو", "سرویس بهداشتی ایرانی", "یخچال", "تلویزیون", "آشپزخانه",
  ];
  for (const unit of [14, 15]) {
    resources.push({
      id: `abali-suite-vozvaei-${unit}`,
      campId: "sayyed-abali",
      building: "سوئیت‌ها و ویلاها",
      type: "suite",
      bookingUnit: "night",
      name: `سوئیت شهید وزوایی — واحد ${unit}`,
      floor: "-",
      capacity: 6,
      pricePerNight: SUITE_RATE,
      amenities: abaliSuiteAmenities,
    });
  }
  for (let i = 1; i <= 12; i++) {
    resources.push({
      id: `abali-suite-${i}`,
      campId: "sayyed-abali",
      building: "سوئیت‌ها و ویلاها",
      type: "suite",
      bookingUnit: "night",
      name: `سوئیت شماره ${i}`,
      floor: "-",
      capacity: 6,
      pricePerNight: SUITE_RATE,
      amenities: abaliSuiteAmenities,
    });
  }

  // ---- آبعلی: کلاس‌های میثاق ----
  for (const [classNo, capacity] of Object.entries(MISAGH_CLASSES)) {
    resources.push({
      id: `abali-class-${classNo}`,
      campId: "sayyed-abali",
      building: "ساختمان میثاق",
      type: "class",
      bookingUnit: "slot",
      exclusive: true,
      name: `کلاس ${classNo}`,
      capacity,
      pricePerSlot: 2500000,
      amenities: ["وایت‌برد", "میز و صندلی"],
    });
  }

  // ---- آبعلی: سالن اجلاس ----
  resources.push({
    id: "abali-hall-ejlas",
    campId: "sayyed-abali",
    building: "سالن اجلاس",
    type: "hall",
    bookingUnit: "slot",
    exclusive: true,
    name: "سالن اجلاس",
    capacity: 67,
    pricePerSlot: 12000000,
    amenities: ["سیستم صوتی", "ویدئوپروژکتور"],
  });

  // ---- آبعلی: سالن آمفی‌تئاتر ----
  resources.push({
    id: "abali-amphitheater",
    campId: "sayyed-abali",
    building: "سالن آمفی‌تئاتر",
    type: "amphitheater",
    bookingUnit: "slot",
    exclusive: true,
    name: "سالن آمفی‌تئاتر",
    capacity: 350,
    pricePerSlot: 30000000,
    amenities: ["سیستم صوتی", "سیستم تهویه", "اتاق کنترل"],
  });

  // ---- آبعلی: استخر ----
  resources.push({
    id: "abali-pool",
    campId: "sayyed-abali",
    building: "استخر",
    type: "pool",
    bookingUnit: "slot",
    exclusive: true,
    name: "استخر",
    capacity: 30,
    pricePerSlot: 5000000,
    amenities: ["سونا", "جکوزی"],
  });

  // ---- آبعلی: سالن غذاخوری ----
  resources.push({
    id: "abali-dining",
    campId: "sayyed-abali",
    building: "سالن پذیرایی و صرف غذا",
    type: "dining",
    bookingUnit: "meal",
    name: "سالن پذیرایی و صرف غذا",
    capacity: 500,
    amenities: ["سلف‌سرویس", "ظرفیت وعده‌ای"],
  });

  // ---- مشهد: خوابگاه گروهی ----
  const mashhadRooms = [
    { no: 101, floor: "اول", name: "شهید حسین علم‌الهدی", cap: 14 },
    { no: 102, floor: "اول", name: "شهید علیرضا موحددانش", cap: 16 },
    { no: 201, floor: "دوم", name: "شهید محمد منتظرالقائم", cap: 14 },
    { no: 202, floor: "دوم", name: "شهید عباس ورامینی", cap: 14 },
    { no: 203, floor: "دوم", name: "شهید محسن وزوایی", cap: 16 },
    { no: 204, floor: "دوم", name: "شهید حمید باکری", cap: 16 },
  ];
  for (const r of mashhadRooms) {
    resources.push({
      id: `mashhad-room-${r.no}`,
      campId: "shohada-mashhad",
      building: "خوابگاه گروهی",
      type: "room",
      bookingUnit: "night",
      name: `اتاق ${r.no} — ${r.name}`,
      floor: r.floor,
      capacity: r.cap,
      pricePerNight: r.cap * BED_RATE,
      amenities: ["تخت‌خواب", "سرویس بهداشتی", "سیستم سرمایش/گرمایش"],
    });
  }

  // ---- مشهد: سوئیت‌ها ----
  const mashhadSuites = [
    { no: 301, name: "شهید حسن باقری", cap: 7, layout: "بدون خواب" },
    { no: 302, name: "شهید مهدی زین‌الدین", cap: 5, layout: "تک‌خواب" },
    { no: 303, name: "شهید محمود شهبازی", cap: 6, layout: "دو خواب" },
    { no: 304, name: "شهید مهدی رجب‌بیگی", cap: 6, layout: "دو خواب" },
  ];
  for (const s of mashhadSuites) {
    resources.push({
      id: `mashhad-suite-${s.no}`,
      campId: "shohada-mashhad",
      building: "سوئیت‌ها",
      type: "suite",
      bookingUnit: "night",
      name: `سوئیت ${s.no} — ${s.name}`,
      floor: "-",
      capacity: s.cap,
      pricePerNight: SUITE_RATE,
      amenities: [s.layout, "آشپزخانه", "سرویس بهداشتی", "تخت دونفره", "مبل تخت‌شو", "کمد", "یخچال", "تلویزیون", "سرمایش/گرمایش"],
    });
  }

  // ---- مشهد: کلاس‌ها ----
  const mashhadClasses = ["شهید عباس دانشگر", "شهید حسین زینال‌زاده", "شهید دانیال رضازاده"];
  mashhadClasses.forEach((name, idx) => {
    resources.push({
      id: `mashhad-class-${idx + 1}`,
      campId: "shohada-mashhad",
      building: "فضای آموزشی",
      type: "class",
      bookingUnit: "slot",
      exclusive: true,
      name: `کلاس ${name}`,
      capacity: 30,
      pricePerSlot: 2500000,
      amenities: ["وایت‌برد", "میز", "صندلی استاد"],
    });
  });

  // ---- مشهد: سالن غذاخوری ----
  resources.push({
    id: "mashhad-dining",
    campId: "shohada-mashhad",
    building: "سالن پذیرایی",
    type: "dining",
    bookingUnit: "meal",
    name: "سالن پذیرایی و صرف غذا",
    capacity: 200,
    amenities: ["سلف‌سرویس", "ظرفیت وعده‌ای"],
  });

  return resources;
}

export const RESOURCES = buildResources();

export const RESOURCE_TYPE_LABELS = {
  room: "اتاق خوابگاهی",
  suite: "سوئیت / ویلا",
  class: "کلاس آموزشی",
  hall: "سالن اجلاس",
  amphitheater: "آمفی‌تئاتر",
  pool: "استخر",
  dining: "سالن غذاخوری",
};

export function getResource(id) {
  return RESOURCES.find((r) => r.id === id) ?? null;
}

export function getDiscount(code) {
  if (!code) return null;
  return DISCOUNTS.find((d) => d.code === String(code).trim().toUpperCase()) ?? null;
}
