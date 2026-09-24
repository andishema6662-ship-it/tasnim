import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_FILE = join(DATA_DIR, "reservations.json");

const SEED_CAMPS = [
  {
    id: "damavand",
    name: "اردوگاه دماوند",
    location: "استان مازندران، دامنه قله دماوند",
    description:
      "اردوگاهی در ارتفاعات با چشم‌انداز مستقیم به قله دماوند، مناسب کوه‌نوردان و علاقه‌مندان به طبیعت‌گردی.",
    pricePerNight: 1800000,
    capacity: 40,
    image: "🏔️",
    amenities: ["آتش‌گاه", "سرویس بهداشتی", "آب آشامیدنی", "پارکینگ"],
  },
  {
    id: "jangal-abr",
    name: "اردوگاه جنگل ابر",
    location: "استان سمنان، شاهرود",
    description:
      "اقامت در دل جنگل مه‌آلود ابر با کلبه‌های چوبی و مسیرهای پیاده‌روی جنگلی.",
    pricePerNight: 2200000,
    capacity: 25,
    image: "🌲",
    amenities: ["کلبه چوبی", "برق", "سرویس بهداشتی", "آلاچیق"],
  },
  {
    id: "kavir-maranjab",
    name: "اردوگاه کویر مرنجاب",
    location: "استان اصفهان، آران و بیدگل",
    description:
      "تجربه شب‌مانی در کویر مرنجاب با آسمان پرستاره و تور بازدید از دریاچه نمک.",
    pricePerNight: 1500000,
    capacity: 60,
    image: "🏜️",
    amenities: ["چادر صحرایی", "تور شبانه", "آتش‌گاه", "راهنمای محلی"],
  },
  {
    id: "sahel-qeshm",
    name: "اردوگاه ساحلی قشم",
    location: "استان هرمزگان، جزیره قشم",
    description:
      "اردوگاه کنار ساحل با دسترسی به دره ستارگان و جنگل حرا، مناسب خانواده‌ها.",
    pricePerNight: 2600000,
    capacity: 35,
    image: "🏖️",
    amenities: ["ساحل اختصاصی", "قایق‌سواری", "سرویس بهداشتی", "رستوران"],
  },
];

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify({ reservations: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf8"));
  } catch {
    return { reservations: [] };
  }
}

function writeStore(store) {
  ensureStore();
  writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function getCamps() {
  return SEED_CAMPS;
}

export function getCamp(id) {
  return SEED_CAMPS.find((c) => c.id === id) ?? null;
}

export function getReservations() {
  return readStore().reservations;
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function rangesOverlap(aIn, aOut, bIn, bOut) {
  return new Date(aIn) < new Date(bOut) && new Date(bIn) < new Date(aOut);
}

// Returns how many guest-spots are already booked for a camp on an overlapping range.
export function bookedGuests(campId, checkIn, checkOut, excludeId = null) {
  return getReservations()
    .filter((r) => r.campId === campId && r.id !== excludeId)
    .filter((r) => rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut))
    .reduce((sum, r) => sum + r.guests, 0);
}

export function checkAvailability(campId, checkIn, checkOut, guests) {
  const camp = getCamp(campId);
  if (!camp) return { ok: false, reason: "اردوگاه یافت نشد." };

  const nights = nightsBetween(checkIn, checkOut);
  if (Number.isNaN(nights) || nights <= 0) {
    return { ok: false, reason: "تاریخ خروج باید بعد از تاریخ ورود باشد." };
  }
  if (!Number.isInteger(guests) || guests <= 0) {
    return { ok: false, reason: "تعداد نفرات باید عددی مثبت باشد." };
  }

  const alreadyBooked = bookedGuests(campId, checkIn, checkOut);
  const remaining = camp.capacity - alreadyBooked;
  if (guests > remaining) {
    return {
      ok: false,
      reason: `ظرفیت کافی نیست. ظرفیت باقی‌مانده برای این بازه: ${remaining} نفر.`,
      remaining,
    };
  }

  return { ok: true, nights, remaining, totalPrice: nights * camp.pricePerNight };
}

export function createReservation({ campId, guestName, phone, checkIn, checkOut, guests }) {
  const availability = checkAvailability(campId, checkIn, checkOut, guests);
  if (!availability.ok) {
    const err = new Error(availability.reason);
    err.code = "UNAVAILABLE";
    throw err;
  }

  const store = readStore();
  const reservation = {
    id: `RSV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    campId,
    guestName,
    phone,
    checkIn,
    checkOut,
    guests,
    nights: availability.nights,
    totalPrice: availability.totalPrice,
    createdAt: new Date().toISOString(),
  };
  store.reservations.push(reservation);
  writeStore(store);
  return reservation;
}
