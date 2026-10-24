import type { NewsroomData, RoleBase, User } from "./types";
import { currentRole } from "./workflow";

/** کاربر نمایشی پیش‌فرض برای هر نقش در دمو */
export const DEMO_USER_ID_BY_ROLE: Record<RoleBase, string> = {
  publisher: "u-leila",
  chief: "u-kamran",
  reporter: "u-sara",
};

export function defaultUserIdForRole(data: NewsroomData, roleId: string): string | undefined {
  const role = data.roles.find((item) => item.id === roleId);
  if (!role) return undefined;
  const preferred = DEMO_USER_ID_BY_ROLE[role.base];
  if (preferred && data.users.some((user) => user.id === preferred && user.roleId === roleId && user.active)) {
    return preferred;
  }
  return data.users.find((user) => user.roleId === roleId && user.active)?.id;
}

export function usersForRole(data: NewsroomData, roleId: string): User[] {
  return data.users.filter((user) => user.roleId === roleId && user.active);
}

export function resolveCurrentUser(data: NewsroomData): User | undefined {
  if (data.currentUserId) {
    const picked = data.users.find((user) => user.id === data.currentUserId && user.active);
    if (picked && picked.roleId === data.currentRoleId) return picked;
  }
  const role = currentRole(data);
  const fallback = data.users.find((user) => user.roleId === role.id && user.active);
  return fallback ?? data.users.find((user) => user.active) ?? data.users[0];
}
