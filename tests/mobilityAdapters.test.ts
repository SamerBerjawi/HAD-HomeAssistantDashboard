import { describe, expect, it } from 'vitest';
import type { HADevice, HAEntityRegistryEntry, HAState, HAZone } from '@/types';
import { buildMobilityHome, mobilityCalls } from '@/pro/lib/mobility/adapters';
import type { HaContext } from '@/pro/lib/mobility/kit';
import { fordUpdateStage } from '@/pro/lib/mobility/adapters/fordpass';
import { quarterHourSpeeds } from '@/pro/hooks/useMobilityHome';
import { readiness } from '@/pro/lib/mobilityHome';

const NOW = Date.parse('2026-11-27T08:00:00Z');
const T = '2026-11-27T07:55:00Z';

type Ent = { id: string; key: string; state: string; attrs?: Record<string, unknown>; platform: string; device: string };
const ent = (platform: string, device: string, id: string, key: string, state: string, attrs: Record<string, unknown> = {}): Ent => ({ id, key, state, attrs, platform, device });

function ctx(ents: Ent[], devices: HADevice[], zones: HAZone[] = []): HaContext {
  const registry: HAEntityRegistryEntry[] = ents.map((e) => ({ entity_id: e.id, platform: e.platform, device_id: e.device, translation_key: e.key, unique_id: `uid_${e.device}_${e.key}` }));
  const states: Record<string, HAState> = Object.fromEntries(ents.map((e) => [e.id, { entity_id: e.id, state: e.state, attributes: e.attrs ?? {}, last_updated: T, last_changed: T }]));
  return { states, registry, devices, zones, now: NOW };
}

const HOME: HAZone = { entity_id: 'zone.home', name: 'Home', latitude: 50.84, longitude: 4.35, radius: 100 };
const F = (id: string, key: string, state: string, attrs?: Record<string, unknown>) => ent('fordpass', 'dev-ford', id, key, state, attrs);
const C = (id: string, key: string, state: string, attrs?: Record<string, unknown>) => ent('cowboy', 'dev-bike', id, key, state, attrs);

