/**
 * The Mobility adapters' shared kit (docs/pro-ui/MOBILITY.md §0, "Live adapters"). An adapter
 * turns one Home Assistant device of its integration into the brand-neutral `Vehicle`, and turns
 * the page's actions into service calls for that device. Adapters find entities by the registry's
 * `translation_key` (or the `unique_id` suffix), never by the entity_id the owner may have renamed,
 * so a renamed or second vehicle of the same make still works.
 *
 * Adding a make: write `adapters/<integration>.ts` with an `id`, the registry `platform` it reads
 * and `build`, then list it in `adapters/index.ts`. Anything the make lacks stays null and the page
 * leaves it out.
 */
import type { HADevice, HAEntityRegistryEntry, HAState, HAZone } from '@/types';
import type { HaCall } from '../../areas/ha/haTileActions';
import type { DistanceUnit, MobilityAction, Place, Vehicle } from '../mobilityHome';

export type { HaCall };

export interface HaContext {
  states: Record<string, HAState>;
  registry: HAEntityRegistryEntry[];
  devices: HADevice[];
  zones: HAZone[];
  now: number;
  /** 24 h of speed per speed entity, 96 quarter hours, oldest first (fetched by the hook). */
  speeds?: Record<string, number[]>;
  /** The owner's pictures from classic Mobility's settings, by kind. */
  images?: { car?: string | null; bike?: string | null };
}

/** A vehicle and how to ask it to do things. */
export interface VehicleSource {
  vehicle: Vehicle;
  calls: (a: MobilityAction) => HaCall[];
  /** Speed entity to fetch 24 h of history for, if any. */
  speedEntity?: string | null;
  /** Odometer entity whose monthly long-term statistics give the Distance history, if any. */
  odometerEntity?: string | null;
}

export interface VehicleAdapter {
  id: string;
  /** The registry `platform` of the integration's entities; null for the generic fallback. */
  platform: string | null;
  build: (device: Device, ctx: HaContext) => VehicleSource | null;
}

/** One HA device with its (enabled) entities. */
export interface Device {
  id: string;
  info: HADevice | null;
  entries: HAEntityRegistryEntry[];
}

/** The devices behind a platform's entities (entities without a device are grouped by config entry). */
export function devicesOf(ctx: HaContext, platform: string | null, taken: Set<string> = new Set()): Device[] {
  const byId = new Map<string, Device>();
  for (const e of ctx.registry) {
    if (e.disabled_by) continue;
    if (platform !== null && e.platform !== platform) continue;
    const id = e.device_id ?? (e.config_entry_id ? `entry:${e.config_entry_id}` : null);
    if (!id || taken.has(id)) continue;
    let d = byId.get(id);
    if (!d) {
      d = { id, info: ctx.devices.find((x) => x.id === e.device_id) ?? null, entries: [] };
      byId.set(id, d);
    }
    d.entries.push(e);
  }
  return [...byId.values()];
}

const domainOf = (entityId: string) => entityId.slice(0, entityId.indexOf('.'));

/** An entity of the device by its key: the translation_key, else the unique_id's last part. */
export function entry(d: Device, domain: string, key: string): HAEntityRegistryEntry | null {
  const k = key.toLowerCase();
  const inDomain = d.entries.filter((e) => domainOf(e.entity_id) === domain);
  return (
    inDomain.find((e) => e.translation_key?.toLowerCase() === k) ??
    inDomain.find((e) => (e.unique_id ?? '').toLowerCase().endsWith(`_${k}`)) ??
    inDomain.find((e) => e.entity_id.toLowerCase().endsWith(`_${k}`)) ??
    null
  );
}

const UNAVAILABLE = new Set(['unavailable', 'unknown', 'none', '']);

/** The entity's state, or null when it is missing or unavailable. */
export function state(ctx: HaContext, d: Device, domain: string, key: string): HAState | null {
  const e = entry(d, domain, key);
  const s = e ? ctx.states[e.entity_id] : undefined;
  return s && !UNAVAILABLE.has(String(s.state).toLowerCase()) ? s : null;
}

export function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function time(v: unknown): number | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const t = typeof v === 'number' ? v : Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

export const unitOf = (s: HAState | null) => String(s?.attributes?.unit_of_measurement ?? '').toLowerCase();
export const distanceUnit = (s: HAState | null): DistanceUnit => (unitOf(s) === 'mi' ? 'mi' : 'km');

/** A speed state in km/h (or mph when the range is in miles). */
export function speedOf(s: HAState | null): number | null {
  const v = num(s?.state);
  if (v === null) return null;
  const u = unitOf(s);
  return Math.round(u === 'm/s' ? v * 3.6 : v);
}

/** A duration state in minutes. */
export function minutesOf(s: HAState | null): number | null {
  const v = num(s?.state);
  if (v === null) return null;
  const u = unitOf(s);
  return Math.round(u === 's' ? v / 60 : u === 'h' ? v * 60 : u === 'd' ? v * 1440 : v);
}

