import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = join(__dirname, "..", "data", "store.json");

// Start from a clean store so capacity/conflict assertions are deterministic.
if (existsSync(STORE)) rmSync(STORE);

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
});

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
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
