import { describe, expect, it } from 'vitest';
import type { TransformedEnergyBucket, TransformedEnergyModel, TransformedEnergyTotals } from '@/services/energy/types';
import type { HAState, ResolvedEntity } from '@/types';
import type { InstantaneousPowerTelemetry } from '@/utils/energyMath';
import {
  buildEnergyHome,
  deviceKind,
  findCo2Entity,
  findPriceEntity,
  fiveMinutePower,
  hourlyCo2,
  hourlyPrices,
  lifetimeImpact,
  priceLevel,
  socCurve,
  sunToday
} from '@/pro/lib/energyHomeLive';
import { axisSpanHours, dayAxisFraction } from '@/pro/lib/energyHome';

const DAY = new Date(2026, 10, 26).getTime();
const H = 3600_000;
const NOW = DAY + 12.5 * H;

const st = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): HAState => ({ entity_id, state, attributes });
const states = (...list: HAState[]) => Object.fromEntries(list.map((s) => [s.entity_id, s]));

const TOTALS: TransformedEnergyTotals = {
  solar: 0, gridImport: 0, gridExport: 0, batteryCharge: 0, batteryDischarge: 0,
  solarToHome: 0, solarToGrid: 0, solarToBattery: 0, gridToHome: 0, gridToBattery: 0, batteryToHome: 0, batteryToGrid: 0,
  homeConsumption: 0, selfSufficiencyPercentage: 0, selfConsumptionPercentage: 0,
  gasUsage: 0, gasUnit: 'm³', waterUsage: 0, waterUnit: 'L', solarForecastTotal: null
};

function bucket(startMs: number, p: Partial<TransformedEnergyBucket> = {}): TransformedEnergyBucket {
  return {
    startMs, endMs: startMs + H, label: '', isoDate: new Date(startMs).toISOString(),
    solar: 0, gridImport: 0, gridExport: 0, batteryCharge: 0, batteryDischarge: 0,
    solarToHome: 0, solarToGrid: 0, solarToBattery: 0, gridToHome: 0, gridToBattery: 0, batteryToHome: 0, batteryToGrid: 0,
    homeConsumption: 0, gasUsage: 0, waterUsage: 0, deviceValues: {}, solarForecast: null, ...p
  };
}

function model(p: Partial<TransformedEnergyModel> = {}): TransformedEnergyModel {
  return {
    totals: TOTALS,
    financials: { gridImportCost: 0, gridExportCompensation: 0, gasCost: 0, waterCost: 0, standingCharge: 0, netCost: 0, currency: '€', sources: [] },
    buckets: [], devices: [], untrackedKwh: 0, untrackedPercentage: 0,
    hasSolar: false, hasGrid: true, hasBattery: false, hasGas: false, hasWater: false, hasDevices: false,
    ...p
  };
}

const REALTIME: InstantaneousPowerTelemetry = {
  solarPowerKW: 0, gridPowerKW: 0.5, gridImportPowerKW: 0.5, gridExportPowerKW: 0, batteryPowerKW: 0, batteryDischargePowerKW: 0, batteryChargePowerKW: 0,
  batterySoC: null, homeConsumptionKW: 0.5, gasRate: null, waterRate: null
};

