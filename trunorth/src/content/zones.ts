/** TruNorth journey zones — mapped from concept art / contentConfig */

import { contentConfig, type ZoneConfig } from "../config/content.js";

export type ZoneMeta = ZoneConfig;

export const ZONES: ZoneMeta[] = contentConfig.zones;

export const ACHIEVEMENT_CHECKLIST = contentConfig.achievementChecklist;

export function zoneForChapter(chapterId: string): ZoneMeta {
  return ZONES.find((z) => z.chapterIds.includes(chapterId)) ?? ZONES[0];
}

export function zoneFromBackground(background: string): ZoneMeta | null {
  const key = background.replace("bg_", "");
  return ZONES.find((z) => z.id === key) ?? null;
}
