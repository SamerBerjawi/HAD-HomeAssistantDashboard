/**
 * Mock entities for the Area Tiles Studio, modelled on real HA devices and attributes (Hue White
 * Ambiance, Hue Gradient, IKEA on/off, Shelly plug, input_boolean helper, DREO tower fan, ceiling
 * fan, extractor), plus `applyTileAction`, a tiny stand-in for HA so the mockups react.
 */
import type { CarTileModel, VacuumTileModel, LockTileModel, MotionTileModel, OpeningTileModel, SafetyTileModel, CameraTileModel, ClimateTileModel, CoverTileModel, FanTileModel, LightTileModel, MediaTileModel, ReadingTileModel, SceneTileModel, SwitchTileModel, TileAction, TileModel } from '../tileTypes';
import { CAMERA_STILL, CAR_PICTURE, SUNSET_ART } from './mockArt';

const now = Date.now();
const ago = (min: number) => now - min * 60_000;

export interface MockState<M> {
  id: string;
  label: string;
  model: M;
}

const light = (p: Partial<LightTileModel> & Pick<LightTileModel, 'entityId' | 'name'>): LightTileModel => ({
  kind: 'light',
  available: true,
  isOn: true,
  lastChanged: ago(42),
  brightness: 72,
  dimmable: true,
  kelvin: 2900,
  minKelvin: 2200,
  maxKelvin: 6500,
  supportsTemp: true,
  rgb: null,
  supportsColor: false,
  effect: null,
  ...p
});

export const LIGHT_STATES: MockState<LightTileModel>[] = [
  { id: 'warm', label: 'On · warm white', model: light({ entityId: 'light.living_room_ceiling', name: 'Ceiling Lamp' }) },
  { id: 'color', label: 'On · colour', model: light({ entityId: 'light.living_room_tv_backlight', name: 'TV Backlight', brightness: 45, kelvin: null, rgb: 'rgb(123, 97, 255)', supportsColor: true }) },
  { id: 'off', label: 'Off', model: light({ entityId: 'light.living_room_floor_lamp', name: 'Floor Lamp', isOn: false, brightness: null, kelvin: null, lastChanged: ago(190) }) },
  { id: 'dim', label: 'Dim · 8%', model: light({ entityId: 'light.living_room_shelf', name: 'Bookshelf Strip', brightness: 8, kelvin: 2200 }) },
  { id: 'onoff', label: 'On/off only', model: light({ entityId: 'light.living_room_ikea_lamp', name: 'Paper Lantern', dimmable: false, brightness: null, kelvin: null, supportsTemp: false }) },
  { id: 'long', label: 'Long name', model: light({ entityId: 'light.living_room_window_pendant', name: 'Bay Window Pendant Cluster Left', brightness: 100, kelvin: 4200 }) },
  { id: 'na', label: 'Unavailable', model: light({ entityId: 'light.living_room_reading', name: 'Reading Lamp', available: false, isOn: false, brightness: null }) }
];

const power = (base: number, spikes: number[] = []) => Array.from({ length: 24 }, (_, i) => Math.max(0, base + Math.sin(i / 2.4) * base * 0.12 + (spikes.includes(i) ? base * 6 : 0)));

const sw = (p: Partial<SwitchTileModel> & Pick<SwitchTileModel, 'entityId' | 'name'>): SwitchTileModel => ({
  kind: 'switch',
  available: true,
  isOn: true,
  lastChanged: ago(134),
  role: 'plug',
  appliance: null,
  powerW: null,
  energyTodayKwh: null,
  powerHistory: [],
  ...p
});

export const SWITCH_STATES: MockState<SwitchTileModel>[] = [
  { id: 'plug', label: 'Plug · on, metered', model: sw({ entityId: 'switch.living_room_diffuser', name: 'Aroma Diffuser', appliance: 'Diffuser', powerW: 12, energyTodayKwh: 0.11, powerHistory: power(12) }) },
  { id: 'heavy', label: 'Plug · heavy load', model: sw({ entityId: 'switch.kitchen_espresso', name: 'Espresso Machine', appliance: 'Espresso machine', powerW: 1380, energyTodayKwh: 0.86, powerHistory: power(4, [6, 7, 15, 16, 22]) , lastChanged: ago(9) }) },
  { id: 'off', label: 'Plug · off', model: sw({ entityId: 'switch.living_room_tree', name: 'Christmas Tree', isOn: false, powerW: 0, energyTodayKwh: 0.34, powerHistory: power(38), lastChanged: ago(65) }) },
  { id: 'wall', label: 'Wall switch', model: sw({ entityId: 'switch.porch', name: 'Porch Light Switch', role: 'switch', lastChanged: ago(380) }) },
  { id: 'helper', label: 'Helper toggle', model: sw({ entityId: 'input_boolean.guest_mode', name: 'Guest Mode', role: 'helper', isOn: false, lastChanged: ago(2880) }) },
  { id: 'na', label: 'Unavailable', model: sw({ entityId: 'switch.living_room_dehumidifier', name: 'Dehumidifier', available: false, isOn: false, powerW: null }) }
];

