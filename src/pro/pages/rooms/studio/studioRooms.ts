/**
 * Rooms studio fixtures (docs/pro-ui/ROOMS.md §5): a representative home built with the real
 * room model (`finishRoom`, `assignRoomColors`, `assembleRoomsPage`), in a few named states, plus a
 * stand-in for HA's service calls that changes only these fixtures. Nothing here reaches Home
 * Assistant.
 */
import type { HAFloor } from '@/types';
import type { ProAreaItem } from '../../../lib/overviewAreas';
import type { ProThermostatItem, ThermostatAction } from '../../../lib/overviewThermostat';
import { assembleRoomsPage, assignRoomColors, finishRoom, type RoomItem, type RoomsPageModel } from '../../../lib/roomsPage';

export const STUDIO_FLOORS: HAFloor[] = [
  { floor_id: 'first', name: 'First Floor', level: 1 },
  { floor_id: 'ground', name: 'Ground Floor', level: 0 },
  { floor_id: 'basement', name: 'Basement', level: -1 }
];

interface Spec {
  id: string;
  name: string;
  floor: string;
  icon: string;
  lights?: [on: number, total: number];
  temp?: number | null;
  humidity?: number | null;
  climate?: ThermostatAction;
  target?: number;
  media?: 'playing' | 'paused' | null;
  title?: string;
  fans?: [on: number, total: number];
  covers?: [open: number, total: number];
  scenes?: number;
  motion?: boolean;
  open?: number;
  power?: number;
  devices: number;
  favourite?: boolean;
  lightColor?: string | null;
}

const thermostat = (s: Spec): ProThermostatItem | null =>
  s.climate
    ? {
        entityId: `climate.${s.id}`,
        name: `${s.name} thermostat`,
        shortName: 'Thermostat',
        roomName: s.name,
        mode: s.climate === 'off' ? 'off' : s.climate === 'cooling' ? 'cool' : 'heat',
        modes: ['off', 'heat', 'cool'],
        action: s.climate,
        current: s.temp ?? null,
        target: s.target ?? 21,
        targetLow: null,
        targetHigh: null,
        humidity: s.humidity ?? null,
        unit: '°C',
        min: 7,
        max: 30,
        step: 0.5
      }
    : null;

function build(s: Spec): RoomItem {
  const [lightsOn, totalLights] = s.lights ?? [0, 0];
  const playing = s.media === 'playing';
  const base: ProAreaItem = {
    areaId: s.id,
    name: s.name,
    icon: s.icon,
    picture: null,
    floorId: s.floor,
    floorName: STUDIO_FLOORS.find((f) => f.floor_id === s.floor)?.name ?? null,
    temperature: s.temp ?? null,
    humidity: s.humidity ?? null,
    lightsOn,
    totalLights,
    lightIds: Array.from({ length: totalLights }, (_, i) => `light.${s.id}_${i}`),
    mediaPlaying: playing ? 1 : 0,
    motion: Boolean(s.motion),
    openContacts: s.open ?? 0,
    powerWatts: s.power ?? 0,
    isFavorite: Boolean(s.favourite)
  };
  const th = thermostat(s);
  return finishRoom(base, {
    climateActive: s.climate === 'heating' || s.climate === 'cooling',
    targetTemp: th?.target ?? null,
    cleaning: false,
    lowBattery: 0,
    switchesOn: 0,
    deviceCount: s.devices,
    lightColor: s.lightColor ?? null,
    scenes: Array.from({ length: s.scenes ?? 0 }, (_, i) => ({ entityId: `scene.${s.id}_${i}`, name: ['Relax', 'Movie', 'Bright', 'Night'][i] ?? `Scene ${i + 1}` })),
    thermostat: th,
    fanIds: Array.from({ length: s.fans?.[1] ?? 0 }, (_, i) => `fan.${s.id}_${i}`),
    fansOn: s.fans?.[0] ?? 0,
    coverIds: Array.from({ length: s.covers?.[1] ?? 0 }, (_, i) => `cover.${s.id}_${i}`),
    coversOpen: s.covers?.[0] ?? 0,
    media: s.media ? { entityId: `media_player.${s.id}`, playing, title: s.title ?? null } : null
  });
}

