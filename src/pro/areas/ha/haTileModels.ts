/**
 * Home Assistant → Area tile models (Area page build, phase 1). One mapper per tile type, from a
 * `ResolvedEntity` (state, attributes, device, area). Pure: everything time- or history-based comes
 * in through `MapContext`, so the same entity always gives the same model and it can be tested.
 *
 * Not decided here (later phases): history (reading trends, plug power, motion and door events)
 * comes from `ctx.history` once the page queries it; pictures go through `ctx.picture`, which the
 * page points at the token-aware image loader.
 */
import type { ResolvedEntity } from '@/types';
import { DOMAIN_NAME, shortName } from '../../lib/roomPage';
import type { CameraTileModel, ClimateTileModel, CoverTileModel, FanTileModel, LightTileModel, LockTileModel, MediaTileModel, MotionTileModel, OpeningTileModel, ReadingTileModel, SafetyTileModel, SceneTileModel, SwitchTileModel, TileModel, VacuumTileModel } from '../tileTypes';

export interface TileHistory {
  /** Numeric samples, oldest first (readings, plug power). */
  values?: Record<string, number[]>;
  /** "On" moments, ms epoch, oldest first (motion detections, camera motion). */
  events?: Record<string, number[]>;
  /** Open spells [start, end | null], oldest first (doors and windows). */
  spells?: Record<string, [number, number | null][]>;
}

export interface MapContext {
  /** The room's name, taken off the front of entity names. */
  room: string;
  now: number;
  /** The other entities of the same device (battery, power, energy, motion of a camera). */
  siblings: readonly ResolvedEntity[];
  history?: TileHistory;
  /** Turns an HA picture path into a loadable URL (token, proxy); identity when not given. */
  picture?: (path: string) => string | null;
  /** The temperature unit of the HA instance. */
  tempUnit?: string;
}

/** Binary sensor classes per tile type; sensor classes that make a room reading. */
export const OPENING_CLASSES = new Set(['door', 'window', 'garage_door', 'opening']);
export const MOTION_CLASSES = new Set(['motion', 'occupancy', 'presence']);
export const SAFETY_CLASSES = new Set(['moisture', 'smoke', 'gas', 'carbon_monoxide']);
export const READING_CLASSES = new Set(['temperature', 'humidity', 'carbon_dioxide', 'pm25', 'pm10', 'aqi', 'illuminance', 'volatile_organic_compounds', 'volatile_organic_compounds_parts', 'pressure']);

export const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
export const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
export const time = (v: unknown): number | null => {
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};
export const deviceClass = (e: ResolvedEntity): string | null => str(e.attributes?.device_class);

/** A CSS background for a tile picture. */
export const cssImage = (url: string | null) => (url ? `url("${url.replace(/"/g, '%22')}") center / cover no-repeat` : null);

