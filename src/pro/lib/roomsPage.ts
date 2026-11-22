/**
 * Rooms page model (docs/pro-ui/ROOMS.md): every room by floor with what is going on in it, the
 * home's totals, and the rooms with something happening, busiest first. Built on the Areas
 * widget's room item (`buildAreaItem`) so both read rooms the same way. Pure: no React, no store.
 */
import type { HAFloor, ResolvedArea, ResolvedEntity } from '@/types';
import { buildAreaItem, type ProAreaItem } from './overviewAreas';
import { buildThermostatItem, type ProThermostatItem } from './overviewThermostat';
import { lastMotionAt, roomAir, type RoomAir } from './roomsInsights';

export type RoomSignal = 'lights' | 'media' | 'motion' | 'open' | 'climate' | 'cleaning' | 'battery';

export interface RoomItem extends ProAreaItem {
  /** Heating or cooling right now. */
  climateActive: boolean;
  targetTemp: number | null;
  cleaning: boolean;
  lowBattery: number;
  switchesOn: number;
  deviceCount: number;
  /** Motion or something playing: someone is (probably) there. */
  occupied: boolean;
  /** What is going on, most telling first. */
  signals: RoomSignal[];
  /** Higher = more going on (orders "Happening now"). */
  activity: number;
  /** The room's colour (CSS): the user's choice, else one picked per kind of room, apart from the others. */
  color: string;
  /** True when the user chose the colour (`rooms.areaOverrides[id].customColor`). */
  customColor: boolean;
  /** Colour of the lights that are on (CSS), or null for plain warm white. */
  lightColor: string | null;
  /** The room's scenes (up to 4), for the card's scene menu. */
  scenes: { entityId: string; name: string }[];
  /** The room's thermostat (the active one, else the first), for the climate chip. */
  thermostat: ProThermostatItem | null;
  air: RoomAir;
  /** When motion was last seen (ms), null while there is motion or no sensor. */
  lastMotion: number | null;
  /** Fans in the room and how many run (the fan quick action). */
  fanIds: string[];
  fansOn: number;
  /** Covers (blinds, shades, curtains) and how many are open (the cover quick action). */
  coverIds: string[];
  coversOpen: number;
  /** The room's main media player (the playing one, else the first that is on), for play/pause. */
  media: RoomMedia | null;
}

export interface RoomMedia {
  entityId: string;
  playing: boolean;
  /** What is playing (`media_title`), when HA says. */
  title: string | null;
}

/** The user's Rooms settings that shape the page (shared with the classic Rooms page). */
export interface RoomsPageOptions {
  favoriteIds?: readonly string[];
  hiddenIds?: readonly string[];
  /** Floor ids in the user's order; unlisted floors follow, highest level first. */
  floorOrder?: readonly string[];
  hiddenFloors?: readonly string[];
  /** Room ids in the user's order (within each floor); unlisted rooms keep HA's order after them. */
  areaOrder?: readonly string[];
  /** Colours the user chose, by room id (hex). */
  colors?: Readonly<Record<string, string>>;
}

export interface RoomsFloor {
  floorId: string | null;
  name: string;
  level: number;
  rooms: RoomItem[];
  lightsOn: number;
  totalLights: number;
  occupied: number;
  avgTemp: number | null;
  devices: number;
}

export interface RoomsTotals {
  rooms: number;
  /** Rooms with anything going on. */
  active: number;
  occupied: number;
  lightsOn: number;
  totalLights: number;
  roomsLit: number;
  devices: number;
  open: number;
  powerWatts: number;
  minTemp: number | null;
  maxTemp: number | null;
  lowBattery: number;
}

export interface RoomsPageModel {
  floors: RoomsFloor[];
  rooms: RoomItem[];
  /** Rooms with something going on, busiest first. */
  active: RoomItem[];
  totals: RoomsTotals;
}

const NO_FLOOR_LEVEL = Number.MAX_SAFE_INTEGER;
const num = (v: number | undefined | null) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const avg = (vals: number[]) => (vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null);

/** The extra room facts, on top of the Areas widget's item. */
export type RoomFacts = Pick<RoomItem, 'climateActive' | 'targetTemp' | 'cleaning' | 'lowBattery' | 'switchesOn' | 'deviceCount'> &
  Partial<Pick<RoomItem, 'lightColor' | 'scenes' | 'thermostat' | 'air' | 'lastMotion' | 'fanIds' | 'fansOn' | 'coverIds' | 'coversOpen' | 'media'>>;

