"use client";

import { useCallback, useState } from "react";
import { generateStrongPassword } from "@/lib/password";
import { Button, Field, Input, cn } from "../ui";

type Props = {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  passwordLabel: string;
  confirmLabel: string;
  passwordTestId?: string;
  confirmTestId?: string;
  disabled?: boolean;
  className?: string;
};

export function UserPasswordPairFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  passwordLabel,
  confirmLabel,
  passwordTestId,
  confirmTestId,
  disabled,
  className,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [generatedValue, setGeneratedValue] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState("");

  const suggest = useCallback(() => {
    const value = generateStrongPassword();
    onPasswordChange(value);
    onConfirmChange(value);
    setGeneratedValue(value);
    setVisible(true);
    setCopyHint("");
  }, [onConfirmChange, onPasswordChange]);

  async function copyGenerated() {
    const text = generatedValue ?? password;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint("رمز در حافظه کپی شد.");
    } catch {
      setCopyHint("کپی خودکار ممکن نبود؛ رمز را دستی انتخاب کنید.");
    }
  }

  function onPasswordInput(value: string) {
    if (generatedValue && value !== generatedValue) setGeneratedValue(null);
    onPasswordChange(value);
  }

  function onConfirmInput(value: string) {
    if (generatedValue && value !== generatedValue) setGeneratedValue(null);
    onConfirmChange(value);
  }

  const inputType = visible ? "text" : "password";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          tone="ghost"
          className="text-xs"
          disabled={disabled}
          data-testid="user-password-suggest"
          onClick={suggest}
        >
          پیشنهاد رمز قوی
        </Button>
        <Button
          type="button"
          tone="quiet"
          className="text-xs"
          disabled={disabled || (!password && !confirm)}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? "پنهان کردن رمز" : "نمایش رمز"}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={passwordLabel}>
          <Input
            type={inputType}
            value={password}
            onChange={(event) => onPasswordInput(event.target.value)}
            dir="ltr"
            autoComplete="new-password"
            disabled={disabled}
            data-testid={passwordTestId}
          />
        </Field>
        <Field label={confirmLabel}>
          <Input
            type={inputType}
            value={confirm}
            onChange={(event) => onConfirmInput(event.target.value)}
            dir="ltr"
            autoComplete="new-password"
            disabled={disabled}
            data-testid={confirmTestId}
          />
        </Field>
      </div>
      {generatedValue ? (
        <div
          className="rounded-lg border border-teal-200/80 bg-teal-50/80 px-3 py-2 text-sm text-teal-950"
          data-testid="user-password-generated-banner"
          role="status"
        >
          <p className="text-xs font-medium text-teal-900">رمز پیشنهادی (یک‌بار نمایش داده می‌شود — برای کاربر ذخیره کنید)</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="select-all rounded bg-white/80 px-2 py-1 font-mono text-xs" dir="ltr">
              {visible ? generatedValue : "••••••••••••••••"}
            </code>
            <Button type="button" tone="ghost" className="text-xs" onClick={copyGenerated}>
              کپی رمز
            </Button>
          </div>
          {copyHint ? <p className="mt-1 text-xs text-teal-800">{copyHint}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
