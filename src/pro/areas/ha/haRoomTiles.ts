/**
 * One HA area → the Area page's tiles (Area page build, phase 1): which entities get a tile, their
 * models, sections, default sizes per device class and a stable order. Pure; the page feeds it the
 * store's resolved area and keeps the result in its layout.
 *
 * Rules:
 * - Hidden, disabled, diagnostic and config entities never get a tile.
 * - A car device is one car tile; its lock, climate, sensors and tracker don't get tiles of their own.
 * - A reading that belongs to a thermostat, a vacuum, a speaker or TV is part of that tile, not a
 *   tile itself (the thermostat already shows its temperature).
 * - The scene run last in the room, within the last two hours, counts as the one that holds.
 */
import type { ResolvedArea, ResolvedEntity } from '@/types';
import type { CarTileModel, TileModel, TileSize } from '../tileTypes';
import { SECTION_ORDER, sectionOf, type Device, type RoomItem } from '../page/roomLayout';
import { carModel, carParts, type CarTargets } from './haCar';
import { toTileModel, type MapContext, type TileHistory } from './haTileModels';

export interface AreaTile extends RoomItem {
  entityId: string;
  model: TileModel;
  /** Car tiles: the entity this X-small / Small tile is about (absent: the whole car). */
  focus?: CarTileModel['focus'];
  /** Car tiles: the entities its actions call. */
  targets?: CarTargets;
}

export interface AreaTileOptions {
  now?: number;
  history?: TileHistory;
  picture?: MapContext['picture'];
  tempUnit?: string;
}

/** Default size per kind, phone and wider screens (the owner changes them in Customize). */
function defaultSize(m: TileModel): Record<Device, TileSize> {
  switch (m.kind) {
    case 'light':
      return m.dimmable ? { phone: 's', wide: 's' } : { phone: 'xs', wide: 's' };
    case 'switch':
      return m.role === 'plug' && m.powerW !== null ? { phone: 'w', wide: 'w' } : m.role === 'helper' ? { phone: 'xs', wide: 'xs' } : { phone: 'xs', wide: 's' };
    case 'climate':
    case 'media':
    case 'camera':
    case 'vacuum':
    case 'car':
      return { phone: 'w', wide: 'w' };
    case 'scene':
      return { phone: 'xs', wide: 'xs' };
    case 'reading':
    case 'opening':
    case 'motion':
    case 'safety':
      return { phone: 'xs', wide: 's' };
    default:
      return { phone: 's', wide: 's' };
  }
}

/** Inside a section: the big things first, then by name. */
const KIND_RANK: TileModel['kind'][] = ['climate', 'media', 'camera', 'car', 'vacuum', 'lock', 'cover', 'fan', 'light', 'switch', 'opening', 'motion', 'safety', 'reading', 'scene'];
const READING_RANK = ['temperature', 'humidity', 'carbon_dioxide', 'aqi', 'pm25', 'pm10', 'volatile_organic_compounds', 'volatile_organic_compounds_parts', 'illuminance', 'pressure'];

const skip = (e: ResolvedEntity) => e.hidden || Boolean(e.disabled_by) || e.isDiagnostic || e.entity_category === 'config' || e.entity_category === 'diagnostic';
const OWNS_READINGS = new Set(['climate', 'vacuum', 'media_player']);
const SCENE_HOLDS_MS = 2 * 60 * 60 * 1000;

/** The car entities that get a tile of their own, in this order. */
const SHOWN_FOCUS = new Set<CarTileModel['focus']>(['battery', 'lock']);
export const CAR_FOCUS_NAME: Record<CarTileModel['focus'], string> = { battery: 'Battery', range: 'Range', charging: 'Charging', lock: 'Doors', climate: 'Climate', location: 'Location' };

