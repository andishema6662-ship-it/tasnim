import type { CSSProperties } from "react";
import { defaultHomepageSlots } from "./homepage-slots";
import type { NewsroomData, TemplateSettings } from "./types";

export const PALETTE_OPTIONS: { id: TemplateSettings["palette"]; label: string; primary: string; accent: string; nav: string }[] = [
  { id: "ordibehesht", label: "زرشکی اردیبهشت", primary: "#8e1e2d", accent: "#c41e3a", nav: "#7a1f2e" },
  { id: "news-blue", label: "آبی خبری", primary: "#0d47a1", accent: "#1565c0", nav: "#0a3d7a" },
  { id: "green", label: "سبز", primary: "#1b5e20", accent: "#2e7d32", nav: "#144a18" },
  { id: "navy", label: "سرمه‌ای", primary: "#1a237e", accent: "#3949ab", nav: "#121858" },
  { id: "custom", label: "رنگ سفارشی", primary: "#8e1e2d", accent: "#c41e3a", nav: "#7a1f2e" },
];

export const HOME_LAYOUT_OPTIONS: { id: TemplateSettings["homeLayout"]; label: string }[] = [
  { id: "classic", label: "سبک کلاسیک خبرگزاری" },
  { id: "modern-grid", label: "سبک مدرن شبکه‌ای" },
  { id: "magazine", label: "سبک مجله‌ای" },
];

export const FONT_OPTIONS: { id: TemplateSettings["fontFamily"]; label: string; stack: string }[] = [
  { id: "vazirmatn", label: "وزیرمتن", stack: "var(--font-vazir), sans-serif" },
  { id: "sahel", label: "ساحل", stack: '"Sahel", var(--font-vazir), sans-serif' },
  { id: "shabnam", label: "شبنم", stack: '"Shabnam", var(--font-vazir), sans-serif' },
];

export function defaultTemplateSettings(): TemplateSettings {
  return {
    palette: "ordibehesht",
    customPrimary: "#8e1e2d",
    customAccent: "#c41e3a",
    homeLayout: "classic",
    showTriCalendar: true,
    showLiveClock: true,
    showLanguageToggle: true,
    showBreakingTicker: true,
    tickerLabel: "فوری",
    aboutFooter: "خبرگزاری نمونه با رویکرد تحریریه شفاف و خروجی سریع برای مخاطب فارسی‌زبان.",
    copyrightText: "تمام حقوق محفوظ است.",
    socialTelegram: "https://t.me/example",
    socialInstagram: "https://instagram.com/example",
    socialYoutube: "https://youtube.com/@example",
    fontFamily: "vazirmatn",
    fontScale: "md",
    homepageSlots: defaultHomepageSlots(),
  };
}

export function resolveTemplateSettings(data: NewsroomData): TemplateSettings {
  const defaults = defaultTemplateSettings();
  const raw = data.templateSettings ?? {};
  return {
    ...defaults,
    ...raw,
    homepageSlots: {
      ...defaults.homepageSlots,
      ...(raw.homepageSlots ?? {}),
      hero: { ...defaults.homepageSlots.hero, ...raw.homepageSlots?.hero },
      featuredSide: { ...defaults.homepageSlots.featuredSide, ...raw.homepageSlots?.featuredSide },
      editorialPicks: { ...defaults.homepageSlots.editorialPicks, ...raw.homepageSlots?.editorialPicks },
      categoryShowcase: {
        ...defaults.homepageSlots.categoryShowcase,
        ...raw.homepageSlots?.categoryShowcase,
      },
      hot: { ...defaults.homepageSlots.hot, ...raw.homepageSlots?.hot },
      photos: { ...defaults.homepageSlots.photos, ...raw.homepageSlots?.photos },
      multimedia: { ...defaults.homepageSlots.multimedia, ...raw.homepageSlots?.multimedia },
    },
  };
}

export function paletteColors(settings: TemplateSettings) {
  const preset = PALETTE_OPTIONS.find((item) => item.id === settings.palette) ?? PALETTE_OPTIONS[0];
  if (settings.palette === "custom") {
    return {
      primary: settings.customPrimary || preset.primary,
      accent: settings.customAccent || preset.accent,
      nav: settings.customPrimary || preset.nav,
    };
  }
  return { primary: preset.primary, accent: preset.accent, nav: preset.nav };
}

export function portalThemeStyle(settings: TemplateSettings): CSSProperties {
  const colors = paletteColors(settings);
  const font = FONT_OPTIONS.find((item) => item.id === settings.fontFamily) ?? FONT_OPTIONS[0];
  const scale = settings.fontScale === "sm" ? "14px" : settings.fontScale === "lg" ? "17px" : "15px";
  return {
    ["--portal-primary" as string]: colors.primary,
    ["--portal-accent" as string]: colors.accent,
    ["--portal-nav" as string]: colors.nav,
    fontFamily: font.stack,
    fontSize: scale,
  };
}