describe('prices', () => {
  it('reads Nordpool quarter-hours and cents into an hourly price', () => {
    const raw = Array.from({ length: 96 }, (_, k) => ({ start: new Date(DAY + k * 15 * 60_000).toISOString(), value: 20 + Math.floor(k / 4) }));
    const p = hourlyPrices(st('sensor.nordpool_kwh_fi', '32', { raw_today: raw, price_in_cents: true }), DAY);
    expect(p).toHaveLength(24);
    expect(p[0]).toBeCloseTo(0.2);
    expect(p[12]).toBeCloseTo(0.32);
  });

  it('reads a plain 24-value today list and Tibber-style objects', () => {
    expect(hourlyPrices(st('sensor.x', '0.1', { today: Array.from({ length: 24 }, (_, i) => i / 100) }), DAY)[5]).toBeCloseTo(0.05);
    const tibber = [{ total: 0.3, startsAt: new Date(DAY + 3 * H).toISOString() }];
    const p = hourlyPrices(st('sensor.y', '0.3', { today: tibber }), DAY);
    expect(p[3]).toBeCloseTo(0.3);
    expect(p[4]).toBeNull();
  });

  it('ranks the price now against the day, and needs enough hours to say', () => {
    const day = Array.from({ length: 24 }, (_, i) => i);
    expect(priceLevel(2, day)).toBe('low');
    expect(priceLevel(12, day)).toBe('normal');
    expect(priceLevel(22, day)).toBe('high');
    expect(priceLevel(5, [5, 6])).toBeNull();
  });

  it('prefers the price entity set in the Energy dashboard', () => {
    const s = states(st('sensor.nordpool_kwh', '1', { raw_today: [] }), st('sensor.my_price', '0.2'));
    expect(findPriceEntity(s, { gridImport: [{ statId: 'x', priceEntity: 'sensor.my_price' }], allPriceEntityIds: [] } as never)).toBe('sensor.my_price');
    expect(findPriceEntity(s, null)).toBe('sensor.nordpool_kwh');
  });
});

describe('sun.sun', () => {
  const sun = (state: string, rising: number, setting: number) => st('sun.sun', state, { next_rising: new Date(rising).toISOString(), next_setting: new Date(setting).toISOString(), elevation: 20 });
  it('gives today’s sunrise and sunset while the sun is up', () => {
    expect(sunToday(sun('above_horizon', DAY + 24 * H + 8 * H, DAY + 16 * H), NOW)).toMatchObject({ up: true, rising: DAY + 8 * H, setting: DAY + 16 * H });
  });
  it('keeps tomorrow’s sunrise after sunset and brings the sunset back to today', () => {
    expect(sunToday(sun('below_horizon', DAY + 32 * H, DAY + 40 * H), DAY + 20 * H)).toMatchObject({ up: false, rising: DAY + 32 * H, setting: DAY + 16 * H });
  });
  it('uses both as given before sunrise', () => {
    expect(sunToday(sun('below_horizon', DAY + 8 * H, DAY + 16 * H), DAY + 5 * H)).toMatchObject({ rising: DAY + 8 * H, setting: DAY + 16 * H });
  });
});

describe('carbon and battery', () => {
  it('finds Electricity Maps and bins its history by hour, carrying quiet hours', () => {
    expect(findCo2Entity(states(st('sensor.electricity_maps_co2_intensity', '140', { unit_of_measurement: 'gCO2eq/kWh' })))).toBe('sensor.electricity_maps_co2_intensity');
    const h = hourlyCo2([{ state: '200', timestamp: DAY + 0.5 * H }, { state: '100', timestamp: DAY + 2.2 * H }, { state: '120', timestamp: DAY + 2.8 * H }], DAY, DAY + 4.5 * H, 90);
    expect(h.slice(0, 6)).toEqual([200, 200, 110, 120, 90, null]);
  });

  it('walks the battery charge back from now', () => {
    const hours = [
      { batteryIn: 1, batteryOut: 0, future: false },
      { batteryIn: 0, batteryOut: 2, future: false },
      { batteryIn: 0, batteryOut: 0, future: true }
    ];
    expect(socCurve(hours, 50, 10)).toEqual([70, 50, null]);
    expect(socCurve(hours, null, 10)).toEqual([null, null, null]);
  });

  it('guesses a device’s kind from its name', () => {
    expect(deviceKind('Tesla Wall Connector')).toBe('ev');
    expect(deviceKind('Heat pump')).toBe('heat');
    expect(deviceKind('Dishwasher')).toBe('kitchen');
    expect(deviceKind('Washing machine')).toBe('laundry');
    expect(deviceKind('Aquarium')).toBe('other');
  });
});