const fan = (p: Partial<FanTileModel> & Pick<FanTileModel, 'entityId' | 'name'>): FanTileModel => ({
  kind: 'fan',
  available: true,
  isOn: true,
  lastChanged: ago(25),
  percentage: 67,
  levels: 6,
  supportsSpeed: true,
  presetModes: [],
  presetMode: null,
  oscillating: null,
  direction: null,
  ...p
});

export const FAN_STATES: MockState<FanTileModel>[] = [
  { id: 'tower', label: 'Tower · presets', model: fan({ entityId: 'fan.living_room_dreo', name: 'Tower Fan', percentage: 67, presetModes: ['normal', 'natural', 'sleep', 'auto', 'turbo'], presetMode: 'natural', oscillating: true }) },
  { id: 'ceiling', label: 'Ceiling · 3 speeds', model: fan({ entityId: 'fan.bedroom_ceiling', name: 'Ceiling Fan', percentage: 67, levels: 3, direction: 'forward' }) },
  { id: 'max', label: 'Top speed', model: fan({ entityId: 'fan.office_desk', name: 'Desk Fan', percentage: 100, levels: 4, oscillating: false }) },
  { id: 'off', label: 'Off', model: fan({ entityId: 'fan.living_room_dreo', name: 'Tower Fan', isOn: false, percentage: 0, presetModes: ['normal', 'natural', 'sleep', 'auto', 'turbo'], presetMode: 'natural', oscillating: false, lastChanged: ago(300) }) },
  { id: 'onoff', label: 'On/off only', model: fan({ entityId: 'fan.bathroom_extractor', name: 'Extractor', supportsSpeed: false, levels: 1, percentage: 100 }) },
  { id: 'na', label: 'Unavailable', model: fan({ entityId: 'fan.nursery', name: 'Nursery Fan', available: false, isOn: false, percentage: 0 }) }
];

const base = { available: true, isOn: true, lastChanged: ago(30) };

export const CLIMATE_STATES: MockState<ClimateTileModel>[] = [
  { id: 'cool', label: 'Cooling', model: { ...base, kind: 'climate', entityId: 'climate.living_room_ecobee', name: 'Thermostat', current: 21.5, target: 22, step: 0.5, min: 16, max: 30, mode: 'cool', modes: ['off', 'heat', 'cool', 'heat_cool', 'auto', 'fan_only'], action: 'cooling', humidity: 48, unit: '°' } },
  { id: 'heat', label: 'Heating', model: { ...base, kind: 'climate', entityId: 'climate.bedroom', name: 'Radiator', current: 18.4, target: 21, step: 0.5, min: 7, max: 28, mode: 'heat', modes: ['off', 'heat'], action: 'heating', humidity: null, unit: '°' } },
  { id: 'off', label: 'Off', model: { ...base, kind: 'climate', entityId: 'climate.office_ac', name: 'Air Conditioner', isOn: false, current: 24.2, target: null, step: 1, min: 16, max: 30, mode: 'off', modes: ['off', 'cool', 'dry', 'fan_only'], action: 'off', humidity: 52, unit: '°' } },
  { id: 'auto', label: 'Auto · idle', model: { ...base, kind: 'climate', entityId: 'climate.hallway', name: 'Hallway', current: 21.4, target: 21.5, step: 0.5, min: 16, max: 28, mode: 'heat_cool', modes: ['off', 'heat', 'cool', 'heat_cool'], action: 'idle', humidity: 44, unit: '°' } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'climate', entityId: 'climate.guest_room', name: 'Guest Room', available: false, isOn: false, current: null, target: null, step: 0.5, min: 16, max: 28, mode: 'off', modes: ['off', 'heat'], action: null, humidity: null, unit: '°' } }
];

