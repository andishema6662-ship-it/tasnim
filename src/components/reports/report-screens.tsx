"use client";

import { useState } from "react";
import { faDate, faNum } from "@/lib/format";
import { useNewsroom } from "@/lib/store";
import { categoryName, STATUSES, statusLabel } from "@/lib/workflow";
import { Button, Empty, ModulePage, Notice, Select, StatusBadge } from "../ui";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function NewsReportScreen() {
  const { data } = useNewsroom();
  const [status, setStatus] = useState("all");
  const rows = data.stories.filter((story) => status === "all" || story.status === status);

  function download() {
    const header = ["عنوان", "وضعیت", "نویسنده", "دسته", "بازدید", "به‌روزرسانی"];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((story) =>
        [story.title, statusLabel(data, story.status), story.author, categoryName(data, story.categoryId), String(story.views), faDate(story.updatedAt)].map(csvCell).join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "newsroom-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <ModulePage
      slug="news-report"
      actions={
        <Button onClick={download} disabled={rows.length === 0}>
          خروجی CSV
        </Button>
      }
    >
      <Select value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-xs" aria-label="فیلتر وضعیت">
        <option value="all">همه وضعیت‌ها</option>
        {STATUSES.map((item) => (
          <option key={item} value={item}>
            {statusLabel(data, item)}
          </option>
        ))}
      </Select>
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              {["عنوان", "وضعیت", "نویسنده", "دسته", "بازدید"].map((label) => (
                <th key={label} className="px-3 py-2 text-right font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((story) => (
              <tr key={story.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{story.title}</td>
                <td className="px-3 py-2"><StatusBadge status={story.status} label={statusLabel(data, story.status)} /></td>
                <td className="px-3 py-2">{story.author}</td>
                <td className="px-3 py-2">{categoryName(data, story.categoryId)}</td>
                <td className="px-3 py-2">{faNum(story.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <Empty>خبری برای این فیلتر نیست.</Empty> : null}
    </ModulePage>
  );
}

export function ViewsScreen() {
  const { data } = useNewsroom();
  const rows = [...data.stories].sort((a, b) => b.views - a.views);
  return (
    <ModulePage slug="views">
      <Notice>عدد اولیه نمونه است. هر بار که خبر در این مرورگر باز شود، یکی به شمارنده محلی اضافه می‌شود.</Notice>
      <ol className="divide-y divide-line rounded-lg border border-line bg-sheet">
        {rows.map((story) => (
          <li key={story.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm">{story.title}</span>
            <span className="font-semibold">{faNum(story.views)}</span>
          </li>
        ))}
      </ol>
    </ModulePage>
  );
}

export function StaffScreen() {
  const { data } = useNewsroom();
  const names = [...new Set(data.stories.map((story) => story.author))];
  return (
    <ModulePage slug="staff">
      <div className="overflow-x-auto rounded-lg border border-line bg-sheet">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-right font-medium">نویسنده</th>
              {STATUSES.map((status) => (
                <th key={status} className="px-3 py-2 text-right font-medium">{statusLabel(data, status)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((name) => (
              <tr key={name} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium">{name}</td>
                {STATUSES.map((status) => (
                  <td key={status} className="px-3 py-2">
                    {faNum(data.stories.filter((story) => story.author === name && story.status === status).length)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {names.length === 0 ? <Empty>هنوز خبری برای سنجش نیست.</Empty> : null}
    </ModulePage>
  );
}

export function TrafficScreen() {
  const { data } = useNewsroom();
  return (
    <ModulePage slug="traffic">
      <Notice>آمار سایت عمومی به این پنل وصل نیست. این فهرست کارهایی است که در همین مرورگر ثبت شده.</Notice>
      {data.activity.length === 0 ? <Empty>فعالیتی ثبت نشده است.</Empty> : null}
      <ol className="divide-y divide-line rounded-lg border border-line bg-sheet">
        {data.activity.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span>{item.text}</span>
            <span className="text-xs text-muted">{faDate(item.at)}</span>
          </li>
        ))}
      </ol>
    </ModulePage>
  );
}