/** Signals and activity from a room's facts (also used for fixtures). */
export function finishRoom(base: ProAreaItem, facts: RoomFacts): RoomItem {
  const signals: RoomSignal[] = [];
  if (base.openContacts > 0) signals.push('open');
  if (base.motion) signals.push('motion');
  if (base.mediaPlaying > 0) signals.push('media');
  if (base.lightsOn > 0) signals.push('lights');
  if (facts.climateActive) signals.push('climate');
  if (facts.cleaning) signals.push('cleaning');
  if (facts.lowBattery > 0) signals.push('battery');
  const activity = (base.openContacts > 0 ? 5 : 0) + (base.motion ? 4 : 0) + (base.mediaPlaying > 0 ? 3 : 0) + Math.min(3, base.lightsOn) + (facts.climateActive ? 1 : 0) + (facts.cleaning ? 2 : 0);
  return {
    lightColor: null,
    scenes: [],
    thermostat: null,
    air: NO_AIR,
    lastMotion: null,
    fanIds: [],
    fansOn: 0,
    coverIds: [],
    coversOpen: 0,
    media: null,
    ...base,
    ...facts,
    occupied: base.motion || base.mediaPlaying > 0,
    signals,
    activity,
    color: '',
    customColor: false
  };
}

const NO_AIR: RoomAir = { co2: null, aqi: null, pm25: null, level: null };

/** A starting hue per kind of room. */
const KIND_HUES: [RegExp, number][] = [
  [/bed|nursery|kid|guest/, 255],
  [/kitchen|dining/, 28],
  [/living|lounge|family|cinema|tv/, 345],
  [/bath|wc|shower|toilet/, 188],
  [/office|study|studio/, 212],
  [/garden|patio|yard|outdoor|terrace|balcony|pool/, 135],
  [/garage|drive|parking|storage|cellar|basement|laundry|utility/, 220],
  [/hall|entry|landing|stair/, 42],
  [/gym/, 165]
];
const MIN_GAP = 28;
const STEP = 47;
const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/** Hue of a hex colour (#rgb or #rrggbb), or null. */
export function hexHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

/**
 * A colour for every room: the user's choice, else a hue for its kind of room, moved round the
 * colour wheel until it stands apart from the rooms before it (so two bedrooms differ).
 */
export function assignRoomColors(rooms: readonly { areaId: string; name: string }[], custom: Readonly<Record<string, string>> = {}): Map<string, string> {
  const out = new Map<string, string>();
  const used: number[] = [];
  for (const r of rooms) {
    const hue = custom[r.areaId] ? hexHue(custom[r.areaId]) : null;
    if (custom[r.areaId]) {
      out.set(r.areaId, custom[r.areaId]);
      if (hue !== null) used.push(hue);
    }
  }
  for (const r of rooms) {
    if (out.has(r.areaId)) continue;
    const name = r.name.toLowerCase();
    const base = KIND_HUES.find(([re]) => re.test(name))?.[1] ?? 200;
    let best = base;
    let bestGap = -1;
    for (let k = 0; k < 360 / STEP + 1; k++) {
      const h = (base + k * STEP) % 360;
      const gap = used.length ? Math.min(...used.map((u) => hueDistance(h, u))) : 360;
      if (gap > bestGap) [best, bestGap] = [h, gap];
      if (gap >= MIN_GAP) break;
    }
    used.push(best);
    out.set(r.areaId, `hsl(${best} 42% 48%)`);
  }
  return out;
}

const rgbOf = (a: Record<string, unknown>): [number, number, number] | null => {
  if (Array.isArray(a.rgb_color) && a.rgb_color.length >= 3 && a.rgb_color.every((v) => typeof v === 'number')) return [a.rgb_color[0], a.rgb_color[1], a.rgb_color[2]];
  if (typeof a.color === 'string') {
    const m = /^#([0-9a-f]{6})$/i.exec(a.color.trim());
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as [number, number, number];
  }
  const kelvin = typeof a.color_temp_kelvin === 'number' ? a.color_temp_kelvin : typeof a.color_temp === 'number' && a.color_temp > 0 ? 1e6 / a.color_temp : null;
  // Cool white reads as a pale blue glow; warm white stays the default warm glow.
  if (kelvin !== null && kelvin >= 4500) return [205, 222, 255];
  return null;
};

