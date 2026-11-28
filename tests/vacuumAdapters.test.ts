import { describe, expect, it } from 'vitest';
import type { HAEntityRegistryEntry, HAState } from '@/types';
import { activityOf, cleanerSources, roomNames, roomsOf, supplyState } from '@/pro/lib/vacuums/adapters';
import { chores, statusWords } from '@/pro/lib/vacuums/cleaner';

const st = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): HAState => ({ entity_id, state, attributes, last_changed: '2026-11-28T09:00:00Z', last_updated: '2026-11-28T09:00:00Z' }) as HAState;
const reg = (entity_id: string, platform: string, device_id: string): HAEntityRegistryEntry => ({ entity_id, platform, device_id });

function ctx(list: [string, string, Record<string, unknown>?][], platform: string, device: string) {
  const states: Record<string, HAState> = {};
  const registry = list.map(([id, s, a]) => {
    states[id] = st(id, s, a);
    return reg(id, platform, device);
  });
  return { states, registry, devices: [{ id: device, name: device === 'd1' ? 'X60 Pro Ultra Complete' : 'Basement stick vacuum', manufacturer: device === 'd1' ? 'Dreame' : 'Samsung' }] as never[], zones: [], now: Date.parse('2026-11-28T10:00:00Z') };
}

const P = 'x60_pro_ultra_complete';
const dreame = (over: Record<string, string> = {}) =>
  ctx(
    [
      [`vacuum.${P}`, over.vacuum ?? 'docked', { supported_features: 8192 | 4 | 16 | 512, rooms: { 'Map 1': [{ id: 1, name: 'Kitchen' }, { id: 2, name: 'Hall' }] }, suction_level: 'standard' }],
      [`sensor.${P}_status`, over.status ?? 'charging_completed'],
      [`sensor.${P}_error`, over.error ?? 'no_error'],
      [`sensor.${P}_battery_level`, '100', { unit_of_measurement: '%' }],
      [`binary_sensor.${P}_charging_state`, 'off'],
      [`sensor.${P}_self_wash_base_status`, over.base ?? 'idle'],
      [`sensor.${P}_clean_water_tank_status`, over.clean ?? 'installed'],
      [`sensor.${P}_dirty_water_tank_status`, over.dirty ?? 'installed'],
      [`sensor.${P}_dust_bag_status`, 'installed'],
      [`sensor.${P}_detergent_status`, 'installed'],
      [`sensor.${P}_low_water_warning`, over.lowWater ?? 'no_warning'],
      [`sensor.${P}_main_brush_left`, '72', { unit_of_measurement: '%' }],
      [`sensor.${P}_main_brush_time_left`, '216', { unit_of_measurement: 'h' }],
      [`sensor.${P}_side_brush_left`, '6', { unit_of_measurement: '%' }],
      [`sensor.${P}_filter_left`, '41', { unit_of_measurement: '%' }],
      [`sensor.${P}_cleaned_area`, '34', { unit_of_measurement: 'm²' }],
      [`sensor.${P}_cleaning_time`, '41', { unit_of_measurement: 'min' }],
      [`sensor.${P}_total_cleaned_area`, '4812'],
      [`sensor.${P}_cleaning_count`, '96'],
      [`switch.${P}_carpet_boost`, 'on', { friendly_name: 'X60 Carpet Boost' }]
    ],
    'dreame_vacuum',
    'd1'
  );

