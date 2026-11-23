/**
 * Pure sample dataset and live scenario builder for the Energy Studio (docs/pro-ui/ENERGY.md §2).
 * Produces realistic Home Assistant energy telemetry across 5 named states and 5 periods
 * (day, week, month, year, custom) using the real `buildOverviewEnergyModel` composer.
 */
import type {
  FinancialSourceBreakdown,
  TransformedDevice,
  TransformedEnergyBucket,
  TransformedEnergyTotals
} from '@/services/energy/types';
import {
  ENERGY_SECTIONS,
  type EnergySectionId,
  type EnergySectionMeta,
  type PhoneTabId,
  type StudioBatteryPoint,
  type StudioBatterySummary,
  type StudioComparison,
  type StudioEnergySnapshot,
  type StudioEnergyStateId,
  type StudioImpactData,
  type StudioPeriod,
  type StudioUtilityPoint
} from '../../../lib/energyPage';
import { buildOverviewEnergyModel } from '../../../lib/overviewEnergy';

export {
  ENERGY_SECTIONS,
  type EnergySectionId,
  type EnergySectionMeta,
  type PhoneTabId,
  type StudioBatteryPoint,
  type StudioBatterySummary,
  type StudioComparison,
  type StudioEnergySnapshot,
  type StudioEnergyStateId,
  type StudioImpactData,
  type StudioPeriod,
  type StudioUtilityPoint
};

export const STUDIO_STATES: readonly { id: StudioEnergyStateId; label: string; summary: string }[] = [
  { id: 'sunny', label: 'Sunny afternoon', summary: 'Solar surplus, battery charging (68%), exporting to grid' },
  { id: 'evening', label: 'Evening on battery', summary: 'Sunset, battery powering home (54%), near-zero grid draw' },
  { id: 'cloudy', label: 'Cloudy winter', summary: 'Low solar yield vs forecast, battery depleted, importing' },
  { id: 'grid', label: 'Grid only', summary: 'No solar, no battery, no impact sensors — partial setup' },
  { id: 'states', label: 'Edge states', summary: 'Not configured in HA, loading skeleton, and error state' }
];

interface ScenarioConfig {
  peakSolar: number;
  batteryKwh: number;
  nowHour: number;
  forecastRatio: number;
  loadScale: number;
  gasScale: number;
  waterScale: number;
  hasSolar: boolean;
  hasBattery: boolean;
  hasGas: boolean;
  hasWater: boolean;
  hasImpact: boolean;
  startSocFrac: number;
}

