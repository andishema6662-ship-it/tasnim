"use client";

import { useParams } from "next/navigation";
import { SiteArticleView } from "@/components/site/site-views";

export default function PublicStoryPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <SiteArticleView id={id} />;
}
