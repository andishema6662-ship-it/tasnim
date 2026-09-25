"use client";

import { useState } from "react";
import { suggestAudio, suggestImage, suggestSummary, suggestTags, suggestTitle } from "@/lib/assist";
import type { Story } from "@/lib/types";
import { Button, Notice } from "../ui";

type Patch = Partial<Pick<Story, "title" | "lead" | "tags" | "imagePrompt" | "audioScript" | "cover">>;

type Suggestion =
  | { kind: "title"; text: string }
  | { kind: "lead"; text: string }
  | { kind: "tags"; tags: string[] }
  | { kind: "image"; prompt: string; cover: string }
  | { kind: "audio"; script: string };

export function AssistBar({
  title,
  lead,
  body,
  desk,
  onApply,
}: {
  title: string;
  lead: string;
  body: string;
  desk: string;
  onApply: (patch: Patch) => void;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [hint, setHint] = useState("");
  const source = `${title}\n${lead}\n${body}`.trim();

  function needText() {
    if (source) return false;
    setHint("اول عنوان، لید یا متن را بنویسید تا دستیار پیشنهاد بدهد.");
    setSuggestion(null);
    return true;
  }

  function speak(script: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setHint("پخش صوت در این مرورگر در دسترس نیست. متن پیشنهادی همین‌جا مانده است.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "fa-IR";
    window.speechSynthesis.speak(utterance);
    setHint("پخش از دستگاه درخواست شد. اگر صدای فارسی نصب نباشد، مرورگر ممکن است ساکت بماند.");
  }

  function apply() {
    if (!suggestion) return;
    if (suggestion.kind === "title") onApply({ title: suggestion.text });
    if (suggestion.kind === "lead") onApply({ lead: suggestion.text });
    if (suggestion.kind === "tags") onApply({ tags: suggestion.tags });
    if (suggestion.kind === "image") onApply({ imagePrompt: suggestion.prompt, cover: suggestion.cover });
    if (suggestion.kind === "audio") onApply({ audioScript: suggestion.script });
    setSuggestion(null);
    setHint("پیشنهاد دستیار در فرم نشست. تا وقتی ذخیره نکنید به کارتابل نمی‌رود.");
  }

  return (
    <section className="rounded-lg border border-line bg-sand/50 p-4">
      <p className="text-xs font-semibold text-rule">دستیار تحریریه · پیشنهاد محلی</p>
      <p className="mt-1 text-sm leading-7 text-muted">پیشنهادها در همین مرورگر ساخته می‌شوند و جای تصمیم تحریریه را نمی‌گیرند.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          tone="ghost"
          onClick={() => {
            if (needText()) return;
            const text = suggestTitle(lead, body);
            setSuggestion({ kind: "title", text });
            setHint(text ? "" : "مطلب برای عنوان کافی نیست.");
          }}
        >
          پیشنهاد عنوان
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            if (needText()) return;
            const text = suggestSummary(body, lead);
            setSuggestion({ kind: "lead", text });
            setHint(text ? "" : "مطلب برای خلاصه کافی نیست.");
          }}
        >
          پیشنهاد خلاصه
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            if (needText()) return;
            const tags = suggestTags(source, desk ? [desk] : []);
            setSuggestion({ kind: "tags", tags });
            setHint(tags.length ? "" : "برچسبی از این متن درنیامد.");
          }}
        >
          پیشنهاد برچسب
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            const image = suggestImage(title || lead, desk);
            setSuggestion({ kind: "image", prompt: image.prompt, cover: image.cover });
            setHint("");
          }}
        >
          پیشنهاد تصویر
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            const script = suggestAudio(title, lead || body);
            if (!script) {
              needText();
              return;
            }
            setSuggestion({ kind: "audio", script });
            setHint("");
          }}
        >
          پیشنهاد صوت
        </Button>
      </div>
      {suggestion ? (
        <div className="mt-3 rounded-md border border-line bg-sheet p-3 text-sm leading-7">
          <p className="text-xs font-semibold text-muted">پیشنهاد دستیار، هنوز اعمال نشده</p>
          {suggestion.kind === "title" || suggestion.kind === "lead" ? <p className="mt-1">{suggestion.text}</p> : null}
          {suggestion.kind === "tags" ? <p className="mt-1">{suggestion.tags.join("، ") || "—"}</p> : null}
          {suggestion.kind === "image" ? (
            <p className="mt-1">
              طرح تصویر عوض می‌شود. پرامپت: {suggestion.prompt}
            </p>
          ) : null}
          {suggestion.kind === "audio" ? (
            <div className="mt-1 space-y-2">
              <p>{suggestion.script}</p>
              <Button tone="ghost" onClick={() => speak(suggestion.script)}>
                پخش متن
              </Button>
            </div>
          ) : null}
          <div className="mt-2">
            <Button onClick={apply}>اعمال پیشنهاد</Button>
          </div>
        </div>
      ) : null}
      {hint ? (
        <div className="mt-3">
          <Notice>{hint}</Notice>
        </div>
      ) : null}
    </section>
  );
}
