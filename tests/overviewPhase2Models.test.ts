import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import { buildThermostatModel, stepTarget, thermostatAction } from '@/pro/lib/overviewThermostat';
import { buildScenesModel, CURRENT_WINDOW_MS, sceneMood } from '@/pro/lib/overviewScenes';

const climate = (id: string, state: string, attributes: Record<string, unknown>) => ({ entity_id: `climate.${id}`, domain: 'climate', name: id, state, attributes }) as unknown as ResolvedEntity;
const scene = (id: string, name: string, state: string) => ({ entity_id: `scene.${id}`, domain: 'scene', name, state, attributes: {} }) as unknown as ResolvedEntity;

describe('thermostat model (Phase 2)', () => {
  it('uses hvac_action when given, else guesses from mode and temperatures', () => {
    expect(thermostatAction('cool', 'cooling', 22, 21)).toBe('cooling');
    expect(thermostatAction('heat', undefined, 18, 21)).toBe('heating');
    expect(thermostatAction('heat', undefined, 21, 21)).toBe('idle');
    expect(thermostatAction('off', undefined, 21, 21)).toBe('off');
    expect(thermostatAction('fan_only', undefined, null, null)).toBe('fan');
  });

  it('picks an active thermostat first and reads range, unit and limits', () => {
    const m = buildThermostatModel([
      climate('bedroom', 'heat', { current_temperature: 21, temperature: 21, hvac_action: 'idle' }),
      climate('living', 'cool', { current_temperature: 23.5, temperature: 21, hvac_action: 'cooling', current_humidity: 48, min_temp: 16, max_temp: 30 })
    ]);
    expect(m.primary?.entityId).toBe('climate.living');
    expect(m.activeCount).toBe(1);
    expect(m.primary).toMatchObject({ current: 23.5, target: 21, humidity: 48, min: 16, max: 30, unit: '°C', step: 0.5 });
  });

  it('steps the target on the device step and keeps it in range', () => {
    const [t] = buildThermostatModel([climate('x', 'heat', { temperature: 29.5, max_temp: 30 })]).items;
    expect(stepTarget(t, 1)).toBe(30);
    expect(stepTarget({ ...t, target: 30 }, 1)).toBe(30);
    expect(stepTarget(t, -1)).toBe(29);
  });

  it('handles no thermostats', () => {
    expect(buildThermostatModel([])).toEqual({ items: [], primary: null, activeCount: 0, totalCount: 0 });
  });
});

describe('scenes model (Phase 2)', () => {
  const now = Date.parse('2026-11-19T20:00:00Z');
  it('marks the most recent scene current only within the window', () => {
    const m = buildScenesModel([scene('movie', 'Cozy Movie Night', '2026-11-19T19:30:00Z'), scene('focus', 'Bright Work Focus', '2026-11-19T09:00:00Z'), scene('never', 'Party', 'unknown')], now);
    expect(m.current?.entityId).toBe('scene.movie');
    expect(m.items.find((i) => i.entityId === 'scene.never')?.lastActivated).toBeNull();
    const old = buildScenesModel([scene('focus', 'Focus', new Date(now - CURRENT_WINDOW_MS - 1000).toISOString())], now);
    expect(old.current).toBeNull();
  });

  it('gives each scene a mood from its name', () => {
    expect(sceneMood('Cozy Movie Night')).toBe('cinema');
    expect(sceneMood('All Lights Off')).toBe('night');
    expect(sceneMood('Relaxing Dinner')).toBe('dining');
    expect(sceneMood('Party & Celebration')).toBe('party');
    expect(sceneMood('Something')).toBe('other');
  });
});
