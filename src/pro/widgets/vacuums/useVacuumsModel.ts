import type { AutoLayoutStoreState } from '@/store/useAutoLayoutStore';
import { discoverVacuumDevices } from '@/services/vacuumDiscovery';
import type { ResolvedEntity } from '@/types';
import { buildVacuumsOverviewModel, type ProVacuumsModel } from '../../lib/overviewAppliances';
import { useDerivedModel } from '../shared/entities';

/** Vacuum entities as the old Overview found them (registry first, else any `vacuum.*`). */
export function vacuumEntitiesFrom(s: AutoLayoutStoreState): ResolvedEntity[] {
  const raw = (s.domainGroups.vacuum ?? []).filter((v) => !v.disabled_by);
  if (raw.length > 0) return raw;
  return Object.values(s.resolvedEntities ?? {}).filter((e) => (e.entity_id?.startsWith('vacuum.') || e.domain === 'vacuum') && !e.disabled_by);
}

export function buildVacuumsModelFromStore(s: AutoLayoutStoreState): ProVacuumsModel {
  const entities = vacuumEntitiesFrom(s);
  if (entities.length === 0) return buildVacuumsOverviewModel([], []);
  const { vacuums } = discoverVacuumDevices(entities, s.resolvedEntities ?? {}, s.states ?? {}, s.entityRegistry, s.devices);
  return buildVacuumsOverviewModel(vacuums, entities);
}

// Battery and room come from other sensors, so the model reads the whole store but only renders
// when the vacuums' own view changes.
export const useVacuumsModel = (): ProVacuumsModel => useDerivedModel(buildVacuumsModelFromStore, (m) => JSON.stringify(m));
