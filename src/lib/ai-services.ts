import { suggestTags, suggestTitle } from "./assist";
import { faDate } from "./format";
import type { OriginHit } from "./types";

const OUTLETS = [
  "ایرنا",
  "ایسنا",
  "تسنیم",
  "فارس",
  "مهر",
  "رویترز",
  "بلومبرگ",
  "بی‌بی‌سی فارسی",
  "خبرگزاری صدا و سیما",
];

function hashTopic(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function simulateTranscription(opts: { fileName: string; durationSec: number; hint?: string }) {
  const hint = (opts.hint ?? "").trim() || opts.fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const topic = hint || "رویداد خبری";
  const minutes = Math.max(1, Math.round(opts.durationSec / 60));
  const transcript = [
    `گزارش صوتی ${minutes} دقیقه‌ای درباره «${topic}».`,
    `طبق نقل‌قول منبع، جزئیات اصلی هنوز در حال تکمیل است و تحریریه باید نام افراد و زمان دقیق را تأیید کند.`,
    `خبرنگار حاضر در محل گفت: «${topic}» از صبح مورد توجه رسانه‌ها بوده و انتظار می‌رود تا پایان روز بیانیه رسمی منتشر شود.`,
    `در پایان، تاکید شد که این متن خروجی موتور تبدیل گفتار به نوشتار است و پیش از انتشار باید ویرایش شود.`,
  ].join("\n\n");
  const title = suggestTitle(topic, transcript) || `گزارش صوتی: ${topic}`;
  const lead = `خروجی تبدیل صوت به متن برای «${topic}» — ${minutes} دقیقه ماده خام.`;
  return { transcript, title, lead, tags: suggestTags(`${title} ${transcript}`, ["صوت", "گزارش میدانی"]) };
}

export function polishNewsText(text: string, mode: "grammar" | "journalistic" | "lead") {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return { result: "", lead: "", bullets: [] as string[] };

  let result = raw
    .replace(/\s+([،؛:!؟])/g, "$1")
    .replace(/می\s+([آ-ی])/g, "می‌$1")
    .replace(/نمی\s+([آ-ی])/g, "نمی‌$1")
    .replace(/هاي\s/g, "های ")
    .replace(/ه\s+اي\s/g, "های ");

  if (mode === "journalistic") {
    const sentences = result.split(/(?<=[.!?؟])\s+/).filter(Boolean);
    result = sentences
      .map((s, i) => (i === 0 ? s : s.replace(/^(و|اما)\s+/, "")))
      .slice(0, 5)
      .join(" ");
    if (result.length > 280) result = `${result.slice(0, 260).replace(/\s+\S*$/, "")}…`;
  }

  const lead = suggestTitle(raw, raw) || raw.split(/[.!?؟]/)[0]?.trim() || raw.slice(0, 160);
  const bullets = raw
    .split(/[.!?؟]\s+/)
    .filter((s) => s.length > 24)
    .slice(0, 4)
    .map((s) => s.trim());

  if (mode === "lead") {
    return { result: lead, lead, bullets };
  }

  return { result, lead, bullets };
}

export function trackHeadlineOrigin(headline: string): OriginHit[] {
  const topic = headline.trim();
  if (!topic) return [];
  const seed = hashTopic(topic);
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  const hits: OriginHit[] = [];
  const count = 4 + (seed % 3);
  for (let i = 0; i < count; i += 1) {
    const outlet = OUTLETS[(seed + i * 7) % OUTLETS.length];
    const minutesAgo = (seed % 90) + i * 37;
    const at = new Date(base.getTime() - minutesAgo * 60_000);
    const similarity = Math.min(99, 72 + ((seed >> i) % 28) - i * 3);
    const exclusive = i === 0 ? "exclusive" : i < 2 ? "reprint" : "syndicated";
    hits.push({
      outlet,
      publishedAt: at.toISOString(),
      similarity,
      exclusive,
      url: `https://example.com/${outlet}/${encodeURIComponent(topic.slice(0, 24))}`,
    });
  }
  return hits.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

export function exclusiveLabel(kind: OriginHit["exclusive"]) {
  if (kind === "exclusive") return "خبر اختصاصی / نخستین انتشار";
  if (kind === "syndicated") return "بازنشر / خوراک مشترک";
  return "بازنشر";
}

export function suggestAlternateHeadlines(text: string): string[] {
  const base = suggestTitle(text, text) || text.slice(0, 80);
  return [
    base,
    `${base}؛ جزئیات تازه`,
    `گزارش| ${base.replace(/؛.*/, "")}`,
    `تحلیل: ${base}`,
  ].filter((item, index, arr) => item && arr.indexOf(item) === index).slice(0, 4);
}

export function preliminaryFactCheck(text: string): { level: "low" | "medium" | "high"; notes: string[] } {
  const risky = /(?:قطعاً|حتماً|۱۰۰٪|بدون شک|همه می‌دانند)/u.test(text);
  const numbers = (text.match(/\d+/g) ?? []).length;
  const quotes = (text.match(/[«"]/g) ?? []).length;
  const notes: string[] = [];
  if (risky) notes.push("عبارات قطعی بدون منبع دیده شد؛ نقل‌قول یا مستند اضافه کنید.");
  if (numbers > 3) notes.push("چند عدد آمده است؛ ارجاع به منبع رسمی پیشنهاد می‌شود.");
  if (quotes < 2) notes.push("نقل‌قول مستقیم کم است؛ برای تأییدپذیری یک جمله از منبع بیاورید.");
  if (!notes.length) notes.push("متن از نظر لحن اولیه قابل انتشار است؛ بازبینی حقوقی و منبع همچنان لازم است.");
  const level = risky ? "high" : numbers > 3 ? "medium" : "low";
  return { level, notes };
}

export function suggestSeoKeywords(text: string): string[] {
  return suggestTags(text, ["خبر", "گزارش"]);
}

export function formatOriginRow(hit: OriginHit) {
  return `${hit.outlet} · ${faDate(hit.publishedAt)} · ${hit.similarity}٪`;
}
