"use client";

import { useMemo, useRef, useState } from "react";
import {
  exclusiveLabel,
  formatOriginRow,
  polishNewsText,
  preliminaryFactCheck,
  simulateTranscription,
  suggestAlternateHeadlines,
  suggestSeoKeywords,
  trackHeadlineOrigin,
} from "@/lib/ai-services";
import { faDate, faNum } from "@/lib/format";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { AiTaskKind, AiTaskLogEntry } from "@/lib/types";
import { blankStory, placeStory } from "@/lib/workflow";
import { Button, Field, Flash, Input, ModulePage, Notice, TextArea } from "../ui";

type TabId = "transcribe" | "polish" | "origin" | "extras";

const TABS: { id: TabId; label: string }[] = [
  { id: "transcribe", label: "تبدیل صوت به متن" },
  { id: "polish", label: "اصلاح و ویرایش هوشمند" },
  { id: "origin", label: "ردیابی منبع انتشار" },
  { id: "extras", label: "ابزارهای تکمیلی" },
];

export function AiHubScreen() {
  const { data, update } = useNewsroom();
  const [tab, setTab] = useState<TabId>("transcribe");
  const [flash, setFlash] = useState("");

  const [audioHint, setAudioHint] = useState("");
  const [audioDuration, setAudioDuration] = useState(180);
  const [transcript, setTranscript] = useState("");
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [transcriptLead, setTranscriptLead] = useState("");

  const [draftText, setDraftText] = useState("");
  const [polishMode, setPolishMode] = useState<"grammar" | "journalistic" | "lead">("grammar");
  const [polished, setPolished] = useState("");

  const [headlineQuery, setHeadlineQuery] = useState("");
  const [originHits, setOriginHits] = useState<ReturnType<typeof trackHeadlineOrigin>>([]);

  const [extrasText, setExtrasText] = useState("");
  const [altHeadlines, setAltHeadlines] = useState<string[]>([]);
  const [seoTags, setSeoTags] = useState<string[]>([]);
  const [factNotes, setFactNotes] = useState<string[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const logs = useMemo(() => data.aiTaskLogs ?? [], [data.aiTaskLogs]);

  function appendLog(kind: AiTaskKind, inputSummary: string, outputSummary: string) {
    const entry: AiTaskLogEntry = {
      id: uid("ait"),
      kind,
      inputSummary: inputSummary.slice(0, 160),
      outputSummary: outputSummary.slice(0, 160),
      createdAt: new Date().toISOString(),
    };
    update((current) => ({
      ...current,
      aiTaskLogs: [entry, ...(current.aiTaskLogs ?? [])].slice(0, 80),
    }));
  }

  function sendToCartable(payload: { title: string; lead: string; body: string; tags?: string[] }) {
    const ts = new Date().toISOString();
    const story = {
      ...blankStory(data),
      id: uid("story"),
      title: payload.title.trim() || "پیش‌نویس بدون عنوان",
      lead: payload.lead.trim(),
      body: payload.body.trim(),
      tags: payload.tags ?? [],
      status: "draft" as const,
      updatedAt: ts,
      createdAt: ts,
    };
    update((current) => placeStory(current, story, { log: `پیش‌نویس از خدمات هوش مصنوعی: ${story.title}` }));
    setFlash(`«${story.title}» به کارتابل (پیش‌نویس) رفت.`);
  }

  function runTranscription(fileName: string, durationSec: number) {
    const out = simulateTranscription({ fileName, durationSec, hint: audioHint });
    setTranscript(out.transcript);
    setTranscriptTitle(out.title);
    setTranscriptLead(out.lead);
    appendLog("transcribe", fileName, out.title);
    setFlash("متن پیاده‌سازی‌شده آماده است (موتور شبیه‌سازی محلی).");
  }

  async function toggleRecord() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const started = Date.now();
      recorderRef.current = recorder;
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const durationSec = Math.max(30, Math.round((Date.now() - started) / 1000));
        setAudioDuration(durationSec);
        runTranscription("ضبط-زنده.webm", durationSec);
      };
      recorder.start();
      setRecording(true);
      setFlash("در حال ضبط… دوباره بزنید تا پایان و تبدیل به متن انجام شود.");
    } catch {
      setFlash("دسترسی به میکروفون ممکن نشد. فایل صوتی بارگذاری کنید.");
    }
  }

  function onAudioFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name);
    if (!allowed) {
      setFlash("فرمت مجاز: mp3, wav, m4a, ogg");
      return;
    }
    runTranscription(file.name, audioDuration);
  }

  function runPolish() {
    const out = polishNewsText(draftText, polishMode);
    setPolished(out.result);
    appendLog("polish", draftText, out.result);
    setFlash("نسخه ویرایش‌شده آماده است.");
  }

  function runOrigin() {
    const hits = trackHeadlineOrigin(headlineQuery);
    setOriginHits(hits);
    appendLog("origin", headlineQuery, hits[0] ? formatOriginRow(hits[0]) : "بدون نتیجه");
    setFlash(hits.length ? "جدول ردیابی به‌روز شد." : "تیتر را وارد کنید.");
  }

  function runExtras() {
    setAltHeadlines(suggestAlternateHeadlines(extrasText));
    setSeoTags(suggestSeoKeywords(extrasText));
    setFactNotes(preliminaryFactCheck(extrasText).notes);
    appendLog("extras", extrasText, suggestAlternateHeadlines(extrasText)[0] ?? "");
    setFlash("تیترهای جایگزین و کلمات کلیدی آماده است.");
  }

  return (
    <ModulePage slug="ai-hub">
      <Notice>
        خدمات هوش مصنوعی در این نسخه به‌صورت موتور شبیه‌سازی محلی در مرورگر کار می‌کند؛ خروجی جایگزین قضاوت تحریریه نیست.
      </Notice>
      <Flash>{flash}</Flash>

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`ai-tab-${item.id}`}
            className={`rounded-md px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-ink text-sheet" : "bg-sand text-ink"}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "transcribe" ? (
        <section className="space-y-4 rounded-lg border border-line bg-sheet p-4" data-testid="ai-panel-transcribe">
          <h2 className="font-bold">تبدیل صوت به متن خبر</h2>
          <Field label="موضوع یا کلیدواژه (برای کیفیت بهتر خروجی)">
            <Input value={audioHint} onChange={(e) => setAudioHint(e.target.value)} placeholder="مثلاً نشست خبری وزارت" />
          </Field>
          <Field label="مدت تقریبی (ثانیه) — برای فایل بدون متادیتا">
            <Input type="number" min={30} max={3600} value={audioDuration} onChange={(e) => setAudioDuration(Number(e.target.value) || 180)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" tone="ghost" onClick={() => fileRef.current?.click()}>بارگذاری صوت (mp3, wav, m4a, ogg)</Button>
            <Button type="button" tone="ghost" onClick={toggleRecord}>{recording ? "پایان ضبط و تبدیل" : "ضبط صدا"}</Button>
          </div>
          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*" className="hidden" onChange={onAudioFile} />
          {transcript ? (
            <>
              <Field label="تیتر پیشنهادی">
                <Input value={transcriptTitle} onChange={(e) => setTranscriptTitle(e.target.value)} />
              </Field>
              <Field label="متن پیاده‌سازی‌شده">
                <TextArea rows={8} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
              </Field>
              <Button
                type="button"
                data-testid="ai-send-cartable-transcribe"
                onClick={() => sendToCartable({ title: transcriptTitle, lead: transcriptLead, body: transcript })}
              >
                انتقال به پیش‌نویس خبر جدید
              </Button>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === "polish" ? (
        <section className="space-y-4 rounded-lg border border-line bg-sheet p-4" data-testid="ai-panel-polish">
          <h2 className="font-bold">اصلاح و ویرایش هوشمند خبر</h2>
          <Field label="متن خام خبر">
            <TextArea rows={6} value={draftText} onChange={(e) => setDraftText(e.target.value)} data-testid="ai-polish-input" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" tone={polishMode === "grammar" ? "accent" : "ghost"} onClick={() => setPolishMode("grammar")}>اصلاح نگارشی</Button>
            <Button type="button" tone={polishMode === "journalistic" ? "accent" : "ghost"} onClick={() => setPolishMode("journalistic")}>بازنویسی ژورنالیستی</Button>
            <Button type="button" tone={polishMode === "lead" ? "accent" : "ghost"} onClick={() => setPolishMode("lead")}>استخراج لید</Button>
            <Button type="button" data-testid="ai-run-polish" onClick={runPolish}>اجرای ویرایش</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">نسخه اولیه</p>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-paper p-3 text-sm leading-7">{draftText || "—"}</pre>
            </div>
            <div>
              <p className="text-sm font-semibold">نسخه ویرایش‌شده</p>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-paper p-3 text-sm leading-7" data-testid="ai-polish-output">{polished || "—"}</pre>
            </div>
          </div>
          {polished ? (
            <Button type="button" onClick={() => sendToCartable({ title: polished.split(/[.!?؟]/)[0] ?? "خبر ویرایش‌شده", lead: polished.slice(0, 200), body: polished })}>
              اعمال در خبر (پیش‌نویس کارتابل)
            </Button>
          ) : null}
        </section>
      ) : null}

      {tab === "origin" ? (
        <section className="space-y-4 rounded-lg border border-line bg-sheet p-4" data-testid="ai-panel-origin">
          <h2 className="font-bold">ردیابی منبع نخستین انتشار تیتر</h2>
          <Field label="تیتر یا موضوع خبر">
            <Input value={headlineQuery} onChange={(e) => setHeadlineQuery(e.target.value)} data-testid="ai-origin-input" placeholder="تیتر خبر برای جستجو در رسانه‌های بیرونی" />
          </Field>
          <Button type="button" data-testid="ai-run-origin" onClick={runOrigin}>جستجو در رسانه‌ها</Button>
          {originHits.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm" data-testid="ai-origin-table">
                <thead>
                  <tr className="border-b border-line text-right">
                    <th className="p-2">رسانه</th>
                    <th className="p-2">زمان انتشار</th>
                    <th className="p-2">مشابهت تیتر</th>
                    <th className="p-2">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {originHits.map((hit) => (
                    <tr key={`${hit.outlet}-${hit.publishedAt}`} className="border-b border-line/60">
                      <td className="p-2 font-medium">{hit.outlet}</td>
                      <td className="p-2">{faDate(hit.publishedAt)}</td>
                      <td className="p-2">{faNum(hit.similarity)}٪</td>
                      <td className="p-2">{exclusiveLabel(hit.exclusive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "extras" ? (
        <section className="space-y-4 rounded-lg border border-line bg-sheet p-4" data-testid="ai-panel-extras">
          <h2 className="font-bold">ابزارهای تکمیلی</h2>
          <Field label="متن یا تیتر">
            <TextArea rows={4} value={extrasText} onChange={(e) => setExtrasText(e.target.value)} />
          </Field>
          <Button type="button" onClick={runExtras}>تولید تیتر، سئو و راستی‌آزمایی مقدماتی</Button>
          {altHeadlines.length ? (
            <ul className="list-disc space-y-1 pr-5 text-sm">
              {altHeadlines.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {seoTags.length ? <p className="text-sm">کلمات کلیدی: {seoTags.join("، ")}</p> : null}
          {factNotes.length ? (
            <ul className="text-sm text-muted">
              {factNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-sheet p-4">
        <h2 className="font-bold">تاریخچه درخواست‌های هوش مصنوعی</h2>
        {logs.length === 0 ? <p className="mt-2 text-sm text-muted">هنوز ثبت نشده است.</p> : null}
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
          {logs.slice(0, 15).map((entry) => (
            <li key={entry.id} className="rounded border border-line/70 px-2 py-1.5">
              <span className="text-xs text-muted">{faDate(entry.createdAt)} · {entry.kind}</span>
              <p className="line-clamp-1">{entry.outputSummary}</p>
            </li>
          ))}
        </ul>
      </section>
    </ModulePage>
  );
}
