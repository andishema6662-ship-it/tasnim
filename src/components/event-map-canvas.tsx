"use client";

import { useMemo, useRef, useState } from "react";
import {
  bboxFromCenter,
  osmEmbedUrl,
  percentToLatLngInBbox,
  pointDisplayPercent,
  projectMapCenter,
} from "@/lib/event-map-geo";
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

  const center = projectMapCenter(project);
  const bbox = useMemo(() => bboxFromCenter(center.lat, center.lng, center.zoom), [center.lat, center.lng, center.zoom]);
  const embedUrl = useMemo(() => osmEmbedUrl(bbox), [bbox]);

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
    const { lat, lng } = percentToLatLngInBbox(x, y, bbox);
    return { x, y, lat, lng };
  }

  function onCanvasClick(event: React.MouseEvent) {
    if (dragId) return;
    const pos = placeFromEvent(event.clientX, event.clientY);
    if (!pos) return;
    const id = uid("pt");
    const point: EventMapPoint = {
      id,
      x: pos.x,
      y: pos.y,
      lat: pos.lat,
      lng: pos.lng,
      label: `ایستگاه ${project.points.length + 1}`,
      kind: "checkpoint",
    };
    patch({ points: [...project.points, point], routeOrder: [...(project.routeOrder ?? []), id] });
  }

  const routePoints = (project.routeOrder ?? [])
    .map((id) => project.points.find((p) => p.id === id))
    .filter(Boolean) as EventMapPoint[];

  const polyline = routePoints
    .map((p) => {
      const pos = pointDisplayPercent(p, bbox);
      return `${(pos.x / 100) * size.w},${(pos.y / 100) * size.h}`;
    })
    .join(" ");

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
  const overlayTint =
    style === "dark"
      ? "bg-slate-900/25"
      : style === "brand"
        ? "bg-violet-500/10"
        : "bg-white/5";

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted" data-testid="event-map-region-label">
        نقشه ایران — مرکز {center.lat.toFixed(2)}° شمالی، {center.lng.toFixed(2)}° شرقی (زوم {center.zoom})
      </p>
      <div
        ref={ref}
        className="relative h-[min(24rem,55vh)] min-h-80 w-full cursor-crosshair overflow-hidden rounded-xl border border-line shadow-inner"
        data-testid="event-map-canvas"
        onClick={onCanvasClick}
        onMouseLeave={() => setDragId(null)}
        role="presentation"
      >
        <iframe
          title="نقشه OpenStreetMap ایران"
          src={embedUrl}
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
          loading="lazy"
          data-testid="event-map-osm-embed"
        />
        <div className={cn("pointer-events-none absolute inset-0", overlayTint)} aria-hidden />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" onLoad={syncSize}>
          {routePoints.length > 1 ? (
            <polyline fill="none" stroke="#8e1e2d" strokeWidth="3" strokeDasharray="8 5" points={polyline} />
          ) : null}
        </svg>
        {project.points.map((point) => {
          const pos = pointDisplayPercent(point, bbox);
          return (
            <button
              key={point.id}
              type="button"
              className={cn(
                "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs text-sheet shadow-md",
                KIND_STYLES[point.kind ?? "checkpoint"],
              )}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
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
                const placed = placeFromEvent(e.clientX, e.clientY);
                if (!placed) return;
                patch({
                  points: project.points.map((p) =>
                    p.id === point.id ? { ...p, x: placed.x, y: placed.y, lat: placed.lat, lng: placed.lng } : p,
                  ),
                });
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
          );
        })}
        <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-muted">
          کلیک: ایستگاه · درگ: جابه‌جایی · دوبارکلیک: نام · Alt+دوبارکلیک: نوع
        </p>
      </div>
    </div>
  );
}