describe('buildEnergyHome', () => {
  it('maps a grid-only home: no solar, battery or forecast, prices from the sensor', () => {
    const prices = Array.from({ length: 24 }, (_, i) => 0.1 + i / 100);
    const day = model({
      buckets: [bucket(DAY, { homeConsumption: 0.4, gridImport: 0.4 }), bucket(DAY + 12 * H, { homeConsumption: 0.6, gridImport: 0.6 })],
      totals: { ...TOTALS, homeConsumption: 1, gridImport: 1 },
      financials: { ...model().financials, gridImportCost: 0.3 },
      devices: [{ statId: 'sensor.fridge_energy', name: 'Fridge', kwh: 0.3, percentage: 30 }]
    });
    const resolved = {
      'sensor.fridge_energy': { entity_id: 'sensor.fridge_energy', domain: 'sensor', device_id: 'd1', attributes: {} },
      'sensor.fridge_power': { entity_id: 'sensor.fridge_power', domain: 'sensor', device_id: 'd1', attributes: { device_class: 'power', unit_of_measurement: 'W' } }
    } as unknown as Record<string, ResolvedEntity>;
    const home = buildEnergyHome({
      now: NOW, currency: '€', day, periods: {}, realtime: REALTIME,
      states: states(st('sensor.price', '0.22', { today: prices }), st('sensor.fridge_power', '120', { unit_of_measurement: 'W' })),
      resolvedEntities: resolved
    });
    expect(home.live).toEqual({ solar: null, home: 0.5, grid: 0.5, battery: null, soc: null });
    expect(home.battery).toBeNull();
    expect(home.forecast).toBeNull();
    expect(home.today).toHaveLength(24);
    expect(home.today[0]).toMatchObject({ home: 0.4, gridIn: 0.4, future: false, price: 0.1 });
    expect(home.today[13].future).toBe(true);
    expect(home.grid).toMatchObject({ price: 0.22, priceLevel: 'normal', co2: null });
    expect(home.totals.day).toMatchObject({ used: 1, cost: 0.3 });
    expect(home.totals.month).toEqual(home.totals.day);
    expect(home.devices).toEqual([{ id: 'sensor.fridge_energy', name: 'Fridge', kind: 'kitchen', power: 0.12, today: 0.3 }]);
    expect(home.gas).toBeNull();
    expect(home.impact).toBeNull();
  });

  it('maps solar, battery, forecast and the periods behind today', () => {
    const day = model({
      hasSolar: true,
      hasBattery: true,
      buckets: Array.from({ length: 24 }, (_, i) => bucket(DAY + i * H, { solar: i >= 8 && i <= 12 ? 2 : 0, batteryCharge: i === 11 ? 1 : 0, homeConsumption: 0.5, solarForecast: i >= 8 && i <= 15 ? 2 : 0 })),
      totals: { ...TOTALS, solar: 10, homeConsumption: 12, batteryCharge: 1, selfSufficiencyPercentage: 66.6, solarForecastTotal: 16 }
    });
    const week = model({ buckets: Array.from({ length: 7 }, (_, i) => bucket(DAY - (6 - i) * 24 * H, { homeConsumption: 10, gridImport: 5 })), totals: { ...TOTALS, homeConsumption: 70, gridImport: 35 }, financials: { ...model().financials, gridImportCost: 7 } });
    const home = buildEnergyHome({
      now: NOW, currency: '€', day, periods: { week },
      realtime: { ...REALTIME, solarPowerKW: 2.5, batteryPowerKW: -1, batterySoC: 64.4, homeConsumptionKW: 1, gridPowerKW: -0.5 },
      states: states(st('sensor.energy_production_tomorrow', '14.2', { unit_of_measurement: 'kWh' }))
    });
    expect(home.live).toEqual({ solar: 2.5, home: 1, grid: -0.5, battery: 1, soc: 64 });
    expect(home.battery).toEqual({ capacity: 10 });
    expect(home.today[12].soc).toBe(64);
    expect(home.today[11].soc).toBe(64);
    expect(home.today[10].soc).toBe(54);
    // Half of 12:00's 2 kWh plus 13:00–15:00.
    expect(home.forecast).toEqual({ today: 16, remaining: 7, tomorrow: 14.2 });
    expect(home.totals.day.selfSufficiency).toBe(67);
    expect(home.totals.week.used).toBe(70);
    expect(home.history.week).toHaveLength(7);
    expect(home.history.week[0]).toMatchObject({ used: 10, gridIn: 5, cost: 1 });
    expect(home.history.month).toEqual([]);
  });
});