const toRad = (d: number) => (d * Math.PI) / 180;
function metres(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const x = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Where a tracker is: its position, the HA zone it is in (by its state, else by distance), its address. */
export function placeOf(ctx: HaContext, tracker: HAState | null, address: string | null = null, at: number | null = null): Place | null {
  const lat = num(tracker?.attributes?.latitude);
  const lon = num(tracker?.attributes?.longitude);
  if (!tracker || lat === null || lon === null) return null;
  const st = String(tracker.state);
  const home = ctx.zones.find((z) => z.entity_id === 'zone.home');
  let zone: string | null = null;
  if (st === 'home') zone = home?.name ?? 'Home';
  else if (st !== 'not_home') zone = ctx.zones.find((z) => z.name.toLowerCase() === st.toLowerCase() || z.entity_id === `zone.${st.toLowerCase()}`)?.name ?? null;
  if (!zone) zone = ctx.zones.find((z) => !z.passive && metres({ lat, lon }, { lat: z.latitude, lon: z.longitude }) <= Math.max(z.radius || 100, 100))?.name ?? null;
  return { lat, lon, zone, address, at: at ?? time(tracker.last_updated) };
}

/**
 * The picture the integration gives the vehicle: the first entity_picture among its entities,
 * an image entity first (some integrations add one with the car's render), then its tracker.
 */
export function devicePicture(d: Device, ctx: HaContext): string | null {
  const rank = (id: string) => (id.startsWith('image.') ? 0 : id.startsWith('device_tracker.') ? 1 : 2);
  for (const e of [...d.entries].sort((a, b) => rank(a.entity_id) - rank(b.entity_id))) {
    const pic = ctx.states[e.entity_id]?.attributes?.entity_picture;
    if (typeof pic === 'string' && pic.trim()) return pic.trim();
  }
  return null;
}

/** The newest last_updated of some states. */
export function newest(...ss: (HAState | null)[]): number | null {
  const ts = ss.map((s) => time(s?.last_updated)).filter((t): t is number => t !== null);
  return ts.length ? Math.max(...ts) : null;
}

/** The owner's name for a device, never a raw identifier the integration puts in the name (FordPass: "VIN: …"). */
export function deviceName(d: Device, fallback: string): string {
  const n = d.info?.name_by_user || d.info?.name || '';
  return !n || /^vin\b|^[A-HJ-NPR-Z0-9]{17}$/i.test(n.trim()) ? fallback : n;
}

export const on = (s: HAState | null) => s?.state === 'on';
export const call = (domain: string, service: string, entityId: string | null | undefined, data: Record<string, unknown> = {}, optimistic?: HaCall['optimistic']): HaCall[] =>
  entityId ? [{ domain, service, data, entityId, ...(optimistic ? { optimistic } : {}) }] : [];

/** The select option closest to a number (options like "80", "80%", "21_5", "hi"). */
export function optionFor(options: unknown, value: number): string | null {
  if (!Array.isArray(options)) return null;
  let best: string | null = null;
  let gap = Infinity;
  for (const o of options) {
    const v = num(String(o).replace('_', '.'));
    if (v !== null && Math.abs(v - value) < gap) {
      gap = Math.abs(v - value);
      best = String(o);
    }
  }
  return best;
}

/** "driverFront" / "rear_left" → "driver front" / "rear left". */
export const words = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase().trim();

/**
 * A vehicle whose integration reports nothing (every entity unavailable, e.g. the integration
 * failed to log in): kept on the page, marked offline, last heard from when its entities went away.
 */
export function offlineVehicle(d: Device, ctx: HaContext, v: Pick<Vehicle, 'id' | 'kind' | 'name' | 'make' | 'model' | 'integration' | 'image'> & { picture?: string | null }): VehicleSource | null {
  const raw = d.entries.map((e) => ctx.states[e.entity_id]).filter((x): x is HAState => !!x);
  if (!raw.length) return null;
  const went = raw.map((x) => time(x.last_changed)).filter((t): t is number => t !== null);
  return {
    vehicle: {
      ...v,
      picture: v.picture ?? devicePicture(d, ctx),
      deviceId: d.info?.id ?? null,
      powertrain: 'ev',
      seen: went.length ? Math.max(...went) : null,
      asleep: false,
      offline: true,
      level: null,
      range: null,
      unit: 'km',
      odometer: null,
      charging: null,
      climate: null,
      security: { locked: null, alarm: null, open: [], stolen: false, crashed: false },
      place: null,
      motion: null,
      today: null,
      lastTrip: null,
      lifetime: null,
      mode: null,
      condition: { tyres: null, battery12v: null, oil: null, batteryHealth: null, batteryKwh: null, batteryTemp: null, warnings: [], software: null, batteryInserted: null },
      actions: []
    },
    calls: () => []
  };
}
