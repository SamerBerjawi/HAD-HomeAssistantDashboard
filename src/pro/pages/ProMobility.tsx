import { useMemo } from 'react';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { haWebSocketService } from '@/services/haWebSocket';
import { Garage } from './mobility/Garage';
import { garageFleet } from './mobility/garageFleet';
import { deriveBikeMetrics } from '@/services/mobility/bikeMetrics';
import { deriveCarMetrics } from '@/services/mobility/carMetrics';
import type { Vehicle } from './mobility/vehicle';

function demoGarage(): Vehicle[] {
  const input = { states: {}, resolvedZones: [], isDemo: true };
  const car = deriveCarMetrics({ ...input, speedHistory: [] });
  const bike = deriveBikeMetrics(input);
  return [
    { id: 'demo-car', kind: 'Car', name: 'Electric car', charge: car.soc ?? null, range: car.range ?? null, rangeUnit: car.rangeUnit, state: car.chargingState, place: car.locationZone },
    { id: 'demo-bike', kind: 'Bike', name: 'Electric bike', charge: bike.batteryPercent ?? null, range: bike.remainingRangeKm ?? null, state: bike.isLocked ? 'Locked' : 'Unlocked', place: bike.locationZone }
  ];
}

export default function ProMobility() {
  const entities = useAutoLayoutStore(s => s.resolvedEntities);
  const fleet = useMemo(() => garageFleet(entities), [entities]);
  return <Garage fleet={fleet.length || !haWebSocketService.isDemo() ? fleet : demoGarage()} />;
}
