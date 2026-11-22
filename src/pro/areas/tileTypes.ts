/**
 * Area tiles (docs/pro-ui/AREA_TILES.md): one Home Assistant entity per tile, designed per entity
 * type. These are the tiles' view models and actions. They are pure data, so the studio can drive
 * them from mock state and the room page (once approved) from live HA state and service calls.
 */
import type { WidgetSize } from '../lib/overviewLayout';

/** The Overview's four sizes plus X-small: one column, half a Small's height (owner, 2026-11-21). */
export type TileSize = WidgetSize | 'xs';
export const TILE_SIZES: readonly TileSize[] = ['xs', 's', 'w', 't', 'l'];
export const TILE_SIZE_LABEL: Record<TileSize, string> = { xs: 'X-small', s: 'Small', w: 'Wide', t: 'Tall', l: 'Large' };

interface TileBase {
  entityId: string;
  /** Name without the room's ("Living Room Ceiling Lamp" → "Ceiling Lamp"). */
  name: string;
  available: boolean;
  isOn: boolean;
  /** ms epoch of the last state change, for "on for 2h". */
  lastChanged: number | null;
}

/** light.*: on/off, brightness, colour temperature and colour, as the light supports them. */
export interface LightTileModel extends TileBase {
  kind: 'light';
  /** 1–100 when on and dimmable. */
  brightness: number | null;
  dimmable: boolean;
  /** Colour temperature in kelvin when the light is in that mode. */
  kelvin: number | null;
  minKelvin: number;
  maxKelvin: number;
  supportsTemp: boolean;
  /** `rgb(...)` when the light is in a colour mode. */
  rgb: string | null;
  supportsColor: boolean;
  effect: string | null;
}

/** switch.* / input_boolean.*: on/off, with power and energy when the plug reports them. */
export interface SwitchTileModel extends TileBase {
  kind: 'switch';
  /** What it is, for the icon: a smart plug, a wall switch, a helper toggle. */
  role: 'plug' | 'switch' | 'helper';
  /** What it powers, when known (from the device or name): "Diffuser", "Kettle". */
  appliance: string | null;
  powerW: number | null;
  energyTodayKwh: number | null;
  /** Last ~24 power readings (W), oldest first, for a sparkline. */
  powerHistory: number[];
}

/** fan.*: on/off, speed (percentage in steps), preset modes, oscillation and direction. */
export interface FanTileModel extends TileBase {
  kind: 'fan';
  percentage: number;
  /** Number of speed levels the fan has (100 / percentage_step, capped for display). */
  levels: number;
  supportsSpeed: boolean;
  presetModes: string[];
  presetMode: string | null;
  oscillating: boolean | null;
  direction: 'forward' | 'reverse' | null;
}

/** climate.*: current and target temperature, HVAC mode and what it's doing now. */
export interface ClimateTileModel extends TileBase {
  kind: 'climate';
  current: number | null;
  target: number | null;
  step: number;
  min: number;
  max: number;
  mode: string;
  modes: string[];
  /** hvac_action: heating, cooling, idle, off… */
  action: string | null;
  humidity: number | null;
  unit: string;
}

/** cover.*: position (0 closed … 100 open), moving or not. */
export interface CoverTileModel extends TileBase {
  kind: 'cover';
  position: number | null;
  moving: 'opening' | 'closing' | null;
  deviceClass: 'shutter' | 'blind' | 'curtain' | 'garage' | 'awning' | null;
}

/** sensor.* reading (temperature, humidity, CO₂…), with the last hours for a trend. */
export interface ReadingTileModel extends TileBase {
  kind: 'reading';
  deviceClass: string;
  value: number | null;
  unit: string;
  history: number[];
}

/** media_player.*: what's playing and the transport controls. */
export interface MediaTileModel extends TileBase {
  kind: 'media';
  /** What it is, for the icon and the TV layout (source list instead of a track). */
  deviceClass: 'speaker' | 'tv';
  playing: boolean;
  title: string | null;
  artist: string | null;
  /** Artwork URL, or a CSS background for the mock. */
  art: string | null;
  volume: number | null;
  source: string | null;
  /** Seconds into the track and its length, when known. */
  position: number | null;
  duration: number | null;
  shuffle: boolean;
  repeat: boolean;
  muted: boolean;
  /** `source_list`: inputs or apps (TV) and services (speaker). */
  sources: string[];
}

