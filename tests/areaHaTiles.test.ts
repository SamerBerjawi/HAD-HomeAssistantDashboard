import { describe, expect, it } from 'vitest';
import type { ResolvedArea, ResolvedEntity } from '@/types';
import { batteryOf, toTileModel, type MapContext } from '@/pro/areas/ha/haTileModels';
import { carModel, carParts } from '@/pro/areas/ha/haCar';
import { applyCarPicture, carDeviceId, NO_PICTURE, readCarPictures, withCarPicture } from '@/pro/areas/ha/carPictures';
import { areaTileName, buildAreaTiles } from '@/pro/areas/ha/haRoomTiles';

const NOW = Date.parse('2026-11-21T18:00:00Z');
const ago = (min: number) => new Date(NOW - min * 60000).toISOString();

function ent(entity_id: string, state: string, attributes: Record<string, unknown> = {}, extra: Partial<ResolvedEntity> = {}): ResolvedEntity {
  return {
    entity_id,
    domain: entity_id.split('.')[0],
    name: String(attributes.friendly_name ?? entity_id),
    state,
    attributes,
    area_id: 'living_room',
    device_id: null,
    floor_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    last_changed: ago(30),
    last_updated: ago(5),
    ...extra
  };
}

const ctx = (over: Partial<MapContext> = {}): MapContext => ({ room: 'Living Room', now: NOW, siblings: [], ...over });
const map = (e: ResolvedEntity, over: Partial<MapContext> = {}) => toTileModel(e, ctx(over));

