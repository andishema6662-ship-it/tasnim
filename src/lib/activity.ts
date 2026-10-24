import { uid } from "./id";
import type { NewsroomData } from "./types";

export function pushActivity(data: NewsroomData, text: string): NewsroomData {
  return {
    ...data,
    activity: [{ id: uid("act"), at: new Date().toISOString(), text }, ...data.activity].slice(0, 100),
  };
}
