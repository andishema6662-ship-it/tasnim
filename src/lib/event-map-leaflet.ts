import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { EventMapPoint, EventMapProject } from "./types";

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function createOsmTileLayer(L: typeof import("leaflet")) {
  return L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION, crossOrigin: "anonymous" });
}

export function orderedRoutePoints(project: EventMapProject): EventMapPoint[] {
  return (project.routeOrder ?? [])
    .map((id) => project.points.find((p) => p.id === id))
    .filter((p): p is EventMapPoint => Boolean(p && p.lat != null && p.lng != null));
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function createLabelDivIcon(L: typeof import("leaflet"), label: string, interactive: boolean) {
  return L.divIcon({
    className: "event-map-leaflet-marker-wrap",
    html: `<button type="button" class="event-map-marker-label${interactive ? "" : " event-map-marker-label--static"}" ${
      interactive ? "" : 'tabindex="-1"'
    }>${escapeHtml(label)}</button>`,
    iconAnchor: [0, 22],
  });
}

export type RouteLayerSyncOptions = {
  polylineColor: string;
  polylineWeight: number;
  interactiveMarkers: boolean;
  pulseMarkers?: boolean;
  polylineClassName?: string;
  onMarkerDoubleClick?: (pointId: string, currentLabel: string) => void;
  onMarkerClick?: (pointId: string, currentLabel: string) => void;
};

export function syncRouteLayer(
  L: typeof import("leaflet"),
  layer: LayerGroup,
  points: EventMapPoint[],
  options: RouteLayerSyncOptions,
): void {
  layer.clearLayers();
  const latlngs = points.map((p) => L.latLng(p.lat!, p.lng!));
  if (latlngs.length > 1) {
    L.polyline(latlngs, {
      color: options.polylineColor,
      weight: options.polylineWeight,
      dashArray: "10 6",
      lineCap: "round",
      lineJoin: "round",
      className: options.polylineClassName,
    }).addTo(layer);
  }
  points.forEach((point, index) => {
    const label = point.label || (index === 0 ? "مبدا" : "نقطه");
    if (options.pulseMarkers) {
      const isOrigin = index === 0;
      const isDest = index === points.length - 1 && points.length > 1;
      const pulseClass = isOrigin ? "event-map-pulse-origin" : isDest ? "event-map-pulse-dest" : "event-map-pulse-waypoint";
      L.circleMarker([point.lat!, point.lng!], {
        radius: isOrigin || isDest ? 11 : 8,
        className: `event-map-pulse-ring ${pulseClass}`,
        interactive: false,
      }).addTo(layer);
    }
    const marker = L.marker([point.lat!, point.lng!], {
      icon: createLabelDivIcon(L, label, options.interactiveMarkers),
      interactive: options.interactiveMarkers,
      keyboard: false,
      alt: label,
    }).addTo(layer);
    if (options.onMarkerClick) {
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        options.onMarkerClick?.(point.id, point.label);
      });
    }
    if (options.onMarkerDoubleClick) {
      marker.on("dblclick", (event) => {
        L.DomEvent.stopPropagation(event);
        options.onMarkerDoubleClick?.(point.id, point.label);
      });
    }
  });
}

export function interpolateLatLng(
  L: typeof import("leaflet"),
  points: EventMapPoint[],
  t: number,
): import("leaflet").LatLng | null {
  if (points.length < 2) return null;
  const latlngs = points.map((p) => L.latLng(p.lat!, p.lng!));
  const segments: { from: import("leaflet").LatLng; to: import("leaflet").LatLng; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < latlngs.length - 1; i += 1) {
    const from = latlngs[i];
    const to = latlngs[i + 1];
    const len = from.distanceTo(to);
    segments.push({ from, to, len });
    total += len;
  }
  if (total === 0) return latlngs[0];
  let dist = (t % 1) * total;
  for (const seg of segments) {
    if (dist <= seg.len) {
      const ratio = seg.len === 0 ? 0 : dist / seg.len;
      return L.latLng(
        seg.from.lat + (seg.to.lat - seg.from.lat) * ratio,
        seg.from.lng + (seg.to.lng - seg.from.lng) * ratio,
      );
    }
    dist -= seg.len;
  }
  return latlngs[latlngs.length - 1];
}

export function readMapView(map: LeafletMap): { lat: number; lng: number; zoom: number } {
  const center = map.getCenter();
  return { lat: center.lat, lng: center.lng, zoom: map.getZoom() };
}

export function setMapInteraction(map: LeafletMap, canPanZoom: boolean): void {
  if (canPanZoom) {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
  } else {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
  }
}

export function startRouteDotAnimation(
  L: typeof import("leaflet"),
  _map: LeafletMap,
  layer: LayerGroup,
  points: EventMapPoint[],
  durationMs = 4000,
): () => void {
  let dot: import("leaflet").CircleMarker | null = L.circleMarker([0, 0], {
    radius: 6,
    className: "event-map-travel-dot-marker",
    interactive: false,
  });
  dot.addTo(layer);
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = ((now - start) % durationMs) / durationMs;
    const pos = interpolateLatLng(L, points, t);
    if (pos && dot) dot.setLatLng(pos);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    if (dot) {
      layer.removeLayer(dot);
      dot = null;
    }
  };
}
