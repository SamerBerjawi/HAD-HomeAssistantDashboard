/**
 * Cowboy (elsbrock/cowboy-ha, registry platform "cowboy"). Keys are its translation keys, also the
 * unique_id suffix ("battery_state_of_charge", "remaining_range", "last_trip_title", …). Read from the
 * integration's source on 2026-11-27. Read only: no lock, ring or refresh, so the bike has no actions.
 */
import type { Vehicle } from '../../mobilityHome';
import { devicePicture, deviceName, offlineVehicle, distanceUnit, minutesOf, newest, num, on, placeOf, state, time, unitOf, type Device, type HaContext, type VehicleAdapter, type VehicleSource } from '../kit';

const MODES: [RegExp, string][] = [
  [/assistance_off/, 'Assistance off'],
  [/adaptive_eco/, 'Adaptive eco'],
  [/adaptive/, 'Adaptive'],
  [/offroad/, 'Off-road'],
  [/static/, 'Static']
];
const modeName = (s: string | null) => (s ? (MODES.find(([re]) => re.test(s))?.[1] ?? s.replace(/_/g, ' ')) : null);
/** CO₂ in kg (the integration reports grams). */
const kg = (v: number | null, unit: string) => (v === null ? null : Math.round((unit === 'g' ? v / 1000 : v) * 10) / 10);

function build(d: Device, ctx: HaContext): VehicleSource | null {
  const s = (domain: string, key: string) => state(ctx, d, domain, key);
  const level = s('sensor', 'battery_state_of_charge');
  const odometer = s('sensor', 'total_distance');
  const tracker = d.entries.map((e) => ctx.states[e.entity_id]).find((x) => x?.entity_id.startsWith('device_tracker.') && x.state !== 'unavailable') ?? null;
  if (!level && !odometer && !tracker) {
    if (!d.entries.some((e) => e.translation_key === 'battery_state_of_charge' || e.translation_key === 'total_distance')) return null;
    return offlineVehicle(d, ctx, { id: `cowboy:${d.id}`, kind: 'bike', name: deviceName(d, 'Cowboy'), make: 'Cowboy', model: d.info?.model ?? null, integration: 'cowboy', image: ctx.images?.bike ?? null });
  }

  const range = s('sensor', 'remaining_range');
  const co2 = s('sensor', 'total_co2_saved');
  const hours = minutesOf(s('sensor', 'total_duration'));
  const update = d.entries.map((e) => ctx.states[e.entity_id]).find((x) => x?.entity_id.startsWith('update.')) ?? null;
  const tripDist = num(s('sensor', 'last_trip_distance')?.state);
  const tripEnd = time(s('sensor', 'last_trip_ended_at')?.state);
  const tripCo2 = s('sensor', 'last_trip_co2_saved');
  const inserted = s('binary_sensor', 'battery_inserted');

  const vehicle: Vehicle = {
    id: `cowboy:${d.id}`,
    kind: 'bike',
    powertrain: 'ev',
    name: deviceName(d, 'Cowboy'),
    make: 'Cowboy',
    model: d.info?.model ?? null,
    image: ctx.images?.bike ?? null,
    picture: devicePicture(d, ctx),
    deviceId: d.info?.id ?? null,
    integration: 'cowboy',
    seen: time(s('sensor', 'seen_at')?.state) ?? newest(level, tracker),
    offline: false,
    asleep: false,
    level: num(level?.state),
    range: num(range?.state),
    unit: distanceUnit(range ?? odometer),
    odometer: num(odometer?.state),
    charging: null,
    climate: null,
    security: { locked: null, alarm: null, open: [], stolen: on(s('binary_sensor', 'stolen')), crashed: on(s('binary_sensor', 'crashed')) },
    place: placeOf(ctx, tracker, typeof tracker?.attributes?.location_name === 'string' ? tracker.attributes.location_name : null, time(tracker?.attributes?.location_received_at)),
    motion: null,
    today: num(s('sensor', 'today_distance')?.state),
    lastTrip:
      tripDist !== null && tripEnd !== null
        ? {
            title: s('sensor', 'last_trip_title')?.state ?? null,
            distance: tripDist,
            minutes: minutesOf(s('sensor', 'last_trip_duration')) ?? 0,
            endedAt: tripEnd,
            energyKwh: null,
            co2SavedKg: kg(num(tripCo2?.state), unitOf(tripCo2)),
            calories: num(s('sensor', 'last_trip_calories')?.state)
          }
        : null,
    lifetime: co2 || hours !== null ? { co2SavedKg: kg(num(co2?.state), unitOf(co2)) !== null ? Math.round(kg(num(co2?.state), unitOf(co2)) as number) : null, hours: hours !== null ? Math.round(hours / 60) : null } : null,
    mode: modeName(s('sensor', 'last_ride_mode')?.state ?? null),
    condition: {
      tyres: null,
      battery12v: null,
      oil: null,
      batteryHealth: num(s('sensor', 'battery_health')?.state),
      batteryKwh: null,
      batteryTemp: null,
      warnings: [],
      software: update
        ? {
            installed: update.attributes?.installed_version ? String(update.attributes.installed_version) : null,
            latest: update.attributes?.latest_version ? String(update.attributes.latest_version) : null,
            stage: update.attributes?.in_progress ? 'installing' : update.state === 'on' ? 'available' : 'idle',
            lastUpdate: null,
            nextWindow: null,
            blocked: null,
            auto: null
          }
        : null,
      batteryInserted: inserted ? on(inserted) : null
    },
    actions: []
  };
  return { vehicle, calls: () => [] };
}

export const cowboy: VehicleAdapter = { id: 'cowboy', platform: 'cowboy', build };
