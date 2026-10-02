import { staticVisiblePeopleIds } from "@/lib/static-export-params";
import { SitePersonProfileClient } from "./client";

export function generateStaticParams() {
  return staticVisiblePeopleIds();
}

export default function SitePersonProfilePage() {
  return <SitePersonProfileClient />;
}