const FORD = [
  F('sensor.car_soc', 'soc', '61', { unit_of_measurement: '%' }),
  F('sensor.car_elveh', 'elveh', '262', { unit_of_measurement: 'km', maximumBatteryCapacity: 88 }),
  F('sensor.car_odometer', 'odometer', '21436', { unit_of_measurement: 'km' }),
  F('sensor.car_elvehplug', 'elvehplug', 'CONNECTED'),
  F('sensor.car_elvehcharging', 'elvehcharging', 'IN_PROGRESS', { batteryTemperature: 16 }),
  F('sensor.car_elvehchargingpower', 'elvehchargingpower', '7.2', { unit_of_measurement: 'kW' }),
  F('select.car_target', 'elvehtargetcharge', '90', { options: ['50', '60', '70', '80', '90', '100'] }),
  F('button.car_evstart', 'evstart', 'unknown'),
  F('button.car_evpause', 'evpause', 'unknown'),
  F('switch.car_remote_start', 'ignition', 'off'),
  F('number.car_temp', 'rcctemperature', '21', { min: 15.5, max: 30.5 }),
  F('switch.car_windscreen', 'rccdefrostfront', 'on'),
  F('select.car_seat_driver', 'rccseatfrontleft', 'off', { options: ['off', 'heated1', 'heated3'] }),
  F('lock.car_doors', 'doorlock', 'unlocked'),
  F('sensor.car_doors', 'doorstatus', 'Open', { driverRear: 'CLOSED', passengerFront: 'OPEN', hood: 'CLOSED' }),
  F('sensor.car_windows', 'windowposition', 'Closed', { driverFront: 'FULLY_CLOSED' }),
  F('sensor.car_alarm', 'alarm', 'SET'),
  F('sensor.car_speed', 'speed', '0', { unit_of_measurement: 'km/h' }),
  F('sensor.car_gear', 'gearleverposition', 'PARK'),
  F('sensor.car_tyres', 'tirepressure', 'Normal', { frontLeft: '2.1 bar', frontRight: '2.8 bar', rearLeft: '2.9 bar', rearRight: '2.9 bar' }),
  F('sensor.car_battery', 'battery', '88', { batteryVoltage: 12.4 }),
  F('sensor.car_messages', 'messages', '2'),
  F('device_tracker.car', 'tracker', 'home', { latitude: 50.8401, longitude: 4.3501 }),
  F('button.car_refresh', 'request_refresh', 'unknown'),
  F('sensor.car_fw_status', 'firmwareupgstatus', 'queued', { rawState: 'installation_queued' }),
  F('sensor.car_fw_last', 'lastfirmwareupdate', '2026-11-18T03:10:00+00:00', { firmwareVersion: '5.0.24' }),
  F('sensor.car_ota_schedule', 'otaschedule', '2026-11-28T02:00:00+00:00'),
  F('sensor.car_ota_readiness', 'otareadiness', 'low_lv_battery'),
  F('switch.car_auto_updates', 'autosoftwareupdates', 'on')
];
const BIKE = [
  C('sensor.bike_soc', 'battery_state_of_charge', '64', { unit_of_measurement: '%' }),
  C('sensor.bike_range', 'remaining_range', '45', { unit_of_measurement: 'km' }),
  C('sensor.bike_health', 'battery_health', '96'),
  C('sensor.bike_mileage', 'total_distance', '3812', { unit_of_measurement: 'km' }),
  C('sensor.bike_time', 'total_duration', '770400', { unit_of_measurement: 's' }),
  C('sensor.bike_co2', 'total_co2_saved', '412000', { unit_of_measurement: 'g' }),
  C('sensor.bike_mode', 'last_ride_mode', 'adaptive_eu'),
  C('sensor.bike_trip_title', 'last_trip_title', 'Morning ride'),
  C('sensor.bike_trip_dist', 'last_trip_distance', '6.1', { unit_of_measurement: 'km' }),
  C('sensor.bike_trip_end', 'last_trip_ended_at', '2026-11-27T07:30:00Z'),
  C('sensor.bike_trip_dur', 'last_trip_duration', '1140', { unit_of_measurement: 's' }),
  C('sensor.bike_trip_co2', 'last_trip_co2_saved', '900', { unit_of_measurement: 'g' }),
  C('binary_sensor.bike_inserted', 'battery_inserted', 'off'),
  C('binary_sensor.bike_stolen', 'stolen', 'off'),
  C('update.bike_firmware', 'firmware', 'on', { installed_version: '1.18.4', latest_version: '1.19.0' }),
  C('device_tracker.bike', 'tracker', 'not_home', { latitude: 50.9, longitude: 4.5, location_name: 'Station Square' })
];
const DEVICES: HADevice[] = [
  { id: 'dev-ford', name: 'VIN: TESTVIN', name_by_user: null, model: 'Mustang Mach-E', manufacturer: 'Ford' },
  { id: 'dev-bike', name: 'Bolt', model: 'Cowboy 4', manufacturer: 'cowboy' }
];