export const COVER_STATES: MockState<CoverTileModel>[] = [
  { id: 'open', label: 'Open · 60%', model: { ...base, kind: 'cover', entityId: 'cover.living_room_shutter', name: 'Living Blinds', position: 60, moving: null, deviceClass: 'shutter' } },
  { id: 'part', label: 'Partly open', model: { ...base, kind: 'cover', entityId: 'cover.bedroom_blind', name: 'Bedroom Blind', position: 35, moving: null, deviceClass: 'blind' } },
  { id: 'closed', label: 'Closed', model: { ...base, kind: 'cover', entityId: 'cover.office_curtain', name: 'Curtain', isOn: false, position: 0, moving: null, deviceClass: 'curtain' } },
  { id: 'moving', label: 'Opening', model: { ...base, kind: 'cover', entityId: 'cover.kitchen_blind', name: 'Kitchen Blind', position: 45, moving: 'opening', deviceClass: 'blind' } },
  { id: 'nopos', label: 'Open/close only', model: { ...base, kind: 'cover', entityId: 'cover.garage_door', name: 'Garage Door', isOn: false, position: null, moving: null, deviceClass: 'garage' } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'cover', entityId: 'cover.patio_awning', name: 'Patio Awning', available: false, isOn: false, position: null, moving: null, deviceClass: 'awning' } }
];

const wave = (mid: number, amp: number) => Array.from({ length: 24 }, (_, i) => mid + Math.sin(i / 3.2) * amp + Math.sin(i / 1.3) * amp * 0.25);
export const READING_STATES: MockState<ReadingTileModel>[] = [
  { id: 'humidity', label: 'Humidity', model: { ...base, kind: 'reading', entityId: 'sensor.living_room_humidity', name: 'Humidity', deviceClass: 'humidity', value: 48, unit: '%', history: wave(47, 4) } },
  { id: 'temp', label: 'Temperature', model: { ...base, kind: 'reading', entityId: 'sensor.living_room_temp', name: 'Temperature', deviceClass: 'temperature', value: 21.8, unit: '°', history: wave(21.4, 0.8) } },
  { id: 'co2', label: 'CO₂ high', model: { ...base, kind: 'reading', entityId: 'sensor.office_co2', name: 'CO₂', deviceClass: 'carbon_dioxide', value: 1240, unit: 'ppm', history: wave(950, 220) } },
  { id: 'dry', label: 'Humidity dry', model: { ...base, kind: 'reading', entityId: 'sensor.bedroom_humidity', name: 'Humidity', deviceClass: 'humidity', value: 31, unit: '%', history: wave(34, 3) } },
  { id: 'pm25', label: 'PM2.5 good', model: { ...base, kind: 'reading', entityId: 'sensor.living_room_pm25', name: 'PM2.5', deviceClass: 'pm25', value: 6, unit: 'µg/m³', history: wave(8, 3) } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'reading', entityId: 'sensor.garage_temp', name: 'Temperature', available: false, isOn: false, deviceClass: 'temperature', value: null, unit: '°', history: [] } }
];

const ROOMS = ['Living Room', 'Kitchen', 'Hallway', 'Bedroom', 'Office', 'Bathroom'];
const vac = { kind: 'vacuum' as const, fanSpeeds: ['Quiet', 'Balanced', 'Turbo', 'Max'], rooms: ROOMS };
export const VACUUM_STATES: MockState<VacuumTileModel>[] = [
  { id: 'cleaning', label: 'Cleaning', model: { ...base, ...vac, entityId: 'vacuum.roborock_s8', name: 'Robot Vacuum', state: 'cleaning', battery: 64, fanSpeed: 'Balanced', target: ['Living Room', 'Kitchen', 'Hallway'], room: 'Kitchen', areaM2: 23, minutes: 18, progress: 46, error: null, lastRun: ago(18) } },
  { id: 'docked', label: 'Docked', model: { ...base, ...vac, entityId: 'vacuum.roborock_s8', name: 'Robot Vacuum', isOn: false, state: 'docked', battery: 100, fanSpeed: 'Balanced', target: [], room: null, areaM2: 58, minutes: 47, progress: null, error: null, lastRun: ago(60 * 5) } },
  { id: 'returning', label: 'Returning', model: { ...base, ...vac, entityId: 'vacuum.roborock_s8', name: 'Robot Vacuum', state: 'returning', battery: 21, fanSpeed: 'Turbo', target: [], room: 'Hallway', areaM2: 41, minutes: 36, progress: 100, error: null, lastRun: ago(2) } },
  { id: 'error', label: 'Stuck', model: { ...base, ...vac, entityId: 'vacuum.upstairs', name: 'Upstairs Vacuum', state: 'error', battery: 48, fanSpeed: 'Quiet', target: ['Bedroom'], room: 'Bedroom', areaM2: 6, minutes: 9, progress: 30, error: 'Stuck under the bed', lastRun: ago(4) } },
  { id: 'basic', label: 'No rooms (basic)', model: { ...base, kind: 'vacuum', entityId: 'vacuum.eufy', name: 'Eufy', isOn: false, state: 'docked', battery: 90, fanSpeed: null, fanSpeeds: [], rooms: [], target: [], room: null, areaM2: null, minutes: null, progress: null, error: null, lastRun: ago(60 * 26) } },
  { id: 'na', label: 'Unavailable', model: { ...base, ...vac, entityId: 'vacuum.garage', name: 'Garage Vacuum', available: false, isOn: false, state: 'docked', battery: null, fanSpeed: null, target: [], room: null, areaM2: null, minutes: null, progress: null, error: null, lastRun: null } }
];

