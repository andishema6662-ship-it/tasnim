import { staticStoryIds } from "@/lib/static-export-params";
import { PublicStoryClient } from "./client";

export function generateStaticParams() {
  return staticStoryIds();
}

export default function PublicStoryPage() {
  return <PublicStoryClient />;
}
