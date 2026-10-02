"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  loadAdminSession,
  saveAdminSession,
  sessionMatchesUser,
  verifyAdminCredentials,
  type AdminSession,
} from "./admin-auth";
import { useNewsroom } from "./store";

interface AdminAuthValue {
  ready: boolean;
  authenticated: boolean;
  session: AdminSession | null;
  login: (username: string, password: string) => { ok: true } | { ok: false; message: string };
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data, setCurrentUser } = useNewsroom();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadAdminSession();
    if (stored && sessionMatchesUser(stored, data)) {
      setSession(stored);
      setCurrentUser(stored.userId);
    } else if (stored) {
      saveAdminSession(null);
    }
    setReady(true);
  }, [data, setCurrentUser]);

  const login = useCallback(
    (username: string, password: string) => {
      const user = verifyAdminCredentials(data, username, password);
      if (!user) {
        return { ok: false as const, message: "نام کاربری یا رمز عبور نادرست است." };
      }
      const next: AdminSession = {
        userId: user.id,
        username: user.username,
        loggedInAt: new Date().toISOString(),
      };
      saveAdminSession(next);
      setSession(next);
      setCurrentUser(user.id);
      return { ok: true as const };
    },
    [data, setCurrentUser],
  );

  const logout = useCallback(() => {
    saveAdminSession(null);
    setSession(null);
  }, []);

  const authenticated = ready && sessionMatchesUser(session, data);

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
