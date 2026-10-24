export interface EventMapRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const EVENT_MAP_REGIONS: EventMapRegion[] = [
  { id: "iran", name: "کل ایران", lat: 32.4279, lng: 53.688, zoom: 6 },
  { id: "tehran", name: "تهران", lat: 35.6892, lng: 51.389, zoom: 11 },
  { id: "khorasan-razavi", name: "خراسان رضوی", lat: 36.297, lng: 59.606, zoom: 9 },
  { id: "isfahan", name: "اصفهان", lat: 32.6546, lng: 51.668, zoom: 10 },
  { id: "fars", name: "فارس", lat: 29.5918, lng: 52.5837, zoom: 9 },
  { id: "khuzestan", name: "خوزستان", lat: 31.3183, lng: 48.6706, zoom: 9 },
  { id: "mazandaran", name: "مازندران", lat: 36.5659, lng: 52.6782, zoom: 9 },
  { id: "azerbaijan-east", name: "آذربایجان شرقی", lat: 38.08, lng: 46.2919, zoom: 9 },
];

export function regionById(id: string | undefined): EventMapRegion {
  return EVENT_MAP_REGIONS.find((item) => item.id === id) ?? EVENT_MAP_REGIONS[0];
}
