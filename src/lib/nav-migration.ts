/** Maps legacy module keys (and old URL groups) to current keys after menu restructure. */
export const MODULE_KEY_MIGRATIONS: Record<string, string> = {
  "core/system": "infra/system",
  "core/settings": "infra/settings",
  "core/monitoring": "infra/monitoring",
  "core/backup": "infra/backup",
  "core/portal": "infra/portal",
  "core/users": "admin/users",
  "core/access": "admin/access",
  "core/tickets": "admin/chat",
  "admin/tickets": "admin/chat",
  "core/comms": "admin/comms",
  "core/official-contacts": "admin/official-contacts",
  "core/admin-affairs": "admin/admin-affairs",
  "core/roles": "admin/roles",
  "core/menus": "template/menus",
  "core/forms": "template/forms",
  "core/subsites": "template/subsites",
  "core/logos": "template/logos",
  "core/links": "structure/links",
  "structure/theme": "template/theme",
  "structure/pages": "template/pages",
  "media/rss": "template/rss",
  "media/email": "template/email",
  "media/newsletter": "template/newsletter",
  "media/social": "template/social",
};

export function migrateModuleKey(key: string): string {
  return MODULE_KEY_MIGRATIONS[key] ?? key;
}

export function migrateModuleAccessList(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of list) {
    const next = migrateModuleKey(key);
    if (!seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
  }
  return out;
}

import { groups } from "./modules";

/** Permanent redirects for bookmarks and old links. */
export function legacyNavRedirects(): { source: string; destination: string; permanent: boolean }[] {
  const moduleRedirects = Object.entries(MODULE_KEY_MIGRATIONS).map(([from, to]) => ({
    source: `/${from}`,
    destination: `/admin/${to}`,
    permanent: false,
  }));
  const adminGroupRedirects = groups.flatMap((group) => [
    {
      source: `/${group.id}/:slug`,
      destination: `/admin/${group.id}/:slug`,
      permanent: false,
    },
  ]);
  return [
    { source: "/site", destination: "/", permanent: false },
    { source: "/site/:path*", destination: "/:path*", permanent: false },
    ...moduleRedirects,
    ...adminGroupRedirects,
  ];
}
