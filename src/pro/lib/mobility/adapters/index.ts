/**
 * Every vehicle Home Assistant knows, through the adapters: each make's own first, then the
 * generic fallback for devices no adapter claimed. Add a make here (see `../kit.ts`).
 */
import type { MobilityAction, MobilityHome } from '../../mobilityHome';
import { devicesOf, type HaCall, type HaContext, type VehicleAdapter, type VehicleSource } from '../kit';
import { cowboy } from './cowboy';
import { fordpass } from './fordpass';
import { generic } from './generic';

export const ADAPTERS: VehicleAdapter[] = [fordpass, cowboy];
const FALLBACK = generic;

export function vehicleSources(ctx: HaContext): VehicleSource[] {
  const out: VehicleSource[] = [];
  const taken = new Set<string>();
  for (const a of ADAPTERS) {
    for (const d of devicesOf(ctx, a.platform)) {
      const src = a.build(d, ctx);
      if (src) out.push(src);
      taken.add(d.id);
    }
  }
  const claimed = new Set(ADAPTERS.map((a) => a.platform));
  for (const d of devicesOf(ctx, null, taken)) {
    if (d.entries.some((e) => claimed.has(e.platform ?? ''))) continue;
    const src = FALLBACK.build(d, ctx);
    if (src) out.push(src);
  }
  // Cars before bikes, then by name, so the order is stable.
  return out.sort((a, b) => (a.vehicle.kind === b.vehicle.kind ? a.vehicle.name.localeCompare(b.vehicle.name) : a.vehicle.kind === 'car' ? -1 : 1));
}

export function buildMobilityHome(ctx: HaContext): { home: MobilityHome; sources: VehicleSource[] } {
  const sources = vehicleSources(ctx);
  return { home: { now: ctx.now, vehicles: sources.map((s) => s.vehicle) }, sources };
}

/** The service calls for a page action on one vehicle. */
export function mobilityCalls(sources: VehicleSource[], vehicleId: string, a: MobilityAction): HaCall[] {
  return sources.find((s) => s.vehicle.id === vehicleId)?.calls(a) ?? [];
}
