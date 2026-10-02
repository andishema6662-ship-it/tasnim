import { StoryPageClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  const ids = ["new", ...seed.stories.map((s) => s.id)];
  return ids.map((id) => ({ id }));
}

export default function StoryPage() {
  return <StoryPageClient />;
}