/** The entity's name; with none, the words of its id ("climate.living_room" → "Living room"). */
function displayName(e: ResolvedEntity): string {
  const n = e.name && e.name !== e.entity_id ? e.name : str(e.attributes?.friendly_name);
  if (n) return n;
  const words = e.entity_id.split('.').pop()!.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function base(e: ResolvedEntity, ctx: MapContext) {
  const a = e.attributes ?? {};
  return {
    entityId: e.entity_id,
    name: shortName(displayName(e), ctx.room, DOMAIN_NAME[e.domain]),
    available: e.state !== 'unavailable',
    lastChanged: time(e.last_changed)
  };
}

/** Battery of the entity or its device: its own attribute, the resolver's value, or a battery sensor on the device. */
export function batteryOf(e: ResolvedEntity, siblings: readonly ResolvedEntity[]): number | null {
  const a = e.attributes ?? {};
  const own = num(a.battery_level) ?? num(a.battery) ?? (typeof e.batteryPct === 'number' ? e.batteryPct : null);
  if (own !== null) return Math.round(own);
  const s = siblings.find((x) => x.domain === 'sensor' && deviceClass(x) === 'battery' && num(x.state) !== null);
  return s ? Math.round(num(s.state)!) : null;
}

function sibling(siblings: readonly ResolvedEntity[], cls: string, pick?: (e: ResolvedEntity) => boolean) {
  return siblings.find((x) => x.domain === 'sensor' && deviceClass(x) === cls && num(x.state) !== null && (!pick || pick(x)));
}

/* ── Light ── */
const COLOR_MODES = new Set(['hs', 'rgb', 'rgbw', 'rgbww', 'xy']);
export function lightModel(e: ResolvedEntity, ctx: MapContext): LightTileModel {
  const a = e.attributes ?? {};
  const modes: string[] = Array.isArray(a.supported_color_modes) ? a.supported_color_modes : [];
  const on = e.state === 'on';
  const mode = str(a.color_mode);
  const rgb = Array.isArray(a.rgb_color) && a.rgb_color.length === 3 ? `rgb(${a.rgb_color.map((v: number) => Math.round(v)).join(', ')})` : null;
  const kelvin = num(a.color_temp_kelvin) ?? (num(a.color_temp) ? Math.round(1_000_000 / num(a.color_temp)!) : null);
  const b = num(a.brightness);
  return {
    kind: 'light',
    ...base(e, ctx),
    isOn: on,
    // `onoff` only (or no modes reported and no brightness): a plain on/off light.
    dimmable: modes.length ? modes.some((m) => m !== 'onoff') : b !== null,
    brightness: on && b !== null ? Math.max(1, Math.round((b / 255) * 100)) : null,
    supportsTemp: modes.includes('color_temp'),
    kelvin: on && mode === 'color_temp' ? kelvin : null,
    minKelvin: num(a.min_color_temp_kelvin) ?? 2000,
    maxKelvin: num(a.max_color_temp_kelvin) ?? 6500,
    supportsColor: modes.some((m) => COLOR_MODES.has(m)),
    rgb: on && mode !== null && COLOR_MODES.has(mode) ? rgb : null,
    effect: on ? str(a.effect) : null
  };
}

/* ── Switch & plug ── */
export function switchModel(e: ResolvedEntity, ctx: MapContext): SwitchTileModel {
  const power = sibling(ctx.siblings, 'power');
  const energy = sibling(ctx.siblings, 'energy', (x) => /today|daily|day/i.test(`${x.entity_id} ${x.name}`));
  const cls = deviceClass(e);
  const role = e.domain === 'input_boolean' ? 'helper' : cls === 'outlet' || power || typeof e.powerWatts === 'number' ? 'plug' : 'switch';
  return {
    kind: 'switch',
    ...base(e, ctx),
    isOn: e.state === 'on',
    role,
    appliance: null,
    powerW: power ? num(power.state) : typeof e.powerWatts === 'number' ? e.powerWatts : null,
    energyTodayKwh: energy ? num(energy.state) : null,
    powerHistory: power ? (ctx.history?.values?.[power.entity_id] ?? []) : []
  };
}

/* ── Fan ── */
const FAN = { SET_SPEED: 1, OSCILLATE: 2, DIRECTION: 4, PRESET_MODE: 8 };
export function fanModel(e: ResolvedEntity, ctx: MapContext): FanTileModel {
  const a = e.attributes ?? {};
  const features = num(a.supported_features) ?? 0;
  const supportsSpeed = Boolean(features & FAN.SET_SPEED) || num(a.percentage) !== null;
  const step = num(a.percentage_step);
  return {
    kind: 'fan',
    ...base(e, ctx),
    isOn: e.state === 'on',
    percentage: num(a.percentage) ?? (e.state === 'on' ? 100 : 0),
    supportsSpeed,
    levels: supportsSpeed ? Math.max(1, Math.min(10, step ? Math.round(100 / step) : 3)) : 1,
    presetModes: Array.isArray(a.preset_modes) ? a.preset_modes.map(String) : [],
    presetMode: str(a.preset_mode),
    oscillating: features & FAN.OSCILLATE || typeof a.oscillating === 'boolean' ? Boolean(a.oscillating) : null,
    direction: a.direction === 'forward' || a.direction === 'reverse' ? a.direction : null
  };
}

/* ── Thermostat ── */
export function climateModel(e: ResolvedEntity, ctx: MapContext): ClimateTileModel {
  const a = e.attributes ?? {};
  const unit = ctx.tempUnit ?? '°C';
  return {
    kind: 'climate',
    ...base(e, ctx),
    isOn: e.state !== 'off' && e.state !== 'unavailable',
    current: num(a.current_temperature),
    target: num(a.temperature) ?? num(a.target_temp_high),
    step: num(a.target_temp_step) ?? (unit.includes('F') ? 1 : 0.5),
    min: num(a.min_temp) ?? (unit.includes('F') ? 45 : 7),
    max: num(a.max_temp) ?? (unit.includes('F') ? 95 : 35),
    mode: e.state,
    modes: Array.isArray(a.hvac_modes) ? a.hvac_modes.map(String) : [e.state],
    action: str(a.hvac_action),
    humidity: num(a.current_humidity),
    unit
  };
}

/* ── Cover ── */
const COVER_CLASSES = new Set(['shutter', 'blind', 'curtain', 'garage', 'awning']);
export function coverModel(e: ResolvedEntity, ctx: MapContext): CoverTileModel {
  const a = e.attributes ?? {};
  const cls = deviceClass(e);
  const pos = num(a.current_position);
  return {
    kind: 'cover',
    ...base(e, ctx),
    isOn: e.state === 'open' || e.state === 'opening',
    // No position reported: open or closed is all we know.
    position: pos ?? (e.state === 'open' ? 100 : e.state === 'closed' ? 0 : null),
    moving: e.state === 'opening' || e.state === 'closing' ? e.state : null,
    deviceClass: cls && COVER_CLASSES.has(cls) ? (cls as CoverTileModel['deviceClass']) : null
  };
}

/* ── Reading ── */
export function readingModel(e: ResolvedEntity, ctx: MapContext): ReadingTileModel {
  const a = e.attributes ?? {};
  return {
    kind: 'reading',
    ...base(e, ctx),
    isOn: false,
    deviceClass: deviceClass(e) ?? 'measurement',
    value: num(e.state),
    unit: str(a.unit_of_measurement) ?? '',
    history: ctx.history?.values?.[e.entity_id] ?? []
  };
}

/* ── Speaker & TV ── */
export function mediaModel(e: ResolvedEntity, ctx: MapContext): MediaTileModel {
  const a = e.attributes ?? {};
  const playing = e.state === 'playing';
  const position = num(a.media_position);
  const updated = time(a.media_position_updated_at);
  // HA reports the position as of `media_position_updated_at`; move it on while playing.
  const live = position !== null && playing && updated !== null ? position + Math.max(0, (ctx.now - updated) / 1000) : position;
  const duration = num(a.media_duration);
  const art = str(a.entity_picture);
  return {
    kind: 'media',
    ...base(e, ctx),
    isOn: !['off', 'standby', 'unavailable', 'unknown'].includes(e.state),
    deviceClass: deviceClass(e) === 'tv' ? 'tv' : 'speaker',
    playing,
    title: str(a.media_title),
    artist: str(a.media_artist) ?? str(a.media_series_title) ?? str(a.app_name),
    art: art ? cssImage(ctx.picture ? ctx.picture(art) : art) : null,
    volume: num(a.volume_level) !== null ? Math.round(num(a.volume_level)! * 100) : null,
    source: str(a.source) ?? str(a.app_name),
    position: live !== null && duration !== null ? Math.min(live, duration) : live,
    duration,
    shuffle: a.shuffle === true,
    repeat: typeof a.repeat === 'string' ? a.repeat !== 'off' : false,
    muted: a.is_volume_muted === true,
    sources: Array.isArray(a.source_list) ? a.source_list.map(String) : []
  };
}

/* ── Scene ── */
const LOOKS: [SceneTileModel['look'], RegExp][] = [
  ['movie', /movie|film|cinema|tv|netflix/i],
  ['night', /night|sleep|bed|good ?night/i],
  ['relax', /relax|chill|calm|evening|cozy|cosy/i],
  ['bright', /bright|clean|work|focus|full|day/i],
  ['dinner', /dinner|dining|meal|eat/i],
  ['reading', /read/i]
];
export function sceneModel(e: ResolvedEntity, ctx: MapContext): SceneTileModel {
  const a = e.attributes ?? {};
  const b = base(e, ctx);
  const members: unknown[] = Array.isArray(a.entity_id) ? a.entity_id : [];
  return {
    kind: 'scene',
    ...b,
    // A scene's state is when it last ran. "On" (it still holds) is decided for the room as a whole.
    isOn: false,
    look: LOOKS.find(([, re]) => re.test(b.name))?.[0] ?? null,
    // HA keeps no target colours on the scene entity; tiles fall back to the look's colour.
    palette: [],
    members: members.length,
    lastActivated: time(e.state)
  };
}

/* ── Camera ── */
export function cameraModel(e: ResolvedEntity, ctx: MapContext): CameraTileModel {
  const a = e.attributes ?? {};
  const pic = str(a.entity_picture);
  const events = ctx.history?.events?.[e.entity_id] ?? [];
  const motion = ctx.siblings.find((x) => x.domain === 'binary_sensor' && MOTION_CLASSES.has(deviceClass(x) ?? ''));
  const lastMotion = events.length ? events[events.length - 1] : motion?.state === 'on' ? ctx.now : motion ? time(motion.last_changed) : null;
  return {
    kind: 'camera',
    ...base(e, ctx),
    isOn: e.state === 'streaming' || e.state === 'recording',
    live: false,
    picture: pic ? cssImage(ctx.picture ? ctx.picture(pic) : pic) : null,
    lastMotion,
    events
  };
}

/* ── Lock ── */
const LOCK_STATES = new Set(['locked', 'unlocked', 'locking', 'unlocking', 'jammed', 'open']);
export function lockModel(e: ResolvedEntity, ctx: MapContext): LockTileModel {
  const a = e.attributes ?? {};
  const state = LOCK_STATES.has(e.state) ? (e.state as LockTileModel['state']) : e.state === 'opening' ? 'unlocking' : 'locked';
  return {
    kind: 'lock',
    ...base(e, ctx),
    isOn: state !== 'locked',
    state,
    battery: batteryOf(e, ctx.siblings),
    changedBy: str(a.changed_by),
    supportsOpen: Boolean((num(a.supported_features) ?? 0) & 1)
  };
}

/* ── Door & window, motion, leak & smoke ── */
export function openingModel(e: ResolvedEntity, ctx: MapContext): OpeningTileModel {
  return {
    kind: 'opening',
    ...base(e, ctx),
    isOn: e.state === 'on',
    deviceClass: (deviceClass(e) ?? 'opening') as OpeningTileModel['deviceClass'],
    battery: batteryOf(e, ctx.siblings),
    spells: ctx.history?.spells?.[e.entity_id] ?? []
  };
}

export function motionModel(e: ResolvedEntity, ctx: MapContext): MotionTileModel {
  return {
    kind: 'motion',
    ...base(e, ctx),
    isOn: e.state === 'on',
    deviceClass: (deviceClass(e) ?? 'motion') as MotionTileModel['deviceClass'],
    battery: batteryOf(e, ctx.siblings),
    events: ctx.history?.events?.[e.entity_id] ?? []
  };
}

export function safetyModel(e: ResolvedEntity, ctx: MapContext): SafetyTileModel {
  return {
    kind: 'safety',
    ...base(e, ctx),
    isOn: e.state === 'on',
    deviceClass: (deviceClass(e) ?? 'smoke') as SafetyTileModel['deviceClass'],
    battery: batteryOf(e, ctx.siblings),
    lastSeen: time(e.last_updated) ?? time(e.last_changed)
  };
}

/* ── Vacuum ── */
const VAC_STATES = new Set(['docked', 'cleaning', 'returning', 'paused', 'idle', 'error']);
/** Room names from the shapes integrations use: a list of names, a list of objects, or an id → name map. */
function vacuumRooms(v: unknown): string[] {
  const nameOf = (x: unknown) => (typeof x === 'string' ? x : x && typeof x === 'object' ? str((x as Record<string, unknown>).name) : null);
  const list = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v as Record<string, unknown>) : [];
  return list.map(nameOf).filter((x): x is string => x !== null);
}
export function vacuumModel(e: ResolvedEntity, ctx: MapContext): VacuumTileModel {
  const a = e.attributes ?? {};
  const state = VAC_STATES.has(e.state) ? (e.state as VacuumTileModel['state']) : e.state === 'charging' ? 'docked' : 'idle';
  return {
    kind: 'vacuum',
    ...base(e, ctx),
    isOn: state === 'cleaning' || state === 'returning',
    state,
    battery: batteryOf(e, ctx.siblings),
    fanSpeed: str(a.fan_speed),
    fanSpeeds: Array.isArray(a.fan_speed_list) ? a.fan_speed_list.map(String) : [],
    rooms: vacuumRooms(a.rooms ?? a.segments),
    target: [],
    room: str(a.current_room) ?? str(a.room),
    areaM2: num(a.cleaned_area) ?? num(a.cleaning_area),
    minutes: num(a.cleaning_time),
    progress: num(a.cleaning_progress) ?? num(a.progress),
    error: state === 'error' ? (str(a.error) ?? str(a.status) ?? null) : null,
    lastRun: time(a.last_run) ?? time(a.last_clean_end)
  };
}

