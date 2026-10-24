import type { AdminSession } from "./admin-auth";

/** Client session lifetime (static demo; server auth would use HTTP-only cookies). */
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function isAdminSessionFresh(session: AdminSession, now = Date.now()): boolean {
  const loggedAt = Date.parse(session.loggedInAt);
  if (!Number.isFinite(loggedAt)) return false;
  return now - loggedAt < ADMIN_SESSION_TTL_MS;
}
