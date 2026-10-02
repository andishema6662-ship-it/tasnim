import { SiteAlbumClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  return seed.albums.map((a) => ({ id: a.id }));
}

export default function PublicAlbumPage() {
  return <SiteAlbumClient />;
}