const car = { kind: 'car' as const, entityId: 'device.model_y', name: 'Model Y', picture: CAR_PICTURE, uploadedPicture: null, chargeLimit: 80, can: { lock: true, climate: true, charge: true } };
export const CAR_STATES: MockState<CarTileModel>[] = [
  { id: 'charging', label: 'Charging · battery tile', model: { ...base, ...car, focus: 'battery', battery: 54, rangeKm: 262, charging: 'charging', chargeKw: 11, chargeMinutes: 95, locked: true, climateOn: false, cabinTemp: 14, climateTarget: 21, location: 'Home' } },
  { id: 'range', label: 'Low range · range tile', model: { ...base, ...car, focus: 'range', battery: 14, rangeKm: 61, charging: 'unplugged', chargeKw: null, chargeMinutes: null, locked: true, climateOn: false, cabinTemp: 9, climateTarget: 21, location: 'Home' } },
  { id: 'lock', label: 'Unlocked · lock tile', model: { ...base, ...car, focus: 'lock', battery: 78, rangeKm: 371, charging: 'plugged', chargeKw: 0, chargeMinutes: null, locked: false, climateOn: false, cabinTemp: 16, climateTarget: 21, location: 'Home', lastChanged: ago(12) } },
  { id: 'climate', label: 'Preheating · climate tile', model: { ...base, ...car, focus: 'climate', battery: 80, rangeKm: 380, charging: 'plugged', chargeKw: 0, chargeMinutes: null, locked: true, climateOn: true, cabinTemp: 17.5, climateTarget: 21, location: 'Home' } },
  { id: 'away', label: 'Away · location tile', model: { ...base, ...car, focus: 'location', battery: 61, rangeKm: 290, charging: 'unplugged', chargeKw: null, chargeMinutes: null, locked: true, climateOn: false, cabinTemp: 19, climateTarget: 21, location: 'Office', lastChanged: ago(140) } },
  { id: 'plug', label: 'Plugged in · charging tile', model: { ...base, ...car, focus: 'charging', battery: 80, rangeKm: 380, charging: 'plugged', chargeKw: 0, chargeMinutes: null, locked: true, climateOn: false, cabinTemp: 15, climateTarget: 21, location: 'Home' } },
  { id: 'na', label: 'Asleep / offline', model: { ...base, ...car, available: false, focus: 'battery', battery: null, rangeKm: null, charging: null, chargeKw: null, chargeMinutes: null, locked: null, climateOn: null, cabinTemp: null, climateTarget: null, location: null } }
];

