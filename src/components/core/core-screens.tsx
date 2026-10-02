"use client";

import { useRef, useState } from "react";
import { pushActivity } from "@/lib/activity";
import { bytesLabel, faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { mergeSeed } from "@/lib/seed";
import { STORAGE_KEY } from "@/lib/storage";
import { useNewsroom } from "@/lib/store";
import type { MenuItem, NewsroomData, Permissions, RoleBase, Settings, User, VersionEntry } from "@/lib/types";
import { REPORTER_GRADE_LABELS } from "@/lib/reporter-labels";
import { hashPassword, validateNewPassword, usernameTaken } from "@/lib/password";
import { canManageModuleAccess } from "@/lib/module-access";
import { defaultTicketRecipient, TICKET_RECIPIENT_PRESETS, ticketRecipientLabel } from "@/lib/ticket-recipients";
import { ACTORS, canPerm, categoryName, currentRole } from "@/lib/workflow";
import { Button, Empty, Field, Flash, Input, ModulePage, Notice, Select, TextArea, cn } from "../ui";
import { IconButton, IconPencil, IconTrash, IconUserCheck, IconUserOff } from "../ui/icon-button";
import { UserPasswordPairFields } from "./user-password-pair-fields";
import { ModuleAccessMatrix, ModuleAccessRolePicker } from "./module-access-matrix";

export function SystemScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ version: "", notes: "" });
  const [flash, setFlash] = useState("");
  const rows = [
    ["نام اتاق خبر", data.settings.newsroomName],
    ["نقش فعلی", currentRole(data).name],
    ["خبر", faNum(data.stories.length)],
    ["کاربر", faNum(data.users.length)],
    ["حجم داده محلی", bytesLabel(data)],
    ["کلید ذخیره", STORAGE_KEY],
    ["شروع این نسخه داده", faDate(data.sessionStartedAt)],
    ["مرورگر", typeof navigator === "undefined" ? "—" : navigator.userAgent.slice(0, 80)],
  ];
  return (
    <ModulePage slug="system">
      <Notice>این صفحه سرور سازمان را نشان نمی‌دهد. عددها از همین مرورگر خوانده شده‌اند.</Notice>
      <dl className="divide-y divide-line rounded-lg border border-line bg-sheet">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-8 rounded-lg border border-line bg-sheet p-4" data-testid="version-changelog">
        <h2 className="font-bold">تاریخچه نسخه‌ها (Changelog)</h2>
        <Flash>{flash}</Flash>
        <form
          className="mt-3 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.version.trim() || !form.notes.trim()) return;
            const entry: VersionEntry = {
              id: uid("ver"),
              version: form.version.trim(),
              releasedAt: new Date().toISOString(),
              notes: form.notes.trim(),
            };
            update((current) => ({ ...current, versionHistory: [entry, ...current.versionHistory] }));
            setForm({ version: "", notes: "" });
            setFlash("نسخه ثبت شد.");
          }}
        >
          <Field label="شماره نسخه">
            <Input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} placeholder="1.5.1" dir="ltr" />
          </Field>
          <Field label="جزئیات تغییرات">
            <TextArea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
          <Button type="submit" className="self-end">ثبت نسخه</Button>
        </form>
        <ul className="mt-4 divide-y divide-line">
          {(data.versionHistory ?? []).map((entry) => (
            <li key={entry.id} className="py-3">
              <p className="font-semibold">نسخه {entry.version} · {faDate(entry.releasedAt)}</p>
              <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{entry.notes}</p>
            </li>
          ))}
        </ul>
      </section>
    </ModulePage>
  );
}

function publisherUsers(users: User[]): User[] {
  return users.filter((user) => user.roleId === "publisher");
}

function blocksLastPublisher(users: User[], userId: string, nextRoleId?: string): boolean {
  const target = users.find((user) => user.id === userId);
  if (!target || target.roleId !== "publisher") return false;
  if (publisherUsers(users).length > 1) return false;
  if (nextRoleId === "publisher") return false;
  return true;
}