describe('lifetimeImpact', () => {
  it('reads Huawei’s lifetime sensors in kg or tonnes', () => {
    expect(lifetimeImpact(states(st('sensor.energy_information_lifetime_co2_emission_reduction', '1430', { unit_of_measurement: 'kg' }), st('sensor.energy_information_lifetime_equivalent_tree_planted', '48.2')))).toEqual({ lifetimeKwh: 3575, co2AvoidedKg: 1430, trees: 48.2 });
    expect(lifetimeImpact(states(st('sensor.energy_information_lifetime_co2_emission_reduction', '1.43', { unit_of_measurement: 't' })))?.co2AvoidedKg).toBe(1430);
  });
  it('is left out without the sensors', () => {
    expect(lifetimeImpact(states(st('sensor.energy_information_lifetime_co2_emission_reduction', 'unavailable')))).toBeNull();
  });
});

describe('5-minute power (as HA draws today)', () => {
  const M5 = 5 * 60_000;
  const day5 = Array.from({ length: 288 }, (_, i) => bucket(DAY + i * M5, { endMs: DAY + (i + 1) * M5, solar: 0.25, homeConsumption: 0.1, gridImport: 0.05 }));

  it('turns kWh per five minutes into kW, and treats unfinished slots as future', () => {
    const p = fiveMinutePower(day5, DAY, NOW)!;
    expect(p).toHaveLength(288);
    expect(p[0]).toMatchObject({ at: DAY, solar: 3, home: 1.2, gridIn: 0.6, future: false });
    // 12:25 is over at 12:30 (now); 12:30 is still running.
    const i1225 = (12 * 60 + 25) / 5;
    expect(p[i1225].future).toBe(false);
    expect(p[i1225 + 1]).toMatchObject({ future: true, solar: 0 });
  });

  it('waits for a whole day of buckets, and the page model carries them', () => {
    expect(fiveMinutePower(day5.slice(0, 24), DAY, NOW)).toBeNull();
    expect(fiveMinutePower(undefined, DAY, NOW)).toBeNull();
    const home = buildEnergyHome({ now: NOW, currency: '€', day: model({ powerBuckets: day5 }), periods: {}, realtime: REALTIME, states: {} });
    expect(home.power).toHaveLength(288);
    expect(buildEnergyHome({ now: NOW, currency: '€', day: model(), periods: {}, realtime: REALTIME, states: {} }).power).toBeUndefined();
  });

  it('spans the axis 00:00–23:55 in 5-minute steps (00:00–23:00 hourly)', () => {
    const home = buildEnergyHome({ now: NOW, currency: '€', day: model({ powerBuckets: day5 }), periods: {}, realtime: REALTIME, states: {} });
    expect(axisSpanHours(home)).toBeCloseTo(23 + 55 / 60);
    expect(dayAxisFraction(home, DAY + (23 + 55 / 60) * H)).toBeCloseTo(1);
    const hourly = buildEnergyHome({ now: NOW, currency: '€', day: model(), periods: {}, realtime: REALTIME, states: {} });
    expect(axisSpanHours(hourly)).toBe(23);
  });
});