/**
 * The colour of the room's lit lights, averaged (HA `rgb_color`, a cool colour temperature, or
 * the demo's `color`). Plain or warm white counts as no colour, so the card keeps its warm glow.
 */
export function roomLightColor(lights: readonly Pick<ResolvedEntity, 'state' | 'attributes'>[]): string | null {
  const colors = lights
    .filter((l) => l.state === 'on')
    .map((l) => rgbOf((l.attributes ?? {}) as Record<string, unknown>))
    .filter((c): c is [number, number, number] => c !== null && Math.min(...c) < 225);
  if (!colors.length) return null;
  const avgCh = (i: number) => Math.round(colors.reduce((n, c) => n + c[i], 0) / colors.length);
  return `rgb(${avgCh(0)} ${avgCh(1)} ${avgCh(2)})`;
}

const OFF_MEDIA = new Set(['off', 'unavailable', 'unknown', 'standby']);
const OPEN_COVER = new Set(['open', 'opening']);

/** The room's main media player: the playing one, else a paused one, else the first that is on. */
export function roomMedia(players: readonly Pick<ResolvedEntity, 'entity_id' | 'state' | 'attributes'>[]): RoomMedia | null {
  const on = players.filter((p) => !OFF_MEDIA.has(p.state));
  const p = on.find((x) => x.state === 'playing') ?? on.find((x) => x.state === 'paused') ?? on[0];
  if (!p) return null;
  const title = p.attributes?.media_title;
  return { entityId: p.entity_id, playing: p.state === 'playing', title: typeof title === 'string' && title.trim() ? title : null };
}

export function buildRoomItem(area: ResolvedArea, floorName: string | null, isFavorite: boolean): RoomItem {
  const s = area.summary;
  const by = area.entitiesByDomain ?? {};
  const thermostats = (by.climate ?? []).map(buildThermostatItem);
  const thermostat = thermostats.find((t) => t.action === 'heating' || t.action === 'cooling') ?? thermostats.find((t) => t.action !== 'off') ?? thermostats[0] ?? null;
  return finishRoom(buildAreaItem(area, floorName, isFavorite), {
    climateActive: (s?.climatesActive ?? 0) > 0,
    targetTemp: num(s?.targetTempAvg),
    cleaning: (s?.activeCleaners ?? 0) > 0,
    lowBattery: s?.lowBatteryCount ?? 0,
    switchesOn: s?.activeSwitches ?? 0,
    deviceCount: area.devices?.length ?? 0,
    lightColor: roomLightColor(by.light ?? []),
    scenes: (by.scene ?? []).slice(0, 4).map((e) => ({ entityId: e.entity_id, name: e.name || String(e.attributes?.friendly_name ?? e.entity_id) })),
    thermostat,
    air: roomAir(area.entities ?? []),
    lastMotion: lastMotionAt(area.entities ?? []),
    fanIds: (by.fan ?? []).map((e) => e.entity_id),
    fansOn: (by.fan ?? []).filter((e) => e.state === 'on').length,
    coverIds: (by.cover ?? []).map((e) => e.entity_id),
    coversOpen: (by.cover ?? []).filter((e) => OPEN_COVER.has(e.state)).length,
    media: roomMedia(by.media_player ?? [])
  });
}

const floorRank = (f: RoomsFloor, order: readonly string[]) => (f.floorId === null ? Number.MAX_SAFE_INTEGER : order.includes(f.floorId) ? order.indexOf(f.floorId) : order.length);
/** Level for sorting highest first; "Other areas" sorts last. */
const floorLevel = (f: RoomsFloor) => (f.level === NO_FLOOR_LEVEL ? -NO_FLOOR_LEVEL : f.level);

