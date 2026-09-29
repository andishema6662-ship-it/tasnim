import { portalBannerAds } from "./site-portal";
import { resolveTemplateSettings } from "./template";
import type { NewsroomData } from "./types";

export function resolvePortalBranding(data: NewsroomData) {
  const theme = resolveTemplateSettings(data);
  const branding = theme.portalBranding;
  return {
    mediaName: (branding?.mediaName ?? "").trim() || data.settings.mediaName || "",
    mediaDisplayTitle: (branding?.mediaDisplayTitle ?? "").trim() || data.settings.mediaDisplayTitle || "",
    brandMark: branding?.brandMark || data.settings.brandMark || "",
  };
}

export function portalTitleFromData(data: NewsroomData): string {
  const branding = resolvePortalBranding(data);
  return (branding.mediaName ?? "").trim() || data.settings.newsroomName;
}

export function portalSubtitleFromData(data: NewsroomData): string {
  const branding = resolvePortalBranding(data);
  return (branding.mediaDisplayTitle ?? "").trim() || data.settings.tagline;
}

export function resolvePortalHeaderBanner(data: NewsroomData): { image: string; href: string } | null {
  const theme = resolveTemplateSettings(data);
  const banner = theme.portalHeaderBanner;
  if (banner && banner.enabled === false) return null;
  if (banner?.image) {
    return { image: banner.image, href: banner.href || "#" };
  }
  const ad = portalBannerAds(data)[0];
  if (ad?.image) return { image: ad.image, href: ad.href || "#" };
  return null;
}
