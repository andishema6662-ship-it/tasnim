"use client";

import { useParams } from "next/navigation";
import { SiteAlbumView } from "@/components/site/site-views";

export function SiteAlbumClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <SiteAlbumView id={id} />;
}
