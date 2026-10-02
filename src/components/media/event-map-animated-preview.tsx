"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { projectMapCenter } from "@/lib/event-map-geo";
import {
  createOsmTileLayer,
  orderedRoutePoints,
  setMapInteraction,
  startRouteDotAnimation,
  syncRouteLayer,
} from "@/lib/event-map-leaflet";
import type { EventMapProject } from "@/lib/types";
import { cn } from "../ui";

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

export function EventMapAnimatedPreview({ project, className }: { project: EventMapProject; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const stopAnimRef = useRef<(() => void) | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    void import("leaflet").then((L) => {
      if (cancelled || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(container, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        preferCanvas: true,
      });
      createOsmTileLayer(L).addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      routeLayerRef.current = routeLayer;
      setMapInteraction(map, false);
      const view = viewFromProject(project);
      map.setView([view.lat, view.lng], view.zoom, { animate: false });
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      stopAnimRef.current?.();
      stopAnimRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        leafletRef.current = null;
      }
    };
  }, [project.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const view = viewFromProject(project);
    map.setView([view.lat, view.lng], view.zoom, { animate: false });
  }, [project.viewCenterLat, project.viewCenterLng, project.viewZoom, project.centerLat, project.centerLng, project.mapZoom, project.viewLocked]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = routeLayerRef.current;
    if (!map || !L || !layer) return;

    stopAnimRef.current?.();
    const points = orderedRoutePoints(project);
    syncRouteLayer(L, layer, points, {
      polylineColor: "#fbbf24",
      polylineWeight: 5,
      interactiveMarkers: false,
      pulseMarkers: true,
      polylineClassName: "event-map-preview-route",
    });
    if (points.length > 1) {
      stopAnimRef.current = startRouteDotAnimation(L, map, layer, points, 4000);
    }
    return () => {
      stopAnimRef.current?.();
      stopAnimRef.current = null;
    };
  }, [project.points, project.routeOrder, mapReady]);

  return (
    <div
      className={cn("relative h-56 w-full overflow-hidden rounded-xl border border-line bg-sheet", className)}
      data-testid="event-map-animated-preview"
    >
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" data-testid="event-map-preview-tiles" />
      <p className="pointer-events-none absolute bottom-2 left-2 z-10 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
        پیش‌نمایش متحرک مسیر
      </p>
    </div>
  );
}