const TRACKS = [
  { title: 'Golden Hour', artist: 'Kiasmos' },
  { title: 'Sunset Lover', artist: 'Petit Biscuit' },
  { title: 'Midnight City', artist: 'M83' }
];
const speaker = { deviceClass: 'speaker' as const, muted: false, sources: ['Spotify', 'Apple Music', 'TuneIn', 'Line-in'] };
export const MEDIA_STATES: MockState<MediaTileModel>[] = [
  { id: 'playing', label: 'Playing', model: { ...base, ...speaker, kind: 'media', entityId: 'media_player.living_room_sonos', name: 'Living Room Speaker', playing: true, ...TRACKS[0], art: SUNSET_ART, volume: 32, source: 'Spotify', position: 134, duration: 268, shuffle: false, repeat: false } },
  { id: 'paused', label: 'Paused', model: { ...base, ...speaker, kind: 'media', entityId: 'media_player.living_room_sonos', name: 'Living Room Speaker', playing: false, ...TRACKS[1], art: SUNSET_ART, volume: 32, source: 'Spotify', position: 134, duration: 268, shuffle: false, repeat: false } },
  { id: 'tv', label: 'TV · Netflix', model: { ...base, kind: 'media', deviceClass: 'tv', entityId: 'media_player.living_room_tv', name: 'Living Room TV', playing: true, title: 'The Night Agent', artist: 'S2 · E4', art: null, volume: 18, source: 'Netflix', position: 1520, duration: 2880, shuffle: false, repeat: false, muted: false, sources: ['Netflix', 'YouTube', 'Disney+', 'HDMI 1 · Apple TV', 'HDMI 2 · PS5'] } },
  { id: 'muted', label: 'Muted', model: { ...base, ...speaker, kind: 'media', entityId: 'media_player.kitchen_sonos', name: 'Kitchen Speaker', playing: true, ...TRACKS[2], art: SUNSET_ART, volume: 40, source: 'Spotify', position: 60, duration: 244, shuffle: true, repeat: false, muted: true } },
  { id: 'idle', label: 'Idle', model: { ...base, ...speaker, kind: 'media', entityId: 'media_player.kitchen_homepod', name: 'Kitchen HomePod', isOn: false, playing: false, title: null, artist: null, art: null, volume: 20, source: null, position: null, duration: null, shuffle: false, repeat: false } },
  { id: 'na', label: 'Unavailable', model: { ...base, ...speaker, kind: 'media', entityId: 'media_player.bedroom_tv', deviceClass: 'tv', name: 'Bedroom TV', available: false, isOn: false, playing: false, title: null, artist: null, art: null, volume: null, source: null, position: null, duration: null, shuffle: false, repeat: false, sources: [] } }
];

export const SCENE_STATES: MockState<SceneTileModel>[] = [
  { id: 'movie', label: 'Active', model: { ...base, kind: 'scene', entityId: 'scene.living_room_movie_night', name: 'Movie Night', look: 'movie', palette: ['rgb(123, 97, 255)', 'rgb(255, 92, 160)', 'hsl(30 100% 62%)'], members: 6, lastActivated: ago(38), lastChanged: ago(38) } },
  { id: 'relax', label: 'Used earlier', model: { ...base, kind: 'scene', entityId: 'scene.living_room_relax', name: 'Relax', isOn: false, look: 'relax', palette: ['hsl(32 100% 64%)', 'hsl(26 95% 58%)', 'hsl(40 100% 72%)'], members: 4, lastActivated: ago(190), lastChanged: ago(190) } },
  { id: 'bright', label: 'Bright', model: { ...base, kind: 'scene', entityId: 'scene.living_room_bright', name: 'Bright', isOn: false, look: 'bright', palette: ['hsl(212 30% 92%)', 'hsl(45 60% 90%)'], members: 7, lastActivated: ago(60 * 30), lastChanged: ago(60 * 30) } },
  { id: 'night', label: 'Turns things off', model: { ...base, kind: 'scene', entityId: 'scene.good_night', name: 'Good Night', isOn: false, look: 'night', palette: ['hsl(230 30% 28%)', 'hsl(250 40% 40%)'], members: 14, lastActivated: ago(60 * 20), lastChanged: ago(60 * 20) } },
  { id: 'long', label: 'Long name, never used', model: { ...base, kind: 'scene', entityId: 'scene.dinner_with_friends', name: 'Dinner with Friends', isOn: false, look: 'dinner', palette: ['hsl(28 100% 60%)', 'rgb(255, 120, 60)'], members: 5, lastActivated: null, lastChanged: null } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'scene', entityId: 'scene.reading_corner', name: 'Reading', available: false, isOn: false, look: 'reading', palette: [], members: 2, lastActivated: null, lastChanged: null } }
];

/** n event times spread over the last `hours`, oldest first, ending `last` minutes ago. */
const events = (n: number, hours: number, last: number) => Array.from({ length: n }, (_, i) => ago(last + ((n - 1 - i) * hours * 60) / Math.max(1, n) + ((i * 37) % 23)));
export const CAMERA_STATES: MockState<CameraTileModel>[] = [
  { id: 'live', label: 'Live · motion', model: { ...base, kind: 'camera', entityId: 'camera.living_room_indoor', name: 'Living Room Camera', live: true, picture: CAMERA_STILL, lastMotion: ago(4), events: events(9, 6, 4) } },
  { id: 'still', label: 'Still · quiet', model: { ...base, kind: 'camera', entityId: 'camera.living_room_indoor', name: 'Living Room Camera', live: false, picture: CAMERA_STILL, lastMotion: ago(52), events: events(3, 6, 52) } },
  { id: 'na', label: 'Offline', model: { ...base, kind: 'camera', entityId: 'camera.garage', name: 'Garage Cam', available: false, isOn: false, live: false, picture: null, lastMotion: null, events: [] } }
];

