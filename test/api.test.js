import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = join(__dirname, "..", "data", "store.json");
const CAMPS = join(__dirname, "..", "data", "camps.json");

// Start from a clean store so capacity/conflict assertions are deterministic.
if (existsSync(STORE)) rmSync(STORE);
if (existsSync(CAMPS)) rmSync(CAMPS);

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const app = (await import("../src/server.js")).default;

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
  if (existsSync(STORE)) rmSync(STORE);
  if (existsSync(CAMPS)) rmSync(CAMPS);
});

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function put(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("health is ok", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal((await res.json()).status, "ok");
});

test("camps and resources are seeded", async () => {
  const camps = await (await fetch(`${base}/api/camps`)).json();
  assert.equal(camps.length, 2);
  const resources = await (await fetch(`${base}/api/resources`)).json();
  assert.ok(resources.length > 100, `expected many resources, got ${resources.length}`);

  const rooms = await (await fetch(`${base}/api/resources?type=room`)).json();
  assert.ok(rooms.every((r) => r.bookingUnit === "night"));
  const dining = await (await fetch(`${base}/api/resources?type=dining`)).json();
  assert.ok(dining.every((r) => r.bookingUnit === "meal"));
});

test("invoice preview computes discount and 9% tax", async () => {
  // امفی‌تئاتر: pricePerSlot 30,000,000 ، دو اسلات => 60,000,000
  const { status, body } = await post("/api/invoice/preview", {
    items: [
      { resourceId: "abali-amphitheater", unit: "slot", date: "2030-03-01", slots: ["morning", "afternoon"] },
    ],
    discountCode: "FARMANDEHI",
  });
  assert.equal(status, 200);
  assert.equal(body.subtotal, 60000000);
  assert.equal(body.discount.percent, 50);
  assert.equal(body.discountAmount, 30000000);
  assert.equal(body.tax, Math.round((60000000 - 30000000) * 0.09));
  assert.equal(body.total, 30000000 + body.tax);
});

test("exclusive slot resource cannot be double-booked", async () => {
  const first = await post("/api/requests", {
    customer: { name: "مسئول اول", phone: "0912" },
    courseTitle: "دوره الف",
    items: [{ resourceId: "abali-hall-ejlas", unit: "slot", date: "2030-04-10", slots: ["morning"] }],
  });
  assert.equal(first.status, 201);

  const clash = await post("/api/invoice/preview", {
    items: [{ resourceId: "abali-hall-ejlas", unit: "slot", date: "2030-04-10", slots: ["morning"] }],
  });
  assert.equal(clash.status, 409);

  // a different slot on the same day is fine
  const ok = await post("/api/invoice/preview", {
    items: [{ resourceId: "abali-hall-ejlas", unit: "slot", date: "2030-04-10", slots: ["evening"] }],
  });
  assert.equal(ok.status, 200);
});

test("room capacity is enforced across overlapping nights", async () => {
  // اتاق 201 ظرفیت 4 تخت
  const first = await post("/api/requests", {
    customer: { name: "گروه ۱", phone: "0912" },
    items: [{ resourceId: "abali-sol-201", unit: "night", checkIn: "2030-05-01", checkOut: "2030-05-03", guests: 3 }],
  });
  assert.equal(first.status, 201);

  const overflow = await post("/api/invoice/preview", {
    items: [{ resourceId: "abali-sol-201", unit: "night", checkIn: "2030-05-02", checkOut: "2030-05-04", guests: 2 }],
  });
  assert.equal(overflow.status, 409);
});

test("dining is booked per meal slot with capacity", async () => {
  const { status, body } = await post("/api/invoice/preview", {
    items: [{ resourceId: "abali-dining", unit: "meal", date: "2030-06-01", meal: "lunch", persons: 50 }],
  });
  assert.equal(status, 200);
  assert.equal(body.subtotal, 50 * 650000);
});