/** scene.*: run it. HA scenes have no on state; `isOn` means it was the last one run here and still holds. */
export interface SceneTileModel extends TileBase {
  kind: 'scene';
  /** What it's for, picked from the name or icon: the tile's icon. */
  look: 'movie' | 'relax' | 'bright' | 'night' | 'dinner' | 'reading' | null;
  /** The colours its lights go to (from the scene's light states), for a preview. */
  palette: string[];
  /** How many entities it sets. */
  members: number;
  lastActivated: number | null;
}

/** camera.*: a still or live view. */
export interface CameraTileModel extends TileBase {
  kind: 'camera';
  live: boolean;
  /** Still image URL, or a CSS background for the mock. */
  picture: string | null;
  lastMotion: number | null;
  /** Motion events in the last 6 h (ms epoch), oldest first, for a timeline. */
  events: number[];
}

/** lock.*: locked or not, mid-move, jammed; battery and who did it when the lock reports them. */
export interface LockTileModel extends TileBase {
  kind: 'lock';
  state: 'locked' | 'unlocked' | 'locking' | 'unlocking' | 'jammed' | 'open';
  battery: number | null;
  /** Who or what last changed it ("Sam", "Keypad", "Auto-lock"), when known. */
  changedBy: string | null;
  /** The lock can also unlatch the door (`lock.open`). */
  supportsOpen: boolean;
}

/** binary_sensor (door, window, garage_door, opening): `isOn` = open. */
export interface OpeningTileModel extends TileBase {
  kind: 'opening';
  deviceClass: 'door' | 'window' | 'garage_door' | 'opening';
  battery: number | null;
  /** Open spells in the last 24 h as [start, end | null] (ms epoch), oldest first. */
  spells: [number, number | null][];
}

/** binary_sensor (motion, occupancy, presence): `isOn` = detected. */
export interface MotionTileModel extends TileBase {
  kind: 'motion';
  deviceClass: 'motion' | 'occupancy' | 'presence';
  battery: number | null;
  /** Detections in the last 6 h (ms epoch), oldest first. */
  events: number[];
}

/** vacuum.*: what it's doing, battery, suction, the rooms it knows, and the current or last run. */
export interface VacuumTileModel extends TileBase {
  kind: 'vacuum';
  state: 'docked' | 'cleaning' | 'returning' | 'paused' | 'idle' | 'error';
  battery: number | null;
  fanSpeed: string | null;
  fanSpeeds: string[];
  /** Rooms (map segments) it can clean one by one; empty when the integration doesn't expose them. */
  rooms: string[];
  /** The rooms of the current run (or picked for the next one). */
  target: string[];
  /** Where it is now while cleaning. */
  room: string | null;
  /** Current run (or last one when docked): m² and minutes. */
  areaM2: number | null;
  minutes: number | null;
  /** 0–100 of the current run, when known. */
  progress: number | null;
  error: string | null;
  lastRun: number | null;
}

/**
 * A car, as one HA device (owner, 2026-11-21): X-small and Small tiles show one of its entities
 * (`focus`); Wide, Tall and Large combine them into one device tile.
 */
export interface CarTileModel extends TileBase {
  kind: 'car';
  focus: 'battery' | 'range' | 'charging' | 'lock' | 'climate' | 'location';
  /** sensor: state of charge, %. */
  battery: number | null;
  /** sensor: range, km. */
  rangeKm: number | null;
  /** binary_sensor / sensor: charging state, rate and limit. */
  charging: 'charging' | 'plugged' | 'unplugged' | null;
  chargeKw: number | null;
  chargeLimit: number | null;
  /** Minutes to the charge limit while charging. */
  chargeMinutes: number | null;
  /** lock entity. */
  locked: boolean | null;
  /** climate entity: on (preconditioning) and the cabin temperature. */
  climateOn: boolean | null;
  cabinTemp: number | null;
  climateTarget: number | null;
  /** device_tracker: "Home", "Away", or a zone / place name. */
  location: string | null;
  /** Image URL of the car from Home Assistant: the `entity_picture` of one of the device's entities. */
  picture: string | null;
  /** The owner's own picture (uploaded to `/api/assets`); wins over `picture`. */
  uploadedPicture: string | null;
  /** What the car's entities can do: a tile offers only these buttons (no lock entity, no Lock). */
  can: { lock: boolean; climate: boolean; charge: boolean };
}

