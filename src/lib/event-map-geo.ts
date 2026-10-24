import type { EventMapPoint, EventMapProject } from "./types";

/** مرکز تقریبی ایران */
export const IRAN_MAP_CENTER = { lat: 32.4279, lng: 53.688, zoom: 6 };
/** تهران — برای مسیرهای شهری */
export const TEHRAN_MAP_CENTER = { lat: 35.6892, lng: 51.389, zoom: 12 };

export interface MapBbox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function projectMapCenter(project: EventMapProject): { lat: number; lng: number; zoom: number } {
  return {
    lat: project.centerLat ?? IRAN_MAP_CENTER.lat,
    lng: project.centerLng ?? IRAN_MAP_CENTER.lng,
    zoom: project.mapZoom ?? IRAN_MAP_CENTER.zoom,
  };
}

export function bboxFromCenter(lat: number, lng: number, zoom: number): MapBbox {
  const span = 360 / Math.pow(2, Math.max(4, zoom));
  const latSpan = span * 0.45;
  const lngSpan = span * 0.55;
  return {
    north: lat + latSpan / 2,
    south: lat - latSpan / 2,
    east: lng + lngSpan / 2,
    west: lng - lngSpan / 2,
  };
}

export function latLngToPercentInBbox(lat: number, lng: number, bbox: MapBbox): { x: number; y: number } {
  const x = ((lng - bbox.west) / (bbox.east - bbox.west)) * 100;
  const y = ((bbox.north - lat) / (bbox.north - bbox.south)) * 100;
  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(98, Math.max(2, y)),
  };
}

export function percentToLatLngInBbox(x: number, y: number, bbox: MapBbox): { lat: number; lng: number } {
  const lng = bbox.west + (x / 100) * (bbox.east - bbox.west);
  const lat = bbox.north - (y / 100) * (bbox.north - bbox.south);
  return { lat, lng };
}

export function pointDisplayPercent(point: EventMapPoint, bbox: MapBbox): { x: number; y: number } {
  if (point.lat != null && point.lng != null) return latLngToPercentInBbox(point.lat, point.lng, bbox);
  return { x: point.x, y: point.y };
}

export function osmEmbedUrl(bbox: MapBbox): string {
  const { west, south, east, north } = bbox;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik`;
}

export function normalizeEventMapProject(project: EventMapProject): EventMapProject {
  const center = projectMapCenter(project);
  const bbox = bboxFromCenter(center.lat, center.lng, center.zoom);
  const points = project.points.map((point) => {
    if (point.lat != null && point.lng != null) {
      const pos = latLngToPercentInBbox(point.lat, point.lng, bbox);
      return { ...point, x: pos.x, y: pos.y };
    }
    const { lat, lng } = percentToLatLngInBbox(point.x, point.y, bbox);
    return { ...point, lat, lng };
  });
  return {
    ...project,
    centerLat: center.lat,
    centerLng: center.lng,
    mapZoom: center.zoom,
    points,
  };
}
