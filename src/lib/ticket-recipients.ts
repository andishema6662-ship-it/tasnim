import type { NewsroomData } from "./types";

export const TICKET_RECIPIENT_PRESETS = [
  { id: "chief", label: "سردبیر" },
  { id: "publisher", label: "مدیر مسئول" },
  { id: "it-support", label: "پشتیبانی فنی و IT" },
  { id: "admin-finance", label: "امور اداری و مالی" },
] as const;

export type TicketRecipientPresetId = (typeof TICKET_RECIPIENT_PRESETS)[number]["id"];

export function ticketRecipientLabel(data: NewsroomData, recipient: string): string {
  if (!recipient) return "—";
  if (recipient.startsWith("user:")) {
    const userId = recipient.slice(5);
    return data.users.find((user) => user.id === userId)?.name ?? "کاربر";
  }
  const preset = TICKET_RECIPIENT_PRESETS.find((item) => item.id === recipient);
  return preset?.label ?? recipient;
}

export function defaultTicketRecipient(data: NewsroomData): string {
  const chief = data.roles.find((role) => role.base === "chief");
  if (chief) return "chief";
  return "publisher";
}

export function normalizeTicketRecipient(raw: string | undefined, data: NewsroomData): string {
  if (!raw) return defaultTicketRecipient(data);
  if (raw.startsWith("user:")) return raw;
  if (TICKET_RECIPIENT_PRESETS.some((item) => item.id === raw)) return raw;
  return defaultTicketRecipient(data);
}
