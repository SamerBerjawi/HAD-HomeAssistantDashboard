import { describe, expect, it } from 'vitest';
import { isNight, lastMotionAt, roomAir, roomMood, type MoodInput } from '@/pro/lib/roomsInsights';

const e = (entity_id: string, state: string, attributes: Record<string, unknown> = {}, last_changed?: string) => ({ entity_id, domain: entity_id.split('.')[0], state, attributes, last_changed });

describe('roomsInsights', () => {
  it('reads air from sensors and from an air monitor, worst level wins', () => {
    expect(roomAir([e('sensor.office_co2', '1200', { device_class: 'carbon_dioxide' })])).toMatchObject({ co2: 1200, level: 'fair' });
    expect(roomAir([e('sensor.bedroom_air_quality', '18', { device_class: 'aqi', co2: 480, pm25: 40 })])).toMatchObject({ aqi: 18, co2: 480, pm25: 40, level: 'poor' });
    expect(roomAir([e('sensor.temp', '21', { device_class: 'temperature' })]).level).toBeNull();
  });

  it('knows when motion was last seen', () => {
    const motion = (state: string, t: string) => e('binary_sensor.m', state, { device_class: 'motion' }, t);
    expect(lastMotionAt([motion('off', '2026-11-20T10:00:00Z'), motion('off', '2026-11-20T12:00:00Z')])).toBe(Date.parse('2026-11-20T12:00:00Z'));
    expect(lastMotionAt([motion('on', '2026-11-20T12:00:00Z')])).toBeNull();
  });

  it('says how a room is, most important first', () => {
    const base: MoodInput = {
      temperature: 21,
      humidity: 45,
      lightsOn: 0,
      occupied: false,
      openContacts: 0,
      thermostatAction: null,
      air: { co2: null, aqi: null, pm25: null, level: null },
      lastMotion: null
    };
    const now = Date.parse('2026-11-20T15:00:00Z');
    expect(roomMood({ ...base, openContacts: 1, thermostatAction: 'heating', temperature: 27 })).toEqual({ label: 'Open while heating', tone: 'warn' });
    expect(roomMood({ ...base, air: { co2: 1600, aqi: null, pm25: null, level: 'poor' } })?.label).toBe('Stuffy, open a window');
    expect(roomMood({ ...base, temperature: 26.5 })?.label).toBe('Too warm');
    expect(roomMood({ ...base, humidity: 70 })?.label).toBe('Humid');
    expect(roomMood({ ...base, occupied: true, lightsOn: 2 })).toEqual({ label: 'Cozy', tone: 'good' });
    expect(roomMood({ ...base, lastMotion: now - 3.5 * 3_600_000 }, now)?.label).toBe('Empty for 3 h');
    expect(roomMood({ ...base, lastMotion: now - 30 * 3_600_000 }, now)?.label).toBe('Empty for 1 d');
    expect(roomMood(base, now)).toBeNull();
  });

  it('tells night from day', () => {
    expect(isNight('below_horizon')).toBe(true);
    expect(isNight('above_horizon', new Date('2026-11-20T23:00:00'))).toBe(false);
    expect(isNight(undefined, new Date('2026-11-20T21:00:00'))).toBe(true);
    expect(isNight(undefined, new Date('2026-11-20T12:00:00'))).toBe(false);
  });
});
