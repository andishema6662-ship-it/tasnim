import { staticAdminModules } from "@/lib/static-export-params";
import { ModuleRouteClient } from "./client";

export function generateStaticParams() {
  return staticAdminModules();
}

export default function AdminModuleRoute() {
  return <ModuleRouteClient />;
}
