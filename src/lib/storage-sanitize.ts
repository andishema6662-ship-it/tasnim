import type { NewsroomData } from "./types";

const CHAT_MESSAGE_CAP = 400;
const CHAT_ATTACHMENT_KEEP = 48;
const MEDIA_LIBRARY_CAP = 50;
const REPORTER_FILES_CAP = 40;

export type SanitizeMode = "normal" | "aggressive";

export interface SanitizeResult {
  data: NewsroomData;
  pruned: boolean;
  notes: string[];
}

function capChatMessages(data: NewsroomData, aggressive: boolean): { data: NewsroomData; pruned: boolean; notes: string[] } {
  const notes: string[] = [];
  let pruned = false;
  const cap = aggressive ? 120 : CHAT_MESSAGE_CAP;
  let messages = [...data.chatMessages];
  if (messages.length > cap) {
    messages = messages.slice(-cap);
    pruned = true;
    notes.push("پیام‌های چت قدیمی حذف شد.");
  }
  const attachKeep = aggressive ? 12 : CHAT_ATTACHMENT_KEEP;
  const withAttachment = messages.filter((m) => m.dataUrl);
  if (withAttachment.length > attachKeep) {
    const dropIds = new Set(withAttachment.slice(0, withAttachment.length - attachKeep).map((m) => m.id));
    messages = messages.map((m) => (dropIds.has(m.id) ? { ...m, dataUrl: undefined, attachmentName: m.attachmentName } : m));
    pruned = true;
    notes.push("پیوست‌های قدیمی چت از حافظه پاک شد.");
  }
  if (!pruned && messages === data.chatMessages) return { data, pruned: false, notes };
  return { data: { ...data, chatMessages: messages }, pruned, notes };
}

function capMediaLibrary(data: NewsroomData, aggressive: boolean): { data: NewsroomData; pruned: boolean; notes: string[] } {
  const cap = aggressive ? 20 : MEDIA_LIBRARY_CAP;
  if (data.mediaLibrary.length <= cap) return { data, pruned: false, notes: [] };
  const sorted = [...data.mediaLibrary].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    data: { ...data, mediaLibrary: sorted.slice(0, cap) },
    pruned: true,
    notes: ["تصاویر اضافی کتابخانه رسانه حذف شد (جدیدترین‌ها نگه داشته شد)."],
  };
}

function capReporterFiles(data: NewsroomData, aggressive: boolean): { data: NewsroomData; pruned: boolean; notes: string[] } {
  const cap = aggressive ? 15 : REPORTER_FILES_CAP;
  if (data.reporterFiles.length <= cap) return { data, pruned: false, notes: [] };
  const sorted = [...data.reporterFiles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    data: { ...data, reporterFiles: sorted.slice(0, cap) },
    pruned: true,
    notes: ["فایل‌های قدیمی فضای خبرنگار حذف شد."],
  };
}

/** Keeps localStorage + RAM bounded; run on load and before save. */
export function sanitizeNewsroomData(data: NewsroomData, mode: SanitizeMode = "normal"): SanitizeResult {
  const aggressive = mode === "aggressive";
  const notes: string[] = [];
  let pruned = false;
  let next = data;

  for (const step of [capChatMessages, capMediaLibrary, capReporterFiles]) {
    const result = step(next, aggressive);
    next = result.data;
    if (result.pruned) {
      pruned = true;
      notes.push(...result.notes);
    }
  }

  return { data: next, pruned, notes };
}

export function estimateStoreBytes(data: NewsroomData): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

/** Rough browser localStorage safe zone for this app (bytes). */
export const STORAGE_WARN_BYTES = 4 * 1024 * 1024;
export const STORAGE_HARD_BYTES = 8 * 1024 * 1024;
