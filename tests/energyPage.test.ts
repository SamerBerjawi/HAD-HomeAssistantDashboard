import { describe, expect, it } from 'vitest';
import type { TransformedEnergyBucket, TransformedEnergyModel } from '../src/services/energy/types';
import {
  buildLiveEnergySnapshot,
  computeCustomPresetDates,
  DEFAULT_ENERGY_ORDER,
  readEnergyPrefs,
  writeEnergyPrefs
} from '../src/pro/lib/energyPage';

function makeBucket(hour: number, overrides: Partial<TransformedEnergyBucket> = {}): TransformedEnergyBucket {
  const start = new Date(2026, 10, 23, hour, 0, 0, 0).getTime();
  return {
    startMs: start,
    endMs: start + 3600_000,
    label: `${String(hour).padStart(2, '0')}:00`,
    isoDate: new Date(start).toISOString(),
    solar: 0,
    gridImport: 0.4,
    gridExport: 0,
    batteryCharge: 0,
    batteryDischarge: 0,
    solarToHome: 0,
    solarToGrid: 0,
    solarToBattery: 0,
    gridToHome: 0.4,
    gridToBattery: 0,
    batteryToHome: 0,
    batteryToGrid: 0,
    homeConsumption: 0.4,
    gasUsage: 0.1,
    waterUsage: 20,
    deviceValues: {},
    solarForecast: null,
    ...overrides
  };
}

describe('energyPage preferences', () => {
  it('returns default order and empty hidden set when preferences are missing', () => {
    const prefs = readEnergyPrefs(undefined);
    expect(prefs.order).toEqual(DEFAULT_ENERGY_ORDER);
    expect(prefs.hidden.size).toBe(0);
  });

  it('preserves valid custom order, appends missing sections, and filters invalid IDs', () => {
    const prefs = readEnergyPrefs({
      proEnergy: {
        order: ['costs', 'invalid_section', 'live', 'costs'],
        hidden: ['impact', 'nope']
      }
    });
    expect(prefs.order[0]).toBe('costs');
    expect(prefs.order[1]).toBe('live');
    expect(prefs.order).toHaveLength(DEFAULT_ENERGY_ORDER.length);
    expect(prefs.order).toContain('battery');
    expect([...prefs.hidden]).toEqual(['impact']);
  });

  it('round-trips through writeEnergyPrefs without clobbering sibling preferences', () => {
    const updated = writeEnergyPrefs(
      { proRooms: { cardSize: 'large' } },
      { order: ['live', 'period', 'costs'], hidden: new Set(['utilities']) }
    );
    expect((updated as { proRooms?: { cardSize: string } }).proRooms?.cardSize).toBe('large');
    const back = readEnergyPrefs(updated);
    expect(back.order.slice(0, 3)).toEqual(['live', 'period', 'costs']);
    expect(back.hidden.has('utilities')).toBe(true);
  });
});

describe('energyPage custom date presets', () => {
  it('computes accurate inclusive spans for all 5 presets', () => {
    const now = new Date(2026, 10, 23, 15, 30, 0);
    const l7 = computeCustomPresetDates('last7', now);
    expect(l7.start.getDate()).toBe(17);
    expect(l7.end.getDate()).toBe(23);

    const lm = computeCustomPresetDates('lastMonth', now);
    expect(lm.start.getMonth()).toBe(9);
    expect(lm.start.getDate()).toBe(1);
    expect(lm.end.getMonth()).toBe(9);
    expect(lm.end.getDate()).toBe(31);
  });
});

