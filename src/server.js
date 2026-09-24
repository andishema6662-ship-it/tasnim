import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCamps,
  getCamp,
  getReservations,
  checkAvailability,
  createReservation,
} from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/camps", (_req, res) => {
  res.json(getCamps());
});

app.get("/api/camps/:id", (req, res) => {
  const camp = getCamp(req.params.id);
  if (!camp) return res.status(404).json({ error: "اردوگاه یافت نشد." });
  res.json(camp);
});

app.get("/api/reservations", (_req, res) => {
  res.json(getReservations());
});

app.post("/api/availability", (req, res) => {
  const { campId, checkIn, checkOut, guests } = req.body ?? {};
  if (!campId || !checkIn || !checkOut || guests == null) {
    return res.status(400).json({ error: "همه فیلدها الزامی هستند." });
  }
  res.json(checkAvailability(campId, checkIn, checkOut, Number(guests)));
});

app.post("/api/reservations", (req, res) => {
  const { campId, guestName, phone, checkIn, checkOut, guests } = req.body ?? {};
  if (!campId || !guestName || !phone || !checkIn || !checkOut || guests == null) {
    return res.status(400).json({ error: "همه فیلدها الزامی هستند." });
  }
  try {
    const reservation = createReservation({
      campId,
      guestName: String(guestName).trim(),
      phone: String(phone).trim(),
      checkIn,
      checkOut,
      guests: Number(guests),
    });
    res.status(201).json(reservation);
  } catch (err) {
    if (err.code === "UNAVAILABLE") {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: "خطای داخلی سرور." });
  }
});

// Only start listening when run directly (so tests can import the app).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`سامانه رزرو اردوگاه روی http://localhost:${PORT} در حال اجراست`);
  });
}

export default app;
