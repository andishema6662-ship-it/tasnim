import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_FILE = join(DATA_DIR, "store.json");

const EMPTY = { requests: [] };

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, JSON.stringify(EMPTY, null, 2));
}

export function readStore() {
  ensureStore();
  try {
    const parsed = JSON.parse(readFileSync(DB_FILE, "utf8"));
    return { requests: parsed.requests ?? [] };
  } catch {
    return { ...EMPTY };
  }
}

export function writeStore(store) {
  ensureStore();
  writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function getRequests() {
  return readStore().requests;
}

export function addRequest(request) {
  const store = readStore();
  store.requests.push(request);
  writeStore(store);
  return request;
}

export function updateRequest(id, patch) {
  const store = readStore();
  const idx = store.requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.requests[idx] = { ...store.requests[idx], ...patch };
  writeStore(store);
  return store.requests[idx];
}

// Every confirmed line item that occupies capacity/time on a resource.
// Derived from all requests that are not rejected/cancelled.
export function activeBookings() {
  const bookings = [];
  for (const req of getRequests()) {
    if (req.status === "rejected" || req.status === "cancelled") continue;
    for (const item of req.items) {
      bookings.push({ requestId: req.id, status: req.status, ...item });
    }
  }
  return bookings;
}
