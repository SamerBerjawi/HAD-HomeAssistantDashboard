/**
 * The fallback for a make without its own adapter yet (Tesla, BMW, Mercedes, Volvo, Kia…). It
 * reads what most car integrations share, by device class and common names: a battery level, a
 * range in km or mi, an odometer, a lock, a tracker, a plug or charging sensor. A device counts as a
 * vehicle only with both a battery level and a range, so phones and sensors are left alone. Only
 * lock and unlock are offered; a make's own adapter adds the rest.
 */
import type { HAState } from '@/types';
import type { Vehicle } from '../../mobilityHome';
import { call, devicePicture, deviceName, distanceUnit, newest, num, on, placeOf, unitOf, type Device, type HaContext, type VehicleAdapter, type VehicleSource } from '../kit';

const DISTANCE = new Set(['km', 'mi']);

function build(d: Device, ctx: HaContext): VehicleSource | null {
  const all = d.entries.map((e) => ({ e, st: ctx.states[e.entity_id] })).filter((x): x is { e: (typeof d.entries)[number]; st: HAState } => !!x.st && !['unavailable', 'unknown'].includes(x.st.state));
  const key = (x: (typeof all)[number]) => `${x.e.translation_key ?? ''} ${x.e.entity_id}`.toLowerCase();
  const sensor = (test: (x: (typeof all)[number]) => boolean) => all.find((x) => x.e.entity_id.startsWith('sensor.') && test(x))?.st ?? null;
  const level = sensor((x) => x.st.attributes?.device_class === 'battery' && !/12v|12_v|aux|phone|key|remote/.test(key(x)));
  const range = sensor((x) => DISTANCE.has(unitOf(x.st)) && /range/.test(key(x)));
  if (!level || !range) return null;
  const odometer = sensor((x) => DISTANCE.has(unitOf(x.st)) && /odometer|mileage|total_distance/.test(key(x)));
  const lockSt = all.find((x) => x.e.entity_id.startsWith('lock.'))?.st ?? null;
  const tracker = all.find((x) => x.e.entity_id.startsWith('device_tracker.'))?.st ?? null;
  const plug = all.find((x) => x.e.entity_id.startsWith('binary_sensor.') && (x.st.attributes?.device_class === 'plug' || /plug|cable/.test(key(x))))?.st ?? null;
  const chg = all.find((x) => x.e.entity_id.startsWith('binary_sensor.') && (x.st.attributes?.device_class === 'battery_charging' || /charging/.test(key(x))))?.st ?? null;
  const make = d.info?.manufacturer ?? null;

  const vehicle: Vehicle = {
    id: `generic:${d.id}`,
    kind: 'car',
    powertrain: 'ev',
    name: deviceName(d, [make, d.info?.model].filter(Boolean).join(' ') || 'Car'),
    make,
    model: d.info?.model ?? null,
    image: null,
    picture: devicePicture(d, ctx),
    deviceId: d.info?.id ?? null,
    integration: d.entries[0]?.platform ?? 'generic',
    seen: newest(level, range, tracker),
    offline: false,
    asleep: false,
    level: num(level.state),
    range: num(range.state),
    unit: distanceUnit(range),
    odometer: num(odometer?.state),
    charging: plug || chg ? { plugged: on(plug) || on(chg), state: on(chg) ? 'charging' : on(plug) ? 'stopped' : 'unplugged', power: null, target: null, targets: [], readyAt: null, lastSessionKwh: null } : null,
    climate: null,
    security: { locked: lockSt ? lockSt.state === 'locked' : null, alarm: null, open: [], stolen: false, crashed: false },
    place: placeOf(ctx, tracker),
    motion: null,
    today: null,
    lastTrip: null,
    lifetime: null,
    mode: null,
    condition: { tyres: null, battery12v: null, oil: null, batteryHealth: null, batteryKwh: null, batteryTemp: null, warnings: [], software: null, batteryInserted: null },
    actions: lockSt ? ['lock', 'unlock'] : []
  };
  return {
    vehicle,
    odometerEntity: odometer?.entity_id ?? null,
    calls: (a) => (a.type === 'lock' || a.type === 'unlock' ? call('lock', a.type, lockSt?.entity_id, {}, { state: a.type === 'lock' ? 'locked' : 'unlocked' }) : [])
  };
}

export const generic: VehicleAdapter = { id: 'generic', platform: null, build };
