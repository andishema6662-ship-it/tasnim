import { suggestCover } from "./cover";

const STOP = new Set([
  "و", "در", "به", "از", "که", "این", "را", "با", "برای", "یک", "تا", "بر", "هم", "یا", "اما",
  "اگر", "هر", "آن", "شد", "است", "بود", "کرد", "گفت", "های", "ها", "خود", "نیز", "پس", "بین",
  "دارد", "شود", "می", "عنوان", "خبر", "روی", "شدن", "کند", "آنها", "او", "ما", "شما",
]);

export function suggestTitle(lead: string, body: string): string {
  const source = (lead || body).replace(/\s+/g, " ").trim();
  if (!source) return "";
  const sentence = source.split(/[!؟.\n]/)[0]?.trim() || source;
  const words = sentence.split(" ").filter(Boolean);
  if (words.length <= 16) return sentence;
  return words.slice(0, 16).join(" ");
}

export function suggestSummary(body: string, lead: string): string {
  const source = (body || lead).replace(/\s+/g, " ").trim();
  if (!source) return "";
  const parts = source.split(/(?<=[!؟.])\s+/).filter(Boolean);
  const summary = parts.slice(0, 2).join(" ");
  if (summary.length <= 320) return summary;
  return `${summary.slice(0, 300).replace(/\s+\S*$/, "")}…`;
}

export function suggestTags(text: string, extra: string[] = []): string[] {
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP.has(word));
  const counts = new Map<string, number>();
  words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fa")).map(([word]) => word);
  const tags: string[] = [];
  [...extra, ...ranked].forEach((word) => {
    if (word && !tags.includes(word) && tags.length < 5) tags.push(word);
  });
  return tags;
}

export function suggestImage(title: string, desk: string): { prompt: string; cover: string } {
  const subject = title.trim() || desk || "رویداد خبری";
  return {
    prompt: `عکس مستند و مطبوعاتی از ${subject}، میز ${desk || "خبر"}، نور طبیعی، جزئیات محیط مشخص، بدون نوشتار و نشان روی تصویر`,
    cover: suggestCover(subject),
  };
}

export function suggestAudio(title: string, lead: string): string {
  const headline = title.trim();
  const summary = lead.trim();
  if (!headline && !summary) return "";
  if (!summary) return headline;
  return `${headline}. ${summary}`;
}

export function suggestDraft(topic: string, desk: string) {
  const t = topic.trim();
  const title = `${t}؛ جزئیات تازه روی میز ${desk}`;
  const lead = `میز ${desk} پیش‌نویسی درباره «${t}» چیده است تا پس از تکمیل نقل‌قول و منبع، به ویرایش برود.`;
  const body = [
    `آنچه تا اینجا درباره «${t}» ثبت شده برای انتشار کافی نیست و این متن فقط اسکلت خبر است.`,
    `تحریریه باید منبع رسمی، زمان دقیق و یک نقل‌قول را به بدنه اضافه کند.`,
    `تا آن زمان این پیش‌نویس محلی در کارتابل می‌ماند و دستیار جای تصمیم سردبیر را نمی‌گیرد.`,
  ].join(" ");
  const image = suggestImage(title, desk);
  return {
    title,
    lead,
    body,
    imagePrompt: image.prompt,
    audioScript: suggestAudio(title, lead),
    cover: image.cover,
    tags: suggestTags(`${title} ${lead} ${body}`, [desk]),
  };
}
