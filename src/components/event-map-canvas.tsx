"use client";

import { useRef, useState } from "react";
import type { EventMapPoint, EventMapPointKind, EventMapProject, EventMapStyle } from "@/lib/types";
import { cn } from "./ui";
import { uid } from "@/lib/id";

export function EventMapCanvas({
  project,
  onChange,
}: {
  project: EventMapProject;
  onChange: (next: EventMapProject) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 800, h: 320 });

  function syncSize() {
    const el = ref.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
  }

  function patch(projectPatch: Partial<EventMapProject>) {
    onChange({
      ...project,
      ...projectPatch,
      embedCode: `<div data-event-map="${project.id}" class="event-map-widget"></div>`,
    });
  }

  function placeFromEvent(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(98, Math.max(2, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }

  function onCanvasClick(event: React.MouseEvent) {
    if (dragId) return;
    const pos = placeFromEvent(event.clientX, event.clientY);
    if (!pos) return;
    const id = uid("pt");
    const point: EventMapPoint = { id, x: pos.x, y: pos.y, label: `ایستگاه ${project.points.length + 1}`, kind: "checkpoint" };
    patch({ points: [...project.points, point], routeOrder: [...(project.routeOrder ?? []), id] });
  }

  const routePoints = (project.routeOrder ?? [])
    .map((id) => project.points.find((p) => p.id === id))
    .filter(Boolean) as EventMapPoint[];

  const polyline = routePoints.map((p) => `${(p.x / 100) * size.w},${(p.y / 100) * size.h}`).join(" ");

  const KIND_STYLES: Record<EventMapPointKind, string> = {
    checkpoint: "bg-accent",
    gather: "bg-emerald-600",
    rally: "bg-violet-700",
  };

  function cycleKind(kind?: EventMapPointKind): EventMapPointKind {
    const order: EventMapPointKind[] = ["checkpoint", "gather", "rally"];
    const index = order.indexOf(kind ?? "checkpoint");
    return order[(index + 1) % order.length];
  }

  const style: EventMapStyle = project.mapStyle ?? "light";
  const mapSkin =
    style === "dark"
      ? "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"
      : style === "brand"
        ? "bg-gradient-to-br from-violet-200 via-primary-light to-amber-100"
        : "bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-50";

  return (
    <div
      ref={ref}
      className={cn("relative h-[min(24rem,55vh)] min-h-80 w-full cursor-crosshair overflow-hidden rounded-xl border border-line shadow-inner", mapSkin)}
      data-testid="event-map-canvas"
      onClick={onCanvasClick}
      onMouseLeave={() => setDragId(null)}
      role="presentation"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" onLoad={syncSize}>
        {routePoints.length > 1 ? (
          <polyline fill="none" stroke="#8e1e2d" strokeWidth="3" strokeDasharray="8 5" points={polyline} />
        ) : null}
      </svg>
      {project.points.map((point) => (
        <button
          key={point.id}
          type="button"
          className={cn(
            "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs text-sheet shadow-md",
            KIND_STYLES[point.kind ?? "checkpoint"],
          )}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          title={point.label}
          onMouseDown={(e) => {
            e.stopPropagation();
            syncSize();
            setDragId(point.id);
          }}
          onMouseUp={() => setDragId(null)}
          onMouseMove={(e) => {
            if (dragId !== point.id) return;
            e.stopPropagation();
            const pos = placeFromEvent(e.clientX, e.clientY);
            if (!pos) return;
            patch({ points: project.points.map((p) => (p.id === point.id ? { ...p, x: pos.x, y: pos.y } : p)) });
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (e.altKey) {
              patch({
                points: project.points.map((p) => (p.id === point.id ? { ...p, kind: cycleKind(p.kind) } : p)),
              });
              return;
            }
            const label = window.prompt("نام ایستگاه", point.label);
            if (!label) return;
            patch({ points: project.points.map((p) => (p.id === point.id ? { ...p, label } : p)) });
          }}
        >
          {point.label}
        </button>
      ))}
      <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/80 px-2 py-1 text-[10px] text-muted">
        کلیک: ایستگاه · درگ: جابه‌جایی · دوبارکلیک: نام · Alt+دوبارکلیک: نوع (عبور / تجمع / مسیر)
      </p>
    </div>
  );
}
