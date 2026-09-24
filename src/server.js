import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAMPS,
  RESOURCES,
  ROLES,
  DISCOUNTS,
  MEAL_SLOTS,
  TIME_SLOTS,
  TAX_RATE,
  RESOURCE_TYPE_LABELS,
  getResource,
} from "./data.js";
import {
  checkItem,
  buildInvoice,
  normalizeItems,
  getStats,
  getOccupancy,
} from "./engine.js";
import { getRequests, addRequest, updateRequest } from "./store.js";
import {
  getCampProfiles,
  getCampProfile,
  createCampProfile,
  updateCampProfile,
  deleteCampProfile,
  addCampImage,
  deleteCampImage,
  IMAGE_SECTIONS,
} from "./campsStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Larger limit so base64 image uploads for camp profiles fit in the JSON body.
app.use(express.json({ limit: "25mb" }));
app.use(express.static(join(__dirname, "..", "public")));

const IMAGE_SECTION_LABELS = {
  cover: "تصویر شاخص",
  reception: "فضای پذیرش/اقامت",
  class: "کلاس آموزشی",
  conference: "سالن همایش/اجلاس",
  amphitheater: "آمفی‌تئاتر",
  prayer: "نمازخانه",
  selfService: "سالن سلف‌سرویس",
  other: "سایر",
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---- Reference / metadata --------------------------------------------------
app.get("/api/meta", (_req, res) => {
  res.json({
    roles: ROLES,
    discounts: DISCOUNTS,
    mealSlots: MEAL_SLOTS,
    timeSlots: TIME_SLOTS,
    resourceTypeLabels: RESOURCE_TYPE_LABELS,
    taxRate: TAX_RATE,
  });
});

app.get("/api/camps", (_req, res) => {
  const camps = CAMPS.map((c) => ({
    ...c,
    resourceCount: RESOURCES.filter((r) => r.campId === c.id).length,
  }));
  res.json(camps);
});

app.get("/api/resources", (req, res) => {
  const { campId, type } = req.query;
  let list = RESOURCES;
  if (campId) list = list.filter((r) => r.campId === campId);
  if (type) list = list.filter((r) => r.type === type);
  res.json(list);
});

app.get("/api/resources/:id", (req, res) => {
  const resource = getResource(req.params.id);
  if (!resource) return res.status(404).json({ error: "منبع یافت نشد." });
  res.json(resource);
});

// ---- Availability ----------------------------------------------------------
app.post("/api/availability", (req, res) => {
  const item = req.body ?? {};
  if (!item.resourceId || !item.unit) {
    return res.status(400).json({ error: "resourceId و unit الزامی است." });
  }
  res.json(checkItem(item));
});

// ---- Invoice preview (پیش‌فاکتور بدون ذخیره) -------------------------------
app.post("/api/invoice/preview", (req, res) => {
  const { items, discountCode } = req.body ?? {};
  try {
    res.json(buildInvoice(items, discountCode));
  } catch (err) {
    const status = err.code === "UNAVAILABLE" ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ---- Course requests (درخواست دوره → پیش‌فاکتور) ---------------------------
app.get("/api/requests", (_req, res) => {
  res.json(getRequests());
});

app.get("/api/requests/:id", (req, res) => {
  const request = getRequests().find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "درخواست یافت نشد." });
  res.json(request);
});

app.post("/api/requests", (req, res) => {
  const { customer, courseTitle, campId, items, discountCode } = req.body ?? {};
  if (!customer?.name || !customer?.phone) {
    return res.status(400).json({ error: "نام و شماره تماس مسئول الزامی است." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "حداقل یک آیتم انتخاب کنید." });
  }
  try {
    const invoice = buildInvoice(items, discountCode);
    const request = {
      id: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      courseTitle: courseTitle || "دورهٔ بدون عنوان",
      campId: campId || null,
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        nationalId: customer.nationalId ? String(customer.nationalId).trim() : null,
        memberCount: customer.memberCount ? Number(customer.memberCount) : null,
      },
      items: normalizeItems(items),
      invoice,
      status: "pending", // pending -> approved -> paid ; or rejected
      createdAt: new Date().toISOString(),
    };
    addRequest(request);
    res.status(201).json(request);
  } catch (err) {
    const status = err.code === "UNAVAILABLE" ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

function transition(req, res, allowedFrom, nextStatus, extra = {}) {
  const request = getRequests().find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "درخواست یافت نشد." });
  if (!allowedFrom.includes(request.status)) {
    return res
      .status(409)
      .json({ error: `تغییر وضعیت از «${request.status}» به «${nextStatus}» مجاز نیست.` });
  }
  const updated = updateRequest(request.id, { status: nextStatus, ...extra });
  res.json(updated);
}

app.post("/api/requests/:id/approve", (req, res) =>
  transition(req, res, ["pending"], "approved", { approvedAt: new Date().toISOString() })
);

app.post("/api/requests/:id/reject", (req, res) =>
  transition(req, res, ["pending"], "rejected", { rejectedAt: new Date().toISOString() })
);

app.post("/api/requests/:id/pay", (req, res) =>
  transition(req, res, ["approved"], "paid", { paidAt: new Date().toISOString() })
);

// ---- Admin / management panel ---------------------------------------------
app.get("/api/admin/stats", (_req, res) => {
  res.json(getStats());
});

app.get("/api/admin/occupancy", (req, res) => {
  const { date, campId, type } = req.query;
  if (!date) return res.status(400).json({ error: "پارامتر date الزامی است." });
  res.json(getOccupancy(date, { campId, type }));
});

// ---- Camp profiles (تعریف/ویرایش اردوگاه‌ها + تصاویر و ظرفیت‌ها) -----------
app.get("/api/camp-profiles/meta", (_req, res) => {
  res.json({
    imageSections: IMAGE_SECTIONS.map((id) => ({ id, label: IMAGE_SECTION_LABELS[id] })),
  });
});

app.get("/api/camp-profiles", (_req, res) => {
  res.json(getCampProfiles());
});

app.get("/api/camp-profiles/:id", (req, res) => {
  const camp = getCampProfile(req.params.id);
  if (!camp) return res.status(404).json({ error: "اردوگاه یافت نشد." });
  res.json(camp);
});

app.post("/api/camp-profiles", (req, res) => {
  const { name, location, description, capacities } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "نام اردوگاه الزامی است." });
  }
  const camp = createCampProfile({ name, location, description, capacities });
  res.status(201).json(camp);
});

app.put("/api/camp-profiles/:id", (req, res) => {
  const updated = updateCampProfile(req.params.id, req.body ?? {});
  if (!updated) return res.status(404).json({ error: "اردوگاه یافت نشد." });
  res.json(updated);
});

app.delete("/api/camp-profiles/:id", (req, res) => {
  const ok = deleteCampProfile(req.params.id);
  if (!ok) return res.status(404).json({ error: "اردوگاه یافت نشد." });
  res.status(204).end();
});

app.post("/api/camp-profiles/:id/images", (req, res) => {
  const { section, caption, dataUrl } = req.body ?? {};
  try {
    const image = addCampImage(req.params.id, { section, caption, dataUrl });
    if (!image) return res.status(404).json({ error: "اردوگاه یافت نشد." });
    res.status(201).json(image);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/camp-profiles/:id/images/:imageId", (req, res) => {
  const ok = deleteCampImage(req.params.id, req.params.imageId);
  if (!ok) return res.status(404).json({ error: "تصویر یافت نشد." });
  res.status(204).end();
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`سامانه مدیریت اردوگاه روی http://localhost:${PORT} در حال اجراست`);
  });
}

export default app;
