"use client";

import { useState, type FormEvent } from "react";
import { pushActivity } from "@/lib/activity";
import { hashPassword, validateNewPassword, verifyUserPassword } from "@/lib/password";
import { useNewsroom } from "@/lib/store";
import type { User } from "@/lib/types";
import { Button, Field, Flash, Input } from "../ui";

export function ChangePasswordForm({ user }: { user: User }) {
  const { data, update } = useNewsroom();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setFlash("");
    const live = data.users.find((item) => item.id === user.id) ?? user;
    if (!verifyUserPassword(live, current)) {
      setError("رمز فعلی نادرست است.");
      return;
    }
    const validation = validateNewPassword(next);
    if (validation) {
      setError(validation);
      return;
    }
    if (next !== confirm) {
      setError("تکرار رمز با رمز جدید یکسان نیست.");
      return;
    }
    if (next === current) {
      setError("رمز جدید باید با رمز فعلی متفاوت باشد.");
      return;
    }
    const passwordHash = hashPassword(next);
    update((data) =>
      pushActivity(
        {
          ...data,
          users: data.users.map((item) => (item.id === user.id ? { ...item, passwordHash } : item)),
        },
        "رمز عبور حساب شما به‌روزرسانی شد",
      ),
    );
    setCurrent("");
    setNext("");
    setConfirm("");
    setFlash("رمز عبور با موفقیت تغییر کرد.");
  }

  return (
    <section
      className="mt-6 rounded-lg border border-line bg-sheet p-4"
      data-testid="change-password-form"
      aria-labelledby="change-password-title"
    >
      <h2 id="change-password-title" className="text-base font-bold text-ink">تغییر رمز عبور</h2>
      <p className="mt-1 text-sm text-muted">رمز ورود به پنل مدیریت فقط برای حساب شما ذخیره می‌شود (دمو محلی).</p>
      <Flash>{flash}</Flash>
      {error ? <p className="mt-2 text-sm text-rose-700" role="alert">{error}</p> : null}
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="md:col-span-2">
          <Field label="رمز فعلی">
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              data-testid="change-password-current"
              dir="ltr"
            />
          </Field>
        </div>
        <Field label="رمز جدید">
          <Input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            data-testid="change-password-new"
            dir="ltr"
          />
        </Field>
        <Field label="تکرار رمز جدید">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            data-testid="change-password-confirm"
            dir="ltr"
          />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" tone="primary" data-testid="change-password-submit">
            ذخیره رمز جدید
          </Button>
        </div>
      </form>
    </section>
  );
}
