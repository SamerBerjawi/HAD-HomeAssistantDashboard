/**
 * Sample vehicles (the Mobility Studio, and the live page in demo mode) (docs/pro-ui/MOBILITY.md §0). Pure and
 * deterministic, never Home Assistant. The car carries what FordPass offers for an electric Ford,
 * the bike what the Cowboy integration offers, and the "fleet" state adds a second car from
 * another make (with fewer parts) to show the page leaving out what a vehicle lacks.
 */
import type { Charging, Climate, MobilityHome, Vehicle } from '../mobilityHome';

export type StudioMobilityId = 'charging' | 'ready' | 'driving' | 'attention' | 'fleet' | 'quiet';

export const STUDIO_MOBILITY_STATES: { id: StudioMobilityId; label: string; summary: string }[] = [
  { id: 'charging', label: 'Charging overnight', summary: '06:20, the car charging at home, the bike in the hall' },
  { id: 'ready', label: 'Ready, warming up', summary: '07:45, charged, climate on, about to leave' },
  { id: 'driving', label: 'Driving', summary: '17:30, the car on the road, the bike at work' },
  { id: 'attention', label: 'Needs a look', summary: 'Unlocked, a window open, a low tyre, low charge; bike update' },
  { id: 'fleet', label: 'Two cars + bike', summary: 'The Ford, a second car from another make, and the bike' },
  { id: 'quiet', label: 'Asleep, not reporting', summary: 'The car in deep sleep since the night, the bike’s integration down' }
];

const HOME = { lat: 50.8467, lon: 4.3525 };
const WORK = { lat: 50.8382, lon: 4.3995 };
const at = (h: number, m = 0) => new Date(2026, 10, 26, h, m).getTime();
const NOW: Record<StudioMobilityId, number> = { charging: at(6, 20), ready: at(7, 45), driving: at(17, 30), attention: at(19, 5), fleet: at(7, 45), quiet: at(9, 30) };

/** A day of speeds, 96 quarter hours: the commute out and back. */
function speeds(now: number): number[] {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  return Array.from({ length: 96 }, (_, i) => {
    const t = now - (95 - i) * 15 * 60_000;
    const h = (t - day.getTime()) / 3600_000;
    const hh = ((h % 24) + 24) % 24;
    const trip = (from: number, to: number) => (hh >= from && hh < to ? 16 + 30 * Math.sin(((hh - from) / (to - from)) * Math.PI) + ((i * 37) % 11) : 0);
    return Math.round(Math.max(trip(7.9, 8.5), trip(17.2, 17.8), trip(12.4, 12.6) * 0.6));
  });
}

const fordCharging = (p: Partial<Charging>): Charging => ({ plugged: false, state: 'unplugged', power: null, target: 90, targets: [50, 60, 70, 80, 85, 90, 95, 100], readyAt: null, lastSessionKwh: 38.4, ...p });
const fordClimate = (p: Partial<Climate>): Climate => ({
  running: false,
  remoteStart: true,
  minutesLeft: null,
  cabin: 6,
  outside: 3,
  target: 21,
  extras: [
    { id: 'windscreen', label: 'Windscreen', on: false },
    { id: 'rear', label: 'Rear window', on: false },
    { id: 'wheel', label: 'Steering wheel', on: false },
    { id: 'seat-driver', label: 'Driver seat', on: false }
  ],
  ...p
});

function ford(id: StudioMobilityId, now: number): Vehicle {
  const base: Vehicle = {
    id: 'ford',
    kind: 'car',
    powertrain: 'ev',
    name: 'The Ford',
    make: 'Ford',
    model: 'Mustang Mach-E',
    image: null,
    integration: 'fordpass',
    seen: now - 4 * 60_000,
    asleep: false,
    offline: false,
    level: 74,
    range: 318,
    unit: 'km',
    odometer: 21_436,
    charging: fordCharging({}),
    climate: fordClimate({}),
    security: { locked: true, alarm: 'armed', open: [], stolen: false, crashed: false },
    place: { ...HOME, zone: 'Home', address: '12 Linden Street', at: now - 4 * 60_000 },
    motion: { moving: false, speed: 0, on: false, gear: 'P', speeds: speeds(now) },
    today: 0,
    lastTrip: { title: null, distance: 18.2, minutes: 31, endedAt: at(17, 48) - 86400_000, energyKwh: 3.6, co2SavedKg: null, calories: null },
    lifetime: null,
    mode: null,
    condition: {
      tyres: { unit: 'bar', fl: 2.8, fr: 2.8, rl: 2.9, rr: 2.9, low: 2.4 },
      battery12v: 12.6,
      oil: null,
      batteryHealth: 97,
      batteryKwh: 91,
      batteryTemp: 16,
      warnings: [],
      software: { installed: '2.3.1', latest: null, stage: 'idle', lastUpdate: at(3, 10) - 9 * 86400_000, nextWindow: null, blocked: null, auto: true },
      batteryInserted: null
    },
    actions: ['lock', 'unlock', 'climate', 'charge-start', 'charge-pause', 'target', 'honk', 'refresh']
  };
  if (id === 'charging') return { ...base, condition: { ...base.condition, software: { ...(base.condition.software as NonNullable<Vehicle['condition']['software']>), stage: 'downloading' } }, level: 61, range: 262, charging: fordCharging({ plugged: true, state: 'charging', power: 7.2, readyAt: at(7, 10) }), security: { ...base.security }, today: 0 };
  if (id === 'ready' || id === 'fleet') return { ...base, level: 90, range: 386, charging: fordCharging({ plugged: true, state: 'complete', lastSessionKwh: 21.8 }), climate: fordClimate({ running: true, minutesLeft: 8, cabin: 17, extras: fordClimate({}).extras.map((e) => ({ ...e, on: e.id === 'windscreen' || e.id === 'seat-driver' })) }) };
  if (id === 'driving')
    return {
      ...base,
      level: 66,
      range: 281,
      charging: fordCharging({}),
      climate: fordClimate({ cabin: 20, outside: 7 }),
      security: { ...base.security, locked: true, alarm: 'disarmed' },
      place: { lat: 50.8421, lon: 4.3802, zone: null, address: 'Harbour Road', at: now - 30_000 },
      motion: { moving: true, speed: 54, on: true, gear: 'D', speeds: speeds(now) },
      today: 24.6,
      lastTrip: { title: null, distance: 18.4, minutes: 29, endedAt: at(8, 31), energyKwh: 3.4, co2SavedKg: null, calories: null }
    };
  // attention
  return {
    ...base,
    level: 17,
    range: 71,
    charging: fordCharging({}),
    security: { locked: false, alarm: 'disarmed', open: [{ what: 'window', where: 'rear left' }], stolen: false, crashed: false },
    condition: {
      ...base.condition,
      tyres: { unit: 'bar', fl: 2.1, fr: 2.8, rl: 2.9, rr: 2.9, low: 2.4 },
      battery12v: 11.9,
      warnings: [],
      software: { installed: '2.3.1', latest: null, stage: 'queued', lastUpdate: null, nextWindow: at(2, 0) + 86400_000, blocked: '12 V battery low', auto: true }
    },
    today: 41.3,
    lastTrip: { title: null, distance: 22.9, minutes: 38, endedAt: at(18, 52), energyKwh: 4.8, co2SavedKg: null, calories: null }
  };
}