export function UsersScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "manageUsers");
  const [form, setForm] = useState({ name: "", username: "", roleId: "reporter", password: "", passwordConfirm: "" });
  const [editing, setEditing] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirm, setEditPasswordConfirm] = useState("");
  const [editingCustomMenu, setEditingCustomMenu] = useState(false);
  const [editingMenuKeys, setEditingMenuKeys] = useState<string[]>([]);
  const [flash, setFlash] = useState("");

  function roleName(roleId: string): string {
    return data.roles.find((role) => role.id === roleId)?.name ?? roleId;
  }

  function saveEdit() {
    if (!editing || !allowed) return;
    const name = editing.name.trim();
    const username = editing.username.trim();
    if (!name || !username) {
      setFlash("نام و نام کاربری لازم است.");
      return;
    }
    if (usernameTaken(data, username, editing.id)) {
      setFlash("این نام کاربری وجود دارد.");
      return;
    }
    let passwordHash = editing.passwordHash;
    if (editPassword.trim()) {
      const validation = validateNewPassword(editPassword);
      if (validation) {
        setFlash(validation);
        return;
      }
      if (editPassword !== editPasswordConfirm) {
        setFlash("تکرار رمز با رمز جدید یکسان نیست.");
        return;
      }
      passwordHash = hashPassword(editPassword);
    }
    if (blocksLastPublisher(data.users, editing.id, editing.roleId)) {
      setFlash("حداقل یک مدیر مسئول باید بماند.");
      return;
    }
    update((current) => {
      const userModuleAccess = { ...current.userModuleAccess };
      if (editingCustomMenu) userModuleAccess[editing.id] = [...editingMenuKeys];
      else delete userModuleAccess[editing.id];
      return pushActivity(
        {
          ...current,
          userModuleAccess,
          users: current.users.map((item) =>
            item.id === editing.id ? { ...editing, name, username, passwordHash } : item,
          ),
        },
        `کاربر ${name} ویرایش شد`,
      );
    });
    setEditing(null);
    setEditPassword("");
    setEditPasswordConfirm("");
    setEditingCustomMenu(false);
    setFlash("تغییرات کاربر ذخیره شد.");
  }

  function removeUser(user: User) {
    if (!allowed) return;
    if (blocksLastPublisher(data.users, user.id)) {
      setFlash("حداقل یک مدیر مسئول باید بماند.");
      return;
    }
    update((current) => {
      const userModuleAccess = { ...current.userModuleAccess };
      delete userModuleAccess[user.id];
      return pushActivity(
        { ...current, userModuleAccess, users: current.users.filter((item) => item.id !== user.id) },
        `کاربر ${user.name} حذف شد`,
      );
    });
    if (editing?.id === user.id) setEditing(null);
    setFlash(`کاربر ${user.name} حذف شد.`);
  }

  return (
    <ModulePage slug="users">
      {!allowed ? <Notice>افزودن کاربر با مدیر مسئول است.</Notice> : null}
      <Flash>{flash}</Flash>
      <form
        className="grid gap-3 rounded-xl border border-line bg-sheet p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed) return;
          if (!form.name.trim() || !form.username.trim()) {
            setFlash("نام و نام کاربری لازم است.");
            return;
          }
          if (usernameTaken(data, form.username.trim())) {
            setFlash("این نام کاربری وجود دارد.");
            return;
          }
          const validation = validateNewPassword(form.password);
          if (validation) {
            setFlash(validation);
            return;
          }
          if (form.password !== form.passwordConfirm) {
            setFlash("تکرار رمز با رمز ورود یکسان نیست.");
            return;
          }
          const passwordHash = hashPassword(form.password);
          update((current) =>
            pushActivity(
              {
                ...current,
                users: [
                  ...current.users,
                  {
                    id: uid("user"),
                    name: form.name.trim(),
                    username: form.username.trim(),
                    roleId: form.roleId,
                    active: true,
                    reporterGrade: form.roleId === "reporter" ? "junior" : undefined,
                    passwordHash,
                  },
                ],
              },
              `کاربر ${form.name.trim()} اضافه شد`,
            ),
          );
          setForm({ name: "", username: "", roleId: "reporter", password: "", passwordConfirm: "" });
          setFlash("کاربر اضافه شد.");
        }}
      >
        <Field label="نام">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="نام کاربری">
          <Input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            dir="ltr"
            data-testid="user-create-username"
          />
        </Field>
        <div className="md:col-span-2 lg:col-span-3">
          <UserPasswordPairFields
            password={form.password}
            confirm={form.passwordConfirm}
            onPasswordChange={(password) => setForm({ ...form, password })}
            onConfirmChange={(passwordConfirm) => setForm({ ...form, passwordConfirm })}
            passwordLabel="رمز عبور"
            confirmLabel="تکرار رمز"
            passwordTestId="user-create-password"
            disabled={!allowed}
          />
        </div>
        <Field label="نقش">
          <Select value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
            {data.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={!allowed} className="self-end md:col-span-2">
          افزودن کاربر
        </Button>
      </form>
      <p className="text-xs text-muted">رمزها به‌صورت هش SHA-256 در localStorage ذخیره می‌شوند (دمو استاتیک، نه امنیت واقعی).</p>
      <div className="overflow-x-auto rounded-xl border border-line bg-sheet shadow-sm">
        <table className="w-full min-w-[36rem] text-sm" data-testid="users-table">
          <thead className="border-b border-line bg-sand/40 text-xs text-muted">
            <tr>
              <th className="px-3 py-2.5 text-right font-semibold">نام</th>
              <th className="px-3 py-2.5 text-right font-semibold">کاربری</th>
              <th className="px-3 py-2.5 text-right font-semibold">نقش</th>
              <th className="px-3 py-2.5 text-right font-semibold">رتبه</th>
              <th className="px-3 py-2.5 text-right font-semibold">وضعیت</th>
              <th className="px-3 py-2.5 text-right font-semibold w-[7.5rem]">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => {
              const isEditing = editing?.id === user.id;
              const row = isEditing ? editing : user;
              return (
                <>
                <tr
                  key={user.id}
                  className={cn(
                    "border-b border-line transition-colors last:border-0",
                    isEditing ? "bg-primary-light/30" : "hover:bg-sand/35",
                  )}
                >
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Input value={row.name} aria-label="نام" onChange={(event) => setEditing({ ...row, name: event.target.value })} />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="px-3 py-2" dir="ltr">
                    {isEditing ? (
                      <Input value={row.username} aria-label="نام کاربری" onChange={(event) => setEditing({ ...row, username: event.target.value })} dir="ltr" />
                    ) : (
                      user.username
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Select value={row.roleId} aria-label="نقش کاربر" onChange={(event) => setEditing({ ...row, roleId: event.target.value })}>
                        {data.roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      roleName(user.roleId)
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Select
                        value={row.reporterGrade ?? "junior"}
                        aria-label="رتبه خبرنگار"
                        onChange={(event) => setEditing({ ...row, reporterGrade: event.target.value as User["reporterGrade"] })}
                      >
                        {Object.entries(REPORTER_GRADE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </Select>
                    ) : (
                      user.reporterGrade ? REPORTER_GRADE_LABELS[user.reporterGrade] : "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <Select
                        value={row.active ? "active" : "inactive"}
                        aria-label="وضعیت کاربر"
                        onChange={(event) => setEditing({ ...row, active: event.target.value === "active" })}
                      >
                        <option value="active">فعال</option>
                        <option value="inactive">غیرفعال</option>
                      </Select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          user.active ? "bg-teal-100 text-teal-900" : "bg-stone-100 text-stone-600",
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", user.active ? "bg-teal-600" : "bg-stone-400")}
                          aria-hidden="true"
                        />
                        {user.active ? "فعال" : "غیرفعال"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {isEditing ? (
                        <>
                          <Button tone="primary" disabled={!allowed} onClick={saveEdit}>
                            ذخیره
                          </Button>
                          <Button
                            tone="ghost"
                            onClick={() => {
                              setEditing(null);
                              setEditPassword("");
                              setEditPasswordConfirm("");
                            }}
                          >
                            انصراف
                          </Button>
                        </>
                      ) : (
                        <>
                          <IconButton
                            tone={user.active ? "default" : "success"}
                            label={user.active ? "غیرفعال‌سازی کاربر" : "فعال‌سازی کاربر"}
                            disabled={!allowed}
                            data-testid={`user-toggle-active-${user.id}`}
                            onClick={() => {
                              if (!allowed) return;
                              update((current) =>
                                pushActivity(
                                  {
                                    ...current,
                                    users: current.users.map((item) => (item.id === user.id ? { ...item, active: !item.active } : item)),
                                  },
                                  `دسترسی ${user.name} ${user.active ? "غیرفعال" : "فعال"} شد`,
                                ),
                              );
                            }}
                          >
                            {user.active ? <IconUserOff className="h-4 w-4" /> : <IconUserCheck className="h-4 w-4" />}
                          </IconButton>
                          <IconButton
                            tone="accent"
                            label="ویرایش کاربر"
                            disabled={!allowed}
                            data-testid={`user-edit-${user.id}`}
                            onClick={() => {
                              setEditing({ ...user });
                              setEditPassword("");
                              setEditPasswordConfirm("");
                              const custom = Object.prototype.hasOwnProperty.call(data.userModuleAccess, user.id);
                              setEditingCustomMenu(custom);
                              setEditingMenuKeys(
                                custom
                                  ? data.userModuleAccess[user.id] ?? []
                                  : data.roleModuleAccess[user.roleId] ?? [],
                              );
                            }}
                          >
                            <IconPencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            tone="danger"
                            label="حذف کاربر"
                            disabled={!allowed}
                            data-testid={`user-delete-${user.id}`}
                            onClick={() => removeUser(user)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {isEditing ? (
                  <tr key={`${user.id}-password`} className="border-b border-line bg-sand/20">
                    <td colSpan={6} className="px-3 py-3">
                      <UserPasswordPairFields
                        password={editPassword}
                        confirm={editPasswordConfirm}
                        onPasswordChange={setEditPassword}
                        onConfirmChange={setEditPasswordConfirm}
                        passwordLabel="رمز عبور جدید (خالی = بدون تغییر)"
                        confirmLabel="تکرار رمز جدید"
                        passwordTestId="user-edit-password"
                        confirmTestId="user-edit-password-confirm"
                        disabled={!allowed}
                      />
                    </td>
                  </tr>
                ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && allowed ? (
        <div className="space-y-3 rounded-lg border border-line bg-sheet p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={editingCustomMenu}
              onChange={(event) => {
                const checked = event.target.checked;
                setEditingCustomMenu(checked);
                if (checked && !editingMenuKeys.length) {
                  setEditingMenuKeys(data.roleModuleAccess[editing.roleId] ?? []);
                }
              }}
            />
            دسترسی منو مخصوص این کاربر (جایگزین نقش)
          </label>
          {editingCustomMenu ? (
            <ModuleAccessMatrix
              roleId={editing.id}
              roleName={editing.name}
              roleBase={data.roles.find((role) => role.id === editing.roleId)?.base ?? "reporter"}
              selectedKeys={editingMenuKeys}
              onChange={setEditingMenuKeys}
            />
          ) : (
            <p className="text-sm text-muted">در حالت عادی، منوی همین کاربر از نقش «{roleName(editing.roleId)}» پیروی می‌کند.</p>
          )}
        </div>
      ) : null}
    </ModulePage>
  );
}

export function AccessScreen() {
  const { data, update } = useNewsroom();
  const allowed = canPerm(data, "manageUsers") || canPerm(data, "manageStructure");
  const manageMenus = canManageModuleAccess(data);
  const [menuRoleId, setMenuRoleId] = useState(data.roles[0]?.id ?? "reporter");
  const menuRole = data.roles.find((role) => role.id === menuRoleId) ?? data.roles[0];
  const menuKeys = data.roleModuleAccess[menuRoleId] ?? [];
  return (
    <ModulePage slug="access">
      <Notice>این جدول کنار سطح نقش، ویرایش و انتشار هر دسته را محدود می‌کند. خبرنگار نمونه روی سیاست حق ویرایش ندارد.</Notice>
      <div className="space-y-3">
        <ModuleAccessRolePicker roleId={menuRoleId} roles={data.roles} onRoleId={setMenuRoleId} />
        {menuRole ? (
          <ModuleAccessMatrix
            roleId={menuRole.id}
            roleName={menuRole.name}
            roleBase={menuRole.base}
            selectedKeys={menuKeys}
            disabled={!manageMenus}
            onChange={(keys) => {
              update((current) => ({
                ...current,
                roleModuleAccess: { ...current.roleModuleAccess, [menuRoleId]: keys },
              }));
            }}
          />
        ) : null}
        {!manageMenus ? <Notice>تنظیم دسترسی منو فقط با مدیر مسئول ممکن است.</Notice> : null}
      </div>
      <h2 className="text-lg font-bold">دسترسی دسته‌های خبر</h2>
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-right font-medium">نقش</th>
              <th className="px-3 py-2 text-right font-medium">دسته</th>
              <th className="px-3 py-2 text-right font-medium">ویرایش</th>
              <th className="px-3 py-2 text-right font-medium">انتشار</th>
            </tr>
          </thead>
          <tbody>
            {data.access.map((rule) => (
              <tr key={`${rule.roleId}-${rule.categoryId}`} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{data.roles.find((role) => role.id === rule.roleId)?.name ?? rule.roleId}</td>
                <td className="px-3 py-2">{categoryName(data, rule.categoryId)}</td>
                {(["edit", "publish"] as const).map((key) => (
                  <td key={key} className="px-3 py-2">
                    <input
                      type="checkbox"
                      disabled={!allowed}
                      checked={rule[key]}
                      aria-label={key === "edit" ? "اجازه ویرایش" : "اجازه انتشار"}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        update((current) => ({
                          ...current,
                          access: current.access.map((item) =>
                            item.roleId === rule.roleId && item.categoryId === rule.categoryId ? { ...item, [key]: checked } : item,
                          ),
                        }));
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}

export function SettingsScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState(data.settings);
  const [flash, setFlash] = useState("");
  return (
    <ModulePage slug="settings">
      <Flash>{flash}</Flash>
      <form
        className="max-w-lg space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const pageSize = Math.min(100, Math.max(5, Number(form.pageSize) || 20));
          update((current) => ({ ...current, settings: { ...form, newsroomName: form.newsroomName.trim() || current.settings.newsroomName, pageSize } }));
          setFlash("تنظیم‌ها ذخیره شد و نام بالای صفحه عوض می‌شود.");
        }}
      >
        <Field label="نام اتاق خبر">
          <Input value={form.newsroomName} onChange={(event) => setForm({ ...form, newsroomName: event.target.value })} />
        </Field>
        <Field label="توضیح کوتاه">
          <Input value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} />
        </Field>
        <Field label="تعداد خبر در هر صفحه فهرست">
          <Input type="number" min={5} max={100} value={form.pageSize} onChange={(event) => setForm({ ...form, pageSize: Number(event.target.value) })} />
        </Field>
        <Button type="submit">ذخیره تنظیم‌ها</Button>
      </form>
    </ModulePage>
  );
}

export function MonitoringScreen() {
  const { data } = useNewsroom();
  const [stamp, setStamp] = useState(() => new Date().toISOString());
  const cards = [
    ["حجم ذخیره", bytesLabel(data)],
    ["خبرها", faNum(data.stories.length)],
    ["نظرهای باز", faNum(data.comments.filter((comment) => comment.status === "pending").length)],
    ["آخرین سنجش", faDate(stamp)],
  ];
  return (
    <ModulePage slug="monitoring">
      <Notice>سروری پشت این عددها نیست. سنجش، حافظه محلی مرورگر را دوباره می‌خواند.</Notice>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-line bg-sheet p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </article>
        ))}
      </div>
      <Button
        onClick={() => {
          setStamp(new Date().toISOString());
        }}
      >
        سنجش دوباره
      </Button>
    </ModulePage>
  );
}

export function BackupScreen() {
  const { data, replaceData, resetData } = useNewsroom();
  const allowed = canPerm(data, "manageUsers");
  const [armed, setArmed] = useState(false);
  const [flash, setFlash] = useState("");

  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "newsroom-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    setFlash("فایل پشتیبان دانلود شد.");
  }

  return (
    <ModulePage slug="backup">
      <Notice>فایل، همین داده مرورگر است. ورودی و بازگردانی نمونه فقط برای مدیر مسئول باز است.</Notice>
      <Flash>{flash}</Flash>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}>دانلود پشتیبان</Button>
        <label className={`rounded-md border border-line bg-sheet px-3 py-2 text-sm ${allowed ? "" : "opacity-40"}`}>
          خواندن فایل
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            disabled={!allowed}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text()) as Partial<NewsroomData>;
                if (!Array.isArray(parsed.stories)) throw new Error("bad");
                replaceData(mergeSeed(parsed));
                setFlash("داده فایل جایگزین شد.");
              } catch {
                setFlash("فایل قابل خواندن نبود.");
              }
            }}
          />
        </label>
        <Button tone="ghost" disabled={!allowed} onClick={() => setArmed(true)}>
          بازگردانی داده نمونه
        </Button>
        {armed ? (
          <Button
            tone="accent"
            onClick={() => {
              resetData();
              setArmed(false);
              setFlash("داده نمونه برگشت.");
            }}
          >
            تأیید بازگردانی
          </Button>
        ) : null}
      </div>
    </ModulePage>
  );
}

export function TicketsScreen() {
  const { data, update } = useNewsroom();
  const defaultRecipient = defaultTicketRecipient(data);
  const [form, setForm] = useState({ title: "", body: "", recipient: defaultRecipient });
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [flash, setFlash] = useState("");

  const recipientOptions = [
    ...TICKET_RECIPIENT_PRESETS.map((item) => ({ value: item.id, label: item.label })),
    ...data.users.filter((user) => user.active).map((user) => ({ value: `user:${user.id}`, label: `${user.name} (کاربر)` })),
  ];

  const filteredTickets = data.tickets.filter((ticket) => {
    if (recipientFilter === "all") return true;
    return (ticket.recipient ?? defaultRecipient) === recipientFilter;
  });

  return (
    <ModulePage slug="tickets">
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        data-testid="ticket-create-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.title.trim()) return;
          update((current) => ({
            ...current,
            tickets: [
              {
                id: uid("ticket"),
                title: form.title.trim(),
                body: form.body.trim(),
                status: "open",
                author: currentRole(current).name,
                recipient: form.recipient || defaultRecipient,
                createdAt: new Date().toISOString(),
              },
              ...current.tickets,
            ],
          }));
          setForm({ title: "", body: "", recipient: defaultRecipient });
          setFlash("تیکت ثبت شد.");
        }}
      >
        <Field label="گیرنده تیکت / ارجاع به">
          <Select
            value={form.recipient}
            data-testid="ticket-recipient-select"
            aria-label="گیرنده تیکت"
            onChange={(event) => setForm({ ...form, recipient: event.target.value })}
          >
            <optgroup label="نقش‌ها و واحدها">
              {TICKET_RECIPIENT_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </optgroup>
            <optgroup label="کاربر مشخص">
              {data.users.filter((user) => user.active).map((user) => (
                <option key={user.id} value={`user:${user.id}`}>{user.name}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="موضوع">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} data-testid="ticket-title-input" />
        </Field>
        <Field label="شرح">
          <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </Field>
        <Button type="submit" data-testid="ticket-submit">ثبت تیکت</Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Field label="فیلتر گیرنده">
          <Select value={recipientFilter} onChange={(event) => setRecipientFilter(event.target.value)} data-testid="ticket-recipient-filter" aria-label="فیلتر گیرنده">
            <option value="all">همه گیرنده‌ها</option>
            {recipientOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-sheet" data-testid="ticket-list">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-right">موضوع</th>
              <th className="px-3 py-2 text-right">گیرنده</th>
              <th className="px-3 py-2 text-right">فرستنده</th>
              <th className="px-3 py-2 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-line last:border-0 align-top">
                <td className="px-3 py-3">
                  <p className="font-bold">{ticket.title}</p>
                  <p className="mt-1 text-xs text-muted line-clamp-2">{ticket.body}</p>
                  <p className="mt-1 text-[11px] text-muted">{faDate(ticket.createdAt)}</p>
                </td>
                <td className="px-3 py-3 font-medium text-accent" data-testid="ticket-recipient-cell">
                  {ticketRecipientLabel(data, ticket.recipient ?? defaultRecipient)}
                </td>
                <td className="px-3 py-3">{ticket.author}</td>
                <td className="px-3 py-3">
                  <Select
                    value={ticket.status}
                    aria-label="وضعیت تیکت"
                    onChange={(event) => {
                      const status = event.target.value as typeof ticket.status;
                      update((current) => ({ ...current, tickets: current.tickets.map((item) => (item.id === ticket.id ? { ...item, status } : item)) }));
                    }}
                    className="max-w-36"
                  >
                    <option value="open">باز</option>
                    <option value="pending">در حال بررسی</option>
                    <option value="closed">بسته</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}

export function CommsScreen() {
  const { data, update } = useNewsroom();
  const me = currentRole(data).name;
  const [form, setForm] = useState({ to: data.users[0]?.name ?? "", body: "" });
  const [flash, setFlash] = useState("");
  return (
    <ModulePage slug="comms">
      <Flash>{flash}</Flash>
      <form
        className="space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.body.trim()) return;
          update((current) => ({
            ...current,
            notes: [{ id: uid("nt"), from: me, to: form.to, body: form.body.trim(), read: false, createdAt: new Date().toISOString() }, ...current.notes],
          }));
          setForm({ ...form, body: "" });
          setFlash("پیام داخلی ثبت شد.");
        }}
      >
        <Field label="گیرنده">
          <Select value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })}>
            {data.users.map((user) => (
              <option key={user.id}>{user.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="پیام">
          <TextArea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </Field>
        <Button type="submit">فرستادن در میز</Button>
      </form>
      {data.notes.length === 0 ? <Empty>پیامی نیست.</Empty> : null}
      {data.notes.map((note) => (
        <article key={note.id} className="rounded-lg border border-line bg-sheet p-4">
          <p className="text-xs text-muted">
            {note.from} به {note.to} · {faDate(note.createdAt)} · {note.read ? "خوانده‌شده" : "نخوانده"}
          </p>
          <p className="mt-1 text-sm leading-7">{note.body}</p>
          {!note.read ? (
            <Button tone="ghost" className="mt-2" onClick={() => update((current) => ({ ...current, notes: current.notes.map((item) => (item.id === note.id ? { ...item, read: true } : item)) }))}>
              علامت خوانده
            </Button>
          ) : null}
        </article>
      ))}
    </ModulePage>
  );
}

export function SubsitesScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ name: "", slug: "" });
  const [flash, setFlash] = useState("");
  return (
    <ModulePage slug="subsites">
      <Notice>این‌ها رکورد محلی‌اند. زیرسایتی از اینجا بالا نمی‌آید.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.slug.trim()) return;
          update((current) => ({ ...current, subsites: [...current.subsites, { id: uid("site"), name: form.name.trim(), slug: form.slug.trim(), active: true }] }));
          setForm({ name: "", slug: "" });
          setFlash("زیرسایت ثبت شد.");
        }}
      >
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="نام" />
        <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="slug" dir="ltr" />
        <Button type="submit">ثبت زیرسایت</Button>
      </form>
      {data.subsites.map((site) => (
        <article key={site.id} className="flex items-center justify-between rounded-lg border border-line bg-sheet px-4 py-3">
          <div>
            <h2 className="font-semibold">{site.name}</h2>
            <p className="text-xs text-muted" dir="ltr">{site.slug}</p>
          </div>
          <Button tone="ghost" onClick={() => update((current) => ({ ...current, subsites: current.subsites.map((item) => (item.id === site.id ? { ...item, active: !item.active } : item)) }))}>
            {site.active ? "فعال" : "خاموش"}
          </Button>
        </article>
      ))}
    </ModulePage>
  );
}

export function LinksScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ title: "", url: "", group: "پاصفحه" });
  return (
    <ModulePage slug="links">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.title.trim()) return;
          update((current) => ({ ...current, links: [...current.links, { id: uid("ln"), ...form, title: form.title.trim() }] }));
          setForm({ title: "", url: "", group: form.group });
        }}
      >
        <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="عنوان" />
        <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="/path" dir="ltr" />
        <Select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}>
          <option>پاصفحه</option>
          <option>ستون</option>
        </Select>
        <Button type="submit">افزودن پیوند</Button>
      </form>
      <ul className="divide-y divide-line rounded-lg border border-line bg-sheet">
        {data.links.map((link) => (
          <li key={link.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>
              {link.title} <span className="text-muted">({link.group})</span>
            </span>
            <Button tone="quiet" onClick={() => update((current) => ({ ...current, links: current.links.filter((item) => item.id !== link.id) }))}>
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </ModulePage>
  );
}

export function LogosScreen() {
  const { data, update } = useNewsroom();
  const [flash, setFlash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = data.settings;

  function patchSettings(partial: Partial<Settings>) {
    update((current) => ({
      ...current,
      settings: { ...current.settings, ...partial },
    }));
  }

  function pickMark(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFlash("فقط فایل تصویر قابل قبول است.");
      return;
    }
    if (file.size > 2_500_000) {
      setFlash("حجم تصویر زیاد است. فایل کوچک‌تر از ۲٫۵ مگابایت انتخاب کنید.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchSettings({ brandMark: reader.result });
        setFlash("آرم ذخیره شد.");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <ModulePage slug="logos">
      <Notice>نام رسانه و عنوان نمایش، وقتی پر باشند در سرصفحه و منوی کناری جای نام اتاق خبر و شعار می‌نشینند.</Notice>
      <Flash>{flash}</Flash>
      <div className="max-w-xl space-y-4 rounded-lg border border-line bg-sheet p-4">
        <Field label="نام رسانه">
          <Input value={settings.mediaName ?? ""} onChange={(event) => patchSettings({ mediaName: event.target.value })} placeholder="نام رسانه" />
        </Field>
        <Field label="عنوان نمایش داده شده">
          <Input value={settings.mediaDisplayTitle ?? ""} onChange={(event) => patchSettings({ mediaDisplayTitle: event.target.value })} placeholder="عنوان نمایش داده شده" />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">آرم و نشان</p>
          {settings.brandMark ? (
            <img src={settings.brandMark} alt="" className="h-24 w-24 rounded-md border border-line bg-paper object-contain" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-line text-xs text-muted">بدون آرم</div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickMark} />
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" onClick={() => fileRef.current?.click()}>
              {settings.brandMark ? "عوض کردن آرم" : "انتخاب از رایانه"}
            </Button>
            {settings.brandMark ? (
              <Button tone="quiet" onClick={() => patchSettings({ brandMark: "" })}>
                برداشتن آرم
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}

export function FormsScreen() {
  const { data, update } = useNewsroom();
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [target, setTarget] = useState(data.forms[0]?.id ?? "");
  return (
    <ModulePage slug="forms">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          const id = uid("fm");
          update((current) => ({ ...current, forms: [...current.forms, { id, name: name.trim(), fields: [], active: true }] }));
          setTarget(id);
          setName("");
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="نام فرم تازه" />
        <Button type="submit">ساخت فرم</Button>
      </form>
      {data.forms.map((form) => (
        <article key={form.id} className="rounded-lg border border-line bg-sheet p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{form.name}</h2>
            <Button tone="ghost" onClick={() => update((current) => ({ ...current, forms: current.forms.map((item) => (item.id === form.id ? { ...item, active: !item.active } : item)) }))}>
              {form.active ? "فعال" : "خاموش"}
            </Button>
          </div>
          <p className="mt-2 text-sm">{form.fields.join("، ") || "فیلدی ندارد."}</p>
          <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (target !== form.id || !field.trim()) return;
                update((current) => ({
                  ...current,
                  forms: current.forms.map((item) => (item.id === form.id ? { ...item, fields: [...item.fields, field.trim()] } : item)),
                }));
                setField("");
                setTarget(form.id);
              }}
            >
              <Input value={target === form.id ? field : ""} onChange={(event) => { setTarget(form.id); setField(event.target.value); }} placeholder="فیلد تازه" />
              <Button type="submit">افزودن فیلد</Button>
            </form>
        </article>
      ))}
    </ModulePage>
  );
}

export function MenusScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ label: "", href: "/" });
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [flash, setFlash] = useState("");

  function move(index: number, dir: -1 | 1) {
    update((current) => {
      const menus = current.menus.slice();
      const target = index + dir;
      if (target < 0 || target >= menus.length) return current;
      const [item] = menus.splice(index, 1);
      menus.splice(target, 0, item);
      return { ...current, menus };
    });
  }

  function saveMenuEdit() {
    if (!editing) return;
    const label = editing.label.trim();
    const href = editing.href.trim() || "/";
    if (!label) {
      setFlash("برچسب منو را بنویسید.");
      return;
    }
    update((current) =>
      pushActivity(
        { ...current, menus: current.menus.map((item) => (item.id === editing.id ? { ...editing, label, href } : item)) },
        `منو «${label}» ویرایش شد`,
      ),
    );
    setEditing(null);
    setFlash("تغییرات منو ذخیره شد.");
  }

  return (
    <ModulePage slug="menus">
      <Flash>{flash}</Flash>
      <ol className="space-y-2">
        {data.menus.map((item, index) => {
          const isEditing = editing?.id === item.id;
          const row = isEditing ? editing : item;
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-sheet px-3 py-2">
              {isEditing ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  <Input value={row.label} aria-label="برچسب منو" onChange={(event) => setEditing({ ...row, label: event.target.value })} placeholder="برچسب" className="max-w-xs" />
                  <Input value={row.href} aria-label="نشانی منو" onChange={(event) => setEditing({ ...row, href: event.target.value })} placeholder="/path" dir="ltr" className="max-w-xs" />
                </div>
              ) : (
                <span className="text-sm">
                  {item.label} <span className="text-muted" dir="ltr">{item.href}</span>
                </span>
              )}
              <span className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button tone="primary" onClick={saveMenuEdit}>ذخیره</Button>
                    <Button tone="ghost" onClick={() => setEditing(null)}>انصراف</Button>
                  </>
                ) : (
                  <>
                    <Button tone="ghost" onClick={() => move(index, -1)}>بالا</Button>
                    <Button tone="ghost" onClick={() => move(index, 1)}>پایین</Button>
                    <Button tone="ghost" onClick={() => setEditing({ ...item })}>ویرایش</Button>
                    <Button
                      tone="quiet"
                      onClick={() => {
                        update((current) =>
                          pushActivity(
                            { ...current, menus: current.menus.filter((menu) => menu.id !== item.id) },
                            `منو «${item.label}» حذف شد`,
                          ),
                        );
                        if (editing?.id === item.id) setEditing(null);
                        setFlash(`منو «${item.label}» حذف شد.`);
                      }}
                    >
                      حذف
                    </Button>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.label.trim()) return;
          update((current) => ({ ...current, menus: [...current.menus, { id: uid("mn"), label: form.label.trim(), href: form.href.trim() || "/" }] }));
          setForm({ label: "", href: "/" });
        }}
      >
        <Input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="برچسب" />
        <Input value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} placeholder="/path" dir="ltr" />
        <Button type="submit">افزودن به منو</Button>
      </form>
    </ModulePage>
  );
}

const permissionLabels: { key: keyof Permissions; label: string }[] = [
  { key: "write", label: "نوشتن پیش‌نویس" },
  { key: "review", label: "ویرایش و بازبینی" },
  { key: "publish", label: "انتشار" },
  { key: "archive", label: "آرشیو" },
  { key: "manageUsers", label: "کاربران و پشتیبان" },
  { key: "manageStructure", label: "ساختار سایت" },
];

export function RolesScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState({ name: "", base: "reporter" as RoleBase });
  const [flash, setFlash] = useState("");
  const locked = new Set(["publisher", "chief", "reporter"]);
  return (
    <ModulePage slug="roles">
      <Notice>سطح دسترسی همین‌جا دکمه کارتابل، ساختار و کاربران را عوض می‌کند. سه نقش اصلی حذف نمی‌شوند.</Notice>
      <Flash>{flash}</Flash>
      <div className="space-y-3">
        {data.roles.map((role) => (
          <article key={role.id} className="rounded-lg border border-line bg-sheet p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Input
                value={role.name}
                aria-label="نام نقش"
                className="max-w-xs font-semibold"
                onChange={(event) => {
                  const name = event.target.value;
                  update((current) => ({ ...current, roles: current.roles.map((item) => (item.id === role.id ? { ...item, name } : item)) }));
                }}
              />
              {!locked.has(role.id) ? (
                <Button
                  tone="quiet"
                  onClick={() => {
                    if (data.users.some((user) => user.roleId === role.id)) {
                      setFlash("کاربری با این نقش هست.");
                      return;
                    }
                    update((current) => ({
                      ...current,
                      roles: current.roles.filter((item) => item.id !== role.id),
                      currentRoleId: current.currentRoleId === role.id ? "reporter" : current.currentRoleId,
                    }));
                  }}
                >
                  حذف نقش
                </Button>
              ) : (
                <span className="text-xs text-muted">پایه: {ACTORS.find((actor) => actor.id === role.base)?.name}</span>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {permissionLabels.map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={role.permissions[permission.key]}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      update((current) => ({
                        ...current,
                        roles: current.roles.map((item) =>
                          item.id === role.id ? { ...item, permissions: { ...item.permissions, [permission.key]: checked } } : item,
                        ),
                      }));
                    }}
                  />
                  {permission.label}
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim()) return;
          const baseRole = data.roles.find((role) => role.id === form.base);
          if (!baseRole) return;
          const id = uid("role");
          update((current) => ({
            ...current,
            roles: [...current.roles, { id, name: form.name.trim(), base: form.base, permissions: { ...baseRole.permissions } }],
            roleModuleAccess: {
              ...current.roleModuleAccess,
              [id]: [...(current.roleModuleAccess[form.base] ?? [])],
            },
            access: [
              ...current.access,
              ...current.categories.map((category) => {
                const source = current.access.find((rule) => rule.roleId === form.base && rule.categoryId === category.id);
                return { roleId: id, categoryId: category.id, edit: source?.edit ?? true, publish: source?.publish ?? false };
              }),
            ],
          }));
          setForm({ name: "", base: "reporter" });
          setFlash("نقش تازه به تعویض‌گر بالا اضافه شد.");
        }}
      >
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="نام نقش تازه" />
        <Select value={form.base} onChange={(event) => setForm({ ...form, base: event.target.value as RoleBase })}>
          {ACTORS.map((actor) => (
            <option key={actor.id} value={actor.id}>
              کپی از {actor.name}
            </option>
          ))}
        </Select>
        <Button type="submit">تعریف نقش</Button>
      </form>
    </ModulePage>
  );
}

export function PortalScreen() {
  const { data, update } = useNewsroom();
  const [form, setForm] = useState(data.portal);
  const [flash, setFlash] = useState("");
  return (
    <ModulePage slug="portal">
      <Notice>ذخیره این فرم فقط مشخصات را در مرورگر نگه می‌دارد و به پورتال سازمان وصل نمی‌شود.</Notice>
      <Flash>{flash}</Flash>
      <form
        className="max-w-lg space-y-3 rounded-lg border border-line bg-sheet p-4"
        onSubmit={(event) => {
          event.preventDefault();
          update((current) => ({ ...current, portal: { ...form, lastCheck: current.portal.lastCheck } }));
          setFlash("مشخصات اتصال ذخیره شد. تماسی برقرار نشد.");
        }}
      >
        <Field label="نشانی پورتال">
          <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} dir="ltr" placeholder="https://" />
        </Field>
        <Field label="یادداشت">
          <TextArea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
          نگه‌داشتن این مشخصات به‌عنوان اتصال مورد نظر
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">ثبت مشخصات</Button>
          <Button
            tone="ghost"
            onClick={() => {
              let message = "نشانی خالی است.";
              try {
                if (form.url.trim()) {
                  const parsed = new URL(form.url.trim());
                  message = parsed.protocol === "https:" || parsed.protocol === "http:" ? "قالب نشانی درست است. اتصال زنده انجام نشد." : "فقط نشانی http یا https پذیرفته است.";
                }
              } catch {
                message = "قالب نشانی نادرست است.";
              }
              const lastCheck = message;
              setForm({ ...form, lastCheck });
              update((current) => ({ ...current, portal: { ...form, lastCheck } }));
              setFlash(message);
            }}
          >
            بررسی قالب نشانی
          </Button>
        </div>
        <p className="text-sm text-muted">{form.lastCheck}</p>
      </form>
    </ModulePage>
  );
}
