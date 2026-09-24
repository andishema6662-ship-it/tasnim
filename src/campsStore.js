import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const FILE = join(DATA_DIR, "camps.json");

// Rich, editable camp profiles for presentation and capacity management.
// Seeded from the specification; admins can add / edit / delete afterwards.
const SEED = [
  {
    id: "sayyed-abali",
    name: "مجتمع فرهنگی-آموزشی سیدالشهدا (ع) — آبعلی",
    location: "استان تهران، آبعلی",
    description:
      "مجتمعی آموزشی-اقامتی در ارتفاعات آبعلی، شامل ساختمان خوابگاهی شهید سلیمانی، ساختمان آموزشی میثاق، سالن اجلاس، آمفی‌تئاتر و استخر؛ مناسب برگزاری دوره‌ها و اردوهای چندروزه.",
    capacities: {
      reception: 1068,
      classes: [
        { name: "کلاس ۱۰۱", capacity: 85 },
        { name: "کلاس‌های ۴۰ نفره", capacity: 40 },
        { name: "کلاس‌های کوچک", capacity: 10 },
      ],
      conferenceHall: { name: "سالن اجلاس", capacity: 67 },
      amphitheater: { capacity: 350 },
      prayerRoom: { capacity: 200 },
      selfService: { capacity: 500 },
    },
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "shohada-mashhad",
    name: "مجتمع آموزشی شهدای دانشجو — مشهد مقدس",
    location: "استان خراسان رضوی، مشهد مقدس",
    description:
      "مجتمع اقامتی-آموزشی در مشهد مقدس با خوابگاه‌های گروهی و سوئیت‌های نام‌گذاری‌شده به نام شهدا و فضاهای آموزشی، مناسب اسکان زائران و برگزاری دوره‌های آموزشی.",
    capacities: {
      reception: 90,
      classes: [
        { name: "کلاس شهید عباس دانشگر", capacity: 30 },
        { name: "کلاس شهید حسین زینال‌زاده", capacity: 30 },
        { name: "کلاس شهید دانیال رضازاده", capacity: 30 },
      ],
      conferenceHall: null,
      amphitheater: null,
      prayerRoom: { capacity: 120 },
      selfService: { capacity: 200 },
    },
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) writeFileSync(FILE, JSON.stringify({ camps: SEED }, null, 2));
}

function read() {
  ensure();
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8"));
    return { camps: parsed.camps ?? [] };
  } catch {
    return { camps: [] };
  }
}

function write(store) {
  ensure();
  writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function getCampProfiles() {
  return read().camps;
}

export function getCampProfile(id) {
  return read().camps.find((c) => c.id === id) ?? null;
}

function slugify(name) {
  const base = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-\u0600-\u06FF]/g, "");
  return base || "camp";
}

// Normalizes/validates a capacities object into a consistent shape.
export function normalizeCapacities(input = {}) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  };
  const optionalSpace = (obj, extra = {}) => {
    if (obj == null || (obj.capacity == null && obj.name == null)) return null;
    const cap = num(obj.capacity);
    if (cap <= 0 && !obj.name) return null;
    return { capacity: cap, ...extra, ...(obj.name ? { name: String(obj.name).trim() } : {}) };
  };
  const classes = Array.isArray(input.classes)
    ? input.classes
        .map((c) => ({ name: String(c.name || "").trim(), capacity: num(c.capacity) }))
        .filter((c) => c.name || c.capacity > 0)
    : [];
  return {
    reception: num(input.reception),
    classes,
    conferenceHall: optionalSpace(input.conferenceHall),
    amphitheater: optionalSpace(input.amphitheater),
    prayerRoom: optionalSpace(input.prayerRoom),
    selfService: optionalSpace(input.selfService),
  };
}

export function createCampProfile({ name, location, description, capacities }) {
  const store = read();
  let id = slugify(name);
  if (store.camps.some((c) => c.id === id)) id = `${id}-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();
  const camp = {
    id,
    name: String(name).trim(),
    location: String(location || "").trim(),
    description: String(description || "").trim(),
    capacities: normalizeCapacities(capacities),
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  store.camps.push(camp);
  write(store);
  return camp;
}

export function updateCampProfile(id, patch) {
  const store = read();
  const idx = store.camps.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const current = store.camps[idx];
  const updated = {
    ...current,
    ...(patch.name != null ? { name: String(patch.name).trim() } : {}),
    ...(patch.location != null ? { location: String(patch.location).trim() } : {}),
    ...(patch.description != null ? { description: String(patch.description).trim() } : {}),
    ...(patch.capacities != null ? { capacities: normalizeCapacities(patch.capacities) } : {}),
    updatedAt: new Date().toISOString(),
  };
  store.camps[idx] = updated;
  write(store);
  return updated;
}

export function deleteCampProfile(id) {
  const store = read();
  const before = store.camps.length;
  store.camps = store.camps.filter((c) => c.id !== id);
  if (store.camps.length === before) return false;
  write(store);
  return true;
}

const VALID_SECTIONS = [
  "cover",
  "reception",
  "class",
  "conference",
  "amphitheater",
  "prayer",
  "selfService",
  "other",
];

export function addCampImage(id, { section, caption, dataUrl }) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    const err = new Error("تصویر نامعتبر است (باید data URL تصویر باشد).");
    err.code = "VALIDATION";
    throw err;
  }
  const store = read();
  const idx = store.camps.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const image = {
    id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    section: VALID_SECTIONS.includes(section) ? section : "other",
    caption: caption ? String(caption).trim() : "",
    dataUrl,
  };
  store.camps[idx].images.push(image);
  store.camps[idx].updatedAt = new Date().toISOString();
  write(store);
  return image;
}

export function deleteCampImage(id, imageId) {
  const store = read();
  const idx = store.camps.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  const before = store.camps[idx].images.length;
  store.camps[idx].images = store.camps[idx].images.filter((im) => im.id !== imageId);
  if (store.camps[idx].images.length === before) return false;
  store.camps[idx].updatedAt = new Date().toISOString();
  write(store);
  return true;
}

export const IMAGE_SECTIONS = VALID_SECTIONS;
