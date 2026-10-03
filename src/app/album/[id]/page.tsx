import { staticAlbumIds } from "@/lib/static-export-params";
import { SiteAlbumClient } from "./client";

export function generateStaticParams() {
  return staticAlbumIds();
}

export default function PublicAlbumPage() {
  return <SiteAlbumClient />;
}
