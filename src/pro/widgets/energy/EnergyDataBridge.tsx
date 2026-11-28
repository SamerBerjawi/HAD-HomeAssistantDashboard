import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEnergyData } from '@/hooks/useEnergyData';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { buildOverviewEnergyModel } from '../../lib/overviewEnergy';
import { useEnergyStore } from './energyStore';

/**
 * Runs `useEnergyData` once for the page and publishes the energy model. The model is rebuilt on
 * live power ticks but only published when it changes, so the cards don't re-render on every
 * unrelated state update.
 */
export function EnergyDataBridge() {
  const energy = useEnergyData();
  const { resolvedEntities, areas, floors } = useAutoLayoutStore(useShallow((s) => ({ resolvedEntities: s.resolvedEntities, areas: s.areas, floors: s.floors })));
  const publish = useEnergyStore((s) => s.publish);
  const last = useRef('');

  const model = useMemo(() => buildOverviewEnergyModel({ ...energy, resolvedEntities, areas, floors }), [energy, resolvedEntities, areas, floors]);

  useEffect(() => {
    const key = JSON.stringify(model);
    if (key === last.current) return;
    last.current = key;
    publish({ model });
  }, [model, publish]);

  useEffect(() => {
    publish({ load: energy.loadState, setPeriod: energy.setPeriod });
  }, [energy.loadState, energy.setPeriod, publish]);

  return null;
}