/** binary_sensor (moisture, smoke, gas, carbon_monoxide): `isOn` = problem detected. */
export interface SafetyTileModel extends TileBase {
  kind: 'safety';
  deviceClass: 'moisture' | 'smoke' | 'gas' | 'carbon_monoxide';
  battery: number | null;
  /** Last time it reported in (a dead sensor is a silent risk). */
  lastSeen: number | null;
}

export type TileModel = LightTileModel | SwitchTileModel | FanTileModel | ClimateTileModel | CoverTileModel | ReadingTileModel | MediaTileModel | CameraTileModel | SceneTileModel | LockTileModel | OpeningTileModel | MotionTileModel | SafetyTileModel | VacuumTileModel | CarTileModel;

/** Everything a tile can ask for; the room page maps these to HA services. */
export type TileAction =
  | { type: 'target'; value: number }
  | { type: 'hvac'; mode: string }
  | { type: 'cover'; cmd: 'open' | 'close' | 'stop' }
  | { type: 'position'; pct: number }
  | { type: 'media'; cmd: 'play' | 'pause' | 'next' | 'previous' | 'shuffle' | 'repeat' }
  | { type: 'volume'; pct: number }
  | { type: 'mute'; on: boolean }
  | { type: 'source'; source: string }
  | { type: 'activate' }
  | { type: 'lock'; cmd: 'lock' | 'unlock' | 'open' }
  | { type: 'vacuum'; cmd: 'start' | 'pause' | 'dock' | 'locate' }
  | { type: 'fanSpeed'; speed: string }
  | { type: 'rooms'; rooms: string[] }
  | { type: 'charge'; on: boolean }
  | { type: 'carClimate'; on: boolean }
  | { type: 'toggle' }
  | { type: 'brightness'; pct: number }
  | { type: 'kelvin'; kelvin: number }
  | { type: 'color'; rgb: string }
  | { type: 'percentage'; pct: number }
  | { type: 'preset'; mode: string }
  | { type: 'oscillate'; on: boolean }
  | { type: 'direction'; dir: 'forward' | 'reverse' };

export interface TileProps<M extends TileModel> {
  e: M;
  size: TileSize;
  act: (a: TileAction) => void;
}

/** The level (1…levels) a percentage falls on; 0 when off. */
export const levelOf = (pct: number, levels: number, on: boolean) => (on && pct > 0 ? Math.max(1, Math.min(levels, Math.round((pct / 100) * levels))) : 0);
export const pctOfLevel = (level: number, levels: number) => Math.round((level / levels) * 100);

/** "2h ago", "Yesterday", "3d ago", "Just now", "Never". */
export function agoText(t: number | null, now = Date.now()): string {
  if (!t) return 'Never';
  const m = Math.max(0, Math.round((now - t) / 60_000));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return h < 48 ? 'Yesterday' : `${Math.floor(h / 24)}d ago`;
}

/** "for 2h 14m" / "for 12m" / "" */
export function forText(lastChanged: number | null, now = Date.now()): string {
  if (!lastChanged) return '';
  const m = Math.max(0, Math.round((now - lastChanged) / 60_000));
  if (m < 1) return 'just now';
  if (m < 60) return `for ${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `for ${h}h${m % 60 ? ` ${m % 60}m` : ''}` : `for ${Math.floor(h / 24)}d`;
}

/** Approximate colour of a white light at a colour temperature (2000 K amber … 6500 K daylight). */
export function kelvinColor(k: number): string {
  // Amber → candle → neutral white, then white → cool blue. Never through green.
  if (k <= 4500) {
    const t = Math.max(0, (k - 2000) / 2500);
    return `hsl(${Math.round(30 + t * 14)} ${Math.round(100 - t * 72)}% ${Math.round(64 + t * 26)}%)`;
  }
  const t = Math.min(1, (k - 4500) / 2000);
  return `hsl(212 ${Math.round(18 + t * 62)}% ${Math.round(91 - t * 6)}%)`;
}

/** The colour a light glows in: its colour, else its white temperature, else warm white. */
export const glowOf = (e: LightTileModel) => e.rgb ?? (e.kelvin ? kelvinColor(e.kelvin) : 'hsl(40 100% 72%)');

export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);
