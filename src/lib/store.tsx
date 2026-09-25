"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pushActivity } from "./activity";
import { createSeed } from "./seed";
import { loadState, saveState } from "./storage";
import type { NewsroomData, Story } from "./types";
import { placeStory } from "./workflow";

interface StoreValue {
  data: NewsroomData;
  update: (fn: (data: NewsroomData) => NewsroomData) => void;
  commitStory: (story: Story, opts?: { promote?: boolean; log?: string }) => void;
  setRole: (roleId: string) => void;
  replaceData: (data: NewsroomData) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function NewsroomProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NewsroomData | null>(null);

  useEffect(() => {
    // localStorage فقط بعد از نصب روی کلاینت خوانده می‌شود تا داده نمونه، نسخه ذخیره‌شده را نپوشاند.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- یک‌بار آب‌گیری فروشگاه مرورگر
    setData(loadState());
  }, []);

  useEffect(() => {
    if (data) saveState(data);
  }, [data]);

  const update = useCallback((fn: (current: NewsroomData) => NewsroomData) => {
    setData((prev) => (prev ? fn(prev) : prev));
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
        return pushActivity({ ...current, currentRoleId: roleId }, `تغییر نقش به ${role.name}`);
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
    () => (data ? { data, update, commitStory, setRole, replaceData, resetData } : null),
    [data, update, commitStory, setRole, replaceData, resetData],
  );

  if (!value) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-ink">
        <p>در حال گشودن اتاق خبر…</p>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNewsroom(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useNewsroom باید داخل اتاق خبر باشد");
  return value;
}