function cowboy(id: StudioMobilityId, now: number): Vehicle {
  const atWork = id === 'driving';
  const base: Vehicle = {
    id: 'cowboy',
    kind: 'bike',
    powertrain: 'ev',
    name: 'Cowboy',
    make: 'Cowboy',
    model: 'Cowboy 4',
    image: null,
    integration: 'cowboy',
    seen: now - 2 * 60_000,
    asleep: false,
    offline: false,
    level: id === 'ready' || id === 'fleet' ? 100 : id === 'attention' ? 38 : 64,
    range: id === 'ready' || id === 'fleet' ? 70 : id === 'attention' ? 27 : 45,
    unit: 'km',
    odometer: 3_812,
    charging: null,
    climate: null,
    security: { locked: null, alarm: null, open: [], stolen: false, crashed: false },
    place: atWork ? { ...WORK, zone: 'Work', address: 'Station Square', at: now - 2 * 60_000 } : { ...HOME, zone: 'Home', address: '12 Linden Street', at: now - 2 * 60_000 },
    motion: null,
    today: atWork ? 6.1 : 0,
    lastTrip: { title: atWork ? 'Morning ride' : 'Evening ride', distance: 6.1, minutes: 19, endedAt: atWork ? at(8, 52) : at(18, 24) - 86400_000, energyKwh: null, co2SavedKg: 0.9, calories: 142 },
    lifetime: { co2SavedKg: 412, hours: 214 },
    mode: 'Adaptive',
    condition: { tyres: null, battery12v: null, oil: null, batteryHealth: 96, batteryKwh: null, batteryTemp: null, warnings: [], software: { installed: '1.18.4', latest: id === 'attention' ? '1.19.0' : null, stage: id === 'attention' ? 'available' : 'idle', lastUpdate: null, nextWindow: null, blocked: null, auto: null }, batteryInserted: id !== 'attention' },
    actions: []
  };
  return base;
}

function volvo(now: number): Vehicle {
  return {
    id: 'volvo',
    kind: 'car',
    powertrain: 'ev',
    name: 'EX30',
    make: 'Volvo',
    model: 'EX30',
    image: null,
    integration: 'volvo',
    seen: now - 52 * 60_000,
    asleep: true,
    offline: false,
    level: 48,
    range: 160,
    unit: 'km',
    odometer: 8_204,
    charging: { plugged: false, state: 'unplugged', power: null, target: 80, targets: [], readyAt: null, lastSessionKwh: null },
    climate: { running: false, minutesLeft: null, cabin: null, outside: 3, target: null, extras: [] },
    security: { locked: true, alarm: null, open: [], stolen: false, crashed: false },
    place: { lat: 50.8471, lon: 4.3519, zone: 'Home', address: null, at: now - 52 * 60_000 },
    motion: null,
    today: null,
    lastTrip: null,
    lifetime: null,
    mode: null,
    condition: { tyres: null, battery12v: null, oil: null, batteryHealth: null, batteryKwh: null, batteryTemp: null, warnings: ['Service due in 21 days'], software: null, batteryInserted: null },
    actions: ['lock', 'unlock', 'climate', 'refresh']
  };
}

export function studioMobilityHome(id: StudioMobilityId): MobilityHome {
  const now = NOW[id];
  if (id === 'quiet') {
    const car = ford('charging', now);
    const bike = cowboy('ready', now);
    return {
      now,
      vehicles: [
        { ...car, asleep: true, seen: now - 3 * 3600_000, charging: car.charging && { ...car.charging, state: 'complete', power: null, readyAt: null }, level: 90, range: 386 },
        { ...bike, offline: true, seen: now - 26 * 3600_000, level: null, range: null, odometer: null, place: null, today: null, lastTrip: null, lifetime: null, mode: null, condition: { ...bike.condition, batteryHealth: null, software: null, batteryInserted: null } }
      ]
    };
  }
  const vehicles = [ford(id, now), ...(id === 'fleet' ? [volvo(now)] : []), cowboy(id, now)];
  return { now, vehicles };
}