function carFocuses(c: CarTileModel): CarTileModel['focus'][] {
  const has: Record<CarTileModel['focus'], boolean> = {
    battery: c.battery !== null,
    range: c.rangeKm !== null,
    charging: c.charging !== null,
    lock: c.can.lock,
    climate: c.can.climate,
    location: c.location !== null
  };
  return (Object.keys(CAR_FOCUS_NAME) as CarTileModel['focus'][]).filter((f) => has[f]);
}

/** A tile's name in menus and the Hidden tray: a car entity tile says which entity. */
export const areaTileName = (t: Pick<AreaTile, 'model' | 'focus'>) => (t.focus ? `${t.model.name} · ${CAR_FOCUS_NAME[t.focus]}` : t.model.name);

export function buildAreaTiles(area: ResolvedArea, opts: AreaTileOptions = {}): AreaTile[] {
  const now = opts.now ?? Date.now();
  const entities = (area.entities ?? []).filter((e) => !skip(e));
  const byDevice = new Map<string, ResolvedEntity[]>();
  for (const e of entities) if (e.device_id) byDevice.set(e.device_id, [...(byDevice.get(e.device_id) ?? []), e]);
  const ctxFor = (e: ResolvedEntity): MapContext => ({ room: area.name, now, siblings: e.device_id ? (byDevice.get(e.device_id) ?? []).filter((x) => x !== e) : [], history: opts.history, picture: opts.picture, tempUnit: opts.tempUnit });

  const tiles: AreaTile[] = [];
  const taken = new Set<string>();

  // Cars first: their entities are spoken for.
  for (const [deviceId, list] of byDevice) {
    if (!carParts(list)) continue;
    const device = area.devices?.find((d) => d.id === deviceId) ?? list[0].device;
    const name = device?.name_by_user || device?.name || list[0].name || 'Car';
    const car = carModel(list, name, deviceId, { room: area.name, now, siblings: list, picture: opts.picture, tempUnit: opts.tempUnit });
    if (!car) continue;
    for (const e of list) taken.add(e.entity_id);
    const id = car.model.entityId;
    tiles.push({ key: id, entityId: id, section: 'machines', size: defaultSize(car.model), model: car.model, targets: car.targets });
    // One X-small tile per entity the car has (owner, batch 5); battery and doors show, the rest
    // wait in the Hidden tray.
    for (const focus of carFocuses(car.model)) {
      tiles.push({ key: `${id}#${focus}`, entityId: id, section: 'machines', size: { phone: 'xs', wide: 'xs' }, model: { ...car.model, focus }, focus, targets: car.targets, hidden: !SHOWN_FOCUS.has(focus) });
    }
  }

  for (const e of entities) {
    if (taken.has(e.entity_id)) continue;
    if (e.domain === 'sensor' && e.device_id && (byDevice.get(e.device_id) ?? []).some((x) => OWNS_READINGS.has(x.domain))) continue;
    const model = toTileModel(e, ctxFor(e));
    if (!model) continue;
    tiles.push({ key: e.entity_id, entityId: e.entity_id, section: sectionOf(model.kind), size: defaultSize(model), model });
  }

  // The scene that holds: the last one run here, if recent.
  const scenes = tiles.filter((t) => t.model.kind === 'scene');
  const last = scenes.reduce<AreaTile | null>((best, t) => {
    const at = t.model.kind === 'scene' ? t.model.lastActivated : null;
    const bestAt = best && best.model.kind === 'scene' ? best.model.lastActivated : null;
    return at !== null && (bestAt === null || at > bestAt) ? t : best;
  }, null);
  if (last && last.model.kind === 'scene' && last.model.lastActivated !== null && now - last.model.lastActivated < SCENE_HOLDS_MS) last.model = { ...last.model, isOn: true };

  const rank = (t: AreaTile) => {
    const k = KIND_RANK.indexOf(t.model.kind);
    const r = t.model.kind === 'reading' ? READING_RANK.indexOf(t.model.deviceClass) : 0;
    return k * 100 + (r < 0 ? 99 : r);
  };
  return tiles.sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) || rank(a) - rank(b) || a.model.name.localeCompare(b.model.name));
}
