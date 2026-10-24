"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loadAdminSession,
  saveAdminSession,
  sessionMatchesUser,
  verifyAdminCredentials,
  type AdminSession,
} from "./admin-auth";
import { isAdminSessionFresh } from "./admin-session-policy";
import {
  GENERIC_LOGIN_ERROR,
  checkLoginAllowed,
  clearLoginGuard,
  recordFailedLoginAttempt,
  sleep,
  touchLoginAttempt,
} from "./login-guard";
import { useNewsroom } from "./store";

interface AdminAuthValue {
  ready: boolean;
  authenticated: boolean;
  session: AdminSession | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function readStoredSession(): AdminSession | null {
  const stored = loadAdminSession();
  if (!stored) return null;
  if (!isAdminSessionFresh(stored)) {
    saveAdminSession(null);
    return null;
  }
  return stored;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data, setCurrentUser } = useNewsroom();
  const [session, setSession] = useState<AdminSession | null>(() =>
    typeof window === "undefined" ? null : readStoredSession(),
  );
  const [clientReady] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (!data) return;
    const stored = readStoredSession();
    if (!stored) {
      setSession(null);
      return;
    }
    if (!sessionMatchesUser(stored, data)) {
      saveAdminSession(null);
      setSession(null);
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-admin-session");
      }
      return;
    }
    setSession(stored);
    setCurrentUser(stored.userId);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-admin-session", "1");
    }
  }, [data, setCurrentUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const gate = checkLoginAllowed();
      if (!gate.allowed) {
        return { ok: false as const, message: gate.message ?? GENERIC_LOGIN_ERROR };
      }
      if (gate.waitMs && gate.waitMs > 0) {
        await sleep(gate.waitMs);
      }
      touchLoginAttempt();

      const user = verifyAdminCredentials(data, username.trim(), password);
      if (!user) {
        const message = recordFailedLoginAttempt();
        const locked = checkLoginAllowed();
        if (!locked.allowed && locked.message) {
          return { ok: false as const, message: locked.message };
        }
        return { ok: false as const, message };
      }
      clearLoginGuard();
      const next: AdminSession = {
        userId: user.id,
        username: user.username,
        loggedInAt: new Date().toISOString(),
      };
      saveAdminSession(next);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-admin-session", "1");
      }
      setSession(next);
      setCurrentUser(user.id);
      return { ok: true as const };
    },
    [data, setCurrentUser],
  );

  const logout = useCallback(() => {
    saveAdminSession(null);
    clearLoginGuard();
    setSession(null);
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-admin-session");
    }
  }, []);

  const activeSession = session ?? (clientReady ? readStoredSession() : null);
  const authenticated =
    clientReady && Boolean(data) && sessionMatchesUser(activeSession, data);
  const ready = clientReady && Boolean(data);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      session,
      login,
      logout,
    }),
    [ready, authenticated, session, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth باید داخل AdminAuthProvider باشد");
  return ctx;
}
