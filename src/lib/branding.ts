import type { Settings } from "./types";

/** Crisp emblem only (transparent), not the full paper mockup */
export const SHAMSEH_MARK_PATH = "/shamseh-mark.png";

/** Legacy path; kept in sync with the mark for older saved settings */
export const SHAMSEH_LOGO_PATH = "/shamseh-logo.png";

export const SHAMSEH_MEDIA_NAME = "شمسه";

export const SHAMSEH_FULL_TITLE = "سامانه جامع تحریریه خبر شمسه";

/** زیرعنوان پنل ورود (بدون تکرار نام شمسه) */
export const SHAMSEH_LOGIN_SUBTITLE = "سامانه جامع تحریریه خبر";

/** عنوان رسمی در نوار بالای پنل مدیریت */
export const SHAMSEH_ADMIN_HEADER = "سامانه تحریریه خبر شمسه";

export const SHAMSEH_NEWSROOM_NAME = "تحریریه خبر شمسه";

export const SHAMSEH_TAGLINE = "میز یکپارچه تولید و انتشار";

export const SHAMSEH_APP_TITLE = SHAMSEH_FULL_TITLE;

export const LEGACY_NEWSROOM_NAME = "اتاق خبر";

export function defaultBrandingSettings(): Pick<Settings, "newsroomName" | "tagline" | "mediaName" | "mediaDisplayTitle" | "brandMark"> {
  return {
    newsroomName: SHAMSEH_NEWSROOM_NAME,
    tagline: SHAMSEH_TAGLINE,
    mediaName: SHAMSEH_MEDIA_NAME,
    mediaDisplayTitle: SHAMSEH_FULL_TITLE,
    brandMark: SHAMSEH_MARK_PATH,
  };
}

export function resolveBrandMark(mark?: string): string {
  const trimmed = (mark ?? "").trim();
  if (!trimmed || trimmed === SHAMSEH_LOGO_PATH) return SHAMSEH_MARK_PATH;
  return trimmed;
}

export function applyBrandingDefaults(settings: Settings): Settings {
  const defaults = defaultBrandingSettings();
  const legacyRoom = settings.newsroomName?.trim() === LEGACY_NEWSROOM_NAME;
  return {
    ...settings,
    newsroomName: legacyRoom ? defaults.newsroomName : settings.newsroomName?.trim() || defaults.newsroomName,
    tagline: settings.tagline?.trim() ? settings.tagline : defaults.tagline,
    mediaName: settings.mediaName?.trim() ? settings.mediaName : defaults.mediaName,
    mediaDisplayTitle: settings.mediaDisplayTitle?.trim() ? settings.mediaDisplayTitle : defaults.mediaDisplayTitle,
    brandMark: resolveBrandMark(settings.brandMark?.trim() ? settings.brandMark : defaults.brandMark),
  };
}

export function documentTitleSuffix(): string {
  return SHAMSEH_APP_TITLE;
}
