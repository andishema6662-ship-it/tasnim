"use client";

import { useMemo } from "react";
import { bboxFromCenter, pointDisplayPercent, projectMapCenter } from "@/lib/event-map-geo";
import type { EventMapPoint, EventMapProject } from "@/lib/types";
import { cn } from "../ui";

export function EventMapAnimatedPreview({ project, className }: { project: EventMapProject; className?: string }) {
  const view = project.viewLocked
    ? { lat: project.viewCenterLat ?? project.centerLat, lng: project.viewCenterLng ?? project.centerLng, zoom: project.viewZoom ?? project.mapZoom }
    : projectMapCenter(project);
  const bbox = useMemo(() => bboxFromCenter(view.lat ?? 32.4, view.lng ?? 53.6, view.zoom ?? 10), [view.lat, view.lng, view.zoom]);

  const routePoints = (project.routeOrder ?? [])
    .map((id) => project.points.find((p) => p.id === id))
    .filter(Boolean) as EventMapPoint[];

  const polyline = routePoints
    .map((p) => {
      const pos = pointDisplayPercent(p, bbox);
      return `${pos.x},${pos.y}`;
    })
    .join(" ");

  const motionPath = routePoints
    .map((p) => {
      const pos = pointDisplayPercent(p, bbox);
      return `${pos.x} ${pos.y}`;
    })
    .join(" L ");
  const motionPathD = motionPath ? `M ${motionPath}` : "";

  return (
    <div className={cn("relative h-56 w-full overflow-hidden rounded-xl border border-line bg-slate-900/90", className)} data-testid="event-map-animated-preview">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 opacity-90" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {routePoints.length > 1 ? (
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="4 2"
            points={polyline}
            className="event-map-route-draw"
          />
        ) : null}
        {routePoints.map((point, index) => {
          const pos = pointDisplayPercent(point, bbox);
          const isOrigin = index === 0;
          const isDest = index === routePoints.length - 1 && routePoints.length > 1;
          return (
            <g key={point.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isOrigin || isDest ? 3.5 : 2.5}
                className={cn("event-map-marker-pulse", isOrigin ? "fill-emerald-400" : isDest ? "fill-rose-400" : "fill-sky-400")}
              />
              <circle cx={pos.x} cy={pos.y} r={1.2} className="fill-white" />
            </g>
          );
        })}
        {routePoints.length > 1 ? (
          <circle r="1.8" className="event-map-travel-dot fill-amber-300">
            <animateMotion dur="4s" repeatCount="indefinite" path={motionPathD} />
          </circle>
        ) : null}
      </svg>
      <p className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-[10px] text-white">پیش‌نمایش متحرک مسیر</p>
      <style jsx>{`
        .event-map-route-draw {
          animation: event-map-draw 3s ease-in-out infinite;
        }
        .event-map-marker-pulse {
          animation: event-map-pulse 1.6s ease-in-out infinite;
        }
        @keyframes event-map-draw {
          0% {
            stroke-dashoffset: 120;
            opacity: 0.35;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.85;
          }
        }
        @keyframes event-map-pulse {
          0%,
          100% {
            opacity: 0.65;
            transform-origin: center;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
