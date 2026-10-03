import { staticCartableStoryIds } from "@/lib/static-export-params";
import { StoryPageClient } from "./client";

export function generateStaticParams() {
  return staticCartableStoryIds();
}

export default function AdminStoryEditorPage() {
  return <StoryPageClient />;
}