describe('buildLiveEnergySnapshot', () => {
  const baseModel: TransformedEnergyModel = {
    totals: {
      solar: 14.2,
      gridImport: 4.5,
      gridExport: 5.1,
      batteryCharge: 4.0,
      batteryDischarge: 2.2,
      solarToHome: 5.1,
      solarToGrid: 5.1,
      solarToBattery: 4.0,
      gridToHome: 4.5,
      gridToBattery: 0,
      batteryToHome: 2.2,
      batteryToGrid: 0,
      homeConsumption: 11.8,
      selfSufficiencyPercentage: 62,
      selfConsumptionPercentage: 64,
      gasUsage: 1.8,
      gasUnit: 'm³',
      waterUsage: 240,
      waterUnit: 'L',
      solarForecastTotal: 15.0
    },
    financials: {
      gridImportCost: 1.44,
      gridExportCompensation: 0.46,
      gasCost: 2.1,
      waterCost: 0.58,
      standingCharge: 0.45,
      netCost: 4.11,
      currency: '€',
      sources: []
    },
    buckets: [
      makeBucket(8, { solar: 1.5, solarToHome: 0.8, solarToBattery: 0.7, batteryCharge: 0.7, homeConsumption: 0.8, gridToHome: 0, gridImport: 0 }),
      makeBucket(12, { solar: 4.2, solarToHome: 1.2, solarToBattery: 1.5, batteryCharge: 1.5, gridExport: 1.5, solarToGrid: 1.5, homeConsumption: 1.2, gridToHome: 0, gridImport: 0 }),
      makeBucket(19, { solar: 0, batteryDischarge: 1.1, batteryToHome: 1.1, gridToHome: 0.5, gridImport: 0.5, homeConsumption: 1.6 })
    ],
    devices: [
      { statId: 'sensor.heat_pump', name: 'Heat pump', kwh: 3.1, percentage: 26 },
      { statId: 'sensor.ev', name: 'EV', kwh: 2.5, percentage: 21 },
      { statId: 'sensor.kitchen', name: 'Kitchen', kwh: 1.4, percentage: 12 },
      { statId: 'sensor.laundry', name: 'Laundry', kwh: 0.9, percentage: 8 },
      { statId: 'sensor.office', name: 'Office', kwh: 0.7, percentage: 6 },
      { statId: 'sensor.tv', name: 'TV', kwh: 0.5, percentage: 4 }
    ],
    untrackedKwh: 2.7,
    untrackedPercentage: 23,
    hasSolar: true,
    hasGrid: true,
    hasBattery: true,
    hasGas: true,
    hasWater: true,
    hasDevices: true
  };

  const realtime = {
    solarPowerKW: 3.2,
    gridPowerKW: -1.1,
    gridImportPowerKW: 0,
    gridExportPowerKW: 1.1,
    batteryPowerKW: -0.9,
    batteryDischargePowerKW: 0,
    batteryChargePowerKW: 0.9,
    batterySoC: 72,
    homeConsumptionKW: 1.2,
    gasRate: null,
    waterRate: null
  };

  it('preserves all 6 tracked devices, reconstructs battery curve anchored at live SoC, and converts Huawei kg sensors', () => {
    const snap = buildLiveEnergySnapshot({
      period: 'day',
      dateLabel: 'Today',
      isAtFutureLimit: true,
      currency: '€',
      energyModel: baseModel,
      realtime,
      states: {
        'sensor.energy_information_lifetime_equivalent_tree_planted': {
          entity_id: 'sensor.energy_information_lifetime_equivalent_tree_planted',
          state: '48.2',
          attributes: { unit_of_measurement: 'trees' }
        },
        'sensor.energy_information_lifetime_co2_emission_reduction': {
          entity_id: 'sensor.energy_information_lifetime_co2_emission_reduction',
          state: '1428.6',
          attributes: { unit_of_measurement: 'kg' }
        },
        'sensor.energy_information_lifetime_standard_coal_saved': {
          entity_id: 'sensor.energy_information_lifetime_standard_coal_saved',
          state: '573.4',
          attributes: { unit_of_measurement: 'kg' }
        }
      },
      compareEnabled: true,
      compareYear: 2025,
      availableYears: [2025, 2024],
      compareBuckets: [makeBucket(8, { homeConsumption: 1.0 })],
      compareTotals: { ...baseModel.totals, homeConsumption: 10.0, solar: 12.0, gridImport: 5.0, selfSufficiencyPercentage: 55 }
    });

    expect(snap.model.topConsumers).toHaveLength(6);
    expect(snap.batterySummary?.nowPct).toBe(72);
    expect(snap.batterySeries[snap.batterySeries.length - 1]?.socPct).toBe(72);
    expect(snap.hasImpact).toBe(true);
    expect(snap.impact?.trees).toBe(48.2);
    expect(snap.impact?.co2Tonnes).toBe(1.43);
    expect(snap.impact?.coalTonnes).toBe(0.57);
    expect(snap.comparison?.usedDeltaPct).toBe(18);
    expect(snap.comparison?.selfSuffDeltaPts).toBe(7);
  });

  it('hides impact when Huawei sensors are absent', () => {
    const snap = buildLiveEnergySnapshot({
      period: 'week',
      dateLabel: 'This week',
      isAtFutureLimit: true,
      currency: '€',
      energyModel: baseModel,
      realtime,
      states: {},
      compareEnabled: false,
      compareYear: 2025,
      availableYears: [2025],
      compareBuckets: [],
      compareTotals: null
    });
    expect(snap.hasImpact).toBe(false);
    expect(snap.impact).toBeNull();
    expect(snap.period).toBe('week');
  });
});