describe('HA → tile models', () => {
  it('maps a colour light, a white light and an on/off light', () => {
    const colour = map(ent('light.tv_backlight', 'on', { friendly_name: 'Living Room TV Backlight', brightness: 115, supported_color_modes: ['color_temp', 'hs'], color_mode: 'hs', rgb_color: [120, 80, 255] }));
    expect(colour).toMatchObject({ kind: 'light', name: 'TV Backlight', brightness: 45, dimmable: true, supportsColor: true, supportsTemp: true, rgb: 'rgb(120, 80, 255)', kelvin: null });
    const white = map(ent('light.ceiling', 'on', { brightness: 255, supported_color_modes: ['color_temp'], color_mode: 'color_temp', color_temp_kelvin: 2700 }));
    expect(white).toMatchObject({ brightness: 100, kelvin: 2700, rgb: null, supportsColor: false });
    expect(map(ent('light.lamp', 'off', { supported_color_modes: ['onoff'] }))).toMatchObject({ isOn: false, dimmable: false, brightness: null });
    expect(map(ent('light.gone', 'unavailable'))).toMatchObject({ available: false });
  });

  it('knows a metered plug from a wall switch and a helper', () => {
    const power = ent('sensor.diffuser_power', '12.4', { device_class: 'power', unit_of_measurement: 'W' });
    const energy = ent('sensor.diffuser_energy_today', '0.11', { device_class: 'energy' });
    const plug = map(ent('switch.diffuser', 'on'), { siblings: [power, energy], history: { values: { 'sensor.diffuser_power': [10, 12] } } });
    expect(plug).toMatchObject({ kind: 'switch', role: 'plug', powerW: 12.4, energyTodayKwh: 0.11, powerHistory: [10, 12] });
    expect(map(ent('switch.porch', 'off'))).toMatchObject({ role: 'switch', powerW: null });
    expect(map(ent('input_boolean.guest_mode', 'on'))).toMatchObject({ role: 'helper', isOn: true });
  });

  it('reads fan speed steps, presets, swing and direction', () => {
    const fan = map(ent('fan.ceiling', 'on', { percentage: 66, percentage_step: 33.33, supported_features: 1 | 2 | 4 | 8, preset_modes: ['Natural'], preset_mode: 'Natural', oscillating: false, direction: 'reverse' }));
    expect(fan).toMatchObject({ kind: 'fan', levels: 3, percentage: 66, supportsSpeed: true, presetMode: 'Natural', oscillating: false, direction: 'reverse' });
    expect(map(ent('fan.simple', 'off', { supported_features: 0 }))).toMatchObject({ supportsSpeed: false, levels: 1, oscillating: null });
  });

  it('maps a thermostat, named after its room', () => {
    const c = map(ent('climate.living_room', 'cool', { friendly_name: 'Living Room', current_temperature: 23.5, temperature: 22, hvac_modes: ['off', 'cool', 'heat'], hvac_action: 'cooling', target_temp_step: 0.5, min_temp: 16, max_temp: 30 }));
    expect(c).toMatchObject({ kind: 'climate', name: 'Thermostat', current: 23.5, target: 22, mode: 'cool', action: 'cooling', min: 16, max: 30, isOn: true });
  });

  it('maps covers with and without a position', () => {
    expect(map(ent('cover.blinds', 'opening', { current_position: 40, device_class: 'blind' }))).toMatchObject({ position: 40, moving: 'opening', deviceClass: 'blind' });
    expect(map(ent('cover.garage', 'closed', { device_class: 'garage' }))).toMatchObject({ position: 0, moving: null });
  });

  it('only makes readings of room measurements with numbers', () => {
    expect(map(ent('sensor.co2', '640', { device_class: 'carbon_dioxide', unit_of_measurement: 'ppm' }))).toMatchObject({ kind: 'reading', value: 640, unit: 'ppm' });
    expect(map(ent('sensor.phone_battery', '80', { device_class: 'battery' }))).toBeNull();
    expect(map(ent('sensor.weather', 'sunny', { device_class: 'temperature' }))).toBeNull();
    expect(map(ent('sensor.temp', 'unavailable', { device_class: 'temperature' }))).toMatchObject({ available: false, value: null });
  });

  it('moves the media position on while playing and resolves the art', () => {
    const m = map(ent('media_player.speaker', 'playing', { media_title: 'Golden Hour', media_artist: 'Kiasmos', media_position: 100, media_position_updated_at: ago(1), media_duration: 268, volume_level: 0.35, entity_picture: '/api/media_player_proxy/x', source_list: ['Spotify'], repeat: 'all' }), { picture: (p) => `https://ha.local${p}` });
    expect(m).toMatchObject({ kind: 'media', playing: true, volume: 35, repeat: true, sources: ['Spotify'], position: 160 });
    expect(m && m.kind === 'media' ? m.art : null).toBe('url("https://ha.local/api/media_player_proxy/x") center / cover no-repeat');
    expect(map(ent('media_player.tv', 'off', { device_class: 'tv' }))).toMatchObject({ deviceClass: 'tv', isOn: false });
  });

  it('reads scenes: look from the name, last run from the state', () => {
    expect(map(ent('scene.movie_night', ago(10), { friendly_name: 'Movie Night', entity_id: ['light.a', 'light.b'] }))).toMatchObject({ kind: 'scene', look: 'movie', members: 2, lastActivated: NOW - 600000 });
    expect(map(ent('scene.new', 'unknown'))).toMatchObject({ lastActivated: null });
  });

  it('takes battery from the entity, then from a battery sensor on the device', () => {
    const lock = ent('lock.front', 'jammed', { changed_by: 'Keypad', supported_features: 1 });
    const bat = ent('sensor.front_lock_battery', '18', { device_class: 'battery' });
    expect(map(lock, { siblings: [bat] })).toMatchObject({ kind: 'lock', state: 'jammed', battery: 18, changedBy: 'Keypad', supportsOpen: true });
    expect(batteryOf(ent('binary_sensor.door', 'off', { battery_level: 77 }), [])).toBe(77);
  });

  it('sorts binary sensors into doors, motion and safety', () => {
    expect(map(ent('binary_sensor.window', 'on', { device_class: 'window' }), { history: { spells: { 'binary_sensor.window': [[1, null]] } } })).toMatchObject({ kind: 'opening', isOn: true, spells: [[1, null]] });
    expect(map(ent('binary_sensor.motion', 'off', { device_class: 'occupancy' }))).toMatchObject({ kind: 'motion', deviceClass: 'occupancy' });
    expect(map(ent('binary_sensor.leak', 'on', { device_class: 'moisture' }))).toMatchObject({ kind: 'safety', isOn: true });
    expect(map(ent('binary_sensor.update', 'on', { device_class: 'update' }))).toBeNull();
  });

  it('maps a vacuum, with rooms in any of the usual shapes', () => {
    const v = map(ent('vacuum.robot', 'error', { battery_level: 48, fan_speed: 'Quiet', fan_speed_list: ['Quiet', 'Turbo'], rooms: { 16: { name: 'Kitchen' }, 17: { name: 'Hallway' } }, error: 'Stuck' }));
    expect(v).toMatchObject({ kind: 'vacuum', state: 'error', battery: 48, rooms: ['Kitchen', 'Hallway'], error: 'Stuck' });
    expect(map(ent('vacuum.basic', 'charging', { rooms: ['Bedroom'] }))).toMatchObject({ state: 'docked', rooms: ['Bedroom'] });
  });
});