/** The tile for one entity, or null when it isn't a tile on the Area page. Cars are built per device (`haCar.ts`). */
export function toTileModel(e: ResolvedEntity, ctx: MapContext): TileModel | null {
  const cls = deviceClass(e) ?? '';
  switch (e.domain) {
    case 'light':
      return lightModel(e, ctx);
    case 'switch':
    case 'input_boolean':
      return switchModel(e, ctx);
    case 'fan':
      return fanModel(e, ctx);
    case 'climate':
      return climateModel(e, ctx);
    case 'cover':
      return coverModel(e, ctx);
    case 'media_player':
      return mediaModel(e, ctx);
    case 'scene':
      return sceneModel(e, ctx);
    case 'camera':
      return cameraModel(e, ctx);
    case 'lock':
      return lockModel(e, ctx);
    case 'vacuum':
      return vacuumModel(e, ctx);
    case 'binary_sensor':
      if (OPENING_CLASSES.has(cls)) return openingModel(e, ctx);
      if (MOTION_CLASSES.has(cls)) return motionModel(e, ctx);
      if (SAFETY_CLASSES.has(cls)) return safetyModel(e, ctx);
      return null;
    case 'sensor':
      // A reading with a number, or one that is unavailable (the tile says so); text states are skipped.
      return READING_CLASSES.has(cls) && (num(e.state) !== null || e.state === 'unavailable') ? readingModel(e, ctx) : null;
    default:
      return null;
  }
}
