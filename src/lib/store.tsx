"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pushActivity } from "./activity";
import { defaultUserIdForRole } from "./session-user";
import { createSeed } from "./seed";
import { loadState, saveState } from "./storage";
import { sanitizeNewsroomData } from "./storage-sanitize";
import type { NewsroomData, Story } from "./types";
import { placeStory } from "./workflow";
import { ShamsehSplashGate } from "@/components/shamseh-splash";
import { isAdminLoginPath, isAdminPanelPath, isPublicPortalPath } from "@/lib/routes";
import { usePathname } from "next/navigation";

interface StoreValue {
  data: NewsroomData;
  update: (fn: (data: NewsroomData) => NewsroomData) => void;
  commitStory: (story: Story, opts?: { promote?: boolean; log?: string }) => void;
  setRole: (roleId: string) => void;
  setCurrentUser: (userId: string) => void;
  replaceData: (data: NewsroomData) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function NewsroomProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<NewsroomData | null>(() =>
    typeof window === "undefined" ? null : loadState(),
  );

  useEffect(() => {
    if (data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- یک‌بار آب‌گیری فروشگاه مرورگر
    setData(loadState());
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const handle = window.setTimeout(() => saveState(data), 350);
    return () => window.clearTimeout(handle);
  }, [data]);

  const update = useCallback((fn: (current: NewsroomData) => NewsroomData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      const { data: clean, pruned } = sanitizeNewsroomData(next);
      return pruned ? clean : next;
    });
  }, []);

  const commitStory = useCallback(
    (story: Story, opts?: { promote?: boolean; log?: string }) => {
      update((current) => placeStory(current, story, opts));
    },
    [update],
  );

  const setRole = useCallback(
    (roleId: string) => {
      update((current) => {
        const role = current.roles.find((item) => item.id === roleId);
        if (!role) return current;
        const currentUserId = defaultUserIdForRole(current, roleId) ?? current.currentUserId;
        return pushActivity({ ...current, currentRoleId: roleId, currentUserId }, `تغییر نقش به ${role.name}`);
      });
    },
    [update],
  );

  const setCurrentUser = useCallback(
    (userId: string) => {
      update((current) => {
        const user = current.users.find((item) => item.id === userId && item.active);
        if (!user) return current;
        return pushActivity(
          { ...current, currentUserId: userId, currentRoleId: user.roleId },
          `ورود به حساب ${user.name}`,
        );
      });
    },
    [update],
  );

  const replaceData = useCallback((next: NewsroomData) => {
    setData(pushActivity(next, "داده محلی جایگزین شد"));
  }, []);

  const resetData = useCallback(() => {
    setData(pushActivity(createSeed(), "بازگشت به داده نمونه"));
  }, []);

  const value = useMemo(
    () => (data ? { data, update, commitStory, setRole, setCurrentUser, replaceData, resetData } : null),
    [data, update, commitStory, setRole, setCurrentUser, replaceData, resetData],
  );

  const path = pathname ?? "/";
  const skipSplash = isPublicPortalPath(path) || isAdminLoginPath(path) || isAdminPanelPath(path);

  if (skipSplash) {
    return value ? <StoreContext.Provider value={value}>{children}</StoreContext.Provider> : null;
  }

  return (
    <ShamsehSplashGate ready={value !== null}>
      {value ? <StoreContext.Provider value={value}>{children}</StoreContext.Provider> : null}
    </ShamsehSplashGate>
  );
}

export function useNewsroom(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useNewsroom باید داخل سامانه شمسه باشد");
  return value;
}
