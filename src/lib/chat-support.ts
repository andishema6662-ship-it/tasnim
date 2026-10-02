/** گفتگوی پشتیبانی فنی — جایگزین تیکتینگ قدیمی */
export const CHAT_THREAD_IT_SUPPORT = "cht-it-support";
/** میز تحریریه / سردبیر */
export const CHAT_THREAD_EDITORIAL_DESK = "cht-desk";

export function chatThreadHref(threadId: string): string {
  return `/admin/chat?thread=${encodeURIComponent(threadId)}`;
}

export const CHAT_SUPPORT_IT_HREF = chatThreadHref(CHAT_THREAD_IT_SUPPORT);
export const CHAT_SUPPORT_CHIEF_HREF = chatThreadHref(CHAT_THREAD_EDITORIAL_DESK);