export const LOCK_STATES: MockState<LockTileModel>[] = [
  { id: 'locked', label: 'Locked', model: { ...base, kind: 'lock', entityId: 'lock.front_door', name: 'Front Door', isOn: true, state: 'locked', battery: 82, changedBy: 'Auto-lock', supportsOpen: true, lastChanged: ago(95) } },
  { id: 'unlocked', label: 'Unlocked', model: { ...base, kind: 'lock', entityId: 'lock.front_door', name: 'Front Door', isOn: false, state: 'unlocked', battery: 82, changedBy: 'Sam', supportsOpen: true, lastChanged: ago(6) } },
  { id: 'jammed', label: 'Jammed', model: { ...base, kind: 'lock', entityId: 'lock.back_door', name: 'Back Door', isOn: false, state: 'jammed', battery: 64, changedBy: null, supportsOpen: false, lastChanged: ago(2) } },
  { id: 'low', label: 'Battery low', model: { ...base, kind: 'lock', entityId: 'lock.garage_side', name: 'Garage Side Door', isOn: true, state: 'locked', battery: 12, changedBy: 'Keypad', supportsOpen: false, lastChanged: ago(60 * 7) } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'lock', entityId: 'lock.shed', name: 'Shed', available: false, isOn: false, state: 'locked', battery: null, changedBy: null, supportsOpen: false, lastChanged: null } }
];

const spell = (startMin: number, endMin: number | null): [number, number | null] => [ago(startMin), endMin === null ? null : ago(endMin)];
export const OPENING_STATES: MockState<OpeningTileModel>[] = [
  { id: 'closed', label: 'Door closed', model: { ...base, kind: 'opening', entityId: 'binary_sensor.front_door_contact', name: 'Front Door', isOn: false, deviceClass: 'door', battery: 90, lastChanged: ago(42), spells: [spell(60 * 13, 60 * 13 - 2), spell(60 * 9, 60 * 9 - 1), spell(60 * 4, 60 * 4 - 3), spell(60, 42)] } },
  { id: 'open', label: 'Window open', model: { ...base, kind: 'opening', entityId: 'binary_sensor.bedroom_window', name: 'Bedroom Window', isOn: true, deviceClass: 'window', battery: 71, lastChanged: ago(74), spells: [spell(60 * 20, 60 * 18), spell(74, null)] } },
  { id: 'garage', label: 'Garage door open', model: { ...base, kind: 'opening', entityId: 'binary_sensor.garage_door', name: 'Garage Door', isOn: true, deviceClass: 'garage_door', battery: null, lastChanged: ago(3), spells: [spell(60 * 8, 60 * 8 - 5), spell(3, null)] } },
  { id: 'low', label: 'Battery low', model: { ...base, kind: 'opening', entityId: 'binary_sensor.patio_door', name: 'Patio Door', isOn: false, deviceClass: 'door', battery: 8, lastChanged: ago(60 * 26), spells: [] } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'opening', entityId: 'binary_sensor.attic_hatch', name: 'Attic Hatch', available: false, isOn: false, deviceClass: 'opening', battery: null, lastChanged: null, spells: [] } }
];

export const MOTION_STATES: MockState<MotionTileModel>[] = [
  { id: 'detected', label: 'Motion now', model: { ...base, kind: 'motion', entityId: 'binary_sensor.living_room_motion', name: 'Living Room Motion', isOn: true, deviceClass: 'motion', battery: 88, lastChanged: ago(0.3), events: events(14, 6, 0.3) } },
  { id: 'clear', label: 'Clear', model: { ...base, kind: 'motion', entityId: 'binary_sensor.hallway_motion', name: 'Hallway Motion', isOn: false, deviceClass: 'motion', battery: 54, lastChanged: ago(14), events: events(6, 6, 14) } },
  { id: 'presence', label: 'Presence (mmWave)', model: { ...base, kind: 'motion', entityId: 'binary_sensor.office_presence', name: 'Office Presence', isOn: true, deviceClass: 'presence', battery: null, lastChanged: ago(48), events: events(4, 6, 48) } },
  { id: 'quiet', label: 'Quiet for hours', model: { ...base, kind: 'motion', entityId: 'binary_sensor.guest_room_motion', name: 'Guest Room Motion', isOn: false, deviceClass: 'motion', battery: 31, lastChanged: ago(60 * 9), events: [] } },
  { id: 'na', label: 'Unavailable', model: { ...base, kind: 'motion', entityId: 'binary_sensor.porch_motion', name: 'Porch Motion', available: false, isOn: false, deviceClass: 'motion', battery: null, lastChanged: null, events: [] } }
];

