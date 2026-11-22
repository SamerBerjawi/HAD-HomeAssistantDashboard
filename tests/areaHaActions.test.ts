import { describe, expect, it } from 'vitest';
import { parseRgb, tileActionCalls } from '@/pro/areas/ha/haTileActions';
import type { TileModel } from '@/pro/areas/tileTypes';
import { CAMERA_STATES, CAR_STATES, CLIMATE_STATES, COVER_STATES, FAN_STATES, LIGHT_STATES, LOCK_STATES, MEDIA_STATES, SCENE_STATES, SWITCH_STATES, VACUUM_STATES } from '@/pro/areas/studio/areaStates';

const pick = <M extends TileModel>(list: { id: string; model: M }[], id: string) => list.find((s) => s.id === id)!.model;
const first = (m: TileModel, a: Parameters<typeof tileActionCalls>[1], ...rest: [Parameters<typeof tileActionCalls>[2]?, Parameters<typeof tileActionCalls>[3]?]) => tileActionCalls(m, a, ...rest).calls[0];

describe('tile actions → HA services', () => {
  it('lights: toggle, brightness, white tone and colour', () => {
    const l = pick(LIGHT_STATES, 'warm');
    expect(first(l, { type: 'toggle' })).toMatchObject({ domain: 'light', service: 'toggle', entityId: l.entityId, optimistic: { state: 'off' } });
    expect(first(l, { type: 'brightness', pct: 140 })).toMatchObject({ service: 'turn_on', data: { brightness_pct: 100 }, optimistic: { attributes: { brightness: 255 } } });
    expect(first(l, { type: 'kelvin', kelvin: 2700.4 })).toMatchObject({ data: { color_temp_kelvin: 2700 } });
    expect(first(l, { type: 'color', rgb: 'rgb(255, 120, 60)' })).toMatchObject({ data: { rgb_color: [255, 120, 60] } });
    expect(tileActionCalls(l, { type: 'color', rgb: 'hsl(0 0% 0%)' }).calls).toEqual([]);
  });

  it('does nothing for an unavailable entity', () => {
    expect(tileActionCalls(pick(LIGHT_STATES, 'na'), { type: 'toggle' }).calls).toEqual([]);
  });

  it('switches and helpers toggle in their own domain', () => {
    const helper = pick(SWITCH_STATES, 'helper');
    expect(first(helper, { type: 'toggle' })).toMatchObject({ domain: helper.entityId.split('.')[0], service: 'toggle' });
  });

  it('fans: 0 % turns off, presets, swing and direction', () => {
    const f = pick(FAN_STATES, 'tower');
    expect(first(f, { type: 'percentage', pct: 0 })).toMatchObject({ service: 'turn_off' });
    expect(first(f, { type: 'percentage', pct: 66 })).toMatchObject({ service: 'set_percentage', data: { percentage: 66 } });
    expect(first(f, { type: 'preset', mode: 'Sleep' })).toMatchObject({ service: 'set_preset_mode', data: { preset_mode: 'Sleep' } });
    expect(first(f, { type: 'oscillate', on: true })).toMatchObject({ service: 'oscillate', data: { oscillating: true } });
    expect(first(f, { type: 'direction', dir: 'reverse' })).toMatchObject({ service: 'set_direction', data: { direction: 'reverse' } });
  });

  it('thermostats: target snapped to the step and range, mode, and on to the best mode', () => {
    const c = pick(CLIMATE_STATES, 'cool');
    expect(first(c, { type: 'target', value: 22.3 })).toMatchObject({ service: 'set_temperature', data: { temperature: c.step === 0.5 ? 22.5 : 22 } });
    expect(first(c, { type: 'target', value: 99 })?.data.temperature).toBe(c.max);
    expect(first(c, { type: 'hvac', mode: 'heat' })).toMatchObject({ service: 'set_hvac_mode', data: { hvac_mode: 'heat' } });
    const off = { ...c, isOn: false, mode: 'off', modes: ['off', 'cool', 'heat'] };
    expect(first(off, { type: 'toggle' })?.data).toEqual({ hvac_mode: 'heat' });
    expect(first(c, { type: 'toggle' })?.data).toEqual({ hvac_mode: 'off' });
  });

  it('covers: position, open, close, stop', () => {
    const c = pick(COVER_STATES, 'open');
    expect(first(c, { type: 'position', pct: 35 })).toMatchObject({ service: 'set_cover_position', data: { position: 35 } });
    expect(first(c, { type: 'cover', cmd: 'close' })).toMatchObject({ service: 'close_cover', optimistic: { state: 'closing' } });
    expect(first(c, { type: 'cover', cmd: 'stop' })).toMatchObject({ service: 'stop_cover' });
  });

  it('media: transport, shuffle and repeat flip, volume, mute, source', () => {
    const m = pick(MEDIA_STATES, 'playing');
    expect(first(m, { type: 'media', cmd: 'pause' })).toMatchObject({ service: 'media_pause', optimistic: { state: 'paused' } });
    expect(first(m, { type: 'media', cmd: 'next' })).toMatchObject({ service: 'media_next_track' });
    expect(first(m, { type: 'media', cmd: 'shuffle' })?.data).toEqual({ shuffle: !m.shuffle });
    expect(first(m, { type: 'media', cmd: 'repeat' })?.data).toEqual({ repeat: m.repeat ? 'off' : 'all' });
    expect(first(m, { type: 'volume', pct: 40 })).toMatchObject({ service: 'volume_set', data: { volume_level: 0.4 } });
    expect(first(m, { type: 'mute', on: true })).toMatchObject({ service: 'volume_mute', data: { is_volume_muted: true } });
    expect(first(m, { type: 'source', source: 'Spotify' })).toMatchObject({ service: 'select_source', data: { source: 'Spotify' } });
  });

  it('scenes run and hold; cameras switch live on the screen only', () => {
    const s = tileActionCalls(pick(SCENE_STATES, 'relax'), { type: 'activate' });
    expect(s.calls[0]).toMatchObject({ domain: 'scene', service: 'turn_on' });
    expect(s.local).toEqual({ isOn: true });
    const cam = pick(CAMERA_STATES, 'still');
    expect(tileActionCalls(cam, { type: 'toggle' })).toEqual({ calls: [], local: { live: true } });
  });

  it('locks: lock, unlock, open', () => {
    const l = pick(LOCK_STATES, 'locked');
    expect(first(l, { type: 'lock', cmd: 'unlock' })).toMatchObject({ domain: 'lock', service: 'unlock', optimistic: { state: 'unlocking' } });
    expect(first(l, { type: 'lock', cmd: 'open' })).toMatchObject({ service: 'open' });
    expect(first(l, { type: 'toggle' })).toMatchObject({ service: 'unlock' });
  });

  it('vacuums: picked rooms by area, else start; pause, dock, suction', () => {
    const v = { ...pick(VACUUM_STATES, 'docked'), target: ['Kitchen', 'Hallway'] };
    const ids: Record<string, string> = { Kitchen: 'kitchen', Hallway: 'hallway' };
    expect(first(v, { type: 'vacuum', cmd: 'start' }, {}, { areaIdOf: (r) => ids[r] ?? null })).toMatchObject({ service: 'clean_area', data: { cleaning_area_id: ['kitchen', 'hallway'] } });
    expect(first(v, { type: 'vacuum', cmd: 'start' }, {}, { areaIdOf: () => null })).toMatchObject({ service: 'start' });
    expect(tileActionCalls(v, { type: 'rooms', rooms: ['Office'] })).toEqual({ calls: [], local: { target: ['Office'] } });
    expect(tileActionCalls(v, { type: 'vacuum', cmd: 'dock' })).toMatchObject({ calls: [{ service: 'return_to_base' }], local: { target: [] } });
    expect(first(v, { type: 'fanSpeed', speed: 'Turbo' })).toMatchObject({ service: 'set_fan_speed', data: { fan_speed: 'Turbo' } });
  });

  it('cars call the entity that does it, and nothing when the car has none', () => {
    const car = pick(CAR_STATES, 'charging');
    const t = { lock: 'lock.model_y_doors', climate: 'climate.model_y', charge: 'switch.model_y_charger' };
    expect(first(car, { type: 'lock', cmd: 'unlock' }, t)).toMatchObject({ entityId: 'lock.model_y_doors', domain: 'lock', service: 'unlock' });
    expect(first(car, { type: 'charge', on: false }, t)).toMatchObject({ entityId: 'switch.model_y_charger', service: 'turn_off' });
    expect(first(car, { type: 'carClimate', on: true }, t)).toMatchObject({ entityId: 'climate.model_y', service: 'turn_on' });
    expect(tileActionCalls(car, { type: 'charge', on: true }, {}).calls).toEqual([]);
  });

  it('parses the colour formats tiles use', () => {
    expect(parseRgb('rgb(1 2 3)')).toEqual([1, 2, 3]);
    expect(parseRgb('#ff783c')).toEqual([255, 120, 60]);
    expect(parseRgb('nope')).toBeNull();
  });
});
