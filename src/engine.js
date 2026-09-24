// Capacity / conflict engine + pricing, per the specification.
// - room / suite  -> booked by NIGHT (date range), capacity in beds
// - class / hall / amphitheater / pool -> booked by SLOT (date + time slot), EXCLUSIVE
// - dining -> booked by MEAL (date + meal), capacity in persons

import {
  getResource,
  getDiscount,
  MEAL_SLOTS,
  TIME_SLOTS,
  TAX_RATE,
} from "./data.js";
import { activeBookings } from "./store.js";

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const ms = end - start;
  if (Number.isNaN(ms)) return NaN;
  return Math.round(ms / 86400000);
}

function rangesOverlap(aIn, aOut, bIn, bOut) {
  return new Date(aIn) < new Date(bOut) && new Date(bIn) < new Date(aOut);
}

// ---- Availability checks ---------------------------------------------------

export function checkNightItem(item) {
  const res = getResource(item.resourceId);
  if (!res) return { ok: false, reason: "منبع یافت نشد." };
  if (res.bookingUnit !== "night") {
    return { ok: false, reason: `«${res.name}» بر اساس شب رزرو نمی‌شود.` };
  }
  const nights = nightsBetween(item.checkIn, item.checkOut);
  if (Number.isNaN(nights) || nights <= 0) {
    return { ok: false, reason: "تاریخ خروج باید بعد از تاریخ ورود باشد." };
  }
  const guests = Number(item.guests);
  if (!Number.isInteger(guests) || guests <= 0) {
    return { ok: false, reason: "تعداد نفرات باید عددی مثبت باشد." };
  }

  const bookedBeds = activeBookings()
    .filter((b) => b.resourceId === item.resourceId && b.unit === "night")
    .filter((b) => rangesOverlap(item.checkIn, item.checkOut, b.checkIn, b.checkOut))
    .reduce((sum, b) => sum + Number(b.guests), 0);

  const remaining = res.capacity - bookedBeds;
  if (guests > remaining) {
    return {
      ok: false,
      reason: `ظرفیت «${res.name}» کافی نیست. باقی‌مانده: ${remaining} تخت.`,
      remaining,
    };
  }
  return { ok: true, nights, remaining, lineTotal: nights * res.pricePerNight };
}

export function checkSlotItem(item) {
  const res = getResource(item.resourceId);
  if (!res) return { ok: false, reason: "منبع یافت نشد." };
  if (res.bookingUnit !== "slot") {
    return { ok: false, reason: `«${res.name}» بر اساس تایم‌اسلات رزرو نمی‌شود.` };
  }
  if (!item.date) return { ok: false, reason: "تاریخ استفاده الزامی است." };
  const slots = Array.isArray(item.slots) ? item.slots : [];
  if (!slots.length) return { ok: false, reason: "حداقل یک تایم‌اسلات انتخاب کنید." };
  const validIds = new Set(TIME_SLOTS.map((s) => s.id));
  for (const s of slots) {
    if (!validIds.has(s)) return { ok: false, reason: `تایم‌اسلات نامعتبر: ${s}` };
  }

  // Exclusive resources: no other active booking may hold the same date+slot.
  const conflicts = activeBookings().filter(
    (b) =>
      b.resourceId === item.resourceId &&
      b.unit === "slot" &&
      b.date === item.date &&
      (b.slots || []).some((s) => slots.includes(s))
  );
  if (conflicts.length) {
    const clashSlots = [
      ...new Set(conflicts.flatMap((c) => c.slots).filter((s) => slots.includes(s))),
    ];
    const labels = clashSlots
      .map((id) => TIME_SLOTS.find((t) => t.id === id)?.label ?? id)
      .join("، ");
    return {
      ok: false,
      reason: `«${res.name}» در تاریخ ${item.date} برای این بازه(ها) قبلاً رزرو شده است: ${labels}`,
    };
  }
  return { ok: true, lineTotal: slots.length * res.pricePerSlot };
}

