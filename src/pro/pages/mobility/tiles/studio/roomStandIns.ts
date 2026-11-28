/**
 * Until their batch is designed, the Mobility page's other parts are drawn with the Room page's
 * chosen tiles (docs/pro-ui/VEHICLE_TILES.md): the odometer as a Reading. Pure: a vehicle in, Room tile models out (read-only: none of them has a control).
 */
import type { ReadingTileModel, TileModel, TileSize } from '../../../../areas/tileTypes';
import type { Vehicle } from '../../../../lib/mobilityHome';

export interface StandIn {
  key: string;
  model: TileModel;
  size: TileSize;
}

export type StandInSection = 'where';

const base = (entityId: string, name: string, available = true) => ({ entityId, name, available, isOn: false, lastChanged: null });

export function roomStandIns(v: Vehicle): Record<StandInSection, StandIn[]> {
  const out: Record<StandInSection, StandIn[]> = { where: [] };
  if (v.odometer !== null) out.where.push({ key: 'odometer', model: reading('odometer', 'Odometer', 'distance', v.odometer, v.unit), size: 'xs' });
  return out;
}

function reading(id: string, name: string, deviceClass: string, value: number | null, unit: string): ReadingTileModel {
  return { ...base(`sensor.${id}`, name, value !== null), kind: 'reading', deviceClass, value, unit, history: [] };
}
