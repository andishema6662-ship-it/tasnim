"use client";

import { useCallback, useState } from "react";
import { faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { ContactMsg } from "@/lib/types";
import { Button, Field, Flash, Input, TextArea } from "../ui";

function randomCaptcha(): { a: number; b: number } {
  return { a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 };
}

type ContactFormProps = {
  showEmail?: boolean;
  emailOptional?: boolean;
  onSubmitted?: () => void;
  testId?: string;
};

export function ContactForm({ showEmail = true, emailOptional = true, onSubmitted, testId = "contact-form" }: ContactFormProps) {
  const { update } = useNewsroom();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [captcha, setCaptcha] = useState(randomCaptcha);
  const [answer, setAnswer] = useState("");
  const [flash, setFlash] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptcha(randomCaptcha());
    setAnswer("");
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const expected = captcha.a + captcha.b;
    const parsed = Number(answer.trim().replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setFlash("نام، عنوان و متن پیام الزامی است.");
      return;
    }
    if (showEmail && !emailOptional && !email.trim()) {
      setFlash("ایمیل الزامی است.");
      return;
    }
    if (parsed !== expected) {
      setFlash("کد امنیتی درست نیست. دوباره تلاش کنید.");
      refreshCaptcha();
      return;
    }
    const message: ContactMsg = {
      id: uid("ct"),
      name: name.trim(),
      email: email.trim() || "—",
      subject: subject.trim(),
      body: body.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, contacts: [message, ...current.contacts] }));
    setName("");
    setEmail("");
    setSubject("");
    setBody("");
    setAnswer("");
    refreshCaptcha();
    setFlash("پیام شما ثبت شد. تحریریه در اسرع وقت پاسخ می‌دهد.");
    onSubmitted?.();
  }

  return (
    <form className="space-y-3 rounded-2xl border border-line bg-sheet p-4 shadow-sm" onSubmit={submit} data-testid={testId}>
      <Flash>{flash}</Flash>
      <Field label="نام و نام خانوادگی">
        <Input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
      </Field>
      <Field label="عنوان پیام">
        <Input value={subject} onChange={(event) => setSubject(event.target.value)} required />
      </Field>
      {showEmail ? (
        <Field label={emailOptional ? "ایمیل (اختیاری)" : "ایمیل"}>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" type="email" />
        </Field>
      ) : null}
      <Field label="متن توضیح / پیام">
        <TextArea value={body} onChange={(event) => setBody(event.target.value)} rows={5} required />
      </Field>
      <div className="rounded-lg border border-dashed border-line bg-paper p-3">
        <p className="text-sm font-medium">کد امنیتی کپچا</p>
        <p className="mt-1 text-sm text-muted">
          حاصل جمع {faNum(captcha.a)} + {faNum(captcha.b)} را وارد کنید.
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem] flex-1">
          <Field label="پاسخ">
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              inputMode="numeric"
              data-testid="contact-captcha-answer"
              aria-label="پاسخ کپچا"
            />
          </Field>
          </div>
          <Button type="button" tone="ghost" onClick={refreshCaptcha} data-testid="contact-captcha-refresh">
            تازه‌سازی
          </Button>
        </div>
      </div>
      <Button type="submit" data-testid="contact-submit">ارسال پیام</Button>
    </form>
  );
}
