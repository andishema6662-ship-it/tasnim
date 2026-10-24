"use client";

import { useMemo, useRef, useState } from "react";
import { EventMapAnimatedPreview } from "@/components/media/event-map-animated-preview";
import { EventMapInteractive } from "@/components/media/event-map-interactive";
import { downloadBlob, exportRoutePreviewGif } from "@/lib/event-map-gif-export";
import { orderedRoutePoints } from "@/lib/event-map-leaflet";
import type { EventMapPreviewHandle } from "@/lib/event-map-preview-handle";
import { normalizeEventMapProject } from "@/lib/event-map-geo";
import { EVENT_MAP_REGIONS, regionById } from "@/lib/event-map-regions";
import { uid } from "@/lib/id";
import { useNewsroom } from "@/lib/store";
import type { EventMapProject } from "@/lib/types";
import { Button, Empty, Field, Flash, Input, ModulePage, Select, TextArea } from "../ui";

type MapPhase = "explore" | "plot";

function embedFor(project: EventMapProject): string {
  return `<div data-event-map="${project.id}" class="event-map-widget" data-animated="1"></div>`;
}

export function EventMapScreen() {
  const { data, update } = useNewsroom();
  const initialProject = data.eventMaps[0];
  const [activeId, setActiveId] = useState(initialProject?.id ?? "");
  const [phase, setPhase] = useState<MapPhase>(initialProject?.viewLocked ? "plot" : "explore");
  const [flash, setFlash] = useState("");
  const [gifBusy, setGifBusy] = useState(false);
  const previewRef = useRef<EventMapPreviewHandle>(null);
  const project = data.eventMaps.find((item) => item.id === activeId) ?? data.eventMaps[0];
  const routePointCount = project ? orderedRoutePoints(project).length : 0;
  const defaultRegionId = data.eventMapDefaults?.defaultRegionId ?? "iran";

  const region = useMemo(() => regionById(project?.regionId ?? defaultRegionId), [project?.regionId, defaultRegionId]);

  function patchProject(id: string, partial: Partial<EventMapProject>) {
    update((current) => ({
      ...current,
      eventMaps: current.eventMaps.map((item) =>
        item.id === id ? normalizeEventMapProject({ ...item, ...partial, embedCode: embedFor({ ...item, ...partial }) }) : item,
      ),
    }));
  }

  function createRoute() {
    const regionItem = regionById(defaultRegionId);
    const route: EventMapProject = normalizeEventMapProject({
      id: uid("map"),
      title: "مسیر جدید",
      description: "",
      eventDate: new Date().toISOString().slice(0, 10),
      regionId: regionItem.id,
      centerLat: regionItem.lat,
      centerLng: regionItem.lng,
      mapZoom: regionItem.zoom,
      points: [],
      routeOrder: [],
      embedCode: "",
      mapStyle: "light",
    });
    route.embedCode = embedFor(route);
    update((current) => ({ ...current, eventMaps: [route, ...current.eventMaps] }));
    setActiveId(route.id);
    setPhase("explore");
    setFlash("مسیر جدید ایجاد شد.");
  }

  function deleteRoute(id: string) {
    update((current) => {
      const next = current.eventMaps.filter((item) => item.id !== id);
      return { ...current, eventMaps: next.length ? next : current.eventMaps };
    });
    setFlash("مسیر حذف شد.");
  }

  function applyRegion(regionId: string, saveDefault: boolean) {
    const r = regionById(regionId);
    if (!project) return;
    patchProject(project.id, {
      regionId,
      centerLat: r.lat,
      centerLng: r.lng,
      mapZoom: r.zoom,
      viewLocked: false,
      viewCenterLat: undefined,
      viewCenterLng: undefined,
      viewZoom: undefined,
    });
    if (saveDefault) {
      update((current) => ({ ...current, eventMapDefaults: { defaultRegionId: regionId } }));
      setFlash("منطقه پیش‌فرض ذخیره شد.");
    }
    setPhase("explore");
  }

  return (
    <ModulePage slug="event-map">
      <Flash>{flash}</Flash>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <aside className="space-y-3 rounded-xl border border-line bg-sheet p-4" data-testid="event-map-route-list">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">مسیرهای ثبت‌شده</h2>
            <Button type="button" className="text-xs" data-testid="event-map-new-route" onClick={createRoute}>
              مسیر جدید
            </Button>
          </div>
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {data.eventMaps.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-right transition-colors ${
                    item.id === activeId ? "border-primary bg-primary-light font-semibold" : "border-line hover:bg-sand"
                  }`}
                  onClick={() => {
                    setActiveId(item.id);
                    setPhase(item.viewLocked ? "plot" : "explore");
                  }}
                >
                  <p>{item.title}</p>
                  <p className="text-[11px] text-muted">{regionById(item.regionId).name}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {project ? (
          <div className="space-y-4 rounded-2xl border border-line bg-sheet p-4 shadow-sm" data-testid="event-map-card">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="عنوان مسیر">
                <Input
                  value={project.title}
                  onChange={(event) => patchProject(project.id, { title: event.target.value })}
                  data-testid="event-map-title"
                />
              </Field>
              <Field label="تاریخ رویداد">
                <Input
                  type="date"
                  value={project.eventDate?.slice(0, 10) ?? ""}
                  onChange={(event) => patchProject(project.id, { eventDate: event.target.value })}
                />
              </Field>
            </div>
            <Field label="توضیحات">
              <TextArea rows={2} value={project.description ?? ""} onChange={(event) => patchProject(project.id, { description: event.target.value })} />
            </Field>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="نقشه مبنا (ایران / استان)">
                <Select
                  value={project.regionId ?? region.id}
                  onChange={(event) => applyRegion(event.target.value, false)}
                  data-testid="event-map-region-select"
                >
                  {EVENT_MAP_REGIONS.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </Select>
              </Field>
              <Button type="button" tone="ghost" className="text-xs" data-testid="event-map-save-default-region" onClick={() => applyRegion(project.regionId ?? region.id, true)}>
                ذخیره به‌عنوان نقشه پیش‌فرض
              </Button>
            </div>

            <EventMapInteractive
              key={project.id}
              project={project}
              phase={phase}
              onPhaseChange={(next) => {
                if (next === "explore") {
                  patchProject(project.id, { viewLocked: false });
                }
                setPhase(next);
              }}
              onChange={(next) => patchProject(project.id, next)}
              onLockView={(view) => {
                patchProject(project.id, {
                  viewLocked: true,
                  viewCenterLat: view.lat,
                  viewCenterLng: view.lng,
                  viewZoom: view.zoom,
                  centerLat: view.lat,
                  centerLng: view.lng,
                  mapZoom: view.zoom,
                });
                setPhase("plot");
                setFlash("نما قفل شد. اکنون نقاط مسیر را روی نقشه بگذارید.");
              }}
            />

            <EventMapAnimatedPreview ref={previewRef} project={project} />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                tone="ghost"
                className="text-xs"
                data-testid="event-map-download-gif"
                disabled={routePointCount < 2 || gifBusy}
                onClick={async () => {
                  const handle = previewRef.current;
                  if (!handle) return;
                  setGifBusy(true);
                  setFlash("");
                  try {
                    const blob = await exportRoutePreviewGif(handle);
                    const safeTitle = (project.title || "route").replace(/[^\w\u0600-\u06FF-]+/g, "-").slice(0, 40);
                    downloadBlob(blob, `${safeTitle}-map.gif`);
                    setFlash("فایل GIF دانلود شد.");
                  } catch (error) {
                    setFlash(error instanceof Error ? error.message : "ساخت گیف ناموفق بود.");
                  } finally {
                    setGifBusy(false);
                  }
                }}
              >
                {gifBusy ? "در حال ساخت گیف…" : "دریافت خروجی گیف (GIF)"}
              </Button>
              <Button
                type="button"
                tone="quiet"
                className="text-xs"
                data-testid="event-map-copy-gif-dataurl"
                disabled={routePointCount < 2 || gifBusy}
                onClick={async () => {
                  const handle = previewRef.current;
                  if (!handle) return;
                  setGifBusy(true);
                  try {
                    const blob = await exportRoutePreviewGif(handle);
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = String(reader.result ?? "");
                      void navigator.clipboard?.writeText(dataUrl);
                      setFlash("آدرس داده گیف در حافظه کپی شد (برای درج در خبر).");
                    };
                    reader.readAsDataURL(blob);
                  } catch (error) {
                    setFlash(error instanceof Error ? error.message : "ساخت گیف ناموفق بود.");
                  } finally {
                    setGifBusy(false);
                  }
                }}
              >
                کپی data URL گیف
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" tone="quiet" onClick={() => deleteRoute(project.id)}>حذف این مسیر</Button>
              <Button
                type="button"
                tone="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(project.embedCode);
                  setFlash("کد درج در خبر کپی شد.");
                }}
              >
                کپی کد درج
              </Button>
            </div>
            <Field label="کد درج زنده در اخبار (با پیش‌نمایش متحرک)">
              <TextArea readOnly rows={2} value={project.embedCode} data-testid="event-map-embed" />
            </Field>
          </div>
        ) : (
          <Empty>مسیر رویدادی تعریف نشده است.</Empty>
        )}
      </div>
    </ModulePage>
  );
}
