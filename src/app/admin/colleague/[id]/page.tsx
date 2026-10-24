import { staticColleagueIds } from "@/lib/static-export-params";
import AdminColleagueProfilePageClient from "./colleague-page-client";

export function generateStaticParams() {
  return staticColleagueIds();
}

export default function AdminColleagueProfilePage() {
  return <AdminColleagueProfilePageClient />;
}