const SCENARIOS: Record<StudioEnergyStateId, ScenarioConfig> = {
  sunny: { peakSolar: 5.4, batteryKwh: 10, nowHour: 14, forecastRatio: 0.94, loadScale: 1.0, gasScale: 0.85, waterScale: 1.0, hasSolar: true, hasBattery: true, hasGas: true, hasWater: true, hasImpact: true, startSocFrac: 0.24 },
  evening: { peakSolar: 4.8, batteryKwh: 10, nowHour: 20, forecastRatio: 1.04, loadScale: 1.12, gasScale: 1.05, waterScale: 1.08, hasSolar: true, hasBattery: true, hasGas: true, hasWater: true, hasImpact: true, startSocFrac: 0.18 },
  cloudy: { peakSolar: 1.25, batteryKwh: 10, nowHour: 15, forecastRatio: 2.15, loadScale: 1.35, gasScale: 1.45, waterScale: 0.92, hasSolar: true, hasBattery: true, hasGas: true, hasWater: true, hasImpact: true, startSocFrac: 0.1 },
  grid: { peakSolar: 0, batteryKwh: 0, nowHour: 19, forecastRatio: 1, loadScale: 1.15, gasScale: 1.2, waterScale: 1.0, hasSolar: false, hasBattery: false, hasGas: true, hasWater: true, hasImpact: false, startSocFrac: 0 },
  states: { peakSolar: 4.8, batteryKwh: 10, nowHour: 14, forecastRatio: 1, loadScale: 1, gasScale: 1, waterScale: 1, hasSolar: true, hasBattery: true, hasGas: true, hasWater: true, hasImpact: true, startSocFrac: 0.2 }
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const pad2 = (n: number) => String(n).padStart(2, '0');

function homeLoadKw(hour: number, scale: number, noise: number): number {
  const base = 0.36;
  const morning = hour >= 6 && hour <= 9 ? 0.85 : 0;
  const midday = hour >= 12 && hour <= 14 ? 0.68 : 0;
  const evening = hour >= 17 && hour <= 22 ? 1.25 + (hour === 19 || hour === 20 ? 0.65 : 0) : 0;
  return Math.max(0.22, (base + morning + midday + evening) * scale * (1 + noise * 0.08));
}

function buildDayData(cfg: ScenarioConfig, offset: number) {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  dayStart.setDate(dayStart.getDate() + offset);
  const baseMs = dayStart.getTime();
  const activeUntil = offset < 0 ? 23 : cfg.nowHour;

  let soc = cfg.batteryKwh * cfg.startSocFrac;
  const buckets: TransformedEnergyBucket[] = [];
  const powerBuckets: TransformedEnergyBucket[] = [];
  const batterySeries: StudioBatteryPoint[] = [];
  const gasSeries: StudioUtilityPoint[] = [];
  const waterSeries: StudioUtilityPoint[] = [];

  let live = {
    homeConsumptionKW: 0,
    solarPowerKW: 0,
    gridImportPowerKW: 0,
    gridExportPowerKW: 0,
    batteryChargePowerKW: 0,
    batteryDischargePowerKW: 0,
    batterySoC: cfg.hasBattery ? Math.round(cfg.startSocFrac * 100) : null
  };

  for (let h = 0; h < 24; h++) {
    const wave = Math.sin((h + Math.abs(offset) * 3) * 0.7);
    const solarPotential =
      cfg.hasSolar && h >= 6 && h <= 20
        ? cfg.peakSolar * Math.max(0, Math.sin((Math.PI * (h - 6)) / 14)) * (1 + wave * 0.04)
        : 0;
    const isPastOrNow = h <= activeUntil;
    const solar = isPastOrNow ? solarPotential : 0;
    const use = isPastOrNow ? homeLoadKw(h, cfg.loadScale, wave) : 0;
    const solarToHome = Math.min(solar, use);
    const spare = Math.max(0, solar - solarToHome);
    const batCapRoom = cfg.hasBattery ? Math.max(0, cfg.batteryKwh - soc) : 0;
    const solarToBattery = cfg.hasBattery && isPastOrNow ? Math.min(spare, batCapRoom, 2.2) : 0;
    const solarToGrid = Math.max(0, spare - solarToBattery);
    const deficit = Math.max(0, use - solarToHome);
    const minReserve = cfg.batteryKwh * 0.08;
    const canDischarge = cfg.hasBattery && isPastOrNow && (h >= 16 || h < 6) && soc > minReserve;
    const batteryToHome = canDischarge ? Math.min(deficit, soc - minReserve, 2.4) : 0;
    const gridToHome = Math.max(0, deficit - batteryToHome);
    if (isPastOrNow) soc = clamp(soc + solarToBattery - batteryToHome, 0, cfg.batteryKwh);
    const socPct = cfg.hasBattery ? Math.round((soc / Math.max(1, cfg.batteryKwh)) * 100) : 0;

    const label = `${pad2(h)}:00`;
    buckets.push({
      startMs: baseMs + h * 3600000,
      endMs: baseMs + (h + 1) * 3600000,
      label,
      isoDate: new Date(baseMs + h * 3600000).toISOString(),
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
      gasUsage: isPastOrNow ? r2((h >= 6 && h <= 8 ? 0.34 : h >= 18 && h <= 22 ? 0.28 : 0.06) * cfg.gasScale) : 0,
      waterUsage: isPastOrNow ? r2((h === 7 || h === 8 ? 48 : h === 19 || h === 21 ? 36 : 8) * cfg.waterScale) : 0,
      deviceValues: {},
      solarForecast: cfg.hasSolar && solarPotential > 0.05 ? r2(solarPotential * cfg.forecastRatio) : null
    });

    if (isPastOrNow) {
      for (let sub = 0; sub < 12; sub++) {
        if (offset === 0 && h === activeUntil && sub > 5) break;
        const jitter = 1 + Math.sin(h * 1.7 + sub * 0.8) * 0.07;
        const sMs = baseMs + h * 3600000 + sub * 5 * 60000;
        powerBuckets.push({
          ...buckets[buckets.length - 1],
          startMs: sMs,
          endMs: sMs + 5 * 60000,
          solar: r2((solar * jitter) / 12),
          gridImport: r2((gridToHome * jitter) / 12),
          gridExport: r2((solarToGrid * jitter) / 12),
          batteryCharge: r2((solarToBattery * jitter) / 12),
          batteryDischarge: r2((batteryToHome * jitter) / 12),
          homeConsumption: r2((use * jitter) / 12)
        });
      }
      if (cfg.hasBattery) {
        batterySeries.push({ label, socPct, chargeKwh: r2(solarToBattery), dischargeKwh: r2(batteryToHome) });
      }
      const gasVal = buckets[buckets.length - 1].gasUsage;
      const waterVal = buckets[buckets.length - 1].waterUsage;
      gasSeries.push({ label, value: gasVal, prevValue: r2(gasVal * 1.09) });
      waterSeries.push({ label, value: waterVal, prevValue: r2(waterVal * 0.94) });
    }

    if (h === activeUntil) {
      live = {
        homeConsumptionKW: r2(use),
        solarPowerKW: r2(solar),
        gridImportPowerKW: r2(gridToHome),
        gridExportPowerKW: r2(solarToGrid),
        batteryChargePowerKW: r2(solarToBattery),
        batteryDischargePowerKW: r2(batteryToHome),
        batterySoC: cfg.hasBattery ? socPct : null
      };
    }
  }

  return { buckets, powerBuckets, batterySeries, gasSeries, waterSeries, live };
}

function slotLabels(period: Exclude<StudioPeriod, 'day'>): string[] {
  if (period === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (period === 'month') return Array.from({ length: 15 }, (_, i) => `Day ${i * 2 + 1}`);
  if (period === 'custom') return Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

function periodScale(period: Exclude<StudioPeriod, 'day'>): number {
  if (period === 'week') return 1;
  if (period === 'month') return 2;
  if (period === 'custom') return 1;
  return 30;
}

function buildMultiSlotData(cfg: ScenarioConfig, period: Exclude<StudioPeriod, 'day'>, offset: number) {
  const daySample = buildDayData(cfg, offset);
  const labels = slotLabels(period);
  const mult = periodScale(period);
  const nowDay = Date.now();
  const baseSolar = daySample.buckets.reduce((s, b) => s + b.solar, 0) * (cfg.nowHour < 18 ? 1.25 : 1);
  const baseHome = daySample.buckets.reduce((s, b) => s + b.homeConsumption, 0) * (cfg.nowHour < 18 ? 1.35 : 1);
  const baseBatChg = daySample.buckets.reduce((s, b) => s + b.batteryCharge, 0);
  const baseBatDis = daySample.buckets.reduce((s, b) => s + b.batteryDischarge, 0) * 1.4;

  const buckets: TransformedEnergyBucket[] = [];
  const batterySeries: StudioBatteryPoint[] = [];
  const gasSeries: StudioUtilityPoint[] = [];
  const waterSeries: StudioUtilityPoint[] = [];

  labels.forEach((label, idx) => {
    const seasonal = period === 'year' ? 0.55 + 0.65 * Math.sin((Math.PI * idx) / 11) : 0.88 + 0.22 * Math.sin(idx * 0.9 + Math.abs(offset));
    const solar = cfg.hasSolar ? baseSolar * mult * seasonal : 0;
    const use = baseHome * mult * (period === 'year' ? 1.15 - 0.25 * Math.sin((Math.PI * idx) / 11) : 0.9 + 0.16 * Math.cos(idx * 1.1));
    const solarToHome = Math.min(solar * 0.52, use * 0.65);
    const solarToBattery = cfg.hasBattery ? Math.min(Math.max(0, solar - solarToHome), baseBatChg * mult * seasonal) : 0;
    const solarToGrid = Math.max(0, solar - solarToHome - solarToBattery);
    const batteryToHome = cfg.hasBattery ? Math.min(Math.max(0, use - solarToHome), baseBatDis * mult * seasonal) : 0;
    const gridToHome = Math.max(0, use - solarToHome - batteryToHome);
    const tMs = nowDay - (labels.length - idx) * 86400000;

    buckets.push({
      startMs: tMs,
      endMs: tMs + 86400000,
      label,
      isoDate: new Date(tMs).toISOString(),
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
      gasUsage: r2(2.4 * mult * (period === 'year' ? 1.4 - 0.8 * Math.sin((Math.PI * idx) / 11) : 1)),
      waterUsage: r2(265 * mult * (0.9 + (idx % 3) * 0.08)),
      deviceValues: {},
      solarForecast: cfg.hasSolar ? r2(solar * cfg.forecastRatio) : null
    });

    if (cfg.hasBattery) {
      const socPct = Math.round(clamp(48 + 26 * Math.sin(idx * 0.8 + seasonal), 14, 96));
      batterySeries.push({ label, socPct, chargeKwh: r2(solarToBattery), dischargeKwh: r2(batteryToHome) });
    }
    const g = buckets[buckets.length - 1].gasUsage;
    const w = buckets[buckets.length - 1].waterUsage;
    gasSeries.push({ label, value: g, prevValue: r2(g * 1.07) });
    waterSeries.push({ label, value: w, prevValue: r2(w * 0.96) });
  });

  return { buckets, powerBuckets: [], batterySeries, gasSeries, waterSeries, live: daySample.live };
}

function buildDevices(usedKwh: number): TransformedDevice[] {
  const shares: [string, string, number][] = [
    ['sensor.heat_pump_energy', 'Heat pump', 0.27],
    ['sensor.ev_charger_energy', 'EV charger', 0.21],
    ['sensor.kitchen_appliances', 'Kitchen', 0.14],
    ['sensor.laundry_energy', 'Washer & dryer', 0.09],
    ['sensor.office_desk_energy', 'Home office', 0.07],
    ['sensor.living_media_energy', 'TV & media', 0.05]
  ];
  return shares.map(([statId, name, share]) => ({
    statId,
    name,
    kwh: r2(usedKwh * share),
    percentage: Math.round(share * 100)
  }));
}

function formatDateLabel(period: StudioPeriod, offset: number): string {
  if (period === 'day') return offset === 0 ? 'Today · Nov 23' : offset === -1 ? 'Yesterday · Nov 22' : `Nov ${Math.max(1, 23 + offset)}`;
  if (period === 'week') return offset === 0 ? 'This week · W47' : `Week ${47 + offset}`;
  if (period === 'month') return offset === 0 ? 'November 2026' : `Month ${11 + offset} / 2026`;
  if (period === 'year') return String(2026 + offset);
  return 'Nov 10 – Nov 23';
}

export function buildStudioEnergySnapshot(opts: {
  stateId: StudioEnergyStateId;
  period: StudioPeriod;
  dateOffset: number;
  compareEnabled: boolean;
  compareYear: number;
}): StudioEnergySnapshot {
  const cfg = SCENARIOS[opts.stateId];
  const raw = opts.period === 'day' ? buildDayData(cfg, opts.dateOffset) : buildMultiSlotData(cfg, opts.period, opts.dateOffset);
  const sum = (fn: (b: TransformedEnergyBucket) => number) => r2(raw.buckets.reduce((acc, b) => acc + fn(b), 0));

  const totals: Partial<TransformedEnergyTotals> = {
    solar: sum((b) => b.solar),
    gridImport: sum((b) => b.gridImport),
    gridExport: sum((b) => b.gridExport),
    batteryCharge: sum((b) => b.batteryCharge),
    batteryDischarge: sum((b) => b.batteryDischarge),
    solarToHome: sum((b) => b.solarToHome),
    solarToGrid: sum((b) => b.solarToGrid),
    solarToBattery: sum((b) => b.solarToBattery),
    gridToHome: sum((b) => b.gridToHome),
    batteryToHome: sum((b) => b.batteryToHome),
    homeConsumption: sum((b) => b.homeConsumption),
    solarForecastTotal: cfg.hasSolar ? r2(sum((b) => b.solarForecast ?? 0)) : null,
    gasUsage: sum((b) => b.gasUsage),
    gasUnit: 'm³',
    waterUsage: Math.round(sum((b) => b.waterUsage)),
    waterUnit: 'L'
  };

  const used = totals.homeConsumption ?? 0;
  const daysSpan = opts.period === 'day' ? 1 : opts.period === 'week' ? 7 : opts.period === 'month' ? 30 : opts.period === 'custom' ? 14 : 365;
  const importRate = 0.32;
  const exportRate = 0.09;
  const gasRate = 1.18;
  const waterRate = 0.0024;
  const importCost = r2((totals.gridImport ?? 0) * importRate);
  const exportComp = r2((totals.gridExport ?? 0) * exportRate);
  const gasCost = r2((totals.gasUsage ?? 0) * gasRate);
  const waterCost = r2((totals.waterUsage ?? 0) * waterRate);
  const standingCharge = r2(0.45 * daysSpan);
  const netCost = r2(importCost - exportComp + (cfg.hasGas ? gasCost : 0) + (cfg.hasWater ? waterCost : 0) + standingCharge);

  const devices = buildDevices(used);
  const trackedSum = devices.reduce((s, d) => s + d.kwh, 0);
  const untrackedKwh = r2(Math.max(0, used - trackedSum));
  const untrackedPct = used > 0.01 ? Math.round((untrackedKwh / used) * 100) : 0;

  const dateLabel = formatDateLabel(opts.period, opts.dateOffset);
  const model = buildOverviewEnergyModel({
    period: opts.period,
    dateLabel,
    currency: '€',
    hasSolar: cfg.hasSolar,
    hasGrid: true,
    hasBattery: cfg.hasBattery,
    realtime: raw.live,
    totals,
    financials: { gridImportCost: importCost, gridExportCompensation: exportComp, gasCost, waterCost, standingCharge, netCost, currency: '€' },
    buckets: raw.buckets,
    powerBuckets: raw.powerBuckets,
    devices,
    untrackedKwh,
    untrackedPercentage: untrackedPct
  });

  const financialSources: FinancialSourceBreakdown[] = [
    { name: 'Grid import', type: 'grid_import', energyVal: totals.gridImport ?? 0, unit: 'kWh', costOrCompensation: importCost, rateDescription: '€0.32 / kWh' },
    ...(cfg.hasSolar
      ? [{ name: 'Grid export credit', type: 'grid_export' as const, energyVal: totals.gridExport ?? 0, unit: 'kWh', costOrCompensation: -exportComp, rateDescription: '€0.09 / kWh' }]
      : []),
    ...(cfg.hasGas
      ? [{ name: 'Natural gas', type: 'gas' as const, energyVal: totals.gasUsage ?? 0, unit: 'm³', costOrCompensation: gasCost, rateDescription: '€1.18 / m³' }]
      : []),
    ...(cfg.hasWater
      ? [{ name: 'Mains water', type: 'water' as const, energyVal: totals.waterUsage ?? 0, unit: 'L', costOrCompensation: waterCost, rateDescription: '€2.40 / m³' }]
      : [])
  ];

  const socVals = raw.batterySeries.map((p) => p.socPct);
  const chargedKwh = totals.batteryCharge ?? 0;
  const dischargedKwh = totals.batteryDischarge ?? 0;
  const batterySummary: StudioBatterySummary | null = cfg.hasBattery
    ? {
        nowPct: raw.live.batterySoC ?? 0,
        minPct: socVals.length ? Math.min(...socVals) : 0,
        maxPct: socVals.length ? Math.max(...socVals) : 0,
        chargedKwh,
        dischargedKwh,
        netKwh: r2(chargedKwh - dischargedKwh),
        cyclesEst: r2((chargedKwh + dischargedKwh) / (2 * Math.max(1, cfg.batteryKwh)))
      }
    : null;

  const yearSeed = (2026 - opts.compareYear) * 0.04;
  const comparison: StudioComparison | null = opts.compareEnabled
    ? {
        year: opts.compareYear,
        usedDeltaPct: Math.round((-6.4 + yearSeed * 50) * 10) / 10,
        solarDeltaPct: cfg.hasSolar ? Math.round((opts.stateId === 'cloudy' ? -18.2 : 11.4 - yearSeed * 30) * 10) / 10 : 0,
        gridImportDeltaPct: Math.round((cfg.hasSolar ? -14.8 : 4.2) * 10) / 10,
        netCostDeltaPct: Math.round((opts.stateId === 'cloudy' ? 12.6 : -11.2) * 10) / 10,
        selfSuffDeltaPts: cfg.hasSolar ? (opts.stateId === 'cloudy' ? -7 : 8) : 0,
        prevUsedKwh: r2(used * 1.068),
        prevSolarKwh: r2((totals.solar ?? 0) * 0.898),
        prevNetCost: r2(netCost * 1.126),
        prevSlotTotals: raw.buckets.map((b, i) => r2(b.homeConsumption * (1.03 + 0.08 * Math.sin(i))))
      }
    : null;

  const impact: StudioImpactData | null = cfg.hasImpact ? { trees: 284, co2Tonnes: 5.18, coalTonnes: 4.14, lifetimeMwh: 12.96 } : null;

  return {
    stateId: opts.stateId,
    period: opts.period,
    dateOffset: opts.dateOffset,
    dateLabel,
    isAtFutureLimit: opts.dateOffset >= 0,
    compareEnabled: opts.compareEnabled,
    compareYear: opts.compareYear,
    availableYears: [2025, 2024, 2023],
    model,
    batterySeries: raw.batterySeries,
    batterySummary,
    gasSeries: raw.gasSeries,
    gasTotal: totals.gasUsage ?? 0,
    gasUnit: 'm³',
    gasCost,
    hasGas: cfg.hasGas,
    waterSeries: raw.waterSeries,
    waterTotal: totals.waterUsage ?? 0,
    waterUnit: 'L',
    waterCost,
    hasWater: cfg.hasWater,
    financialSources,
    standingCharge,
    impact,
    hasImpact: cfg.hasImpact,
    hasDevices: devices.length > 0,
    untrackedKwh,
    untrackedPct,
    comparison
  };
}
