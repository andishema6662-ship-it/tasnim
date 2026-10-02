import { DossierClient } from "./client";
import { createSeed } from "@/lib/seed";

export function generateStaticParams() {
  const seed = createSeed();
  const dossiers = seed.specialDossiers ?? [];
  return dossiers.map((d) => ({ id: d.id }));
}

export default function DossierPage() {
  return <DossierClient />;
}