export const SAFETY_STATES: MockState<SafetyTileModel>[] = [
  { id: 'clear', label: 'All clear', model: { ...base, kind: 'safety', entityId: 'binary_sensor.kitchen_sink_leak', name: 'Under Sink', isOn: false, deviceClass: 'moisture', battery: 93, lastSeen: ago(2), lastChanged: ago(60 * 24 * 12) } },
  { id: 'leak', label: 'Leak!', model: { ...base, kind: 'safety', entityId: 'binary_sensor.washer_leak', name: 'Washing Machine', isOn: true, deviceClass: 'moisture', battery: 77, lastSeen: ago(0.2), lastChanged: ago(1) } },
  { id: 'smoke', label: 'Smoke!', model: { ...base, kind: 'safety', entityId: 'binary_sensor.hallway_smoke', name: 'Hallway Smoke', isOn: true, deviceClass: 'smoke', battery: 100, lastSeen: ago(0.1), lastChanged: ago(0.5) } },
  { id: 'smokeok', label: 'Smoke clear', model: { ...base, kind: 'safety', entityId: 'binary_sensor.living_room_smoke', name: 'Smoke Alarm', isOn: false, deviceClass: 'smoke', battery: 18, lastSeen: ago(9), lastChanged: ago(60 * 24 * 40) } },
  { id: 'na', label: 'Not reporting', model: { ...base, kind: 'safety', entityId: 'binary_sensor.boiler_co', name: 'Boiler CO', available: false, isOn: false, deviceClass: 'carbon_monoxide', battery: null, lastSeen: ago(60 * 30), lastChanged: null } }
];

