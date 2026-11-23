/**
 * Pure view-model, layout preferences, and live-data snapshot builder for the Pro Energy page
 * (docs/pro-ui/DESIGN.md 7.9, docs/pro-ui/ENERGY.md §4). Kept separate from studio fixtures so
 * `studioEnergy.ts` is never bundled into production.
 */
import type { IconSvgElement } from '@hugeicons/react';
import {
  BatteryFullIcon,
  Calendar01Icon,
  Car01Icon,
  ChartBarIncreasingIcon,
  Coins01Icon,
  CpuIcon,
  DropletIcon,
  FlashIcon,
  Home01Icon,
  KitchenUtensilsIcon,
  LaptopIcon,
  PineTreeIcon,
  PlugSocketIcon,
  SolarPanel01Icon,
  ThermometerIcon,
  Tv01Icon,
  WorkflowSquare01Icon
} from '@hugeicons/core-free-icons';
import type {
  FinancialSourceBreakdown,
  TransformedEnergyBucket,
  TransformedEnergyModel,
  TransformedEnergyTotals
} from '@/services/energy/types';
import type { EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import type { HAArea, HAFloor, HAState, ResolvedEntity } from '@/types';
import type { InstantaneousPowerTelemetry } from '@/utils/energyMath';
import { buildOverviewEnergyModel, formatKwh, type ProEnergyConsumer, type ProOverviewEnergyModel } from './overviewEnergy';

export type EnergySectionId =
  | 'live'
  | 'period'
  | 'summary'
  | 'usage'
  | 'solar'
  | 'battery'
  | 'flow'
  | 'devices'
  | 'costs'
  | 'utilities'
  | 'impact';

export type PhoneTabId = 'summary' | 'usage' | 'solar' | 'battery' | 'devices' | 'costs' | 'utilities';
export type EnergyConceptChoice = 'A' | 'B' | 'C';

export interface ResponsiveConceptChoice {
  desktop: EnergyConceptChoice;
  mobile: EnergyConceptChoice;
}

export interface EnergySectionMeta {
  id: EnergySectionId;
  title: string;
  shortTitle: string;
  icon: IconSvgElement;
  desktopSpan: 'full' | 'wide' | 'half' | 'narrow';
  phoneTab: PhoneTabId | null;
  summary: string;
}

export const ENERGY_SECTIONS: readonly EnergySectionMeta[] = [
  { id: 'live', title: 'Live now', shortTitle: 'Live', icon: FlashIcon, desktopSpan: 'full', phoneTab: null, summary: 'Real-time power draw, active sources, and battery charge' },
  { id: 'period', title: 'Period bar', shortTitle: 'Period', icon: Calendar01Icon, desktopSpan: 'full', phoneTab: null, summary: 'Timeframe selector, date navigation, YoY compare, and Customise' },
  { id: 'summary', title: 'Summary', shortTitle: 'Summary', icon: Home01Icon, desktopSpan: 'full', phoneTab: 'summary', summary: 'Key totals, self-sufficiency, net cost, and YoY change' },
  { id: 'usage', title: 'Usage over time', shortTitle: 'Usage', icon: ChartBarIncreasingIcon, desktopSpan: 'full', phoneTab: 'usage', summary: 'Hourly or daily consumption by source, export, and power curve' },
  { id: 'flow', title: 'Where it went', shortTitle: 'Flow', icon: WorkflowSquare01Icon, desktopSpan: 'full', phoneTab: 'usage', summary: 'Sankey energy path from sources to home and tracked devices' },
  { id: 'solar', title: 'Solar', shortTitle: 'Solar', icon: SolarPanel01Icon, desktopSpan: 'half', phoneTab: 'solar', summary: 'Solar production against forecast and self-consumption' },
  { id: 'battery', title: 'Battery', shortTitle: 'Battery', icon: BatteryFullIcon, desktopSpan: 'half', phoneTab: 'battery', summary: 'State of charge over the period and charged vs discharged kWh' },
  { id: 'devices', title: 'Devices', shortTitle: 'Devices', icon: CpuIcon, desktopSpan: 'half', phoneTab: 'devices', summary: 'Ranked monitored appliances and untracked home share' },
  { id: 'costs', title: 'Costs & tariffs', shortTitle: 'Costs', icon: Coins01Icon, desktopSpan: 'half', phoneTab: 'costs', summary: 'Import spend, export credit, standing charge, and tariff table' },
  { id: 'utilities', title: 'Gas & water', shortTitle: 'Utilities', icon: DropletIcon, desktopSpan: 'wide', phoneTab: 'utilities', summary: 'Auxiliary gas and water usage charts when configured in HA' },
  { id: 'impact', title: 'Lifetime impact', shortTitle: 'Impact', icon: PineTreeIcon, desktopSpan: 'narrow', phoneTab: 'summary', summary: 'Huawei Fusion Solar lifetime trees, CO₂ avoided, and coal saved' }
];

export const DEFAULT_ENERGY_ORDER: EnergySectionId[] = ENERGY_SECTIONS.map((s) => s.id);
const VALID_SECTION_IDS = new Set<string>(DEFAULT_ENERGY_ORDER);

/** Owner's 11 chosen responsive section designs from the Energy Studio (2026-11-23). */
export const CHOSEN_ENERGY_CONCEPTS: Readonly<Record<EnergySectionId, ResponsiveConceptChoice>> = {
  live: { desktop: 'B', mobile: 'C' },
  period: { desktop: 'B', mobile: 'C' },
  summary: { desktop: 'B', mobile: 'C' },
  usage: { desktop: 'A', mobile: 'A' },
  solar: { desktop: 'B', mobile: 'A' },
  battery: { desktop: 'B', mobile: 'B' },
  flow: { desktop: 'A', mobile: 'C' },
  devices: { desktop: 'A', mobile: 'B' },
  costs: { desktop: 'C', mobile: 'A' },
  utilities: { desktop: 'A', mobile: 'C' },
  impact: { desktop: 'B', mobile: 'B' }
};

export type StudioEnergyStateId = 'sunny' | 'evening' | 'cloudy' | 'grid' | 'states';
export type StudioPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';
export type CustomRangePresetId = 'last7' | 'last14' | 'last30' | 'thisMonth' | 'lastMonth';

export interface StudioBatteryPoint {
  label: string;
  socPct: number;
  chargeKwh: number;
  dischargeKwh: number;
}

export interface StudioBatterySummary {
  nowPct: number;
  minPct: number;
  maxPct: number;
  chargedKwh: number;
  dischargedKwh: number;
  netKwh: number;
  cyclesEst: number;
}

export interface StudioUtilityPoint {
  label: string;
  value: number;
  prevValue: number;
}

export interface StudioImpactData {
  trees: number;
  co2Tonnes: number;
  coalTonnes: number;
  lifetimeMwh: number;
}

export interface StudioComparison {
  year: number;
  usedDeltaPct: number;
  solarDeltaPct: number;
  gridImportDeltaPct: number;
  netCostDeltaPct: number;
  selfSuffDeltaPts: number;
  prevUsedKwh: number;
  prevSolarKwh: number;
  prevNetCost: number;
  prevSlotTotals: number[];
}

export interface StudioEnergySnapshot {
  stateId: StudioEnergyStateId;
  period: StudioPeriod;
  dateOffset: number;
  dateLabel: string;
  isAtFutureLimit: boolean;
  compareEnabled: boolean;
  compareYear: number;
  availableYears: readonly number[];
  model: ProOverviewEnergyModel;
  batterySeries: StudioBatteryPoint[];
  batterySummary: StudioBatterySummary | null;
  gasSeries: StudioUtilityPoint[];
  gasTotal: number;
  gasUnit: string;
  gasCost: number;
  hasGas: boolean;
  waterSeries: StudioUtilityPoint[];
  waterTotal: number;
  waterUnit: string;
  waterCost: number;
  hasWater: boolean;
  financialSources: FinancialSourceBreakdown[];
  standingCharge: number;
  impact: StudioImpactData | null;
  hasImpact: boolean;
  hasDevices: boolean;
  untrackedKwh: number;
  untrackedPct: number;
  comparison: StudioComparison | null;
}

export type PillTone = 'success' | 'warning' | 'danger' | 'default';

export const fmtKw = (kw: number): string =>
  Math.abs(kw) < 1 ? `${Math.round(Math.abs(kw) * 1000)} W` : `${Math.abs(kw).toFixed(1)} kW`;

export const fmtKwh = (kwh: number): string => {
  const safe = Math.max(0, kwh);
  if (safe >= 1000) return `${(safe / 1000).toFixed(2)} MWh`;
  if (safe >= 100) return `${Math.round(safe)} kWh`;
  return `${safe.toFixed(1)} kWh`;
};

export const fmtMoney = (amount: number, currency = '€'): string => {
  if (amount < -0.005) return `-${currency}${Math.abs(amount).toFixed(2)}`;
  return `${currency}${Math.max(0, amount).toFixed(2)}`;
};

export const fmtPct = (n: number): string => `${Math.round(n)}%`;

/** Green/orange/red semantic delta chip for year-over-year comparison. */
export function deltaBadge(deltaPct: number, lowerIsBetter: boolean): { text: string; tone: PillTone; up: boolean } {
  const rounded = Math.round(deltaPct * 10) / 10;
  const up = rounded >= 0;
  const sign = up ? '+' : '';
  const text = `${sign}${rounded.toFixed(Math.abs(rounded) >= 10 ? 0 : 1)}%`;
  if (Math.abs(rounded) < 1) return { text: '0%', tone: 'default', up: true };
  const improved = lowerIsBetter ? rounded < 0 : rounded > 0;
  if (improved) return { text, tone: 'success', up };
  return { text, tone: Math.abs(rounded) > 25 ? 'danger' : 'warning', up };
}

/** Semantic status pill for Live now (strictly green / orange / neutral). */
export function liveStatusPill(m: ProOverviewEnergyModel): { label: string; tone: PillTone; icon: IconSvgElement } {
  if (m.isExporting) return { label: `Exporting ${fmtKw(m.gridExportKW)}`, tone: 'success', icon: SolarPanel01Icon };
  if (m.hasBattery && m.batteryDischargeKW > 0.04) return { label: 'Running on battery', tone: 'success', icon: BatteryFullIcon };
  if (m.hasSolar && m.solarKW > 0.05 && m.gridImportKW <= 0.05) return { label: 'Solar powered', tone: 'success', icon: SolarPanel01Icon };
  if (m.gridImportKW > 0.04) return { label: `Importing ${fmtKw(m.gridImportKW)}`, tone: 'warning', icon: PlugSocketIcon };
  return { label: 'Balanced idle', tone: 'default', icon: FlashIcon };
}

/** Returns whether a section has configured HA data in the given snapshot. */
export function isSectionAvailable(id: EnergySectionId, snap: StudioEnergySnapshot): boolean {
  if (id === 'solar') return snap.model.hasSolar;
  if (id === 'battery') return snap.model.hasBattery && snap.batterySummary !== null;
  if (id === 'utilities') return snap.hasGas || snap.hasWater;
  if (id === 'impact') return snap.hasImpact && snap.impact !== null;
  if (id === 'devices') return snap.hasDevices;
  return true;
}

/** Filters sections by Customise hidden set AND HA availability. */
export function visibleSections(
  order: readonly EnergySectionId[],
  hidden: ReadonlySet<EnergySectionId>,
  snap: StudioEnergySnapshot
): EnergySectionId[] {
  return order.filter((id) => !hidden.has(id) && isSectionAvailable(id, snap));
}

export interface PhoneTabDef {
  id: PhoneTabId;
  title: string;
  icon: IconSvgElement;
  sections: EnergySectionId[];
}

const PHONE_TAB_META: readonly Omit<PhoneTabDef, 'sections'>[] = [
  { id: 'summary', title: 'Summary', icon: Home01Icon },
  { id: 'usage', title: 'Usage & Flow', icon: ChartBarIncreasingIcon },
  { id: 'solar', title: 'Solar', icon: SolarPanel01Icon },
  { id: 'battery', title: 'Battery', icon: BatteryFullIcon },
  { id: 'devices', title: 'Devices', icon: CpuIcon },
  { id: 'costs', title: 'Costs', icon: Coins01Icon },
  { id: 'utilities', title: 'Gas & Water', icon: DropletIcon }
];

/** Maps visible body sections (after Live now + Period bar) into phone tabs, dropping empty tabs. */
export function buildPhoneTabs(
  visibleBody: readonly EnergySectionId[],
  sectionTabMap: Readonly<Record<EnergySectionId, PhoneTabId | null>>
): PhoneTabDef[] {
  return PHONE_TAB_META.map((tab) => ({
    ...tab,
    sections: visibleBody.filter((id) => sectionTabMap[id] === tab.id)
  })).filter((tab) => tab.sections.length > 0);
}

/** Device icon matcher for ranked consumer rows. */
export function deviceIconFor(statId: string): IconSvgElement {
  const id = statId.toLowerCase();
  if (id.includes('heat') || id.includes('hvac')) return ThermometerIcon;
  if (id.includes('ev') || id.includes('car')) return Car01Icon;
  if (id.includes('kitchen') || id.includes('oven')) return KitchenUtensilsIcon;
  if (id.includes('office') || id.includes('desk')) return LaptopIcon;
  if (id.includes('media') || id.includes('tv')) return Tv01Icon;
  return CpuIcon;
}

// ---------------------------------------------------------------------------
// Preferences persistence (`preferences.proEnergy`)
// ---------------------------------------------------------------------------

export const ENERGY_PREF_KEY = 'proEnergy';

export interface EnergyPagePrefs {
  order: EnergySectionId[];
  hidden: EnergySectionId[];
}

export function readEnergyPrefs(preferences: unknown): { order: EnergySectionId[]; hidden: Set<EnergySectionId> } {
  const raw = (preferences as Record<string, unknown> | undefined)?.[ENERGY_PREF_KEY] as Partial<EnergyPagePrefs> | undefined;
  const seen = new Set<EnergySectionId>();
  const order: EnergySectionId[] = [];
  if (Array.isArray(raw?.order)) {
    for (const item of raw.order) {
      if (typeof item === 'string' && VALID_SECTION_IDS.has(item) && !seen.has(item as EnergySectionId)) {
        const id = item as EnergySectionId;
        seen.add(id);
        order.push(id);
      }
    }
  }
  for (const id of DEFAULT_ENERGY_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }

  const hidden = new Set<EnergySectionId>();
  if (Array.isArray(raw?.hidden)) {
    for (const item of raw.hidden) {
      if (typeof item === 'string' && VALID_SECTION_IDS.has(item)) {
        hidden.add(item as EnergySectionId);
      }
    }
  }
  return { order, hidden };
}

export function writeEnergyPrefs(
  preferences: Record<string, unknown> | undefined,
  next: { order: readonly EnergySectionId[]; hidden: ReadonlySet<EnergySectionId> }
): Record<string, unknown> {
  return {
    ...(preferences ?? {}),
    [ENERGY_PREF_KEY]: {
      order: [...next.order],
      hidden: [...next.hidden]
    }
  };
}

export function computeCustomPresetDates(preset: CustomRangePresetId, now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6);
  } else if (preset === 'last14') {
    start.setDate(start.getDate() - 13);
  } else if (preset === 'last30') {
    start.setDate(start.getDate() - 29);
  } else if (preset === 'thisMonth') {
    start.setDate(1);
  } else if (preset === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1);
    end.setMonth(end.getMonth(), 0);
  }
  return { start, end };
}

