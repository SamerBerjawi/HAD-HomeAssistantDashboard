/**
 * Mock vehicle states for the Vehicle Tiles Studio (docs/pro-ui/VEHICLE_TILES.md), taken from the
 * Mobility samples (`lib/mobility/sampleVehicles.ts`), so the tiles are tried on the same cars as
 * the page: the Ford in each moment of its day, the second car (fewer parts) and the bike.
 */
import type { Vehicle } from '../../../../lib/mobilityHome';
import { studioMobilityHome } from '../../../../lib/mobility/sampleVehicles';

export interface VehicleState {
  id: string;
  label: string;
  v: Vehicle;
  now: number;
}

const home = (id: Parameters<typeof studioMobilityHome>[0]) => studioMobilityHome(id);
const ford = (id: Parameters<typeof studioMobilityHome>[0]) => {
  const h = home(id);
  return { v: h.vehicles[0], now: h.now };
};

export function vehicleStates(): VehicleState[] {
  const charging = ford('charging');
  const ready = ford('ready');
  const driving = ford('driving');
  const low = ford('attention');
  const fleet = home('fleet');
  const bike = home('charging');
  const bikeV = bike.vehicles.find((x) => x.kind === 'bike')!;
  const paused: Vehicle = { ...charging.v, charging: charging.v.charging && { ...charging.v.charging, state: 'stopped', power: null, readyAt: null } };
  return [
    { id: 'charging', label: 'Charging overnight', ...charging },
    { id: 'ready', label: 'Charged, plugged in', ...ready },
    { id: 'paused', label: 'Paused', v: paused, now: charging.now },
    { id: 'driving', label: 'Driving, unplugged', ...driving },
    { id: 'low', label: 'Low charge', ...low },
    { id: 'other', label: 'Second car (fewer parts)', v: fleet.vehicles[1], now: fleet.now },
    { id: 'bike', label: 'The bike', v: bike.vehicles.find((x) => x.kind === 'bike')!, now: bike.now },
    { id: 'lights', label: 'Warning lights on', v: { ...charging.v, condition: { ...charging.v.condition, warnings: ['Tire pressure low', 'Washer fluid low', '1 message from Ford'] } }, now: charging.now },
    { id: 'alarm', label: 'Alarm going off', v: { ...charging.v, security: { ...charging.v.security, alarm: 'triggered' } }, now: charging.now },
    { id: 'stolen', label: 'Bike stolen', v: { ...bikeV, security: { ...bikeV.security, stolen: true } }, now: bike.now }
  ];
}
