import { useSheetParam } from '../../hooks/useSheetParam';
import type { DeviceLayout } from '../../lib/overviewLayout';
import { EnergyDataBridge } from './EnergyDataBridge';
import { needsEnergyData } from './energyStore';

/** Mount once per Overview page: runs the energy fetch only when an energy widget needs it. */
export function EnergyDataMount({ layout }: { layout: DeviceLayout }) {
  const { sheet } = useSheetParam();
  return needsEnergyData(layout.items, sheet) ? <EnergyDataBridge /> : null;
}
