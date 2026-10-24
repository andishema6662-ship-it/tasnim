"use client";

import { useMemo } from "react";
import { faNum } from "@/lib/format";
import type { MonthlyPayroll } from "@/lib/payroll-calc";

export function PayrollSlipView({ payroll, newsroomName }: { payroll: MonthlyPayroll; newsroomName: string }) {
  const tracking = useMemo(() => {
    const seed = `${payroll.author}-${payroll.monthLabel}-${payroll.net}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 1_000_000_000;
    return `RH-${payroll.author.slice(0, 2)}-${hash.toString(36).toUpperCase()}`;
  }, [payroll.author, payroll.monthLabel, payroll.net]);

  return (
    <article
      className="mx-auto max-w-[148mm] rounded-lg border-2 border-[#1a3a5f] bg-white p-6 text-ink shadow-lg print:shadow-none"
      data-testid="payroll-slip"
    >
      <header className="border-b-2 border-[#8e1e2d] pb-4 text-center">
        <p className="text-xs tracking-widest text-muted">بسمه تعالی</p>
        <h2 className="mt-2 text-xl font-black text-[#8e1e2d]">{newsroomName}</h2>
        <p className="text-sm font-semibold">فیش حق‌الزحمه / کارکرد خبرنگاری</p>
        <p className="mt-1 text-xs text-muted">شماره رهگیری: {tracking}</p>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-muted">نام خبرنگار</dt><dd className="font-bold">{payroll.author}</dd></div>
        <div><dt className="text-muted">دوره</dt><dd className="font-bold">{payroll.monthLabel}</dd></div>
      </dl>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#f3efe6] text-xs">
            <th className="border border-line p-2 text-right">ردیف</th>
            <th className="border border-line p-2 text-right">عنوان</th>
            <th className="border border-line p-2 text-right">نوع تعرفه</th>
            <th className="border border-line p-2 text-right">مبلغ (ریال)</th>
          </tr>
        </thead>
        <tbody>
          {payroll.lines.map((line, index) => (
            <tr key={line.storyId}>
              <td className="border border-line p-2">{faNum(index + 1)}</td>
              <td className="border border-line p-2">{line.title}</td>
              <td className="border border-line p-2">{line.label}</td>
              <td className="border border-line p-2">{faNum(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 space-y-1 border-t border-dashed border-line pt-3 text-sm">
        <div className="flex justify-between"><dt>جمع کارکرد</dt><dd>{faNum(payroll.gross)} ریال</dd></div>
        <div className="flex justify-between text-emerald-800"><dt>پاداش</dt><dd>+ {faNum(payroll.bonus)}</dd></div>
        <div className="flex justify-between text-rule"><dt>کسورات</dt><dd>- {faNum(payroll.deduction)}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-black"><dt>خالص قابل پرداخت</dt><dd>{faNum(payroll.net)} ریال</dd></div>
      </dl>
      <footer className="mt-8 flex items-end justify-between text-xs text-muted">
        <div className="text-center">
          <p className="mb-8">مهر و امضای خبرنگار</p>
          <div className="h-px w-32 bg-line" />
        </div>
        <div className="text-center">
          <p className="mb-8">مهر و امضای سردبیر</p>
          <div className="h-px w-32 bg-line" />
        </div>
      </footer>
      <p className="mt-4 text-center text-[10px] text-muted">این فیش صرفاً برای چاپ و بایگانی محلی صادر شده است.</p>
    </article>
  );
}
