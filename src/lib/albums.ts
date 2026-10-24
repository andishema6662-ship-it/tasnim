import type { Album, AlbumPlacement, NewsroomData } from "./types";

export const ALBUM_PLACEMENT_LABEL: Record<AlbumPlacement, string> = {
  home_featured: "صفحه اصلی (گزارش تصویری ویژه)",
  service: "سرویس خبری مربوطه",
  dedicated: "صفحه اختصاصی گزارش تصویری",
  slider: "اسلایدر عکس",
};

export function publishedAlbums(data: NewsroomData): Album[] {
  return data.albums
    .filter((album) => album.status === "published")
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
}

export function featuredPhotoAlbums(data: NewsroomData): Album[] {
  return publishedAlbums(data).filter((album) => album.placement === "home_featured" || album.placement === "slider");
}

export function normalizeAlbum(partial: Album): Album {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    title: partial.title,
    description: partial.description ?? "",
    photographer: partial.photographer ?? "",
    photos: partial.photos ?? [],
    placement: partial.placement ?? "dedicated",
    serviceId: partial.serviceId ?? "",
    status: partial.status ?? "draft",
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    publishedAt: partial.publishedAt,
  };
}
