import { DEFAULT_USER_PASSWORD, verifyUserPassword } from "./password";
import type { NewsroomData, User } from "./types";

export const ADMIN_SESSION_KEY = "tasnim-admin-session-v1";

/** @deprecated use DEFAULT_USER_PASSWORD from ./password */
export const DEMO_ADMIN_PASSWORD = DEFAULT_USER_PASSWORD;

export interface AdminSession {
  userId: string;
  username: string;
  loggedInAt: string;
}

export function loadAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.userId || !parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) window.localStorage.removeItem(ADMIN_SESSION_KEY);
    else window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function findUserByUsername(data: NewsroomData, username: string): User | undefined {
  const norm = username.trim().toLowerCase();
  return data.users.find((u) => u.active && u.username.toLowerCase() === norm);
}

export function verifyAdminCredentials(
  data: NewsroomData,
  username: string,
  password: string,
): User | null {
  const user = findUserByUsername(data, username);
  if (!user) return null;
  if (!verifyUserPassword(user, password)) return null;
  return user;
}

export function sessionMatchesUser(session: AdminSession | null, data: NewsroomData): boolean {
  if (!session) return false;
  const user = data.users.find((u) => u.id === session.userId && u.active);
  return Boolean(user && user.username.toLowerCase() === session.username.toLowerCase());
}
