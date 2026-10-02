"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { bboxFromCenter, osmEmbedUrl, percentToLatLngInBbox, pointDisplayPercent, projectMapCenter } from "@/lib/event-map-geo";
import { regionById } from "@/lib/event-map-regions";
import { uid } from "@/lib/id";
import type { EventMapPoint, EventMapProject } from "@/lib/types";
import { Button, cn } from "../ui";

type MapPhase = "explore" | "plot";

function viewFromProject(project: EventMapProject) {
  if (project.viewLocked && project.viewCenterLat != null && project.viewCenterLng != null) {
    return {
      lat: project.viewCenterLat,
      lng: project.viewCenterLng,
      zoom: project.viewZoom ?? project.mapZoom ?? 12,
    };
  }
  const c = projectMapCenter(project);
  return { lat: c.lat, lng: c.lng, zoom: c.zoom };
}

function pointLabel(index: number, total: number): string {
  if (index === 0) return "مبدا";
  if (index === total) return "مقصد نهایی";
  return `ایستگاه ${index}`;
}

export function EventMapInteractive({
  project,
  phase,
  onPhaseChange,
  onChange,
  onLockView,
}: {
  project: EventMapProject;
  phase: MapPhase;
  onPhaseChange: (phase: MapPhase) => void;
  onChange: (next: EventMapProject) => void;
  onLockView: (view: { lat: number; lng: number; zoom: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [view, setView] = useState(() => viewFromProject(project));

  const activeView = project.viewLocked ? viewFromProject(project) : view;
  const bbox = useMemo(
    () => bboxFromCenter(activeView.lat, activeView.lng, activeView.zoom),
    [activeView.lat, activeView.lng, activeView.zoom],
  );
  const embedUrl = useMemo(() => osmEmbedUrl(bbox), [bbox]);

  const patch = useCallback(
    (partial: Partial<EventMapProject>) => {
      onChange({
        ...project,
        ...partial,
        embedCode: `<div data-event-map="${project.id}" class="event-map-widget" data-animated="1"></div>`,
      });
    },
    [onChange, project],
  );

  function addPointAt(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(98, Math.max(2, ((clientY - rect.top) / rect.height) * 100));
    const { lat, lng } = percentToLatLngInBbox(x, y, bbox);
    const id = uid("pt");
    const order = project.routeOrder ?? [];
    const nextIndex = order.length;
    const point: EventMapPoint = {
      id,
      x,
      y,
      lat,
      lng,
      label: pointLabel(nextIndex, nextIndex),
      kind: nextIndex === 0 ? "origin" : "waypoint",
    };
    patch({
      points: [...project.points, point],
      routeOrder: [...order, id],
    });
  }

  function onPointerDown(event: React.PointerEvent) {
    if (phase !== "explore" || project.viewLocked) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragRef.current || phase !== "explore" || project.viewLocked) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    const lngSpan = bbox.east - bbox.west;
    const latSpan = bbox.north - bbox.south;
    setView((current) => ({
      ...current,
      lng: current.lng - (dx / rect.width) * lngSpan,
      lat: current.lat + (dy / rect.height) * latSpan,
    }));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(event: React.WheelEvent) {
    if (phase !== "explore" || project.viewLocked) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -1 : 1;
    setView((current) => ({
      ...current,
      zoom: Math.min(18, Math.max(5, current.zoom + delta)),
    }));
  }

  const routePoints = (project.routeOrder ?? [])
    .map((id) => project.points.find((p) => p.id === id))
    .filter(Boolean) as EventMapPoint[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            phase === "explore" ? "bg-primary text-white" : "bg-paper text-muted",
          )}
          data-testid="event-map-phase-explore"
        >
          ۱. تنظیم نما و زوم
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            phase === "plot" ? "bg-primary text-white" : "bg-paper text-muted",
          )}
          data-testid="event-map-phase-plot"
        >
          ۲. نقطه‌گذاری مسیر
        </span>
        {phase === "explore" && !project.viewLocked ? (
          <Button
            type="button"
            className="text-xs"
            data-testid="event-map-lock-view"
            onClick={() => onLockView(activeView)}
          >
            تأیید نما و شروع نقطه‌گذاری / رسم مسیر
          </Button>
        ) : null}
        {project.viewLocked ? (
          <Button type="button" tone="ghost" className="text-xs" onClick={() => onPhaseChange("explore")}>
            بازگشت به تنظیم نما
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted" data-testid="event-map-region-label">
        <span className="font-semibold text-ink">نقشه {regionById(project.regionId).name}</span>
        {" — "}
        {phase === "explore" && !project.viewLocked
          ? "نقشه را با درگ جابه‌جا کنید و با اسکرول زوم کنید."
          : "روی نقشه کلیک کنید تا مبدا، ایستگاه‌های میانی و مقصد را اضافه کنید."}
      </p>
      <div
        ref={ref}
        className={cn(
          "relative h-[min(28rem,60vh)] min-h-80 w-full overflow-hidden rounded-xl border border-line shadow-inner",
          phase === "plot" ? "cursor-crosshair" : project.viewLocked ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
        )}
        data-testid="event-map-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onClick={(event) => {
          if (phase !== "plot" && !project.viewLocked) return;
          if (dragRef.current) return;
          addPointAt(event.clientX, event.clientY);
        }}
      >
        <iframe title="نقشه" src={embedUrl} className="pointer-events-none absolute inset-0 h-full w-full border-0" data-testid="event-map-osm-embed" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {routePoints.length > 1 ? (
            <polyline
              fill="none"
              stroke="#8e1e2d"
              strokeWidth="0.6"
              strokeDasharray="2 1"
              points={routePoints
                .map((p) => {
                  const pos = pointDisplayPercent(p, bbox);
                  return `${pos.x},${pos.y}`;
                })
                .join(" ")}
            />
          ) : null}
        </svg>
        {routePoints.map((point, index) => {
          const pos = pointDisplayPercent(point, bbox);
          return (
            <button
              key={point.id}
              type="button"
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary px-2 py-0.5 text-[10px] text-white shadow-md"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                const label = window.prompt("نام نقطه", point.label);
                if (!label) return;
                patch({
                  points: project.points.map((p) => (p.id === point.id ? { ...p, label } : p)),
                });
              }}
            >
              {point.label || (index === 0 ? "مبدا" : "نقطه")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