// ---------------------------------------------------------------------------
// Live HA -> StudioEnergySnapshot transformer
// ---------------------------------------------------------------------------

export function normalizeEnergyPeriod(period: EnergyHistoryPeriod): StudioPeriod {
  if (period === 'today' || period === 'yesterday') return 'day';
  if (period === '7d') return 'week';
  return period;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function pctDelta(cur: number, prev: number): number {
  if (!Number.isFinite(prev) || Math.abs(prev) < 0.05) return 0;
  return Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10;
}

function buildBatteryCurve(
  buckets: readonly TransformedEnergyBucket[],
  totals: TransformedEnergyTotals,
  liveSoc: number | null
): { series: StudioBatteryPoint[]; summary: StudioBatterySummary } {
  const active = buckets.filter(
    (b) => b.startMs <= Date.now() + 3600_000 && (b.homeConsumption > 0 || b.solar > 0 || b.batteryCharge > 0 || b.batteryDischarge > 0 || b.gridImport > 0)
  );
  const usedBuckets = active.length > 0 ? active : buckets.slice(0, 1);
  const chargedKwh = r2(totals.batteryCharge);
  const dischargedKwh = r2(totals.batteryDischarge);
  const nowPct = liveSoc !== null ? clamp(Math.round(liveSoc), 0, 100) : 50;
  // Estimate nominal battery capacity from period throughput (typical 10 kWh residential pack floor).
  const maxFlow = Math.max(10, chargedKwh, dischargedKwh);
  const seriesReversed: StudioBatteryPoint[] = [];
  let cursorPct = nowPct;

  for (let i = usedBuckets.length - 1; i >= 0; i--) {
    const b = usedBuckets[i];
    const socPct = Math.round(clamp(cursorPct, 5, 100));
    seriesReversed.push({
      label: b.label,
      socPct,
      chargeKwh: r2(b.batteryCharge),
      dischargeKwh: r2(b.batteryDischarge)
    });
    const deltaPct = ((b.batteryCharge - b.batteryDischarge) / maxFlow) * 100;
    cursorPct = clamp(cursorPct - deltaPct, 5, 100);
  }
  const series = seriesReversed.reverse();
  const socVals = series.map((p) => p.socPct);
  return {
    series,
    summary: {
      nowPct,
      minPct: socVals.length > 0 ? Math.min(...socVals) : nowPct,
      maxPct: socVals.length > 0 ? Math.max(...socVals) : nowPct,
      chargedKwh,
      dischargedKwh,
      netKwh: r2(chargedKwh - dischargedKwh),
      cyclesEst: r2((chargedKwh + dischargedKwh) / (2 * maxFlow))
    }
  };
}

function parseHuaweiImpact(states: Readonly<Record<string, HAState>>, periodSolarKwh: number): StudioImpactData | null {
  const treeEnt = states['sensor.energy_information_lifetime_equivalent_tree_planted'];
  const co2Ent = states['sensor.energy_information_lifetime_co2_emission_reduction'];
  const coalEnt = states['sensor.energy_information_lifetime_standard_coal_saved'];

  const validNum = (e: HAState | undefined): number | null => {
    if (!e || e.state === 'unavailable' || e.state === 'unknown') return null;
    const n = Number.parseFloat(e.state);
    return Number.isFinite(n) ? n : null;
  };

  const tRaw = validNum(treeEnt);
  const cRaw = validNum(co2Ent);
  const coalRaw = validNum(coalEnt);
  if (tRaw === null && cRaw === null && coalRaw === null) return null;

  const toTonnes = (val: number | null, ent: HAState | undefined): number => {
    if (val === null) return 0;
    const unit = (ent?.attributes?.unit_of_measurement ?? 'kg').toString().trim().toLowerCase();
    return unit === 't' || unit === 'ton' || unit === 'tons' ? val : val / 1000;
  };

  const co2Tonnes = r2(toTonnes(cRaw, co2Ent));
  const coalTonnes = r2(toTonnes(coalRaw, coalEnt));
  const trees = tRaw !== null ? Math.round(tRaw * 10) / 10 : 0;
  const lifetimeMwh = co2Tonnes > 0 ? r2(co2Tonnes / 0.4) : r2(periodSolarKwh / 1000);

  return { trees, co2Tonnes, coalTonnes, lifetimeMwh };
}

export interface LiveEnergySnapshotInput {
  period: EnergyHistoryPeriod;
  dateLabel: string;
  isAtFutureLimit: boolean;
  currency: string;
  energyModel: TransformedEnergyModel;
  realtime: InstantaneousPowerTelemetry;
  states: Readonly<Record<string, HAState>>;
  resolvedEntities?: Record<string, ResolvedEntity>;
  areas?: HAArea[];
  floors?: HAFloor[];
  compareEnabled: boolean;
  compareYear: number;
  availableYears: readonly number[];
  compareBuckets: readonly TransformedEnergyBucket[];
  compareTotals: TransformedEnergyTotals | null;
}

export function buildLiveEnergySnapshot(input: LiveEnergySnapshotInput): StudioEnergySnapshot {
  const { energyModel, realtime, states, compareEnabled, compareYear, availableYears, compareBuckets, compareTotals } = input;
  const normalizedPeriod = normalizeEnergyPeriod(input.period);

  const overviewModel = buildOverviewEnergyModel({
    period: input.period,
    dateLabel: input.dateLabel,
    currency: input.currency,
    hasSolar: energyModel.hasSolar,
    hasGrid: energyModel.hasGrid,
    hasBattery: energyModel.hasBattery,
    realtime,
    totals: energyModel.totals,
    financials: energyModel.financials,
    buckets: energyModel.buckets,
    powerBuckets: energyModel.powerBuckets,
    devices: energyModel.devices,
    untrackedKwh: energyModel.untrackedKwh,
    untrackedPercentage: energyModel.untrackedPercentage,
    resolvedEntities: input.resolvedEntities,
    areas: input.areas,
    floors: input.floors
  });

  // Expose every ranked device so DevicesA's "All (N)" button works beyond the top 5.
  const allConsumers: ProEnergyConsumer[] = [...energyModel.devices]
    .filter((d) => Number.isFinite(d.kwh) && d.kwh > 0.005)
    .sort((a, b) => b.kwh - a.kwh)
    .map((d) => {
      const sharePct =
        Number.isFinite(d.percentage) && d.percentage > 0
          ? Math.min(100, Math.round(d.percentage))
          : overviewModel.homeKwh > 0.05
          ? Math.min(100, Math.round((d.kwh / overviewModel.homeKwh) * 100))
          : 0;
      return { id: d.statId, name: d.name, kwh: d.kwh, kwhText: formatKwh(d.kwh), sharePct };
    });

  const model: ProOverviewEnergyModel = {
    ...overviewModel,
    topConsumers: allConsumers.length > 0 ? allConsumers : overviewModel.topConsumers
  };

  const batteryInfo = energyModel.hasBattery
    ? buildBatteryCurve(energyModel.buckets, energyModel.totals, realtime.batterySoC)
    : null;

  const gasSeries: StudioUtilityPoint[] = energyModel.buckets.map((b, idx) => ({
    label: b.label,
    value: r2(b.gasUsage),
    prevValue: r2(compareBuckets[idx]?.gasUsage ?? 0)
  }));
  const waterSeries: StudioUtilityPoint[] = energyModel.buckets.map((b, idx) => ({
    label: b.label,
    value: Math.round(b.waterUsage),
    prevValue: Math.round(compareBuckets[idx]?.waterUsage ?? 0)
  }));

  const financialSources: FinancialSourceBreakdown[] =
    energyModel.financials.sources.length > 0
      ? energyModel.financials.sources
      : [
          {
            name: 'Grid import',
            type: 'grid_import',
            energyVal: energyModel.totals.gridImport,
            unit: 'kWh',
            costOrCompensation: energyModel.financials.gridImportCost
          },
          ...(energyModel.hasSolar
            ? [
                {
                  name: 'Grid export credit',
                  type: 'grid_export' as const,
                  energyVal: energyModel.totals.gridExport,
                  unit: 'kWh',
                  costOrCompensation: -energyModel.financials.gridExportCompensation
                }
              ]
            : [])
        ];

  const impact = parseHuaweiImpact(states, energyModel.totals.solar);

  const comparison: StudioComparison | null =
    compareEnabled && compareTotals
      ? {
          year: compareYear,
          usedDeltaPct: pctDelta(energyModel.totals.homeConsumption, compareTotals.homeConsumption),
          solarDeltaPct: pctDelta(energyModel.totals.solar, compareTotals.solar),
          gridImportDeltaPct: pctDelta(energyModel.totals.gridImport, compareTotals.gridImport),
          netCostDeltaPct: 0,
          selfSuffDeltaPts: Math.round(energyModel.totals.selfSufficiencyPercentage - compareTotals.selfSufficiencyPercentage),
          prevUsedKwh: r2(compareTotals.homeConsumption),
          prevSolarKwh: r2(compareTotals.solar),
          prevNetCost: 0,
          prevSlotTotals: compareBuckets.map((b) => r2(b.homeConsumption))
        }
      : null;

  return {
    stateId: 'sunny',
    period: normalizedPeriod,
    dateOffset: 0,
    dateLabel: input.dateLabel,
    isAtFutureLimit: input.isAtFutureLimit,
    compareEnabled,
    compareYear,
    availableYears,
    model,
    batterySeries: batteryInfo?.series ?? [],
    batterySummary: batteryInfo?.summary ?? null,
    gasSeries,
    gasTotal: r2(energyModel.totals.gasUsage),
    gasUnit: energyModel.totals.gasUnit || 'm³',
    gasCost: r2(energyModel.financials.gasCost),
    hasGas: energyModel.hasGas,
    waterSeries,
    waterTotal: Math.round(energyModel.totals.waterUsage),
    waterUnit: energyModel.totals.waterUnit || 'L',
    waterCost: r2(energyModel.financials.waterCost),
    hasWater: energyModel.hasWater,
    financialSources,
    standingCharge: r2(energyModel.financials.standingCharge),
    impact,
    hasImpact: impact !== null,
    hasDevices: energyModel.hasDevices && model.topConsumers.length > 0,
    untrackedKwh: r2(energyModel.untrackedKwh),
    untrackedPct: Math.min(100, Math.max(0, Math.round(energyModel.untrackedPercentage))),
    comparison
  };
}
