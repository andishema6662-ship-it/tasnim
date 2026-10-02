import { ModuleRouteClient } from "./client";
import { modules } from "@/lib/modules";

export function generateStaticParams() {
  return modules.map((m) => ({
    group: m.group,
    slug: m.slug,
  }));
}

export default function ModuleRoute() {
  return <ModuleRouteClient />;
}