/** What HA would do with the action, applied to the mock model. */
export function applyTileAction(m: TileModel, a: TileAction): TileModel {
  if (!m.available) return m;
  const t = Date.now();
  switch (m.kind) {
    case 'light': {
      const l = m;
      if (a.type === 'toggle') return { ...l, isOn: !l.isOn, brightness: l.isOn ? null : l.dimmable ? (l.brightness ?? 80) : null, kelvin: l.isOn ? l.kelvin : (l.kelvin ?? (l.supportsTemp ? 2900 : null)), lastChanged: t };
      if (a.type === 'brightness') return { ...l, isOn: true, brightness: Math.max(1, Math.min(100, a.pct)), kelvin: l.rgb ? null : (l.kelvin ?? (l.supportsTemp ? 2900 : null)) };
      if (a.type === 'kelvin') return { ...l, isOn: true, kelvin: a.kelvin, rgb: null, brightness: l.brightness ?? 80 };
      if (a.type === 'color') return { ...l, isOn: true, rgb: a.rgb, kelvin: null, brightness: l.brightness ?? 80 };
      return m;
    }
    case 'switch': {
      const s = m;
      if (a.type !== 'toggle') return m;
      const on = !s.isOn;
      const w = s.powerHistory.length ? Math.round(s.powerHistory[s.powerHistory.length - 1]) : null;
      return { ...s, isOn: on, lastChanged: t, powerW: s.powerW === null ? null : on ? (w || 12) : 0 };
    }
    case 'fan': {
      const f = m;
      if (a.type === 'toggle') return { ...f, isOn: !f.isOn, percentage: f.isOn ? 0 : f.percentage || Math.round(100 / f.levels), lastChanged: t };
      if (a.type === 'percentage') return a.pct <= 0 ? { ...f, isOn: false, percentage: 0, lastChanged: t } : { ...f, isOn: true, percentage: a.pct };
      if (a.type === 'preset') return { ...f, isOn: true, presetMode: a.mode, percentage: f.percentage || Math.round(100 / f.levels) };
      if (a.type === 'oscillate') return { ...f, oscillating: a.on };
      if (a.type === 'direction') return { ...f, direction: a.dir };
      return m;
    }
    case 'climate': {
      if (a.type === 'target') return { ...m, target: Math.max(m.min, Math.min(m.max, Math.round(a.value / m.step) * m.step)) };
      if (a.type === 'hvac') return { ...m, mode: a.mode, isOn: a.mode !== 'off', target: a.mode === 'off' || a.mode === 'fan_only' || a.mode === 'dry' ? m.target : (m.target ?? Math.round(m.current ?? 21)), action: a.mode === 'off' ? 'off' : a.mode === 'heat' ? 'heating' : a.mode === 'cool' ? 'cooling' : 'idle' };
      if (a.type === 'toggle') return { ...m, mode: m.isOn ? 'off' : (m.modes.find((x) => x !== 'off') ?? 'auto'), isOn: !m.isOn, target: m.target ?? Math.round(m.current ?? 21), action: m.isOn ? 'off' : 'idle' };
      return m;
    }
    case 'cover': {
      if (a.type === 'position') return { ...m, position: a.pct, isOn: a.pct > 0, moving: null, lastChanged: t };
      if (a.type === 'cover') {
        if (a.cmd === 'stop') return { ...m, moving: null };
        if (m.position === null) return { ...m, isOn: a.cmd === 'open', moving: null, lastChanged: t };
        const pos = a.cmd === 'open' ? 100 : 0;
        return { ...m, position: pos, isOn: pos > 0, moving: null, lastChanged: t };
      }
      if (a.type === 'toggle') return { ...m, position: m.position === null ? null : m.isOn ? 0 : 100, isOn: !m.isOn, lastChanged: t };
      return m;
    }
    case 'media': {
      if (a.type === 'media') {
        if (a.cmd === 'play' || a.cmd === 'pause') return { ...m, playing: a.cmd === 'play', isOn: true };
        if (a.cmd === 'shuffle') return { ...m, shuffle: !m.shuffle };
        if (a.cmd === 'repeat') return { ...m, repeat: !m.repeat };
        const i = (TRACKS.findIndex((x) => x.title === m.title) + (a.cmd === 'next' ? 1 : TRACKS.length - 1)) % TRACKS.length;
        return { ...m, ...TRACKS[i], playing: true, position: 0 };
      }
      if (a.type === 'toggle') return { ...m, playing: !m.playing };
      if (a.type === 'volume') return { ...m, volume: a.pct, muted: false };
      if (a.type === 'mute') return { ...m, muted: a.on };
      if (a.type === 'source') return { ...m, source: a.source, isOn: true };
      return m;
    }
    case 'scene':
      return a.type === 'activate' ? { ...m, isOn: true, lastActivated: t, lastChanged: t } : m;
    case 'camera':
      return a.type === 'toggle' ? { ...m, live: !m.live } : m;
    case 'lock': {
      if (a.type !== 'lock' && a.type !== 'toggle') return m;
      const cmd = a.type === 'toggle' ? (m.state === 'locked' ? 'unlock' : 'lock') : a.cmd;
      return { ...m, state: cmd === 'lock' ? 'locked' : cmd === 'open' ? 'open' : 'unlocked', isOn: cmd === 'lock', changedBy: 'You', lastChanged: t };
    }
    case 'vacuum': {
      if (a.type === 'fanSpeed') return { ...m, fanSpeed: a.speed };
      if (a.type === 'rooms') return { ...m, target: a.rooms };
      if (a.type !== 'vacuum') return m;
      if (a.cmd === 'start') return { ...m, state: 'cleaning', isOn: true, error: null, room: m.target[0] ?? m.room ?? 'Living Room', progress: m.state === 'paused' ? m.progress : 0, areaM2: m.state === 'paused' ? m.areaM2 : 0, minutes: m.state === 'paused' ? m.minutes : 0, lastRun: t };
      if (a.cmd === 'pause') return { ...m, state: 'paused' };
      if (a.cmd === 'dock') return { ...m, state: 'returning', target: [] };
      return m;
    }
    case 'car': {
      if (a.type === 'lock') return { ...m, locked: a.cmd === 'lock', lastChanged: t };
      if (a.type === 'charge') return { ...m, charging: a.on ? 'charging' : 'plugged', chargeKw: a.on ? 11 : 0, chargeMinutes: a.on ? 60 : null };
      if (a.type === 'carClimate') return { ...m, climateOn: a.on };
      return m;
    }
    case 'opening':
    case 'motion':
    case 'safety':
    case 'reading':
      return m;
  }
  return m;
}
