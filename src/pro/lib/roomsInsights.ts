/**
 * Rooms page extras (docs/pro-ui/ROOMS.md §3): air quality, when motion was last seen, a few
 * words for how the room is ("Cozy", "Too warm", "Window open while heating") and night. Pure:
 * no React, no store.
 */
import type { ResolvedEntity } from '@/types';

export type AirLevel = 'good' | 'fair' | 'poor';

export interface RoomAir {
  co2: number | null;
  aqi: number | null;
  pm25: number | null;
  /** The worst of the three. */
  level: AirLevel | null;
}

type Entity = Pick<ResolvedEntity, 'entity_id' | 'domain' | 'state' | 'attributes'> & { last_changed?: string };

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const dc = (e: Entity) =>
  String(e.attributes?.device_class ?? '')
    .toLowerCase()
    .trim();
const RANK: Record<AirLevel, number> = { good: 0, fair: 1, poor: 2 };

/** Air level per reading (CO₂ ppm, US AQI, PM2.5 µg/m³). */
export const co2Level = (v: number): AirLevel => (v > 1400 ? 'poor' : v > 1000 ? 'fair' : 'good');
export const aqiLevel = (v: number): AirLevel => (v > 100 ? 'poor' : v > 50 ? 'fair' : 'good');
export const pm25Level = (v: number): AirLevel => (v > 35 ? 'poor' : v > 12 ? 'fair' : 'good');

/** Air from the room's sensors (`carbon_dioxide`, `aqi`, `pm25`), also read from an air monitor's attributes. */
export function roomAir(entities: readonly Entity[]): RoomAir {
  let co2: number | null = null;
  let aqi: number | null = null;
  let pm25: number | null = null;
  for (const e of entities) {
    if (e.domain !== 'sensor') continue;
    const c = dc(e);
    const v = num(e.state);
    if (c === 'carbon_dioxide' && v !== null) co2 = Math.max(co2 ?? 0, v);
    else if (c === 'aqi' && v !== null) aqi = Math.max(aqi ?? 0, v);
    else if (c === 'pm25' && v !== null) pm25 = Math.max(pm25 ?? 0, v);
    if (c === 'aqi' || /air/.test(e.entity_id)) {
      co2 ??= num(e.attributes?.co2);
      pm25 ??= num(e.attributes?.pm25);
      aqi ??= num(e.attributes?.aqi);
    }
  }
  const levels = [co2 !== null ? co2Level(co2) : null, aqi !== null ? aqiLevel(aqi) : null, pm25 !== null ? pm25Level(pm25) : null].filter((l): l is AirLevel => l !== null);
  const level = levels.length ? levels.reduce((a, b) => (RANK[b] > RANK[a] ? b : a)) : null;
  return { co2, aqi, pm25, level };
}

/** When motion was last seen (ms): a motion or occupancy sensor's last change to clear. Null while there is motion. */
export function lastMotionAt(entities: readonly Entity[]): number | null {
  const sensors = entities.filter((e) => e.domain === 'binary_sensor' && ['motion', 'occupancy', 'presence'].includes(dc(e)));
  if (!sensors.length || sensors.some((e) => e.state === 'on')) return null;
  const times = sensors.map((e) => (e.last_changed ? Date.parse(e.last_changed) : NaN)).filter((t) => Number.isFinite(t));
  return times.length ? Math.max(...times) : null;
}

export type MoodTone = 'good' | 'warn' | 'info';
export interface RoomMood {
  label: string;
  tone: MoodTone;
}

export interface MoodInput {
  temperature: number | null;
  humidity: number | null;
  lightsOn: number;
  occupied: boolean;
  openContacts: number;
  thermostatAction: string | null;
  air: RoomAir;
  lastMotion: number | null;
}

const hoursAgo = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  return h >= 24 ? `${Math.floor(h / 24)} d` : `${h} h`;
};

/** A few words for how the room is, most important first; null when there is nothing to say. */
export function roomMood(r: MoodInput, now = Date.now()): RoomMood | null {
  if (r.openContacts > 0 && (r.thermostatAction === 'heating' || r.thermostatAction === 'cooling')) return { label: `Open while ${r.thermostatAction}`, tone: 'warn' };
  if (r.air.level === 'poor') return { label: r.air.co2 !== null && co2Level(r.air.co2) === 'poor' ? 'Stuffy, open a window' : 'Poor air', tone: 'warn' };
  if (r.temperature !== null && r.temperature >= 26) return { label: 'Too warm', tone: 'warn' };
  if (r.temperature !== null && r.temperature < 17) return { label: 'Chilly', tone: 'info' };
  if (r.humidity !== null && r.humidity >= 65) return { label: 'Humid', tone: 'info' };
  if (r.humidity !== null && r.humidity < 30) return { label: 'Dry air', tone: 'info' };
  if (r.occupied && r.lightsOn > 0 && r.temperature !== null && r.temperature >= 19 && r.temperature <= 24) return { label: 'Cozy', tone: 'good' };
  if (!r.occupied && r.lastMotion !== null && now - r.lastMotion >= 2 * 3_600_000) return { label: `Empty for ${hoursAgo(now - r.lastMotion)}`, tone: 'info' };
  return null;
}

/** Night: HA's sun below the horizon, else (no `sun.sun`) before 7:00 or from 19:00. */
export function isNight(sunState: string | undefined, now = new Date()): boolean {
  if (sunState === 'below_horizon') return true;
  if (sunState === 'above_horizon') return false;
  const h = now.getHours();
  return h < 7 || h >= 19;
}