export function checkMealItem(item) {
  const res = getResource(item.resourceId);
  if (!res) return { ok: false, reason: "منبع یافت نشد." };
  if (res.bookingUnit !== "meal") {
    return { ok: false, reason: `«${res.name}» سالن غذاخوری نیست.` };
  }
  if (!item.date) return { ok: false, reason: "تاریخ وعده الزامی است." };
  const meal = MEAL_SLOTS.find((m) => m.id === item.meal);
  if (!meal) return { ok: false, reason: `وعده نامعتبر: ${item.meal}` };
  const persons = Number(item.persons);
  if (!Number.isInteger(persons) || persons <= 0) {
    return { ok: false, reason: "تعداد نفرات وعده باید عددی مثبت باشد." };
  }

  const bookedPersons = activeBookings()
    .filter(
      (b) =>
        b.resourceId === item.resourceId &&
        b.unit === "meal" &&
        b.date === item.date &&
        b.meal === item.meal
    )
    .reduce((sum, b) => sum + Number(b.persons), 0);

  const remaining = res.capacity - bookedPersons;
  if (persons > remaining) {
    return {
      ok: false,
      reason: `ظرفیت «${meal.label}» در تاریخ ${item.date} کافی نیست. باقی‌مانده: ${remaining} نفر.`,
      remaining,
    };
  }
  return { ok: true, lineTotal: persons * meal.pricePerPerson };
}

export function checkItem(item) {
  if (item.unit === "night") return checkNightItem(item);
  if (item.unit === "slot") return checkSlotItem(item);
  if (item.unit === "meal") return checkMealItem(item);
  return { ok: false, reason: `نوع رزرو نامعتبر: ${item.unit}` };
}

// ---- Pricing / invoice -----------------------------------------------------

function describeItem(item) {
  const res = getResource(item.resourceId);
  const base = { resourceId: item.resourceId, resourceName: res?.name, type: res?.type, unit: item.unit };
  if (item.unit === "night") {
    return { ...base, checkIn: item.checkIn, checkOut: item.checkOut, guests: Number(item.guests) };
  }
  if (item.unit === "slot") {
    return { ...base, date: item.date, slots: item.slots };
  }
  return { ...base, date: item.date, meal: item.meal, persons: Number(item.persons) };
}

// Validates all items, computes each line total and the full invoice with
// discount and tax. Throws with code UNAVAILABLE if any item cannot be booked.
export function buildInvoice(items, discountCode) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error("حداقل یک آیتم برای رزرو لازم است.");
    err.code = "VALIDATION";
    throw err;
  }

  const lines = [];
  for (const item of items) {
    const result = checkItem(item);
    if (!result.ok) {
      const err = new Error(result.reason);
      err.code = "UNAVAILABLE";
      throw err;
    }
    lines.push({ ...describeItem(item), lineTotal: result.lineTotal, nights: result.nights });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const discount = getDiscount(discountCode);
  const discountPercent = discount ? discount.percent : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discountAmount;
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;

  return {
    lines,
    subtotal,
    discount: discount ? { code: discount.code, title: discount.title, percent: discount.percent } : null,
    discountAmount,
    taxRate: TAX_RATE,
    tax,
    total,
  };
}

// Normalizes raw items into the stored booking shape.
export function normalizeItems(items) {
  return items.map((item) => {
    if (item.unit === "night") {
      return {
        resourceId: item.resourceId,
        unit: "night",
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        guests: Number(item.guests),
      };
    }
    if (item.unit === "slot") {
      return {
        resourceId: item.resourceId,
        unit: "slot",
        date: item.date,
        slots: item.slots,
      };
    }
    return {
      resourceId: item.resourceId,
      unit: "meal",
      date: item.date,
      meal: item.meal,
      persons: Number(item.persons),
    };
  });
}
