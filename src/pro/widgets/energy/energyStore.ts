/**
 * One shared energy model for the three Energy widgets and their sheet (rebuild, Phase 3e).
 * `useEnergyData` fetches Home Assistant statistics, so it runs once, in `EnergyDataBridge`,
 * mounted by the page only while an energy widget or sheet is showing.
 */
import { create } from 'zustand';
import type { EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import { buildOverviewEnergyModel, type ProOverviewEnergyModel } from '../../lib/overviewEnergy';

export const ENERGY_WIDGET_IDS = ['energy_now', 'energy_today', 'energy_flow'] as const;

export type EnergyLoad = 'loading' | 'unconfigured' | 'ready' | 'error';

export const EMPTY_ENERGY_MODEL = buildOverviewEnergyModel({
  period: 'today',
  realtime: {
    homeConsumptionKW: 0,
    solarPowerKW: 0,
    gridImportPowerKW: 0,
    gridExportPowerKW: 0,
    batteryChargePowerKW: 0,
    batteryDischargePowerKW: 0,
    batterySoC: null
  }
});

interface EnergyStore {
  model: ProOverviewEnergyModel;
  load: EnergyLoad;
  setPeriod: (period: EnergyHistoryPeriod) => void;
  publish: (next: Partial<Omit<EnergyStore, 'publish'>>) => void;
}

export const useEnergyStore = create<EnergyStore>((set) => ({
  model: EMPTY_ENERGY_MODEL,
  load: 'loading',
  setPeriod: () => undefined,
  publish: (next) => set(next)
}));

export const useEnergyModel = (): ProOverviewEnergyModel => useEnergyStore((s) => s.model);

const IS_ENERGY = new Set<string>(ENERGY_WIDGET_IDS);

/** Fetch energy only while the layout places an energy widget or an energy sheet is open. */
export function needsEnergyData(items: Readonly<Record<string, readonly { i: string }[] | undefined>>, openSheet: string | null): boolean {
  if (openSheet && IS_ENERGY.has(openSheet)) return true;
  return Object.values(items).some((list) => list?.some((p) => IS_ENERGY.has(p.i)));
}
