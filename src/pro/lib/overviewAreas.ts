/**
 * Areas widget model (WIDGET_DESIGN.md, Phase 3, new widget): favourite areas for quick access,
 * and every area grouped by floor for the "all areas" menu. Favourites are the user's own list
 * (`rooms.favoriteAreas`, shared with the Rooms settings); with none set, the first areas stand
 * in so the widget is never empty. Pure: no React, no store.
 */
import type { HAFloor, ResolvedArea } from '@/types';

export interface ProAreaItem {
  areaId: string;
  name: string;
  /** Registry icon name (e.g. `mdi:sofa`, `Tv`), mapped to an icon by the widget. */
  icon: string;
  picture: string | null;
  floorId: string | null;
  floorName: string | null;
  temperature: number | null;
  humidity: number | null;
  lightsOn: number;
  totalLights: number;
  /** Light entity ids in the area (for "lights on/off" here). */
  lightIds: string[];
  mediaPlaying: number;
  motion: boolean;
  openContacts: number;
  powerWatts: number;
  isFavorite: boolean;
}

export interface ProAreaFloor {
  floorId: string | null;
  name: string;
  level: number;
  areas: ProAreaItem[];
}

export interface ProAreasModel {
  favorites: ProAreaItem[];
  /** True when the user has no favourites and the first areas stand in. */
  favoritesAreDefault: boolean;
  /** Floors by level (lowest first); areas with no floor last, as "Other areas". */
  floors: ProAreaFloor[];
  totalCount: number;
}

export const DEFAULT_FAVORITES = 4;
const NO_FLOOR_LEVEL = Number.MAX_SAFE_INTEGER;

const num = (v: number | undefined | null) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function buildAreaItem(area: ResolvedArea, floorName: string | null, isFavorite: boolean): ProAreaItem {
  const s = area.summary;
  const lightIds = (area.entitiesByDomain?.light ?? []).map((e) => e.entity_id);
  return {
    areaId: area.area_id,
    name: area.name,
    icon: area.icon || '',
    picture: area.picture || area.bannerImage || null,
    floorId: area.floor_id ?? null,
    floorName,
    temperature: num(s?.currentTempAvg),
    humidity: num(s?.currentHumidityAvg),
    lightsOn: s?.lightsOn ?? 0,
    totalLights: s?.totalLights ?? lightIds.length,
    lightIds,
    mediaPlaying: s?.activeMediaPlayers ?? 0,
    motion: Boolean(s?.motionDetected),
    openContacts: s?.openContacts ?? 0,
    powerWatts: Math.round(s?.totalPowerWatts ?? 0),
    isFavorite
  };
}

export function buildAreasModel(areas: readonly ResolvedArea[], floors: readonly HAFloor[], favoriteIds: readonly string[] = [], hiddenIds: readonly string[] = []): ProAreasModel {
  const hidden = new Set(hiddenIds);
  const floorById = new Map(floors.map((f) => [f.floor_id, f]));
  const visible = areas.filter((a) => !hidden.has(a.area_id));
  const favSet = new Set(favoriteIds);
  const items = visible.map((a) => buildAreaItem(a, (a.floor_id && floorById.get(a.floor_id)?.name) || null, favSet.has(a.area_id)));
  const byId = new Map(items.map((i) => [i.areaId, i]));

  // Favourites keep the user's order.
  const picked = favoriteIds.map((id) => byId.get(id)).filter((i): i is ProAreaItem => Boolean(i));
  const favoritesAreDefault = picked.length === 0;
  const favorites = favoritesAreDefault ? items.slice(0, DEFAULT_FAVORITES) : picked;

  const groups = new Map<string, ProAreaFloor>();
  for (const item of items) {
    const key = item.floorId && floorById.has(item.floorId) ? item.floorId : '';
    let group = groups.get(key);
    if (!group) {
      const floor = key ? floorById.get(key) : undefined;
      group = { floorId: key || null, name: floor?.name ?? 'Other areas', level: floor ? (floor.level ?? 0) : NO_FLOOR_LEVEL, areas: [] };
      groups.set(key, group);
    }
    group.areas.push(item);
  }
  const grouped = [...groups.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return { favorites, favoritesAreDefault, floors: grouped, totalCount: items.length };
}

/** Find an area anywhere in the model. */
export function findArea(model: ProAreasModel, areaId: string | null): ProAreaItem | null {
  if (!areaId) return null;
  for (const f of model.floors) {
    const hit = f.areas.find((a) => a.areaId === areaId);
    if (hit) return hit;
  }
  return null;
}

/** One line about an area: "21.5° · 3 lights on · Motion". */
export function areaSummaryLine(a: ProAreaItem): string {
  const parts: string[] = [];
  if (a.temperature !== null) parts.push(`${Number(a.temperature.toFixed(1))}°`);
  if (a.totalLights > 0) parts.push(a.lightsOn > 0 ? `${a.lightsOn} light${a.lightsOn === 1 ? '' : 's'} on` : 'Lights off');
  if (a.mediaPlaying > 0) parts.push('Playing');
  if (a.motion) parts.push('Motion');
  if (a.openContacts > 0) parts.push(`${a.openContacts} open`);
  return parts.join(' · ') || 'Quiet';
}

/** Adds an area to the end of the favourites, or takes it out (the favourites sheet). */
export function toggleFavorite(list: readonly string[], areaId: string): string[] {
  return list.includes(areaId) ? list.filter((id) => id !== areaId) : [...list, areaId];
}