test("course request lifecycle: pending -> approved -> paid", async () => {
  const created = await post("/api/requests", {
    customer: { name: "مسئول دوره", phone: "09120000000", memberCount: 20 },
    courseTitle: "اردوی جهادی",
    campId: "sayyed-abali",
    items: [
      { resourceId: "abali-sol-301", unit: "night", checkIn: "2030-07-01", checkOut: "2030-07-04", guests: 10 },
      { resourceId: "abali-amphitheater", unit: "slot", date: "2030-07-02", slots: ["morning"] },
      { resourceId: "abali-dining", unit: "meal", date: "2030-07-02", meal: "dinner", persons: 20 },
    ],
    discountCode: "BASIJ",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, "pending");
  assert.equal(created.body.items.length, 3);
  assert.ok(created.body.invoice.total > 0);
  const id = created.body.id;

  const approved = await post(`/api/requests/${id}/approve`, {});
  assert.equal(approved.body.status, "approved");

  const paid = await post(`/api/requests/${id}/pay`, {});
  assert.equal(paid.body.status, "paid");

  // paying again is not allowed
  const again = await post(`/api/requests/${id}/pay`, {});
  assert.equal(again.status, 409);
});

test("admin stats aggregates requests and revenue", async () => {
  const stats = await (await fetch(`${base}/api/admin/stats`)).json();
  assert.ok(stats.requests.total >= 1);
  assert.ok(stats.requests.paid >= 1, "expected at least one paid request");
  assert.ok(stats.revenue.paid > 0, "paid revenue should be positive");
  assert.ok(stats.revenue.taxCollected > 0);
  assert.ok(stats.resources.total > 100);
  assert.ok(stats.resources.totalBeds > 0);
  assert.equal(stats.camps.length, 2);
});

test("admin occupancy reflects bookings on a date", async () => {
  // From the lifecycle test: room abali-sol-301 has 10 guests over 2030-07-01..04,
  // amphitheater morning on 2030-07-02, dinner for 20 on 2030-07-02.
  const list = await (
    await fetch(`${base}/api/admin/occupancy?date=2030-07-02`)
  ).json();

  const room = list.find((o) => o.id === "abali-sol-301");
  assert.equal(room.used, 10);
  assert.equal(room.remaining, room.capacity - 10);

  const amph = list.find((o) => o.id === "abali-amphitheater");
  assert.ok(amph.bookedSlots.includes("morning"));

  const dining = list.find((o) => o.id === "abali-dining");
  const dinner = dining.perMeal.find((m) => m.meal === "dinner");
  assert.equal(dinner.used, 20);
});

test("camp profiles are seeded", async () => {
  const camps = await (await fetch(`${base}/api/camp-profiles`)).json();
  assert.ok(camps.length >= 2, `expected seeded camps, got ${camps.length}`);
  const abali = camps.find((c) => c.id === "sayyed-abali");
  assert.ok(abali.capacities.reception > 0);
  assert.ok(Array.isArray(abali.capacities.classes));
});

test("create, edit, and image-upload lifecycle for a camp profile", async () => {
  // create
  const created = await post("/api/camp-profiles", {
    name: "اردوگاه آزمایشی شهید",
    location: "استان تست",
    description: "توضیح آزمایشی",
    capacities: {
      reception: 120,
      classes: [
        { name: "کلاس الف", capacity: 25 },
        { name: "کلاس ب", capacity: 30 },
      ],
      conferenceHall: { capacity: 80 },
      amphitheater: { capacity: 200 },
      prayerRoom: { capacity: 60 },
      selfService: { capacity: 150 },
    },
  });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(created.body.capacities.reception, 120);
  assert.equal(created.body.capacities.classes.length, 2);
  assert.equal(created.body.capacities.amphitheater.capacity, 200);

  // edit
  const edited = await put(`/api/camp-profiles/${id}`, {
    capacities: { reception: 200, classes: [{ name: "کلاس ج", capacity: 40 }] },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.capacities.reception, 200);
  assert.equal(edited.body.capacities.classes.length, 1);

  // upload image (valid data URL)
  const img = await post(`/api/camp-profiles/${id}/images`, {
    section: "amphitheater",
    caption: "نمای آمفی‌تئاتر",
    dataUrl: PNG_1PX,
  });
  assert.equal(img.status, 201);
  assert.equal(img.body.section, "amphitheater");

  // invalid image is rejected
  const bad = await post(`/api/camp-profiles/${id}/images`, { dataUrl: "not-an-image" });
  assert.equal(bad.status, 400);

  // image appears on the camp
  const withImg = await (await fetch(`${base}/api/camp-profiles/${id}`)).json();
  assert.equal(withImg.images.length, 1);

  // delete image
  const delImg = await fetch(`${base}/api/camp-profiles/${id}/images/${img.body.id}`, { method: "DELETE" });
  assert.equal(delImg.status, 204);

  // delete camp
  const delCamp = await fetch(`${base}/api/camp-profiles/${id}`, { method: "DELETE" });
  assert.equal(delCamp.status, 204);
  const after404 = await fetch(`${base}/api/camp-profiles/${id}`);
  assert.equal(after404.status, 404);
});
