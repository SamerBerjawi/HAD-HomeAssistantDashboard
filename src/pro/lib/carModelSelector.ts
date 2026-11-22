/**
 * Car model selector (Overview perf, 2026-11-21). `deriveCarMetrics` searches every entity for the
 * car's sensors, which costs milliseconds in a large home; running it on every state event (any
 * light, any sensor) made the whole Overview stutter. This runs it once, remembers which entities
 * it picked, and runs it again only when one of those changes, the zones or the car settings
 * change, or entities are added or removed (a car sensor may have appeared). Pure, so it is tested.
 */
import { deriveCarMetrics } from '@/services/mobility/carMetrics';
import type { HAZone } from '@/types';
import { buildCarModel, type ProCarModel } from './overviewCar';

export interface CarSettings {
  isDemo: boolean;
  targetSocDefault?: number;
  brandLogoUrl?: string;
  vehicleImageUrl?: string;
}

interface CarStoreSlice {
  states: Record<string, unknown>;
  resolvedZones: HAZone[];
}

interface CarCache {
  settingsKey: string;
  zones: HAZone[];
  entityCount: number;
  /** The state objects the car read, by id. The store replaces an object only when that entity changes. */
  picked: Array<[string, unknown]>;
  model: ProCarModel;
  json: string;
}

/** A selector with its own memory: same model object back until something the car reads changes. */
export function createCarModelSelector(): (s: CarStoreSlice, settings: CarSettings) => ProCarModel {
  let cache: CarCache | null = null;
  return (s, settings) => {
    const states = s.states ?? {};
    const zones = s.resolvedZones ?? [];
    const settingsKey = JSON.stringify(settings);
    const entityCount = Object.keys(states).length;
    if (
      cache &&
      cache.settingsKey === settingsKey &&
      cache.zones === zones &&
      cache.entityCount === entityCount &&
      cache.picked.every(([id, obj]) => states[id] === obj)
    ) {
      return cache.model;
    }

    const used = new Set<string>();
    const model = buildCarModel(
      deriveCarMetrics({
        states,
        resolvedZones: zones,
        isDemo: settings.isDemo,
        targetSocDefault: settings.targetSocDefault,
        customBrandLogo: settings.brandLogoUrl,
        customVehicleImage: settings.vehicleImageUrl,
        speedHistory: [],
        usedEntityIds: used
      }),
      'Car'
    );
    const json = JSON.stringify(model);
    // An unrelated attribute of a car entity changed: keep the old object so the card doesn't redraw.
    const keep = cache && cache.json === json ? cache.model : model;
    cache = { settingsKey, zones, entityCount, picked: [...used].map((id) => [id, states[id]]), model: keep, json };
    return keep;
  };
}

