"use client";

import { DASHBOARD_MODULE_KEY, roleModulePreset } from "@/lib/module-access";
import { groups, moduleKey, modules } from "@/lib/modules";
import type { RoleBase } from "@/lib/types";
import { Button, Field, Select } from "../ui";

export function ModuleAccessMatrix({
  roleId,
  roleName,
  roleBase,
  selectedKeys,
  disabled,
  onChange,
}: {
  roleId: string;
  roleName: string;
  roleBase: RoleBase;
  selectedKeys: string[];
  disabled?: boolean;
  onChange: (keys: string[]) => void;
}) {
  const selected = new Set(selectedKeys);

  function toggle(key: string) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  }

  function applyPreset() {
    onChange(roleModulePreset(roleBase));
  }

  function selectAll() {
    onChange([DASHBOARD_MODULE_KEY, ...modules.map((item) => moduleKey(item))]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="rounded-lg border border-line bg-sheet p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">دسترسی منو — {roleName}</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" tone="ghost" disabled={disabled} onClick={applyPreset}>
            پیش‌فرض نقش
          </Button>
          <Button type="button" tone="ghost" disabled={disabled} onClick={selectAll}>
            همه
          </Button>
          <Button type="button" tone="quiet" disabled={disabled} onClick={clearAll}>
            هیچ‌کدام
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">شناسه نقش: {roleId}</p>
      <div className="mt-4 space-y-4">
        <section>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              disabled={disabled}
              checked={selected.has(DASHBOARD_MODULE_KEY)}
              onChange={() => toggle(DASHBOARD_MODULE_KEY)}
            />
            پیشخوان
          </label>
        </section>
        {groups.map((group) => (
          <section key={group.id}>
            <p className="text-xs font-semibold text-rule">{group.title}</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {modules
                .filter((item) => item.group === group.id)
                .map((item) => {
                  const key = moduleKey(item);
                  return (
                    <li key={key}>
                      <label className="flex items-start gap-2 text-sm leading-6">
                        <input
                          type="checkbox"
                          className="mt-1"
                          disabled={disabled}
                          checked={selected.has(key)}
                          onChange={() => toggle(key)}
                        />
                        <span>{item.title}</span>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ModuleAccessRolePicker({
  roleId,
  roles,
  onRoleId,
}: {
  roleId: string;
  roles: { id: string; name: string }[];
  onRoleId: (id: string) => void;
}) {
  return (
    <Field label="نقش برای تنظیم دسترسی منو">
      <Select value={roleId} onChange={(event) => onRoleId(event.target.value)}>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
