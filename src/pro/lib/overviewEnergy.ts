/**
 * Pure view-model builders for the 8 Home Assistant Energy widgets & Energy detail sheet
 * (docs/pro-ui/DESIGN.md 7.6, Option 1 + Option A revision).
 */
import type {
  TransformedDevice,
  TransformedEnergyBucket,
  TransformedEnergyTotals,
  TransformedFinancials
} from '@/services/energy/types';
import type { EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import type { HAArea, HAFloor, ResolvedEntity } from '@/types';
import type { ElectricityBarDatum } from '../ui/bklit/BidirectionalBarChart';
import type { PowerSourcesDatum } from '../ui/bklit/PowerSourcesAreaChart';
import type { SolarForecastDatum } from '../ui/bklit/SolarForecastBarChart';
import { buildEnergySankeyGraph, type EnergySankeyData } from './overviewEnergyFlow';
import { formatPower } from './pageSentences';

export type ProOverviewEnergyView =
  | 'power_flow'
  | 'energy_usage'
  | 'solar_production'
  | 'energy_flow'
  | 'energy_gauges';

export type ProEnergyTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface OverviewEnergyInput {
  period: EnergyHistoryPeriod;
  dateLabel?: string;
  currency?: string;
  hasSolar?: boolean;
  hasGrid?: boolean;
  hasBattery?: boolean;
  realtime: {
    homeConsumptionKW: number;
    solarPowerKW: number;
    gridPowerKW?: number;
    gridImportPowerKW: number;
    gridExportPowerKW: number;
    batteryPowerKW?: number;
    batteryChargePowerKW: number;
    batteryDischargePowerKW: number;
    batterySoC: number | null;
  };
  totals?: Partial<TransformedEnergyTotals>;
  financials?: Partial<TransformedFinancials>;
  buckets?: TransformedEnergyBucket[];
  powerBuckets?: TransformedEnergyBucket[];
  devices?: TransformedDevice[];
  untrackedKwh?: number;
  untrackedPercentage?: number;
  resolvedEntities?: Record<string, ResolvedEntity>;
  areas?: HAArea[];
  floors?: HAFloor[];
}

export interface ProEnergyDistributionData {
  solarToHomeKW: number;
  solarToBatteryKW: number;
  solarToGridKW: number;
  gridToHomeKW: number;
  gridToBatteryKW: number;
  batteryToHomeKW: number;
  batteryToGridKW: number;
  hasSolarToHome: boolean;
  hasSolarToBattery: boolean;
  hasSolarToGrid: boolean;
  hasGridToHome: boolean;
  hasGridToBattery: boolean;
  hasBatteryToHome: boolean;
  hasBatteryToGrid: boolean;
  lowCarbonKwh: number;
  lowCarbonPct: number;
  homeRingSolarPct: number;
  homeRingBatPct: number;
  homeRingGridPct: number;
}

export interface ProEnergyConsumer {
  id: string;
  name: string;
  kwh: number;
  kwhText: string;
  sharePct: number;
}

export interface ProOverviewEnergyModel {
  period: EnergyHistoryPeriod;
  periodLabel: string;
  dateLabel: string;
  currency: string;
  hasSolar: boolean;
  hasGrid: boolean;
  hasBattery: boolean;
  // Live power telemetry
  homeKW: number;
  homeKWText: string;
  solarKW: number;
  solarKWText: string;
  gridKW: number;
  gridImportKW: number;
  gridExportKW: number;
  gridNetText: string;
  isExporting: boolean;
  batteryKW: number;
  batteryChargeKW: number;
  batteryDischargeKW: number;
  batteryKWText: string;
  batterySoC: number | null;
  batteryStatusLabel: string;
  selfSufficiencyPct: number;
  autarkyTone: 'success' | 'warning' | 'default';
  sourceSplit: {
    solarPct: number;
    batteryPct: number;
    gridPct: number;
  };
  distribution: ProEnergyDistributionData;
  // Daily / period totals
  homeKwh: number;
  homeKwhText: string;
  solarKwh: number;
  solarKwhText: string;
  gridImportKwh: number;
  gridImportKwhText: string;
  gridExportKwh: number;
  gridExportKwhText: string;
  netGridKwh: number;
  netGridKwhText: string;
  netGridRatio: number;
  batteryChargeKwh: number;
  batteryDischargeKwh: number;
  solarToHomeKwh: number;
  solarToBatteryKwh: number;
  solarToGridKwh: number;
  batteryToHomeKwh: number;
  gridToHomeKwh: number;
  solarSelfUseKwh: number;
  solarOffsetPct: number;
  selfConsumptionPct: number;
  periodAutarkyPct: number;
  solarForecastKwh: number | null;
  solarForecastText: string;
  solarForecastPct: number;
  netCost: number;
  gridImportCost: number;
  gridExportCompensation: number;
  netCostText: string;
  // HA Chart datasets
  powerSourcesSeries: PowerSourcesDatum[];
  peakHomeKW: number;
  peakHomeKWText: string;
  peakSolarKW: number;
  peakSolarKWText: string;
  electricitySeries: ElectricityBarDatum[];
  solarForecastSeries: SolarForecastDatum[];
  energyFlowCompact: EnergySankeyData;
  energyFlowFull: EnergySankeyData;
  // Consumers
  topConsumers: ProEnergyConsumer[];
  untrackedKwh: number;
  untrackedPct: number;
}

function cleanNum(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatKwh(kwh: number): string {
  const safe = Math.max(0, cleanNum(kwh));
  if (safe >= 100) return `${Math.round(safe)} kWh`;
  if (safe >= 10) return `${safe.toFixed(1)} kWh`;
  return `${safe.toFixed(2).replace(/\.00$/, '')} kWh`;
}

export function formatCurrencyValue(amount: number, currency: string): string {
  const safe = cleanNum(amount);
  const symbol = currency || '€';
  if (safe < -0.005) {
    return `-${symbol}${Math.abs(safe).toFixed(2)}`;
  }
  return `${symbol}${Math.max(0, safe).toFixed(2)}`;
}

export function energyViewForWidgetId(widgetId: string): ProOverviewEnergyView | null {
  if (widgetId === 'power_flow' || widgetId === 'power_flow_chart') return 'power_flow';
  if (widgetId === 'energy_usage' || widgetId === 'energy_usage_chart') return 'energy_usage';
  if (widgetId === 'solar_production' || widgetId === 'solar_production_chart') return 'solar_production';
  if (widgetId === 'energy_flow') return 'energy_flow';
  if (widgetId === 'energy_gauges') return 'energy_gauges';
  return null;
}

function resolvePeriodLabel(period: EnergyHistoryPeriod, dateLabel?: string): string {
  if (dateLabel && dateLabel.trim().length > 0) return dateLabel;
  if (period === 'week' || period === '7d') return 'This week';
  if (period === 'month') return 'This month';
  if (period === 'year') return 'This year';
  return 'Today';
}

const SLOT_MS = 10 * 60 * 1000;
const DAY_SLOTS = 144;
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The "Power sources" series, drawn like Home Assistant's: everything that came in above zero
 * (all the solar produced, battery discharge, grid import) and everything that went out below
 * zero (battery charge, grid export); consumption is the line where the two balance. Total flows,
 * not the "to home" share: clipping solar to what the home used dropped the solar that charged
 * the battery or went to the grid, so the chart didn't add up.
 *
 * From 5-minute statistics: one point per 10 minutes over the whole local day of the latest data,
 * midnight to midnight; slots after the latest data are `future` (the chart leaves them empty).
 */
function buildPowerSourcesSeries(p: {
  powerBuckets: TransformedEnergyBucket[];
  buckets: TransformedEnergyBucket[];
  period: EnergyHistoryPeriod;
}): PowerSourcesDatum[] {
  const { powerBuckets, buckets, period } = p;
  const flows = (b: TransformedEnergyBucket) => ({
    solar: Math.max(0, cleanNum(b.solar)),
    batteryDischarge: Math.max(0, cleanNum(b.batteryDischarge)),
    gridImport: Math.max(0, cleanNum(b.gridImport)),
    batteryCharge: Math.max(0, cleanNum(b.batteryCharge)),
    gridExport: Math.max(0, cleanNum(b.gridExport)),
    home: Math.max(0, cleanNum(b.homeConsumption))
  });
  type Flows = ReturnType<typeof flows>;
  const KEYS = ['solar', 'batteryDischarge', 'gridImport', 'batteryCharge', 'gridExport', 'home'] as const;

  if (powerBuckets.length >= 2) {
    const isActive = (b: TransformedEnergyBucket) => KEYS.some((k) => flows(b)[k] > 0.0005);
    let last: TransformedEnergyBucket | undefined;
    for (let i = powerBuckets.length - 1; i >= 0 && !last; i--) if (isActive(powerBuckets[i]) && Number.isFinite(powerBuckets[i].startMs)) last = powerBuckets[i];
    if (last) {
      const day = new Date(last.startMs);
      day.setHours(0, 0, 0, 0);
      const d0 = day.getTime();
      const lastSlot = Math.min(DAY_SLOTS - 1, Math.floor((last.startMs - d0) / SLOT_MS));
      const sums = Array.from({ length: DAY_SLOTS }, () => ({ n: 0, solar: 0, batteryDischarge: 0, gridImport: 0, batteryCharge: 0, gridExport: 0, home: 0 }));
      for (const b of powerBuckets) {
        const i = Math.floor((b.startMs - d0) / SLOT_MS);
        if (i < 0 || i > lastSlot || b.startMs > last.startMs) continue;
        const f = flows(b);
        const slot = sums[i];
        slot.n += 1;
        for (const k of KEYS) slot[k] += f[k];
      }
      return sums.map((slot, i) => {
        const t = d0 + i * SLOT_MS;
        const at = new Date(t);
        const label = `${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
        // kWh per 5-minute bucket → average kW over the slot.
        const kw = (k: keyof Flows) => (slot.n > 0 ? round2((slot[k] / slot.n) * 12) : 0);
        return {
          label,
          t,
          ...(i > lastSlot ? { future: true } : {}),
          solar: kw('solar'),
          batteryDischarge: kw('batteryDischarge'),
          gridImport: kw('gridImport'),
          batteryCharge: kw('batteryCharge'),
          gridExport: kw('gridExport'),
          home: kw('home')
        };
      });
    }
  }

  if (buckets.length >= 2) {
    const hoursPerBucket = period === 'week' || period === 'month' || period === '7d' ? 24 : 1;
    const scale = 1 / hoursPerBucket;
    const step = Math.max(1, Math.ceil(buckets.length / 24));
    const out: PowerSourcesDatum[] = [];
    for (let i = 0; i < buckets.length; i += step) {
      const slice = buckets.slice(i, i + step);
      const avg = (k: keyof Flows) => round2((slice.reduce((sum, b) => sum + flows(b)[k], 0) / slice.length) * scale);
      out.push({
        label: slice[0]?.label || `${i}`,
        solar: avg('solar'),
        batteryDischarge: avg('batteryDischarge'),
        gridImport: avg('gridImport'),
        batteryCharge: avg('batteryCharge'),
        gridExport: avg('gridExport'),
        home: avg('home')
      });
    }
    return out;
  }

  return [];
}

function buildElectricitySeries(buckets: TransformedEnergyBucket[]): ElectricityBarDatum[] {
  if (buckets.length === 0) return [];
  const raw = buckets.map((b) => {
    const solar = Math.max(0, cleanNum(b.solarToHome));
    const batDis = Math.max(0, cleanNum(b.batteryToHome));
    let gridImp = Math.max(0, cleanNum(b.gridToHome));
    if (solar + batDis + gridImp <= 0.001 && cleanNum(b.homeConsumption) > 0) {
      gridImp = cleanNum(b.homeConsumption);
    }
    return {
      label: b.label,
      solar: round2(solar),
      batteryDischarge: round2(batDis),
      gridImport: round2(gridImp),
      batteryCharge: round2(Math.max(0, cleanNum(b.batteryCharge))),
      gridExport: round2(Math.max(0, cleanNum(b.gridExport)))
    };
  });
  if (raw.length <= 24) return raw;
  const step = Math.ceil(raw.length / 20);
  const out: ElectricityBarDatum[] = [];
  for (let i = 0; i < raw.length; i += step) {
    const slice = raw.slice(i, i + step);
    out.push({
      label: slice[0]?.label || `${i}`,
      solar: round2(slice.reduce((s, d) => s + d.solar, 0)),
      batteryDischarge: round2(slice.reduce((s, d) => s + d.batteryDischarge, 0)),
      gridImport: round2(slice.reduce((s, d) => s + d.gridImport, 0)),
      batteryCharge: round2(slice.reduce((s, d) => s + d.batteryCharge, 0)),
      gridExport: round2(slice.reduce((s, d) => s + d.gridExport, 0))
    });
  }
  return out;
}

function buildSolarForecastSeries(p: {
  buckets: TransformedEnergyBucket[];
  solarForecastKwh: number | null;
  period: EnergyHistoryPeriod;
}): SolarForecastDatum[] {
  const { buckets, solarForecastKwh, period } = p;
  if (buckets.length === 0) return [];
  const isHourly = period === 'day' || period === 'today' || period === 'yesterday';
  const slots: SolarForecastDatum[] = buckets.map((b) => ({
    label: b.label,
    solar: round2(Math.max(0, cleanNum(b.solar))),
    forecast:
      typeof b.solarForecast === 'number' && Number.isFinite(b.solarForecast) && b.solarForecast > 0
        ? round2(b.solarForecast)
        : null
  }));

  const hasSlotForecast = slots.some((s) => s.forecast !== null && s.forecast > 0);
  if (!hasSlotForecast && isHourly && solarForecastKwh && solarForecastKwh > 0 && slots.length === 24) {
    return slots.map((s, hour) => {
      if (hour < 5 || hour > 20) return { ...s, forecast: 0 };
      const dist = Math.abs(hour - 12.5);
      const est = (solarForecastKwh / 8.02) * Math.exp(-(dist * dist) / (2 * 3.2 * 3.2));
      return { ...s, forecast: round2(est) };
    });
  }

  if (slots.length <= 24) return slots;
  const step = Math.ceil(slots.length / 20);
  const condensed: SolarForecastDatum[] = [];
  for (let i = 0; i < slots.length; i += step) {
    const slice = slots.slice(i, i + step);
    const pvSum = round2(slice.reduce((sum, item) => sum + item.solar, 0));
    const fcSum = slice.some((item) => item.forecast !== null)
      ? round2(slice.reduce((sum, item) => sum + (item.forecast ?? 0), 0))
      : null;
    condensed.push({ label: slice[0]?.label || `${i}`, solar: pvSum, forecast: fcSum });
  }
  return condensed;
}

export function buildOverviewEnergyModel(input: OverviewEnergyInput): ProOverviewEnergyModel {
  const totals = input.totals || {};
  const financials = input.financials || {};
  const currency = input.currency || financials.currency || '€';

  const homeKW = Math.max(0, cleanNum(input.realtime.homeConsumptionKW));
  const solarKW = Math.max(0, cleanNum(input.realtime.solarPowerKW));
  const gridImportKW = Math.max(0, cleanNum(input.realtime.gridImportPowerKW));
  const gridExportKW = Math.max(0, cleanNum(input.realtime.gridExportPowerKW));
  const gridKW = cleanNum(input.realtime.gridPowerKW ?? gridImportKW - gridExportKW);
  const batteryChargeKW = Math.max(0, cleanNum(input.realtime.batteryChargePowerKW));
  const batteryDischargeKW = Math.max(0, cleanNum(input.realtime.batteryDischargePowerKW));
  const batteryKW = batteryDischargeKW > 0.01 ? batteryDischargeKW : -batteryChargeKW;
  const batterySoC =
    typeof input.realtime.batterySoC === 'number' && Number.isFinite(input.realtime.batterySoC)
      ? Math.max(0, Math.min(100, Math.round(input.realtime.batterySoC)))
      : null;

  const flowThreshold = 0.01;
  const isExporting = gridExportKW > 0.02 || gridKW < -0.02;
  const exportMagnitude = Math.max(gridExportKW, gridKW < 0 ? -gridKW : 0);
  const importMagnitude = Math.max(gridImportKW, gridKW > 0 ? gridKW : 0);

  const gridNetText = isExporting
    ? `Exporting ${formatPower(exportMagnitude)}`
    : importMagnitude > 0.02
    ? `Importing ${formatPower(importMagnitude)}`
    : 'Balanced';

  const hasBattery =
    Boolean(input.hasBattery) ||
    batterySoC !== null ||
    batteryChargeKW > 0.01 ||
    batteryDischargeKW > 0.01;
  const hasSolar = Boolean(input.hasSolar) || solarKW > 0.01 || cleanNum(totals.solar) > 0.01;
  const hasGrid =
    Boolean(input.hasGrid) ||
    importMagnitude > 0.01 ||
    exportMagnitude > 0.01 ||
    cleanNum(totals.gridImport) > 0.01;

  // HA live flow allocation (conservation of energy matching EnergyDistributionCard)
  const liveSolar = solarKW > flowThreshold ? solarKW : 0;
  const liveGridExp = exportMagnitude > flowThreshold ? exportMagnitude : 0;
  const liveGridImp = importMagnitude > flowThreshold ? importMagnitude : 0;
  const liveBatChg = batteryChargeKW > flowThreshold ? batteryChargeKW : 0;
  const liveBatDis = batteryDischargeKW > flowThreshold ? batteryDischargeKW : 0;

  const solarToGridKW = liveSolar > 0 && hasGrid ? Math.min(liveSolar, liveGridExp) : 0;
  const solarRem = Math.max(0, liveSolar - solarToGridKW);
  const solarToBatteryKW = solarRem > 0 && hasBattery ? Math.min(solarRem, liveBatChg) : 0;
  const solarToHomeKW = solarRem > 0 ? Math.max(0, solarRem - solarToBatteryKW) : 0;

  const gridToBatteryKW = hasBattery ? Math.max(0, liveBatChg - solarToBatteryKW) : 0;
  const batteryToGridKW = hasBattery && hasGrid ? Math.max(0, liveGridExp - solarToGridKW) : 0;
  const batteryToHomeKW = hasBattery ? Math.max(0, liveBatDis - batteryToGridKW) : 0;
  const gridToHomeKW = hasGrid ? Math.max(0, liveGridImp - gridToBatteryKW) : 0;

  const splitDenom = solarToHomeKW + batteryToHomeKW + gridToHomeKW;
  let solarPct = 0;
  let batteryPct = 0;
  let gridPct = 100;
  if (splitDenom > 0.001) {
    solarPct = Math.round((solarToHomeKW / splitDenom) * 100);
    batteryPct = Math.round((batteryToHomeKW / splitDenom) * 100);
    gridPct = Math.max(0, 100 - solarPct - batteryPct);
  }

  const selfSufficiencyPct =
    homeKW > 0.01
      ? Math.min(100, Math.max(0, Math.round(((solarToHomeKW + batteryToHomeKW) / homeKW) * 100)))
      : Math.round(cleanNum(totals.selfSufficiencyPercentage));

  const autarkyTone: 'success' | 'warning' | 'default' =
    selfSufficiencyPct >= 65 || isExporting
      ? 'success'
      : selfSufficiencyPct >= 30
      ? 'warning'
      : 'default';

  const batteryKWText =
    batteryDischargeKW > 0.02
      ? formatPower(batteryDischargeKW)
      : batteryChargeKW > 0.02
      ? formatPower(batteryChargeKW)
      : '0 W';

  const batteryStatusLabel = !hasBattery
    ? 'Not configured'
    : batteryDischargeKW > 0.02
    ? `Discharging${batterySoC !== null ? ` · ${batterySoC}%` : ''}`
    : batteryChargeKW > 0.02
    ? `Charging${batterySoC !== null ? ` · ${batterySoC}%` : ''}`
    : batterySoC !== null
    ? `${batterySoC}% standby`
    : 'Standby';

  // Period totals
  const homeKwh = Math.max(0, cleanNum(totals.homeConsumption));
  const solarKwh = Math.max(0, cleanNum(totals.solar));
  const gridImportKwh = Math.max(0, cleanNum(totals.gridImport));
  const gridExportKwh = Math.max(0, cleanNum(totals.gridExport));
  const netGridKwh = gridImportKwh - gridExportKwh;
  const gridTotalSpan = gridImportKwh + gridExportKwh;
  const netGridRatio = gridTotalSpan > 0.05 ? netGridKwh / gridTotalSpan : 0;

  const batteryChargeKwh = Math.max(0, cleanNum(totals.batteryCharge));
  const batteryDischargeKwh = Math.max(0, cleanNum(totals.batteryDischarge));
  const solarToHomeKwh = Math.max(0, cleanNum(totals.solarToHome));
  const solarToBatteryKwh = Math.max(0, cleanNum(totals.solarToBattery));
  const batteryToGridKwh = Math.max(0, cleanNum(totals.batteryToGrid));
  const gridToBatteryKwh = Math.max(0, cleanNum(totals.gridToBattery));
  // Older totals without the split: count all export as solar (unless the battery's share is known).
  const solarToGridKwh = Math.max(0, cleanNum(totals.solarToGrid) || (batteryToGridKwh > 0 ? 0 : gridExportKwh));
  const batteryToHomeKwh = Math.max(0, cleanNum(totals.batteryToHome));
  const gridToHomeKwh = Math.max(0, cleanNum(totals.gridToHome) || Math.max(0, homeKwh - solarToHomeKwh - batteryToHomeKwh));
  const solarSelfUseKwh = solarToHomeKwh + solarToBatteryKwh;

  const solarOffsetPct =
    homeKwh > 0.05
      ? Math.min(100, Math.round(((solarToHomeKwh + batteryToHomeKwh) / homeKwh) * 100))
      : selfSufficiencyPct;

  const selfConsumptionPct = Math.min(100, Math.max(0, Math.round(cleanNum(totals.selfConsumptionPercentage))));
  const periodAutarkyPct = Math.min(
    100,
    Math.max(0, Math.round(cleanNum(totals.selfSufficiencyPercentage) || solarOffsetPct))
  );

  // Home ring segments from period totals when present, else live
  const ringDenom = solarToHomeKwh + batteryToHomeKwh + gridToHomeKwh;
  const homeRingSolarPct = ringDenom > 0.05 ? Math.round((solarToHomeKwh / ringDenom) * 100) : solarPct;
  const homeRingBatPct = ringDenom > 0.05 ? Math.round((batteryToHomeKwh / ringDenom) * 100) : batteryPct;
  const homeRingGridPct = Math.max(0, 100 - homeRingSolarPct - homeRingBatPct);

  const solarForecastKwh =
    typeof totals.solarForecastTotal === 'number' &&
    Number.isFinite(totals.solarForecastTotal) &&
    totals.solarForecastTotal > 0
      ? totals.solarForecastTotal
      : null;

  const solarForecastPct =
    solarForecastKwh && solarForecastKwh > 0
      ? Math.min(100, Math.round((solarKwh / solarForecastKwh) * 100))
      : selfConsumptionPct;

  const netCost = cleanNum(financials.netCost);
  const gridImportCost = Math.max(0, cleanNum(financials.gridImportCost));
  const gridExportCompensation = Math.max(0, cleanNum(financials.gridExportCompensation));

  const buckets = input.buckets || [];
  const powerBuckets = input.powerBuckets || [];

  const powerSourcesSeries = buildPowerSourcesSeries({
    powerBuckets,
    buckets,
    period: input.period
  });
  const electricitySeries = buildElectricitySeries(buckets);
  const solarForecastSeries = buildSolarForecastSeries({
    buckets,
    solarForecastKwh,
    period: input.period
  });

  const isLongPeriod =
    input.period === 'week' || input.period === 'month' || input.period === '7d' || input.period === 'year';
  const peakHomeKW = Math.max(homeKW, ...powerSourcesSeries.map((p) => p.home));
  const peakSolarKW = isLongPeriod
    ? Math.max(solarKW, 0)
    : Math.max(solarKW, ...solarForecastSeries.map((p) => p.solar));

  const topConsumers: ProEnergyConsumer[] = [...(input.devices || [])]
    // Devices that used nothing in the period aren't consumers (audit P3, 2026-11-19).
    .filter((d) => cleanNum(d.kwh) > 0.005)
    .sort((a, b) => cleanNum(b.kwh) - cleanNum(a.kwh))
    .slice(0, 5)
    .map((d) => {
      const kwh = Math.max(0, cleanNum(d.kwh));
      const sharePct =
        Number.isFinite(d.percentage) && d.percentage > 0
          ? Math.min(100, Math.round(d.percentage))
          : homeKwh > 0.05
          ? Math.min(100, Math.round((kwh / homeKwh) * 100))
          : 0;
      return { id: d.statId, name: d.name, kwh, kwhText: formatKwh(kwh), sharePct };
    });

  const sankeyInput = {
    homeKwh,
    solarToHomeKwh,
    solarToBatteryKwh,
    solarToGridKwh,
    gridToHomeKwh,
    batteryToHomeKwh,
    gridToBatteryKwh,
    batteryToGridKwh,
    devices: (input.devices || []).map((d) => ({
      id: d.statId,
      name: d.name,
      kwh: Math.max(0, cleanNum(d.kwh))
    })),
    untrackedKwh: Math.max(0, cleanNum(input.untrackedKwh)),
    resolvedEntities: input.resolvedEntities,
    areas: input.areas,
    floors: input.floors
  };

  return {
    period: input.period,
    periodLabel: resolvePeriodLabel(input.period, input.dateLabel),
    dateLabel: input.dateLabel || resolvePeriodLabel(input.period),
    currency,
    hasSolar,
    hasGrid,
    hasBattery,
    homeKW,
    homeKWText: formatPower(homeKW),
    solarKW,
    solarKWText: formatPower(solarKW),
    gridKW,
    gridImportKW,
    gridExportKW,
    gridNetText,
    isExporting,
    batteryKW,
    batteryChargeKW,
    batteryDischargeKW,
    batteryKWText,
    batterySoC,
    batteryStatusLabel,
    selfSufficiencyPct,
    autarkyTone,
    sourceSplit: { solarPct, batteryPct, gridPct },
    distribution: {
      solarToHomeKW,
      solarToBatteryKW,
      solarToGridKW,
      gridToHomeKW,
      gridToBatteryKW,
      batteryToHomeKW,
      batteryToGridKW,
      hasSolarToHome: hasSolar && solarToHomeKW > flowThreshold,
      hasSolarToBattery: hasSolar && hasBattery && solarToBatteryKW > flowThreshold,
      hasSolarToGrid: hasSolar && hasGrid && solarToGridKW > flowThreshold,
      hasGridToHome: hasGrid && gridToHomeKW > flowThreshold,
      hasGridToBattery: hasGrid && hasBattery && gridToBatteryKW > flowThreshold,
      hasBatteryToHome: hasBattery && batteryToHomeKW > flowThreshold,
      hasBatteryToGrid: hasGrid && hasBattery && batteryToGridKW > flowThreshold,
      lowCarbonKwh: round2(solarToHomeKwh + batteryToHomeKwh),
      lowCarbonPct: periodAutarkyPct,
      homeRingSolarPct,
      homeRingBatPct,
      homeRingGridPct
    },
    homeKwh,
    homeKwhText: formatKwh(homeKwh),
    solarKwh,
    solarKwhText: formatKwh(solarKwh),
    gridImportKwh,
    gridImportKwhText: formatKwh(gridImportKwh),
    gridExportKwh,
    gridExportKwhText: formatKwh(gridExportKwh),
    netGridKwh,
    netGridKwhText:
      netGridKwh < -0.05 ? `-${formatKwh(-netGridKwh)} net` : `${formatKwh(netGridKwh)} net`,
    netGridRatio,
    batteryChargeKwh,
    batteryDischargeKwh,
    solarToHomeKwh,
    solarToBatteryKwh,
    solarToGridKwh,
    batteryToHomeKwh,
    gridToHomeKwh,
    solarSelfUseKwh,
    solarOffsetPct,
    selfConsumptionPct,
    periodAutarkyPct,
    solarForecastKwh,
    solarForecastText: solarForecastKwh !== null ? formatKwh(solarForecastKwh) : '—',
    solarForecastPct,
    netCost,
    gridImportCost,
    gridExportCompensation,
    netCostText:
      netCost < -0.005
        ? `${formatCurrencyValue(netCost, currency)} credit`
        : formatCurrencyValue(netCost, currency),
    powerSourcesSeries,
    peakHomeKW,
    peakHomeKWText: formatPower(peakHomeKW),
    peakSolarKW,
    peakSolarKWText: formatPower(peakSolarKW),
    electricitySeries,
    solarForecastSeries,
    energyFlowCompact: buildEnergySankeyGraph(sankeyInput, {
      includeAreaHierarchy: false,
      maxDevices: 4
    }),
    // HA shows every device; 12 keeps the card readable, the rest join "Other devices".
    energyFlowFull: buildEnergySankeyGraph(sankeyInput, {
      includeAreaHierarchy: true,
      maxDevices: 12
    }),
    topConsumers,
    untrackedKwh: Math.max(0, cleanNum(input.untrackedKwh)),
    untrackedPct: Math.min(100, Math.max(0, Math.round(cleanNum(input.untrackedPercentage))))
  };
}