describe('car device', () => {
  const dev = (id: string) => ({ device_id: 'car1' as string | null, ...(id ? {} : {}) });
  const car = [
    ent('sensor.model_y_battery', '54', { device_class: 'battery', unit_of_measurement: '%' }, dev('')),
    ent('sensor.model_y_range', '262', { device_class: 'distance', unit_of_measurement: 'km' }, dev('')),
    ent('binary_sensor.model_y_charging', 'on', { device_class: 'battery_charging' }, dev('')),
    ent('sensor.model_y_charger_power', '11000', { device_class: 'power', unit_of_measurement: 'W' }, dev('')),
    ent('sensor.model_y_time_to_full_charge', '1.5', { unit_of_measurement: 'h' }, dev('')),
    ent('number.model_y_charge_limit', '80', {}, dev('')),
    ent('switch.model_y_charger', 'on', {}, dev('')),
    ent('lock.model_y_doors', 'unlocked', {}, dev('')),
    ent('climate.model_y_hvac', 'heat_cool', { current_temperature: 17.5, temperature: 21 }, dev('')),
    ent('device_tracker.model_y_location', 'not_home', { entity_picture: '/api/image/car.png' }, dev(''))
  ];

  it('builds one car with the entities its actions need', () => {
    const c = carModel(car, 'Model Y', 'car1', ctx());
    expect(c?.model).toMatchObject({ kind: 'car', entityId: 'device.car1', name: 'Model Y', battery: 54, rangeKm: 262, charging: 'charging', chargeKw: 11, chargeMinutes: 90, chargeLimit: 80, locked: false, climateOn: true, cabinTemp: 17.5, climateTarget: 21, location: 'Away', picture: '/api/image/car.png' });
    expect(c?.targets).toEqual({ lock: 'lock.model_y_doors', climate: 'climate.model_y_hvac', charge: 'switch.model_y_charger', chargeLimit: 'number.model_y_charge_limit' });
  });

  it('does not take a door lock, a thermostat or a phone for a car', () => {
    expect(carParts([ent('lock.front', 'locked'), ent('sensor.front_battery', '80', { device_class: 'battery' })])).toBeNull();
    expect(carParts([ent('climate.hall', 'heat'), ent('sensor.hall_battery', '80', { device_class: 'battery' })])).toBeNull();
    expect(carParts([ent('device_tracker.phone', 'home'), ent('sensor.phone_battery_level', '80', { device_class: 'battery' })])).toBeNull();
  });
});

describe('car pictures', () => {
  const dev = { device_id: 'car1' };
  const m = carModel([ent('sensor.y_battery', '50', { device_class: 'battery' }, dev), ent('lock.y', 'locked', {}, dev), ent('device_tracker.y', 'home', {}, dev)], 'Model Y', 'car1', ctx())!.model;
  it('keeps the owner\'s choice per car', () => {
    const prefs = withCarPicture({ other: 1 }, 'car1', '/api/assets/car_car1.png');
    expect(readCarPictures(prefs)).toEqual({ car1: '/api/assets/car_car1.png' });
    expect(withCarPicture(prefs, 'car1', null)).toMatchObject({ other: 1, proCarPictures: { car1: null } });
    expect(applyCarPicture(m, readCarPictures(prefs).car1, (u) => `x${u}`).uploadedPicture).toBe('x/api/assets/car_car1.png');
    expect(applyCarPicture(m, NO_PICTURE, (u) => u)).toMatchObject({ picture: null, uploadedPicture: null });
    expect(applyCarPicture(m, undefined, (u) => u)).toBe(m);
    expect(carDeviceId(m.entityId)).toBe('car1');
  });
});