const EVENING: Spec[] = [
  { id: 'master', name: 'Master Bedroom', floor: 'first', icon: 'mdi:bed', lights: [2, 3], temp: 20.7, humidity: 51, climate: 'idle', target: 20.5, fans: [0, 1], covers: [0, 2], devices: 5, favourite: true },
  { id: 'bedroom', name: 'Bedroom', floor: 'first', icon: 'mdi:bed', lights: [1, 2], temp: 20.1, humidity: 55, media: 'playing', title: 'Evening Jazz', devices: 4 },
  { id: 'bath', name: 'Bathroom', floor: 'first', icon: 'mdi:shower', lights: [0, 1], temp: 23.2, humidity: 68, climate: 'heating', target: 24, devices: 2 },
  { id: 'hall', name: 'Hallway', floor: 'first', icon: 'mdi:stairs', lights: [0, 1], temp: 19.6, devices: 1, motion: true },
  { id: 'living', name: 'Living Room', floor: 'ground', icon: 'mdi:sofa', lights: [5, 6], temp: 21.5, humidity: 46, climate: 'heating', target: 22, media: 'playing', title: 'The Night Manager', scenes: 3, power: 310, devices: 6, favourite: true, motion: true },
  { id: 'kitchen', name: 'Kitchen', floor: 'ground', icon: 'mdi:silverware-fork-knife', lights: [1, 3], temp: 20.8, fans: [1, 1], power: 640, devices: 4 },
  { id: 'entrance', name: 'Entrance', floor: 'ground', icon: 'mdi:door', lights: [0, 1], temp: 20, open: 1, devices: 3 },
  { id: 'office', name: 'Office', floor: 'ground', icon: 'mdi:desk', lights: [0, 2], temp: 21.4, climate: 'idle', target: 21, devices: 3 },
  { id: 'wc', name: 'Guest WC', floor: 'ground', icon: 'mdi:toilet', temp: null, devices: 1, motion: true },
  { id: 'storage', name: 'Storage', floor: 'ground', icon: 'mdi:archive', temp: null, devices: 1 },
  { id: 'cinema', name: 'Entertainment', floor: 'basement', icon: 'mdi:television', lights: [0, 2], temp: 19.8, media: 'paused', devices: 3 },
  { id: 'laundry', name: 'Laundry & Utility Room', floor: 'basement', icon: 'mdi:washing-machine', lights: [0, 1], temp: 21.2, fans: [0, 1], power: 1850, devices: 2 }
];

const QUIET: Spec[] = EVENING.map((s) => ({ ...s, lights: s.lights ? [0, s.lights[1]] : undefined, media: s.media ? 'paused' : s.media, fans: s.fans ? [0, s.fans[1]] : undefined, motion: false, open: 0, climate: s.climate ? 'idle' : undefined, power: 0 }));
const MORNING: Spec[] = EVENING.map((s) => ({
  ...s,
  lights: s.id === 'kitchen' ? [3, 3] : s.lights ? [0, s.lights[1]] : undefined,
  lightColor: null,
  media: s.media ? 'paused' : s.media,
  climate: s.climate ? (s.id === 'office' ? 'cooling' : 'heating') : undefined,
  target: s.id === 'office' ? 20 : 22,
  temp: s.temp === null || s.temp === undefined ? s.temp : s.temp - 1.4
}));
const COLOURED: Spec[] = EVENING.map((s) => (s.id === 'living' ? { ...s, lightColor: 'rgb(255 70 150)' } : s.id === 'bedroom' ? { ...s, lightColor: 'rgb(90 120 255)' } : s));

export const STUDIO_STATES = [
  { id: 'evening', label: 'Evening, busy', specs: EVENING },
  { id: 'quiet', label: 'All quiet', specs: QUIET },
  { id: 'morning', label: 'Heating morning', specs: MORNING },
  { id: 'rgb', label: 'Coloured lights', specs: COLOURED }
] as const;
export type StudioStateId = (typeof STUDIO_STATES)[number]['id'];

export function studioRooms(state: StudioStateId): RoomItem[] {
  const specs = STUDIO_STATES.find((s) => s.id === state)?.specs ?? EVENING;
  const rooms = specs.map(build);
  const colors = assignRoomColors(rooms);
  return rooms.map((r) => ({ ...r, color: colors.get(r.areaId) ?? '' }));
}

export const studioPage = (rooms: RoomItem[]): RoomsPageModel => assembleRoomsPage(rooms, STUDIO_FLOORS);

/** HA's answer to a service call, applied to the fixtures only (lights, media, fans, covers, climate). */
export function applyStudioService(rooms: RoomItem[], domain: string, service: string, data: Record<string, unknown>, entityId: string | string[]): RoomItem[] {
  const ids = new Set(Array.isArray(entityId) ? entityId : [entityId]);
  const hit = (list: string[]) => list.some((id) => ids.has(id));
  return rooms.map((r) => {
    let next = r;
    if (domain === 'light' && hit(r.lightIds)) next = { ...r, lightsOn: service === 'turn_on' ? r.totalLights : 0 };
    if (domain === 'fan' && hit(r.fanIds)) next = { ...r, fansOn: service === 'turn_on' ? r.fanIds.length : 0 };
    if (domain === 'cover' && hit(r.coverIds)) next = { ...r, coversOpen: service === 'open_cover' ? r.coverIds.length : 0 };
    if (domain === 'media_player' && r.media && ids.has(r.media.entityId)) {
      const playing = !r.media.playing;
      next = { ...r, media: { ...r.media, playing }, mediaPlaying: playing ? 1 : 0, occupied: r.motion || playing };
    }
    if (domain === 'climate' && r.thermostat && ids.has(r.thermostat.entityId) && typeof data.temperature === 'number')
      next = { ...r, thermostat: { ...r.thermostat, target: data.temperature }, targetTemp: data.temperature };
    return next;
  });
}