describe('FordPass adapter', () => {
  const { home, sources } = buildMobilityHome(ctx(FORD, DEVICES, [HOME]));
  const car = home.vehicles.find((v) => v.integration === 'fordpass');

  it('maps the car, never naming it by its VIN', () => {
    expect(car).toMatchObject({ kind: 'car', powertrain: 'ev', name: 'Mustang Mach-E', make: 'Ford', level: 61, range: 262, unit: 'km', odometer: 21436 });
    expect(car?.charging).toMatchObject({ plugged: true, state: 'charging', power: 7.2, target: 90, targets: [50, 60, 70, 80, 90, 100] });
    expect(car?.climate).toMatchObject({ running: false, target: 21 });
    expect(car?.climate?.extras).toEqual([
      { id: 'windscreen', label: 'Windscreen', on: true },
      { id: 'seat-driver', label: 'Driver seat', on: false }
    ]);
    expect(car?.security).toMatchObject({ locked: false, alarm: 'armed', open: [{ what: 'door', where: 'passenger front' }] });
    expect(car?.place).toMatchObject({ zone: 'Home' });
    expect(car?.condition).toMatchObject({ battery12v: 12.4, batteryKwh: 88, batteryTemp: 16, batteryHealth: null, warnings: ['2 messages from Ford'] });
    expect(car?.condition.tyres).toMatchObject({ unit: 'bar', fl: 2.1, low: 2.2 });
    expect(car?.actions).toEqual(['lock', 'unlock', 'climate', 'charge-start', 'charge-pause', 'target', 'refresh']);
  });

  it('reads where a software update stands', () => {
    expect(car?.condition.software).toEqual({
      installed: '5.0.24',
      latest: null,
      stage: 'queued',
      lastUpdate: Date.parse('2026-11-18T03:10:00Z'),
      nextWindow: Date.parse('2026-11-28T02:00:00Z'),
      blocked: '12 V battery low',
      auto: true
    });
    expect(['artifact_retrieval_in_progress', 'installation_queued', 'deploying', 'success', 'failure'].map(fordUpdateStage)).toEqual(['downloading', 'queued', 'installing', 'idle', 'failed']);
  });

  it('turns page actions into FordPass service calls', () => {
    const id = car?.id ?? '';
    expect(mobilityCalls(sources, id, { type: 'lock' })).toEqual([{ domain: 'lock', service: 'lock', data: {}, entityId: 'lock.car_doors', optimistic: { state: 'locked' } }]);
    expect(mobilityCalls(sources, id, { type: 'charge', on: false })[0]).toMatchObject({ domain: 'button', service: 'press', entityId: 'button.car_evpause' });
    expect(mobilityCalls(sources, id, { type: 'target', pct: 85 })[0]).toMatchObject({ service: 'select_option', data: { option: '80' } });
    expect(mobilityCalls(sources, id, { type: 'temp', value: 22.5 })[0]).toMatchObject({ domain: 'number', service: 'set_value', data: { value: 22.5 } });
    expect(mobilityCalls(sources, id, { type: 'extra', id: 'seat-driver', on: true })[0]).toMatchObject({ data: { option: 'heated3' } });
    expect(mobilityCalls(sources, id, { type: 'honk' })).toEqual([]);
  });

  it('reads remote start as the climate, "Inactive" as off', () => {
    const climateOf = (ents: Ent[]) => buildMobilityHome(ctx(ents, DEVICES, [HOME])).home.vehicles[0]?.climate;
    const countdown = F('sensor.car_rs_countdown', 'remotestartcountdown', '0', { unit_of_measurement: 'min' });
    // Off: the switch is off; Ford's status says "Inactive" (which contains "active"); a stale countdown is not shown.
    expect(climateOf([...FORD, F('sensor.car_rs_status', 'remotestartstatus', 'Inactive'), countdown])).toMatchObject({ running: false, minutesLeft: null, remoteStart: true });
    // Without the switch, the status alone decides.
    const noSwitch = FORD.filter((e) => e.key !== 'ignition');
    expect(climateOf([...noSwitch, F('sensor.car_rs_status', 'remotestartstatus', 'Inactive')])).toMatchObject({ running: false, remoteStart: false });
    expect(climateOf([...noSwitch, F('sensor.car_rs_status', 'remotestartstatus', 'Active')])).toMatchObject({ running: true });
    // Running: the switch is on, with the minutes left.
    const running = FORD.map((e) => (e.key === 'ignition' ? { ...e, state: 'on' } : e));
    expect(climateOf([...running, F('sensor.car_rs_countdown', 'remotestartcountdown', '9', { unit_of_measurement: 'min' })])).toMatchObject({ running: true, minutesLeft: 9 });
    expect(climateOf([...FORD, F('sensor.car_cabin', 'cabintemperature', '17.5', { unit_of_measurement: '°C' })])).toMatchObject({ cabin: 17.5 });
    expect(climateOf(FORD)).toMatchObject({ cabin: null });
  });

  it('takes the car’s picture from its tracker’s entity_picture', () => {
    const withPic = FORD.map((e) => (e.key === 'tracker' ? { ...e, attrs: { ...e.attrs, entity_picture: '/api/fordpass/vehicle_image.png' } } : e));
    const v = buildMobilityHome(ctx(withPic, DEVICES, [HOME])).home.vehicles[0];
    expect(v).toMatchObject({ picture: '/api/fordpass/vehicle_image.png', deviceId: 'dev-ford' });
    expect(car?.picture).toBeNull();
  });

  it('reads the open door as a check', () => {
    expect(readiness(car!, NOW).checks.map((c) => c.id)).toContain('lock');
  });
});