describe('vacuum adapters · Dreame', () => {
  it('reads the robot, its station, parts, lifetime and switches', () => {
    const [s] = cleanerSources(dreame());
    const c = s.cleaner;
    expect(c.kind).toBe('robot');
    expect(c.activity).toBe('docked');
    expect(c.battery).toBe(100);
    expect(c.rooms.map((r) => [r.segment, r.name, r.floor])).toEqual([['1', 'Kitchen', null], ['2', 'Hall', null]]);
    expect(c.floor).toBeNull();
    expect(c.station?.supplies.map((x) => x.id)).toEqual(['clean', 'dirty', 'dust', 'detergent']);
    expect(c.parts.map((p) => [p.id, p.percent, p.hoursLeft])).toEqual([
      ['main', 72, 216],
      ['side', 6, null],
      ['filter', 41, null]
    ]);
    expect(c.lifetime).toMatchObject({ areaM2: 4812, count: 96 });
    expect(c.settings).toHaveLength(1);
    expect(c.actions).toEqual(expect.arrayContaining(['start', 'pause', 'dock', 'locate', 'setting']));
    expect(statusWords(c).word).toBe('Ready to clean');
  });

  it('shows the station’s work and chores, and errors over everything', () => {
    expect(cleanerSources(dreame({ base: 'washing' }))[0].cleaner.activity).toBe('washing');
    const chore = cleanerSources(dreame({ dirty: 'not_installed_or_full', lowWater: 'low_water' }))[0].cleaner;
    expect(chores(chore).map((x) => x.todo)).toEqual(['Empty dirty water', 'Refill clean water']);
    const err = cleanerSources(dreame({ vacuum: 'error', error: 'main_brush_tangled' }))[0].cleaner;
    expect(err.activity).toBe('error');
    expect(err.error).toBe('Main brush tangled');
  });

  it('sends the right services', () => {
    const [s] = cleanerSources(dreame());
    expect(s.calls({ type: 'start' })[0]).toMatchObject({ domain: 'vacuum', service: 'start', entityId: `vacuum.${P}` });
    expect(s.calls({ type: 'dock' })[0].service).toBe('return_to_base');
    expect(s.calls({ type: 'setting', id: `switch.${P}_carpet_boost`, on: false })[0]).toMatchObject({ domain: 'switch', service: 'turn_off' });
    expect(s.calls({ type: 'wash' })).toEqual([]);
    const [kitchen, hall] = s.cleaner.rooms;
    expect(s.calls({ type: 'rooms', ids: [hall.id, kitchen.id] })[0]).toMatchObject({ domain: 'dreame_vacuum', service: 'vacuum_clean_segment', data: { segments: [2, 1] } });
  });
});

describe('vacuum adapters · Samsung stick', () => {
  const S = 'basement_stick_vacuum';
  const stick = (inStation: string, full = 'off') =>
    ctx(
      [
        [`binary_sensor.${S}_stick_cleaner_in_station`, inStation],
        [`binary_sensor.${S}_dust_bag_full`, full],
        [`binary_sensor.${S}_charging`, 'on'],
        [`sensor.${S}_battery`, '64', { unit_of_measurement: '%' }],
        [`sensor.${S}_energy`, '18600', { unit_of_measurement: 'Wh' }],
        [`sensor.${S}_dust_bag_cycles`, '23'],
        [`sensor.${S}_last_emptied`, '2026-11-28T08:50:00Z'],
        [`switch.${S}_empty_dustbin`, 'off']
      ],
      'smartthings',
      'd2'
    );

  it('reads the stick, its bag and energy', () => {
    const [s] = cleanerSources(stick('on'));
    expect(s.cleaner.kind).toBe('stick');
    expect(s.cleaner.activity).toBe('charging');
    expect(s.cleaner.dock).toMatchObject({ inStation: true, bagFull: false, cycles: 23 });
    expect(s.cleaner.energy?.kWh).toBeCloseTo(18.6);
    expect(s.calls({ type: 'empty' })[0]).toMatchObject({ domain: 'switch', service: 'turn_on', entityId: `switch.${S}_empty_dustbin` });
  });

  it('knows when it is off the station or the bag is full', () => {
    expect(cleanerSources(stick('off'))[0].cleaner.activity).toBe('in-use');
    expect(chores(cleanerSources(stick('on', 'on'))[0].cleaner)[0].todo).toBe('Replace the dust bag');
  });
});

describe('vacuum adapters · words', () => {
  it('folds statuses', () => {
    expect(activityOf('docked', 'charging_completed')).toBe('docked');
    expect(activityOf('cleaning', 'sweeping_and_mopping')).toBe('cleaning');
    expect(activityOf('returning', 'returning_to_wash')).toBe('returning');
    expect(activityOf('docked', 'charging')).toBe('charging');
    expect(supplyState('low_water')).toBe('low');
    expect(supplyState('not_installed')).toBe('missing');
    expect(supplyState('not_installed_or_full')).toBe('full');
    expect(roomNames(['A', { name: 'B' }])).toEqual(['A', 'B']);
    expect(roomsOf({ 16: 'Kitchen', 17: 'Hall' }).map((r) => [r.segment, r.name])).toEqual([['16', 'Kitchen'], ['17', 'Hall']]);
    const floors = roomsOf({ 'Ground floor': [{ id: 1, name: 'Kitchen' }], 'First floor': [{ id: 1, name: 'Bedroom' }] });
    expect(floors.map((r) => [r.id, r.segment, r.floor])).toEqual([['Ground floor:1', '1', 'Ground floor'], ['First floor:1', '1', 'First floor']]);
  });
});
