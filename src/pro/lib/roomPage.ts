/**
 * One room's page (docs/pro-ui/ROOM_PAGE.md): the room's entities sorted into groups the page
 * draws (lights, climate, media, covers, fans, switches, openings, motion, readings, cameras,
 * vacuums, locks, scenes), plus a short "today" list of what changed. Pure: built from one
 * `ResolvedArea`, so a Lovelace card could build it from an area id later.
 */
import type { ResolvedArea, ResolvedEntity } from '@/types';

export type RoomGroupId =
  | 'lights'
  | 'climate'
  | 'media'
  | 'covers'
  | 'fans'
  | 'switches'
  | 'openings'
  | 'motion'
  | 'readings'
  | 'cameras'
  | 'vacuums'
  | 'locks'
  | 'scenes';

export interface RoomDevice {
  entityId: string;
  domain: string;
  /** Name without the room's name in front ("Living Room Lamp" → "Lamp"). */
  name: string;
  state: string;
  isOn: boolean;
  /** Short state in words ("62%", "Open", "Playing", "21.5 °C"). */
  detail: string;
  /** Lights: 0–100 when on and dimmable, else null. */
  brightness: number | null;
  /** Lights: `rgb(...)` when the light reports a colour. */
  color: string | null;
  deviceClass: string | null;
  lastChanged: number | null;
  unit: string | null;
  /** Media cover or camera still (an HA path, loaded with the token). */
  picture: string | null;
}

export interface RoomEvent {
  entityId: string;
  name: string;
  text: string;
  at: number;
  group: RoomGroupId;
}

export interface RoomPageGroups {
  groups: Partial<Record<RoomGroupId, RoomDevice[]>>;
  /** Group ids that have something, in page order. */
  order: RoomGroupId[];
  /** Latest changes today, newest first (from `last_changed`, no history query). */
  today: RoomEvent[];
  deviceCount: number;
}

export const GROUP_ORDER: readonly RoomGroupId[] = ['lights', 'climate', 'media', 'covers', 'fans', 'switches', 'openings', 'motion', 'locks', 'vacuums', 'cameras', 'readings', 'scenes'];

const OPENING = new Set(['door', 'window', 'garage_door', 'opening']);
const PRESENCE = new Set(['motion', 'occupancy', 'presence']);
const READINGS = new Set(['temperature', 'humidity', 'carbon_dioxide', 'pm25', 'aqi', 'illuminance', 'power', 'energy', 'volatile_organic_compounds']);

function groupOf(e: ResolvedEntity): RoomGroupId | null {
  const dc = (e.attributes?.device_class as string | undefined) ?? null;
  switch (e.domain) {
    case 'light':
      return 'lights';
    case 'climate':
      return 'climate';
    case 'media_player':
      return 'media';
    case 'cover':
      return 'covers';
    case 'fan':
      return 'fans';
    case 'switch':
    case 'input_boolean':
      return 'switches';
    case 'camera':
      return 'cameras';
    case 'vacuum':
      return 'vacuums';
    case 'lock':
      return 'locks';
    case 'scene':
      return 'scenes';
    case 'binary_sensor':
      if (dc && OPENING.has(dc)) return 'openings';
      if (dc && PRESENCE.has(dc)) return 'motion';
      return null;
    case 'sensor':
      return dc && READINGS.has(dc) ? 'readings' : null;
    default:
      return null;
  }
}

/**
 * The device's own name without the room's, as Apple Home shows it in a room: "Living Room Ceiling
 * Lamp" → "Ceiling Lamp", "Shelf Light (Living Room)" → "Shelf Light". When nothing is left (a
 * thermostat named after its room) the `fallback` is used, else the full name is kept.
 */
export function shortName(name: string, room: string, fallback?: string): string {
  const n = name.trim();
  const r = room.trim();
  if (!r) return n;
  const esc = r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rest = n
    .replace(new RegExp(`^${esc}(?:'s)?(?:[\\s\\-–:·]+|$)`, 'i'), '')
    .replace(new RegExp(`[\\s\\-–:·]+\\(?${esc}\\)?$`, 'i'), '')
    .trim();
  if (!rest) return fallback ?? n;
  return rest === n ? n : rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** What to call a device named only after its room ("Living Room" thermostat → "Thermostat"). */
export const DOMAIN_NAME: Record<string, string> = { climate: 'Thermostat', media_player: 'Speaker', camera: 'Camera', light: 'Light', fan: 'Fan', lock: 'Lock', cover: 'Blinds', vacuum: 'Vacuum' };

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);

function isOn(e: ResolvedEntity, group: RoomGroupId): boolean {
  const s = e.state;
  if (group === 'media') return s === 'playing' || s === 'paused' || s === 'on';
  if (group === 'covers') return s === 'open' || s === 'opening';
  if (group === 'locks') return s === 'unlocked' || s === 'open';
  if (group === 'climate') return s !== 'off' && s !== 'unavailable';
  if (group === 'vacuums') return s === 'cleaning' || s === 'returning';
  if (group === 'readings' || group === 'scenes' || group === 'cameras') return false;
  return s === 'on';
}