describe('Cowboy adapter', () => {
  const { home, sources } = buildMobilityHome(ctx(BIKE, DEVICES, [HOME]));
  const bike = home.vehicles[0];

  it('maps the bike, read only', () => {
    expect(bike).toMatchObject({ kind: 'bike', name: 'Bolt', model: 'Cowboy 4', level: 64, range: 45, odometer: 3812, mode: 'Adaptive', actions: [] });
    expect(bike.lifetime).toEqual({ co2SavedKg: 412, hours: 214 });
    expect(bike.lastTrip).toMatchObject({ title: 'Morning ride', distance: 6.1, minutes: 19, co2SavedKg: 0.9 });
    expect(bike.condition).toMatchObject({ batteryHealth: 96, batteryInserted: false, software: { installed: '1.18.4', latest: '1.19.0', stage: 'available' } });
    expect(bike.place).toMatchObject({ address: 'Station Square', zone: null });
    expect(mobilityCalls(sources, bike.id, { type: 'lock' })).toEqual([]);
  });
});

describe('generic adapter', () => {
  const G = (id: string, key: string, state: string, attrs?: Record<string, unknown>) => ent('volvo_cars', 'dev-volvo', id, key, state, attrs);
  const PHONE = [ent('mobile_app', 'dev-phone', 'sensor.phone_battery', 'battery_level', '80', { device_class: 'battery' }), ent('mobile_app', 'dev-phone', 'device_tracker.phone', 'tracker', 'home', { latitude: 1, longitude: 1 })];
  const VOLVO = [
    G('sensor.ex30_battery', 'battery_charge_level', '72', { device_class: 'battery', unit_of_measurement: '%' }),
    G('sensor.ex30_range', 'electric_range', '301', { unit_of_measurement: 'km' }),
    G('lock.ex30', 'lock', 'locked')
  ];
  const devs: HADevice[] = [{ id: 'dev-volvo', name: 'EX30', manufacturer: 'Volvo', model: 'EX30' }, { id: 'dev-phone', name: 'Phone' }];

  it('takes a device with a battery level and a range, and leaves phones alone', () => {
    const { home, sources } = buildMobilityHome(ctx([...FORD, ...BIKE, ...VOLVO, ...PHONE], [...DEVICES, ...devs]));
    expect(home.vehicles.map((v) => `${v.name}:${v.integration}`)).toEqual(['EX30:volvo_cars', 'Mustang Mach-E:fordpass', 'Bolt:cowboy']);
    const volvo = home.vehicles[0];
    expect(volvo).toMatchObject({ make: 'Volvo', level: 72, range: 301, security: { locked: true }, actions: ['lock', 'unlock'] });
    expect(mobilityCalls(sources, volvo.id, { type: 'unlock' })[0]).toMatchObject({ domain: 'lock', service: 'unlock', entityId: 'lock.ex30' });
  });
});

describe('speed history', () => {
  it('keeps the peak per quarter hour and carries the last value forward', () => {
    const end = NOW;
    const q = 15 * 60_000;
    const s = quarterHourSpeeds(
      [
        { state: '20', timestamp: end - 3 * q + 60_000 },
        { state: '15', timestamp: end - 2 * q + 60_000 },
        { state: '10', timestamp: end - 2 * q + 120_000 }
      ],
      end,
      (v) => v * 3.6
    );
    expect(s).toHaveLength(96);
    expect(s.slice(-4)).toEqual([0, 72, 72, 36]);
    expect(s[0]).toBe(0);
  });
});

describe('integration down', () => {
  it('keeps the vehicle, marked not reporting, when every entity is unavailable', () => {
    const down = (e: Ent) => ({ ...e, state: 'unavailable', attrs: {} });
    const { home } = buildMobilityHome(ctx([...FORD.map(down), ...BIKE.map(down)], DEVICES));
    expect(home.vehicles.map((v) => [v.name, v.offline, v.level, v.actions.length])).toEqual([
      ['Mustang Mach-E', true, null, 0],
      ['Bolt', true, null, 0]
    ]);
    expect(home.vehicles[0].seen).toBe(Date.parse(T));
  });
});

describe('fordpassVin', () => {
  it('reads the VIN from FordPass entity ids', async () => {
    const { fordpassVin } = await import('@/services/mobility/entityLookup');
    expect(fordpassVin({ 'sensor.fordpass_wf0ab1cd2ef345678_soc': {}, 'sensor.other': {} })).toBe('wf0ab1cd2ef345678');
    expect(fordpassVin({ 'sensor.other': {} })).toBe('');
  });
});
