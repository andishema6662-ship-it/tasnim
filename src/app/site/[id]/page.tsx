import { PublicStoryClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  return seed.stories.map((s) => ({ id: s.id }));
}

export default function PublicStoryPage() {
  return <PublicStoryClient />;
}
