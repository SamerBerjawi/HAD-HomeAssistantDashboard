import { describe, expect, it } from 'vitest';
import { generateSyntheticStatistics } from '@/services/haEnergyStatistics';

describe('demo energy statistics', () => {
  it('treats appliance energy sensors as kWh, not water or gas volume (audit P1, 2026-11-19)', () => {
    const start = '2026-11-19T00:00:00.000Z';
    const end = '2026-11-19T23:59:59.000Z';
    const res = generateSyntheticStatistics(['sensor.water_heater_energy', 'sensor.gas_boiler_energy', 'sensor.water_meter'], start, end, 'hour');
    const day = (id: string) => res[id].reduce((sum, b) => sum + (b.change ?? 0), 0);
    expect(day('sensor.water_heater_energy')).toBeLessThan(10);
    expect(day('sensor.gas_boiler_energy')).toBeLessThan(10);
    // A real water meter still gets litres.
    expect(day('sensor.water_meter')).toBeGreaterThan(100);
  });
});
