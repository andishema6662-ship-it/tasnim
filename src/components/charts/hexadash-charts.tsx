"use client";

import { faNum } from "@/lib/format";
import { cn } from "../ui";

const palette = ["#8231d3", "#5f63f2", "#00c875", "#ff9f43", "#ff4d4f", "#272b41"];

export function HexaChartCard({
  title,
  subtitle,
  children,
  testId,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-sheet p-4 shadow-sm" data-testid={testId}>
      <div className="mb-3">
        <h3 className="font-bold text-ink">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function AreaLineChart({
  labels,
  values,
  name,
  height = 160,
}: {
  labels: string[];
  values: number[];
  name: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const width = 320;
  const pad = 8;
  const step = (width - pad * 2) / Math.max(labels.length - 1, 1);
  const points = (lineValues: number[]) =>
    values
      .map((value, index) => {
        const x = pad + index * step;
        const y = height - pad - (value / max) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");

  const areaPoints = (values: number[]) => {
    const line = values
      .map((value, index) => {
        const x = pad + index * step;
        const y = height - pad - (value / max) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
    const lastX = pad + (values.length - 1) * step;
    return `${pad},${height - pad} ${line} ${lastX},${height - pad}`;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={name}>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8231d3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8231d3" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={pad} x2={width - pad} y1={height - pad - ratio * (height - pad * 2)} y2={height - pad - ratio * (height - pad * 2)} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        <polygon points={areaPoints(values)} fill="url(#area-fill)" />
        <polyline fill="none" stroke="#8231d3" strokeWidth="2.5" points={points(values)} />
        {values.map((value, index) => {
          const x = pad + index * step;
          const y = height - pad - (value / max) * (height - pad * 2);
          return <circle key={index} cx={x} cy={y} r="3.5" fill="#fff" stroke="#8231d3" strokeWidth="2" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between gap-1 text-[10px] text-muted">
        {labels.map((label) => (
          <span key={label} className="flex-1 text-center">{label}</span>
        ))}
      </div>
      <p className="mt-1 text-center text-xs font-semibold text-primary">{name}</p>
    </div>
  );
}

export function DualAreaLineChart({
  labels,
  primary,
  secondary,
  primaryName,
  secondaryName,
}: {
  labels: string[];
  primary: number[];
  secondary: number[];
  primaryName: string;
  secondaryName: string;
}) {
  return (
    <div className="space-y-2">
      <AreaLineChart labels={labels} values={primary} name={primaryName} />
      <AreaLineChart labels={labels} values={secondary} name={secondaryName} />
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{primaryName}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent-blue" />{secondaryName}</span>
      </div>
    </div>
  );
}

export function VerticalBarChart({
  items,
}: {
  items: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="flex items-end justify-between gap-2" data-testid="hexa-bar-chart">
      {items.map((item, index) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs font-bold tabular-nums">{faNum(item.value)}</span>
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-[2.5rem] rounded-t-lg"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%`, backgroundColor: item.color ?? palette[index % palette.length] }}
              title={item.label}
            />
          </div>
          <span className="text-center text-[10px] leading-4 text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarChart({
  items,
}: {
  items: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-2" data-testid="hexa-hbar-chart">
      {items.map((item, index) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span>{item.label}</span>
            <span className="font-bold tabular-nums">{faNum(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color ?? palette[index % palette.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DonutChart({
  items,
  centerLabel,
}: {
  items: { label: string; value: number; color?: string }[];
  centerLabel?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item, index) => {
    const fraction = item.value / total;
    const dash = fraction * circumference;
    const offsetBefore = items.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * circumference, 0);
    return { item, index, dash, offsetBefore };
  });
  return (
    <div className="flex flex-wrap items-center justify-center gap-4" data-testid="hexa-donut-chart">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="نمودار دونات">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {segments.map(({ item, index, dash, offsetBefore }) => (
          <circle
            key={item.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={item.color ?? palette[index % palette.length]}
            strokeWidth="14"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offsetBefore}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text x="60" y="58" textAnchor="middle" className="fill-ink text-[11px] font-bold">
          {centerLabel ?? faNum(total)}
        </text>
      </svg>
      <ul className="space-y-1 text-xs">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? palette[index % palette.length] }} />
            <span>{item.label}</span>
            <span className="font-bold tabular-nums">{faNum(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressBar({
  percent,
  label,
  testId,
}: {
  percent: number;
  label: string;
  testId?: string;
}) {
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div data-testid={testId}>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold text-primary">{faNum(safe)}٪</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full bg-gradient-to-l from-primary to-violet-400 transition-all")} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