/** Groups rooms by floor (the user's order, else highest level first; "Other areas" last) and adds up the home. */
export function assembleRoomsPage(rooms: readonly RoomItem[], floors: readonly HAFloor[], floorOrder: readonly string[] = []): RoomsPageModel {
  const floorById = new Map(floors.map((f) => [f.floor_id, f]));
  const groups = new Map<string, RoomsFloor>();
  for (const r of rooms) {
    const key = r.floorId && floorById.has(r.floorId) ? r.floorId : '';
    let g = groups.get(key);
    if (!g) {
      const f = key ? floorById.get(key) : undefined;
      g = { floorId: key || null, name: f?.name ?? 'Other areas', level: f ? (f.level ?? 0) : NO_FLOOR_LEVEL, rooms: [], lightsOn: 0, totalLights: 0, occupied: 0, avgTemp: null, devices: 0 };
      groups.set(key, g);
    }
    g.rooms.push(r);
  }
  for (const g of groups.values()) {
    g.lightsOn = g.rooms.reduce((n, r) => n + r.lightsOn, 0);
    g.totalLights = g.rooms.reduce((n, r) => n + r.totalLights, 0);
    g.occupied = g.rooms.filter((r) => r.occupied).length;
    g.devices = g.rooms.reduce((n, r) => n + r.deviceCount, 0);
    g.avgTemp = avg(g.rooms.map((r) => r.temperature).filter((t): t is number => t !== null));
  }
  const temps = rooms.map((r) => r.temperature).filter((t): t is number => t !== null);
  const active = rooms.filter((r) => r.activity > 0).sort((a, b) => b.activity - a.activity || a.name.localeCompare(b.name));
  return {
    floors: [...groups.values()].sort((a, b) => floorRank(a, floorOrder) - floorRank(b, floorOrder) || floorLevel(b) - floorLevel(a) || a.name.localeCompare(b.name)),
    rooms: [...rooms],
    active,
    totals: {
      rooms: rooms.length,
      active: active.length,
      occupied: rooms.filter((r) => r.occupied).length,
      lightsOn: rooms.reduce((n, r) => n + r.lightsOn, 0),
      totalLights: rooms.reduce((n, r) => n + r.totalLights, 0),
      devices: rooms.reduce((n, r) => n + r.deviceCount, 0),
      roomsLit: rooms.filter((r) => r.lightsOn > 0).length,
      open: rooms.reduce((n, r) => n + r.openContacts, 0),
      powerWatts: rooms.reduce((n, r) => n + r.powerWatts, 0),
      minTemp: temps.length ? Math.min(...temps) : null,
      maxTemp: temps.length ? Math.max(...temps) : null,
      lowBattery: rooms.reduce((n, r) => n + r.lowBattery, 0)
    }
  };
}

export function buildRoomsPage(
  areas: readonly ResolvedArea[],
  floors: readonly HAFloor[],
  favoriteIds: readonly string[] = [],
  hiddenIds: readonly string[] = [],
  options: Omit<RoomsPageOptions, 'favoriteIds' | 'hiddenIds'> = {}
): RoomsPageModel {
  const { floorOrder = [], hiddenFloors = [], areaOrder = [], colors = {} } = options;
  const hidden = new Set(hiddenIds);
  const hiddenFloor = new Set(hiddenFloors);
  const fav = new Set(favoriteIds);
  const floorName = new Map(floors.map((f) => [f.floor_id, f.name]));
  const rank = (id: string) => (areaOrder.includes(id) ? areaOrder.indexOf(id) : areaOrder.length);
  const ordered = areas
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a.area_id) - rank(y.a.area_id) || x.i - y.i)
    .map((x) => x.a);
  // Colours over every room, hidden ones too, so hiding a room doesn't recolour the others.
  const palette = assignRoomColors(
    ordered.map((a) => ({ areaId: a.area_id, name: a.name })),
    colors
  );
  const rooms = ordered
    .filter((a) => !hidden.has(a.area_id) && !(a.floor_id && hiddenFloor.has(a.floor_id)))
    .map((a) => ({ ...buildRoomItem(a, (a.floor_id && floorName.get(a.floor_id)) || null, fav.has(a.area_id)), color: palette.get(a.area_id) ?? '', customColor: Boolean(colors[a.area_id]) }));
  return assembleRoomsPage(rooms, floors, floorOrder);
}

/** Words for what is going on in a room, most telling first: "Motion · 2 lights on · 21.5°". */
export function roomStatusLine(r: RoomItem, withTemp = true): string {
  const parts: string[] = [];
  if (r.openContacts > 0) parts.push(`${r.openContacts} open`);
  if (r.motion) parts.push('Motion');
  if (r.mediaPlaying > 0) parts.push('Playing');
  if (r.lightsOn > 0) parts.push(`${r.lightsOn} light${r.lightsOn === 1 ? '' : 's'} on`);
  if (r.climateActive) parts.push(r.targetTemp !== null ? `Set to ${Number(r.targetTemp.toFixed(1))}°` : 'Climate on');
  if (r.cleaning) parts.push('Cleaning');
  if (withTemp && r.temperature !== null) parts.push(`${Number(r.temperature.toFixed(1))}°`);
  return parts.join(' · ') || (r.totalLights > 0 ? 'All off' : 'Quiet');
}
