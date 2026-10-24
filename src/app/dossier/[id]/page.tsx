import { staticDossierIds } from "@/lib/static-export-params";
import { DossierClient } from "./client";

export function generateStaticParams() {
  return staticDossierIds();
}

export default function DossierPage() {
  return <DossierClient />;
}