function detailOf(e: ResolvedEntity, group: RoomGroupId, on: boolean, brightness: number | null): string {
  const a = e.attributes ?? {};
  if (e.state === 'unavailable') return 'Unavailable';
  switch (group) {
    case 'lights':
      return on ? (brightness !== null ? `${brightness}%` : 'On') : 'Off';
    case 'climate': {
      const cur = typeof a.current_temperature === 'number' ? `${a.current_temperature}°` : null;
      const target = typeof a.temperature === 'number' ? `${a.temperature}°` : null;
      const action = a.hvac_action ? cap(String(a.hvac_action)) : cap(e.state);
      return [action, target && `to ${target}`, cur && `now ${cur}`].filter(Boolean).join(' · ');
    }
    case 'media':
      if (e.state === 'playing' || e.state === 'paused') {
        const what = [a.media_title, a.media_artist].filter(Boolean).join(' · ');
        return what ? `${cap(e.state)} · ${what}` : cap(e.state);
      }
      return cap(e.state);
    case 'covers':
      return typeof a.current_position === 'number' && e.state === 'open' ? `Open · ${a.current_position}%` : cap(e.state);
    case 'openings':
      return on ? 'Open' : 'Closed';
    case 'motion':
      return on ? 'Detected' : 'Clear';
    case 'readings': {
      const v = Number(e.state);
      const unit = (a.unit_of_measurement as string | undefined) ?? '';
      return Number.isFinite(v) ? `${Number(v.toFixed(1))}${unit && unit !== '%' ? ` ${unit}` : unit}` : cap(e.state);
    }
    case 'scenes':
      return 'Scene';
    default:
      return cap(e.state);
  }
}

function toDevice(e: ResolvedEntity, group: RoomGroupId, room: string): RoomDevice {
  const a = e.attributes ?? {};
  const on = isOn(e, group);
  const brightness = group === 'lights' && on && typeof a.brightness === 'number' ? Math.round((a.brightness / 255) * 100) : null;
  const rgb = Array.isArray(a.rgb_color) && a.rgb_color.length === 3 ? `rgb(${a.rgb_color.join(' ')})` : null;
  const changed = e.last_changed ? Date.parse(e.last_changed) : NaN;
  return {
    entityId: e.entity_id,
    domain: e.domain,
    name: shortName(e.name || String(a.friendly_name ?? e.entity_id), room, DOMAIN_NAME[e.domain]),
    state: e.state,
    isOn: on,
    detail: detailOf(e, group, on, brightness),
    brightness,
    color: group === 'lights' && on ? rgb : null,
    deviceClass: (a.device_class as string | undefined) ?? null,
    lastChanged: Number.isFinite(changed) ? changed : null,
    unit: (a.unit_of_measurement as string | undefined) ?? null,
    picture: (a.entity_picture as string | undefined) ?? null
  };
}

const EVENT_GROUPS = new Set<RoomGroupId>(['lights', 'media', 'covers', 'fans', 'switches', 'openings', 'motion', 'locks', 'vacuums', 'climate']);

function eventText(d: RoomDevice, group: RoomGroupId): string {
  if (group === 'openings') return d.isOn ? 'opened' : 'closed';
  if (group === 'motion') return d.isOn ? 'detected' : 'clear';
  if (group === 'locks') return d.state === 'locked' ? 'locked' : 'unlocked';
  if (group === 'media') return d.state === 'playing' ? 'started playing' : d.state;
  return d.isOn ? 'turned on' : 'turned off';
}

/** Sorts on first (lights, switches), then by name; readings keep a fixed order. */
const byOnThenName = (a: RoomDevice, b: RoomDevice) => Number(b.isOn) - Number(a.isOn) || a.name.localeCompare(b.name);
const READING_RANK = ['temperature', 'humidity', 'carbon_dioxide', 'aqi', 'pm25', 'volatile_organic_compounds', 'illuminance', 'power', 'energy'];

export function buildRoomPage(area: ResolvedArea, now = Date.now()): RoomPageGroups {
  const groups: Partial<Record<RoomGroupId, RoomDevice[]>> = {};
  const today: RoomEvent[] = [];
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  let deviceCount = 0;
  for (const e of area.entities ?? []) {
    if (e.hidden || e.disabled_by || e.isDiagnostic) continue;
    const group = groupOf(e);
    if (!group) continue;
    const d = toDevice(e, group, area.name);
    (groups[group] ??= []).push(d);
    if (group !== 'readings' && group !== 'scenes') deviceCount++;
    if (EVENT_GROUPS.has(group) && d.lastChanged !== null && d.lastChanged >= midnight.getTime() && d.state !== 'unavailable') {
      today.push({ entityId: d.entityId, name: d.name, text: eventText(d, group), at: d.lastChanged, group });
    }
  }
  for (const [id, list] of Object.entries(groups) as [RoomGroupId, RoomDevice[]][]) {
    if (id === 'readings') list.sort((a, b) => READING_RANK.indexOf(a.deviceClass ?? '') - READING_RANK.indexOf(b.deviceClass ?? ''));
    else list.sort(byOnThenName);
  }
  today.sort((a, b) => b.at - a.at);
  return { groups, order: GROUP_ORDER.filter((g) => groups[g]?.length), today: today.slice(0, 8), deviceCount };
}

/** "5 min ago", "2 h ago", "09:41". */
export function agoText(at: number, now = Date.now()): string {
  const m = Math.round((now - at) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  if (m < 180) return `${Math.round(m / 60)} h ago`;
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
