import { describe, expect, it } from 'vitest';
import type { TransformedEnergyBucket } from '@/services/energy/types';
import type { HAArea, HAFloor, ResolvedEntity } from '@/types';
import {
  buildOverviewEnergyModel,
  energyViewForWidgetId,
  type OverviewEnergyInput
} from '../src/pro/lib/overviewEnergy';

function makeBucket(label: string, homeConsumption: number, solar: number, solarToHome: number): TransformedEnergyBucket {
  return {
    startMs: 1700000000000,
    endMs: 1700003600000,
    label,
    isoDate: '2026-11-18',
    solar,
    gridImport: Math.max(0, homeConsumption - solarToHome),
    gridExport: Math.max(0, solar - solarToHome),
    batteryCharge: 0,
    batteryDischarge: 0,
    solarToHome,
    solarToGrid: Math.max(0, solar - solarToHome),
    solarToBattery: 0,
    gridToHome: Math.max(0, homeConsumption - solarToHome),
    gridToBattery: 0,
    batteryToHome: 0,
    batteryToGrid: 0,
    homeConsumption,
    gasUsage: 0,
    waterUsage: 0,
    deviceValues: {},
    solarForecast: solar * 1.1
  };
}

describe('overviewEnergy', () => {
  it('maps all 8 energy widget IDs to their detail sheet focus', () => {
    expect(energyViewForWidgetId('power_flow')).toBe('power_flow');
    expect(energyViewForWidgetId('power_flow_chart')).toBe('power_flow');
    expect(energyViewForWidgetId('energy_usage')).toBe('energy_usage');
    expect(energyViewForWidgetId('energy_usage_chart')).toBe('energy_usage');
    expect(energyViewForWidgetId('solar_production')).toBe('solar_production');
    expect(energyViewForWidgetId('solar_production_chart')).toBe('solar_production');
    expect(energyViewForWidgetId('energy_flow')).toBe('energy_flow');
    expect(energyViewForWidgetId('energy_gauges')).toBe('energy_gauges');
    expect(energyViewForWidgetId('weather')).toBeNull();
  });

  it('computes HA conservation distribution flows, series, gauges, and Sankey hierarchy', () => {
    const resolvedEntities: Record<string, ResolvedEntity> = {
      'sensor.ev': {
        entity_id: 'sensor.ev',
        domain: 'sensor',
        name: 'EV Charger',
        state: '1.2',
        attributes: {},
        area_id: 'garage',
        device_id: null,
        floor_id: 'ground',
        resolutionSource: 'direct_entity_area',
        hidden: false,
        isDiagnostic: false
      }
    };
    const areas: HAArea[] = [{ area_id: 'garage', name: 'Garage', floor_id: 'ground' }];
    const floors: HAFloor[] = [{ floor_id: 'ground', name: 'Ground Floor', level: 0 }];

    const input: OverviewEnergyInput = {
      period: 'day',
      dateLabel: 'Today',
      currency: '€',
      hasSolar: true,
      hasGrid: true,
      hasBattery: true,
      realtime: {
        homeConsumptionKW: 1.7,
        solarPowerKW: 3.2,
        gridImportPowerKW: 0,
        gridExportPowerKW: 1.2,
        batteryChargePowerKW: 0.3,
        batteryDischargePowerKW: 0,
        batterySoC: 78
      },
      totals: {
        homeConsumption: 18.4,
        solar: 22.6,
        gridImport: 6.2,
        gridExport: 10.4,
        solarToHome: 12.2,
        solarToBattery: 2.4,
        solarToGrid: 8.0,
        selfConsumptionPercentage: 64,
        selfSufficiencyPercentage: 66,
        solarForecastTotal: 25.0
      },
      financials: {
        netCost: -0.85,
        gridImportCost: 1.65,
        gridExportCompensation: 2.5,
        currency: '€'
      },
      buckets: [
        makeBucket('08:00', 1.2, 0.8, 0.8),
        makeBucket('12:00', 1.6, 3.8, 1.6),
        makeBucket('16:00', 2.4, 1.1, 1.1)
      ],
      devices: [
        { statId: 'sensor.ev', name: 'EV Charger', kwh: 7.4, percentage: 40 },
        { statId: 'sensor.hvac', name: 'Heat Pump', kwh: 5.1, percentage: 28 },
        { statId: 'sensor.dryer', name: 'Heat Pump Dryer', kwh: 1.9, percentage: 10 }
      ],
      untrackedKwh: 4.0,
      resolvedEntities,
      areas,
      floors
    };

    const model = buildOverviewEnergyModel(input);

    expect(model.isExporting).toBe(true);
    expect(model.gridNetText).toBe('Exporting 1.2 kW');
    expect(model.selfSufficiencyPct).toBe(100);
    expect(model.autarkyTone).toBe('success');
    expect(model.sourceSplit.solarPct + model.sourceSplit.batteryPct + model.sourceSplit.gridPct).toBe(100);
    expect(model.distribution.solarToGridKW).toBeCloseTo(1.2, 2);
    expect(model.distribution.solarToBatteryKW).toBeCloseTo(0.3, 2);
    expect(model.distribution.solarToHomeKW).toBeCloseTo(1.7, 2);

    expect(model.homeKwhText).toBe('18.4 kWh');
    expect(model.solarForecastPct).toBe(90);
    expect(model.netCostText).toBe('-€0.85 credit');
    expect(model.netGridRatio).toBeLessThan(0);

    expect(model.electricitySeries).toHaveLength(3);
    expect(model.solarForecastSeries).toHaveLength(3);
    expect(model.powerSourcesSeries).toHaveLength(3);
    expect(model.topConsumers[0].name).toBe('EV Charger');
    expect(model.energyFlowFull.nodes.some((n) => n.label === 'Garage')).toBe(true);
    expect(model.energyFlowFull.nodes.some((n) => n.label === 'Untracked consumption')).toBe(true);
  });

  it('returns empty chart series cleanly without fabricating curves when buckets are empty', () => {
    const model = buildOverviewEnergyModel({
      period: 'day',
      realtime: {
        homeConsumptionKW: 1.5,
        solarPowerKW: 0.6,
        gridImportPowerKW: 0.9,
        gridExportPowerKW: 0,
        batteryChargePowerKW: 0,
        batteryDischargePowerKW: 0,
        batterySoC: null
      },
      buckets: [],
      powerBuckets: []
    });

    expect(model.isExporting).toBe(false);
    expect(model.gridNetText).toBe('Importing 900 W');
    expect(model.selfSufficiencyPct).toBe(40);
    expect(model.autarkyTone).toBe('warning');
    expect(model.sourceSplit).toEqual({ solarPct: 40, batteryPct: 0, gridPct: 60 });
    expect(model.powerSourcesSeries).toEqual([]);
    expect(model.electricitySeries).toEqual([]);
    expect(model.solarForecastSeries).toEqual([]);
    expect(model.energyFlowCompact.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('draws the whole local day from 5-minute buckets: 10-minute points, midnight to midnight', () => {
    const midnight = new Date(2026, 10, 18).getTime();
    // Data until 11:55; later buckets of the day are empty (not yet happened).
    const powerBuckets = Array.from({ length: 288 }, (_, i) => {
      const b = makeBucket(`${i}`, i < 144 ? 0.1 : 0, i < 144 ? 0.05 : 0, i < 144 ? 0.05 : 0);
      return { ...b, startMs: midnight + i * 5 * 60 * 1000, endMs: midnight + (i + 1) * 5 * 60 * 1000 };
    });
    const model = buildOverviewEnergyModel({
      period: 'day',
      realtime: { homeConsumptionKW: 1.2, solarPowerKW: 0.4, gridImportPowerKW: 0.8, gridExportPowerKW: 0, batteryChargePowerKW: 0, batteryDischargePowerKW: 0, batterySoC: null },
      buckets: [],
      powerBuckets
    });
    const series = model.powerSourcesSeries;
    expect(series).toHaveLength(144);
    expect(series[0].label).toBe('00:00');
    expect(series[1].label).toBe('00:10');
    expect(series[143].label).toBe('23:50');
    expect(series[0].home).toBeCloseTo(1.2, 2); // 0.1 kWh per 5 minutes = 1.2 kW
    expect(series[71].future).toBeUndefined();
    expect(series[72].future).toBe(true);
  });

  it('stacks all the solar produced above zero, and what charged the battery below (as HA does)', () => {
    const midnight = new Date(2026, 10, 18).getTime();
    const powerBuckets = [0, 1].map((i) => ({
      ...makeBucket(`${i}`, 0.05, 0.13, 0.05),
      gridExport: 0,
      solarToGrid: 0,
      batteryCharge: 0.08,
      solarToBattery: 0.08,
      startMs: midnight + 12 * 3600 * 1000 + i * 5 * 60 * 1000
    }));
    const model = buildOverviewEnergyModel({
      period: 'day',
      realtime: { homeConsumptionKW: 0.6, solarPowerKW: 1.56, gridImportPowerKW: 0, gridExportPowerKW: 0, batteryChargePowerKW: 0.96, batteryDischargePowerKW: 0, batterySoC: null },
      buckets: [],
      powerBuckets
    });
    const noon = model.powerSourcesSeries.find((d) => d.label === '12:00')!;
    expect(noon.solar).toBeCloseTo(1.56, 2); // all of it, not just the 0.6 kW the home used
    expect(noon.batteryCharge).toBeCloseTo(0.96, 2);
    expect(noon.solar + noon.batteryDischarge + noon.gridImport - noon.batteryCharge - noon.gridExport).toBeCloseTo(noon.home, 2);
  });
});
