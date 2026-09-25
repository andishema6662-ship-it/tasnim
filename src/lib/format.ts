export function faNum(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export function faDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function faDay(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function norm(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function bytesLabel(data: unknown): string {
  const bytes = new Blob([JSON.stringify(data)]).size;
  if (bytes < 1024) return `${faNum(bytes)} بایت`;
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(bytes / 1024)} کیلوبایت`;
}
