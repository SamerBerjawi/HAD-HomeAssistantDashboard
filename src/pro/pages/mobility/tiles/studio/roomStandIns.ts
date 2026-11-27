/**
 * Until their batch is designed, the Mobility page's other parts are drawn with the Room page's
 * chosen tiles (docs/pro-ui/VEHICLE_TILES.md): condition as Readings, the location as the Car
 * tile. Pure: a vehicle in, Room tile models out (read-only: none of them has a control).
 */
import type { CarTileModel, ReadingTileModel, TileModel, TileSize } from '../../../../areas/tileTypes';
import type { Vehicle } from '../../../../lib/mobilityHome';

export interface StandIn {
  key: string;
  model: TileModel;
  size: TileSize;
}

export type StandInSection = 'where' | 'condition';

const base = (entityId: string, name: string, available = true) => ({ entityId, name, available, isOn: false, lastChanged: null });

export function roomStandIns(v: Vehicle): Record<StandInSection, StandIn[]> {
  const out: Record<StandInSection, StandIn[]> = { where: [], condition: [] };
  const k = v.climate;
  if (v.place) {
    const c = v.charging;
    const car: CarTileModel = {
      ...base('device_tracker.car', v.name),
      kind: 'car',
      focus: 'location',
      battery: v.level,
      rangeKm: v.range,
      charging: c ? (c.state === 'charging' ? 'charging' : c.plugged ? 'plugged' : 'unplugged') : null,
      chargeKw: c?.power ?? null,
      chargeLimit: c?.target ?? null,
      chargeMinutes: null,
      locked: v.security.locked,
      climateOn: k?.running ?? null,
      cabinTemp: k?.cabin ?? null,
      climateTarget: k?.target ?? null,
      location: v.motion?.moving ? 'Driving' : (v.place.zone ?? v.place.address ?? 'Away'),
      picture: null,
      uploadedPicture: null,
      can: { lock: false, climate: false, charge: false }
    };
    out.where.push({ key: 'where', model: car, size: 's' });
  }
  if (v.odometer !== null) out.where.push({ key: 'odometer', model: reading('odometer', 'Odometer', 'distance', v.odometer, v.unit), size: 'xs' });
  const t = v.condition.tyres;
  if (t) {
    (['fl', 'fr', 'rl', 'rr'] as const).forEach((w) => {
      const names = { fl: 'Front left', fr: 'Front right', rl: 'Rear left', rr: 'Rear right' };
      out.condition.push({ key: `tyre:${w}`, model: reading(`tyre_${w}`, names[w], 'pressure', t[w], t.unit), size: 'xs' });
    });
  }
  if (v.condition.battery12v !== null) out.condition.push({ key: '12v', model: reading('battery_12v', '12 V battery', 'voltage', v.condition.battery12v, 'V'), size: 'xs' });
  if (v.condition.batteryHealth !== null) out.condition.push({ key: 'health', model: reading('battery_health', 'Battery health', 'battery', v.condition.batteryHealth, '%'), size: 'xs' });
  return out;
}

function reading(id: string, name: string, deviceClass: string, value: number | null, unit: string): ReadingTileModel {
  return { ...base(`sensor.${id}`, name, value !== null), kind: 'reading', deviceClass, value, unit, history: [] };
}
