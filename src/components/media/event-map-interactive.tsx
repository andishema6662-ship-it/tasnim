"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { projectMapCenter } from "@/lib/event-map-geo";
import {
  createOsmTileLayer,
  orderedRoutePoints,
  OSM_ATTRIBUTION,
  readMapView,
  setMapInteraction,
  syncRouteLayer,
} from "@/lib/event-map-leaflet";
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

function pointLabel(index: number): string {
  if (index === 0) return "مبدا";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const projectRef = useRef(project);
  const phaseRef = useRef(phase);
  const onChangeRef = useRef(onChange);
  const regionIdRef = useRef(project.regionId);
  const skipNextRegionFlyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  projectRef.current = project;
  phaseRef.current = phase;
  onChangeRef.current = onChange;

  const patch = useCallback((partial: Partial<EventMapProject>) => {
    const current = projectRef.current;
    onChangeRef.current({
      ...current,
      ...partial,
      embedCode: `<div data-event-map="${current.id}" class="event-map-widget" data-animated="1"></div>`,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    void import("leaflet").then((L) => {
      if (cancelled || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(container, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        preferCanvas: true,
      });
      createOsmTileLayer(L).addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      routeLayerRef.current = routeLayer;

      const initial = viewFromProject(projectRef.current);
      map.setView([initial.lat, initial.lng], initial.zoom, { animate: false });

      map.on("click", (event) => {
        const current = projectRef.current;
        const currentPhase = phaseRef.current;
        if (currentPhase !== "plot") return;
        const order = current.routeOrder ?? [];
        const nextIndex = order.length;
        const id = uid("pt");
        const { lat, lng } = event.latlng;
        const point: EventMapPoint = {
          id,
          x: 0,
          y: 0,
          lat,
          lng,
          label: pointLabel(nextIndex),
          kind: nextIndex === 0 ? "origin" : "waypoint",
        };
        patch({
          points: [...current.points, point],
          routeOrder: [...order, id],
        });
      });

      setMapInteraction(map, phaseRef.current === "explore" && !projectRef.current.viewLocked);
      requestAnimationFrame(() => {
        map.invalidateSize();
        setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        leafletRef.current = null;
      }
    };
  }, [patch, project.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setMapInteraction(map, phase === "explore" && !project.viewLocked);
  }, [phase, project.viewLocked]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = routeLayerRef.current;
    if (!map || !L || !layer) return;

    const points = orderedRoutePoints(project);
    syncRouteLayer(L, layer, points, {
      polylineColor: "#8e1e2d",
      polylineWeight: 4,
      interactiveMarkers: true,
      onMarkerDoubleClick: (pointId, currentLabel) => {
        const label = window.prompt("نام نقطه", currentLabel);
        if (!label) return;
        const current = projectRef.current;
        patch({
          points: current.points.map((p) => (p.id === pointId ? { ...p, label } : p)),
        });
      },
    });
  }, [project.points, project.routeOrder, patch, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (skipNextRegionFlyRef.current) {
      skipNextRegionFlyRef.current = false;
      return;
    }
    if (regionIdRef.current === project.regionId) return;
    regionIdRef.current = project.regionId;
    if (project.viewLocked) return;
    const region = regionById(project.regionId);
    map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.2 });
  }, [project.regionId, project.viewLocked]);

  useEffect(() => {
    regionIdRef.current = project.regionId;
  }, [project.regionId]);

  function handleLockView() {
    const map = mapRef.current;
    if (!map) return;
    onLockView(readMapView(map));
  }

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
          <Button type="button" className="text-xs" data-testid="event-map-lock-view" onClick={handleLockView}>
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
        className={cn(
          "relative h-[min(28rem,60vh)] min-h-80 w-full overflow-hidden rounded-xl border border-line shadow-inner",
          phase === "plot" ? "cursor-crosshair" : project.viewLocked ? "cursor-crosshair" : "",
        )}
        data-testid="event-map-canvas"
      >
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 h-full w-full"
          data-testid="event-map-osm-embed"
          aria-label={`نقشه OpenStreetMap — ${OSM_ATTRIBUTION}`}
        />
      </div>
    </div>
  );
}
