import type { EventMapPoint, EventMapProject } from "./types";

export function relabelRoutePoints(points: EventMapPoint[], routeOrder: string[]): EventMapPoint[] {
  const total = routeOrder.length;
  return points.map((point) => {
    const index = routeOrder.indexOf(point.id);
    if (index === -1) return point;
    const label = index === 0 ? "مبدا" : index === total - 1 && total > 1 ? "مقصد نهایی" : `ایستگاه ${index}`;
    const kind = index === 0 ? "origin" : index === total - 1 && total > 1 ? "destination" : "waypoint";
    return { ...point, label, kind };
  });
}

export function undoLastRoutePoint(project: EventMapProject): EventMapProject | null {
  const order = [...(project.routeOrder ?? [])];
  if (!order.length) return null;
  const removedId = order.pop()!;
  const points = relabelRoutePoints(
    project.points.filter((p) => p.id !== removedId),
    order,
  );
  return { ...project, points, routeOrder: order };
}

export function clearAllRoutePoints(project: EventMapProject): EventMapProject {
  return { ...project, points: [], routeOrder: [] };
}

export function removeRoutePoint(project: EventMapProject, pointId: string): EventMapProject | null {
  const order = (project.routeOrder ?? []).filter((id) => id !== pointId);
  if (order.length === (project.routeOrder ?? []).length) return null;
  const points = relabelRoutePoints(project.points.filter((p) => p.id !== pointId), order);
  return { ...project, points, routeOrder: order };
}
