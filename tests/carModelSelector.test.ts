import { describe, expect, it } from 'vitest';
import { createCarModelSelector, type CarSettings } from '@/pro/lib/carModelSelector';

const settings: CarSettings = { isDemo: false };
const soc = (state: string) => ({ entity_id: 'sensor.my_car_battery_level', state, attributes: { unit_of_measurement: '%' } });
const base = () => ({
  'sensor.my_car_battery_level': soc('64'),
  'light.kitchen': { entity_id: 'light.kitchen', state: 'off', attributes: {} }
});

describe('car model selector', () => {
  it('returns the same model when an unrelated entity changes', () => {
    const select = createCarModelSelector();
    const states = base();
    const zones: never[] = [];
    const first = select({ states, resolvedZones: zones }, settings);
    const next = { ...states, 'light.kitchen': { entity_id: 'light.kitchen', state: 'on', attributes: {} } };
    expect(select({ states: next, resolvedZones: zones }, settings)).toBe(first);
  });

  it('rebuilds when an entity the car reads changes', () => {
    const select = createCarModelSelector();
    const states = base();
    const zones: never[] = [];
    const first = select({ states, resolvedZones: zones }, settings);
    const next = { ...states, 'sensor.my_car_battery_level': soc('80') };
    const second = select({ states: next, resolvedZones: zones }, settings);
    expect(second).not.toBe(first);
    expect(JSON.stringify(second)).toContain('80');
  });

  it('looks again when an entity is added', () => {
    const select = createCarModelSelector();
    const zones: never[] = [];
    const first = select({ states: { 'light.kitchen': base()['light.kitchen'] }, resolvedZones: zones }, settings);
    const second = select({ states: base(), resolvedZones: zones }, settings);
    expect(JSON.stringify(second)).not.toBe(JSON.stringify(first));
  });

  it('rebuilds when the car settings change', () => {
    const select = createCarModelSelector();
    const states = base();
    const zones: never[] = [];
    const first = select({ states, resolvedZones: zones }, settings);
    expect(select({ states, resolvedZones: zones }, { ...settings, targetSocDefault: 90 })).not.toBe(first);
  });
});
