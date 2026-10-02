import { SitePersonProfileClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  return seed.people.filter((p) => p.visible).map((p) => ({ id: p.id }));
}

export default function SitePersonProfilePage() {
  return <SitePersonProfileClient />;
}
