import { describe, expect, it } from 'vitest';
import { buildRoomPage, shortName } from '../src/pro/lib/roomPage';
import type { ResolvedArea, ResolvedEntity } from '../src/types';

const NOW = new Date('2026-11-21T15:00:00').getTime();

function ent(entity_id: string, state: string, attributes: Record<string, unknown> = {}, extra: Partial<ResolvedEntity> = {}): ResolvedEntity {
  return {
    entity_id,
    domain: entity_id.split('.')[0],
    name: String(attributes.friendly_name ?? entity_id),
    state,
    attributes,
    area_id: 'living',
    device_id: null,
    floor_id: null,
    resolutionSource: 'entity',
    hidden: false,
    isDiagnostic: false,
    ...extra
  } as ResolvedEntity;
}

const area = (entities: ResolvedEntity[]) => ({ area_id: 'living', name: 'Living Room', icon: '', devices: [], entities, entitiesByDomain: {}, summary: {}, bannerImage: null }) as unknown as ResolvedArea;

describe('roomPage', () => {
  it('drops the room name from device names', () => {
    expect(shortName('Living Room Lamp', 'Living Room')).toBe('Lamp');
    expect(shortName('Living Room - main light', 'Living Room')).toBe('Main light');
    expect(shortName('Living Room', 'Living Room')).toBe('Living Room');
    expect(shortName('Sofa lamp', 'Living Room')).toBe('Sofa lamp');
    expect(shortName('Living Room Ceiling Lamp', 'Living Room')).toBe('Ceiling Lamp');
    expect(shortName('Shelf Light (Living Room)', 'Living Room')).toBe('Shelf Light');
    expect(shortName('Floor lamp - living room', 'Living Room')).toBe('Floor lamp');
    expect(shortName('Living Roomba', 'Living Room')).toBe('Living Roomba');
    expect(shortName('Living Room', 'Living Room', 'Thermostat')).toBe('Thermostat');
  });

  it('groups devices by kind, lights on first, and leaves out hidden and unknown ones', () => {
    const page = buildRoomPage(
      area([
        ent('light.a', 'off', { friendly_name: 'Living Room Arc' }),
        ent('light.b', 'on', { friendly_name: 'Living Room Bulb', brightness: 128 }),
        ent('binary_sensor.door', 'on', { device_class: 'door', friendly_name: 'Patio door' }),
        ent('sensor.temp', '21.5', { device_class: 'temperature', unit_of_measurement: '°C' }),
        ent('sensor.signal', '-60', { device_class: 'signal_strength' }),
        ent('switch.hidden', 'on', {}, { hidden: true })
      ]),
      NOW
    );
    expect(page.order).toEqual(['lights', 'openings', 'readings']);
    expect(page.groups.lights?.map((d) => [d.name, d.detail])).toEqual([
      ['Bulb', '50%'],
      ['Arc', 'Off']
    ]);
    expect(page.groups.openings?.[0].detail).toBe('Open');
    expect(page.groups.readings?.[0].detail).toBe('21.5 °C');
    expect(page.deviceCount).toBe(3);
  });

  it('lists today’s changes newest first, not yesterday’s', () => {
    const page = buildRoomPage(
      area([
        ent('light.a', 'on', { friendly_name: 'Lamp' }, { last_changed: '2026-11-21T14:00:00' }),
        ent('binary_sensor.m', 'on', { device_class: 'motion', friendly_name: 'Motion' }, { last_changed: '2026-11-21T14:55:00' }),
        ent('light.old', 'off', { friendly_name: 'Old' }, { last_changed: '2026-11-20T22:00:00' })
      ]),
      NOW
    );
    expect(page.today.map((e) => `${e.name} ${e.text}`)).toEqual(['Motion detected', 'Lamp turned on']);
  });
});
