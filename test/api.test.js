import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/server.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server.close());

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("GET /api/camps returns seeded camps", async () => {
  const res = await fetch(`${baseUrl}/api/camps`);
  const camps = await res.json();
  assert.ok(Array.isArray(camps));
  assert.ok(camps.length >= 1);
  assert.ok(camps[0].id && camps[0].name && camps[0].capacity);
});

test("availability rejects check-out before check-in", async () => {
  const res = await fetch(`${baseUrl}/api/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campId: "damavand",
      checkIn: "2030-05-10",
      checkOut: "2030-05-09",
      guests: 2,
    }),
  });
  const body = await res.json();
  assert.equal(body.ok, false);
});

test("POST /api/reservations creates a reservation and computes price", async () => {
  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campId: "damavand",
      guestName: "تست کاربر",
      phone: "09120000000",
      checkIn: "2030-06-01",
      checkOut: "2030-06-04",
      guests: 3,
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.nights, 3);
  assert.equal(body.totalPrice, 3 * 1800000);
  assert.ok(body.id.startsWith("RSV-"));
});

test("capacity overflow is rejected with 409", async () => {
  const res = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campId: "jangal-abr",
      guestName: "پرظرفیت",
      phone: "09120000001",
      checkIn: "2030-07-01",
      checkOut: "2030-07-03",
      guests: 9999,
    }),
  });
  assert.equal(res.status, 409);
});
