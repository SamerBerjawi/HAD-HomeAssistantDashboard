/** Demo/test energy model: a sunny afternoon with a battery, exporting a little. */
import { buildOverviewEnergyModel } from '../../lib/overviewEnergy';

export const ENERGY_FIXTURE = buildOverviewEnergyModel({
  period: 'today',
  currency: 'EUR',
  hasSolar: true,
  hasGrid: true,
  hasBattery: true,
  realtime: {
    homeConsumptionKW: 1.8,
    solarPowerKW: 3.1,
    gridImportPowerKW: 0,
    gridExportPowerKW: 0.9,
    batteryChargePowerKW: 0.4,
    batteryDischargePowerKW: 0,
    batterySoC: 76
  },
  totals: { homeConsumption: 14.2, solar: 18.6, gridImport: 3.1, gridExport: 6.4, solarToHome: 9.6, solarToGrid: 6.4, solarToBattery: 2.6, gridToHome: 3.1, batteryToHome: 1.5 }
});
