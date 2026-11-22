/**
 * Named Energy states for the Widget Design Studio (Phase 4), built with the real model builder
 * from a made-up day: hourly buckets (a sun curve, a home that peaks morning and evening, a
 * battery that fills at noon and empties in the evening) and a few tracked devices. The three
 * energy widgets share one model, so they share these states.
 */
import type { TransformedEnergyBucket, TransformedEnergyTotals } from '@/services/energy/types';
import { buildOverviewEnergyModel, type ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import type { WidgetState } from '../../../studio/types';

interface DayOptions {
  /** Peak solar power (kW); 0 for no solar. */
  peakSolar: number;
  /** Battery size (kWh); 0 for none. */
  battery: number;
  /** Hour "now" (0–23); the live values come from this hour. */
  now: number;
  /** Forecast as a share of the real curve (1 = spot on). */
  forecast?: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function home(h: number): number {
  const base = 0.35;
  const morning = h >= 6 && h <= 8 ? 0.7 : 0;
  const noon = h >= 12 && h <= 15 ? 0.7 : 0;
  const evening = h >= 17 && h <= 22 ? 1.1 + (h === 19 ? 0.8 : 0) : 0;
  return base + morning + noon + evening;
}

function day({ peakSolar, battery, now, forecast = 1 }: DayOptions) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let soc = battery * 0.05;
  const buckets: TransformedEnergyBucket[] = [];
  let live = { homeConsumptionKW: 0, solarPowerKW: 0, gridImportPowerKW: 0, gridExportPowerKW: 0, batteryChargePowerKW: 0, batteryDischargePowerKW: 0, batterySoC: null as number | null };
  for (let h = 0; h <= now; h++) {
    const solar = peakSolar > 0 && h >= 6 && h <= 20 ? peakSolar * Math.max(0, Math.sin((Math.PI * (h - 6)) / 14)) : 0;
    const use = home(h);
    const solarToHome = Math.min(solar, use);
    const spare = solar - solarToHome;
    const solarToBattery = battery > 0 ? Math.min(spare, battery - soc, 0.9) : 0;
    const solarToGrid = spare - solarToBattery;
    const need = use - solarToHome;
    const batteryToHome = battery > 0 && h >= 16 ? Math.min(need, soc, 1.5) : 0;
    const gridToHome = need - batteryToHome;
    soc = soc + solarToBattery - batteryToHome;
    const b = {
      startMs: start.getTime() + h * 3600000,
      endMs: start.getTime() + (h + 1) * 3600000,
      label: `${String(h).padStart(2, '0')}:00`,
      isoDate: new Date(start.getTime() + h * 3600000).toISOString(),
      solar: r2(solar),
      gridImport: r2(gridToHome),
      gridExport: r2(solarToGrid),
      batteryCharge: r2(solarToBattery),
      batteryDischarge: r2(batteryToHome),
      solarToHome: r2(solarToHome),
      solarToGrid: r2(solarToGrid),
      solarToBattery: r2(solarToBattery),
      gridToHome: r2(gridToHome),
      gridToBattery: 0,
      batteryToHome: r2(batteryToHome),
      batteryToGrid: 0,
      homeConsumption: r2(use),
      gasUsage: 0,
      waterUsage: 0,
      deviceValues: {},
      solarForecast: peakSolar > 0 ? r2(solar * forecast) : null
    } satisfies TransformedEnergyBucket;
    buckets.push(b);
    if (h === now) {
      live = {
        homeConsumptionKW: r2(use),
        solarPowerKW: r2(solar),
        gridImportPowerKW: r2(gridToHome),
        gridExportPowerKW: r2(solarToGrid),
        batteryChargePowerKW: r2(solarToBattery),
        batteryDischargePowerKW: r2(batteryToHome),
        batterySoC: battery > 0 ? Math.round((soc / battery) * 100) : null
      };
    }
  }
  const sum = (k: keyof TransformedEnergyBucket) => r2(buckets.reduce((s, b) => s + (b[k] as number), 0));
  const totals: Partial<TransformedEnergyTotals> = {
    solar: sum('solar'),
    gridImport: sum('gridImport'),
    gridExport: sum('gridExport'),
    batteryCharge: sum('batteryCharge'),
    batteryDischarge: sum('batteryDischarge'),
    solarToHome: sum('solarToHome'),
    solarToGrid: sum('solarToGrid'),
    solarToBattery: sum('solarToBattery'),
    gridToHome: sum('gridToHome'),
    batteryToHome: sum('batteryToHome'),
    homeConsumption: sum('homeConsumption')
  };
  return { buckets, totals, live };
}

const DEVICES = (used: number) =>
  [
    ['sensor.heat_pump', 'Heat pump', 0.28],
    ['sensor.ev_charger', 'EV charger', 0.22],
    ['sensor.kitchen', 'Kitchen', 0.14],
    ['sensor.laundry', 'Washer & dryer', 0.09],
    ['sensor.office', 'Office', 0.06],
    ['sensor.media', 'TV & media', 0.05]
  ].map(([statId, name, share]) => ({ statId: String(statId), name: String(name), kwh: r2(used * Number(share)), percentage: Math.round(Number(share) * 100) }));

function build(o: DayOptions, extra: { price?: number; feedIn?: number } = {}): ProOverviewEnergyModel {
  const { buckets, totals, live } = day(o);
  const used = totals.homeConsumption ?? 0;
  const importCost = r2((totals.gridImport ?? 0) * (extra.price ?? 0.32));
  const exportComp = r2((totals.gridExport ?? 0) * (extra.feedIn ?? 0.08));
  return buildOverviewEnergyModel({
    period: 'today',
    currency: '€',
    hasSolar: o.peakSolar > 0,
    hasGrid: true,
    hasBattery: o.battery > 0,
    realtime: live,
    totals,
    financials: { gridImportCost: importCost, gridExportCompensation: exportComp, netCost: r2(importCost - exportComp), currency: '€' },
    buckets,
    devices: DEVICES(used),
    untrackedKwh: r2(used * 0.16),
    untrackedPercentage: 16
  });
}

export const ENERGY_STATES: WidgetState<ProOverviewEnergyModel>[] = [
  { id: 'sunny', label: 'Sunny afternoon', model: build({ peakSolar: 4.2, battery: 10, now: 14, forecast: 0.95 }) },
  { id: 'evening', label: 'Evening on battery', model: build({ peakSolar: 4.2, battery: 10, now: 20 }) },
  { id: 'cloudy', label: 'Cloudy day', model: build({ peakSolar: 1.4, battery: 10, now: 13, forecast: 1.8 }) },
  { id: 'night', label: 'Night, importing', model: build({ peakSolar: 4, battery: 0, now: 23 }) },
  { id: 'grid', label: 'Grid only', model: build({ peakSolar: 0, battery: 0, now: 19 }) }
];