describe('room → tiles', () => {
  const area = (entities: ResolvedEntity[]): ResolvedArea =>
    ({ area_id: 'living_room', name: 'Living Room', icon: '', devices: [{ id: 'car1', name: 'Tesla', name_by_user: 'Model Y' }, { id: 'thermo', name: 'Thermostat' }], entities, entitiesByDomain: {}, summary: {} as ResolvedArea['summary'], bannerImage: null }) as ResolvedArea;

  it('makes one tile per entity, skips what should not show, and orders by section', () => {
    const tiles = buildAreaTiles(
      area([
        ent('light.b_lamp', 'on', { friendly_name: 'Living Room Lamp', supported_color_modes: ['brightness'], brightness: 128 }),
        ent('light.a_ceiling', 'off', { friendly_name: 'Living Room Ceiling', supported_color_modes: ['brightness'] }),
        ent('scene.movie', ago(30), { friendly_name: 'Movie Night' }),
        ent('scene.relax', ago(60 * 5), { friendly_name: 'Relax' }),
        ent('climate.living_room', 'heat', { current_temperature: 21 }, { device_id: 'thermo' }),
        ent('sensor.thermostat_temperature', '21', { device_class: 'temperature' }, { device_id: 'thermo' }),
        ent('sensor.co2', '700', { device_class: 'carbon_dioxide' }),
        ent('light.hidden', 'on', {}, { hidden: true }),
        ent('sensor.signal', '-60', { device_class: 'signal_strength' }, { isDiagnostic: true }),
        ent('lock.model_y_doors', 'locked', {}, { device_id: 'car1' }),
        ent('sensor.model_y_range', '300', { device_class: 'distance', unit_of_measurement: 'km' }, { device_id: 'car1' }),
        ent('sensor.model_y_battery', '70', { device_class: 'battery' }, { device_id: 'car1' })
      ]),
      { now: NOW }
    );
    expect(tiles.filter((t) => !t.focus).map((t) => `${t.section}:${t.model.name}`)).toEqual(['scenes:Movie Night', 'scenes:Relax', 'lights:Ceiling', 'lights:Lamp', 'climate:Thermostat', 'climate:Co2', 'machines:Model Y']);
    // The car's own entities: battery and doors show, range waits in the Hidden tray.
    expect(tiles.filter((t) => t.focus).map((t) => [t.key, t.hidden, areaTileName(t)])).toEqual([
      ['device.car1#battery', false, 'Model Y · Battery'],
      ['device.car1#range', true, 'Model Y · Range'],
      ['device.car1#lock', false, 'Model Y · Doors']
    ]);
    expect(tiles.find((t) => t.key === 'device.car1#lock')?.model).toMatchObject({ focus: 'lock', can: { lock: true, climate: false, charge: false } });
    expect(tiles.find((t) => t.key === 'scene.movie')?.model.isOn).toBe(true);
    expect(tiles.find((t) => t.key === 'scene.relax')?.model.isOn).toBe(false);
    expect(tiles.find((t) => t.model.kind === 'car')).toMatchObject({ key: 'device.car1', size: { phone: 'w', wide: 'w' }, targets: { lock: 'lock.model_y_doors' } });
    expect(tiles.find((t) => t.key === 'light.b_lamp')?.size).toEqual({ phone: 's', wide: 's' });
  });

  it('gives an empty room no tiles', () => {
    expect(buildAreaTiles(area([]), { now: NOW })).toEqual([]);
  });

  it('builds script/button tiles, includes extraEntities bypassing auto skip, and applies entityCustomizations', () => {
    const scriptEnt = ent('script.goodnight', 'off', { friendly_name: 'Goodnight' });
    const buttonEnt = ent('button.doorbell', 'unknown', { friendly_name: 'Chime' });
    const diagSensor = ent('sensor.wifi_rssi', '-58', { device_class: 'signal_strength', unit_of_measurement: 'dBm' }, { isDiagnostic: true });
    const lampPlug = ent('switch.floor_lamp', 'on', { friendly_name: 'Floor Lamp' });

    const tiles = buildAreaTiles(area([lampPlug, diagSensor]), {
      now: NOW,
      extraEntities: [diagSensor, scriptEnt, buttonEnt],
      entityCustomizations: {
        'switch.floor_lamp': { customName: 'Reading Lamp', displayRole: 'light' }
      }
    });

    const lampTile = tiles.find((t) => t.key === 'switch.floor_lamp');
    expect(lampTile?.section).toBe('lights');
    expect(lampTile?.model).toMatchObject({ kind: 'light', name: 'Reading Lamp', isOn: true });
    expect(tiles.find((t) => t.key === 'sensor.wifi_rssi')?.model).toMatchObject({ kind: 'reading', value: -58, unit: 'dBm' });
    expect(tiles.find((t) => t.key === 'script.goodnight')?.model.kind).toBe('scene');
    expect(tiles.find((t) => t.key === 'button.doorbell')?.model.kind).toBe('scene');
  });
});
