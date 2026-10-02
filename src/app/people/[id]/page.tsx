import { AdminPersonProfileClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  return seed.people.map((p) => ({ id: p.id }));
}

export default function AdminPersonProfilePage() {
  return <AdminPersonProfileClient />;
}
