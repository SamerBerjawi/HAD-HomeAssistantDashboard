/**
 * FordPass (marq24/ha-fordpass, registry platform "fordpass"). Keys are the integration's tag
 * keys, which it also uses as translation_key and unique_id suffix ("soc", "elveh", "doorlock",
 * "rcctemperature", …). Read from the integration's source on 2026-11-27; state values Ford sends
 * (charging, plug, alarm, deep sleep) are matched loosely because they are Ford's backend strings.
 *
 * Not offered by FordPass: battery health, distance today, the car's address,
 * the version of a waiting update (only the installed one, once installed).
 */
import type { HAState } from '@/types';
import type { Charging, ChargeState, Climate, Opening, Software, Tyres, UpdateStage, Vehicle } from '../../mobilityHome';
import { call, devicePicture, deviceName, offlineVehicle, distanceUnit, entry, minutesOf, newest, num, on, optionFor, placeOf, speedOf, state, time, unitOf, words, type Device, type HaContext, type VehicleAdapter, type VehicleSource } from '../kit';

const EXTRAS: { id: string; label: string; domain: 'switch' | 'select'; key: string }[] = [
  { id: 'windscreen', label: 'Windscreen', domain: 'switch', key: 'rccdefrostfront' },
  { id: 'rear', label: 'Rear window', domain: 'switch', key: 'rccdefrostrear' },
  { id: 'wheel', label: 'Steering wheel', domain: 'switch', key: 'rccsteeringwheel' },
  { id: 'seat-driver', label: 'Driver seat', domain: 'select', key: 'rccseatfrontleft' },
  { id: 'seat-passenger', label: 'Passenger seat', domain: 'select', key: 'rccseatfrontright' },
  { id: 'seat-rear-left', label: 'Rear left seat', domain: 'select', key: 'rccseatrearleft' },
  { id: 'seat-rear-right', label: 'Rear right seat', domain: 'select', key: 'rccseatrearright' }
];

const seatOn = (s: HAState | null) => !!s && !/off/i.test(s.state);
function seatOption(s: HAState | null, want: boolean): string | null {
  const opts: string[] = Array.isArray(s?.attributes?.options) ? s.attributes.options.map(String) : [];
  if (!want) return opts.find((o) => /off/i.test(o)) ?? null;
  return opts.find((o) => /heat/i.test(o) && /high|3/i.test(o)) ?? opts.find((o) => /heat/i.test(o)) ?? opts.find((o) => !/off/i.test(o)) ?? null;
}

function chargeState(plugged: boolean, s: string): ChargeState {
  if (!plugged) return 'unplugged';
  if (/in_?progress|^charging/i.test(s)) return 'charging';
  if (/complet|full/i.test(s)) return 'complete';
  if (/sched|wait|pend/i.test(s)) return 'waiting';
  return 'stopped';
}

/** Attribute values that say something is open: doors / bonnet / boot / windows. */
function openings(s: HAState | null, fallback: Opening): { what: Opening; where: string }[] {
  if (!s) return [];
  return Object.entries(s.attributes ?? {})
    .filter(([k, v]) => typeof v === 'string' && !/friendly|icon|unit|attribution|device_class/i.test(k) && /open|ajar/i.test(v) && !/closed/i.test(v))
    .map(([k]) => {
      const what: Opening = /hood|bonnet/i.test(k) ? 'bonnet' : /tailgate|trunk|boot|liftgate|frunk/i.test(k) ? 'boot' : fallback;
      return { what, where: what === fallback ? words(k) : '' };
    });
}

function tyres(s: HAState | null): Tyres | null {
  if (!s) return null;
  const a = s.attributes ?? {};
  const read = (k: string) => num(a[k]);
  const fl = read('frontLeft');
  const fr = read('frontRight');
  const rl = read('rearLeft');
  const rr = read('rearRight');
  if ([fl, fr, rl, rr].every((x) => x === null)) return null;
  const sample = String(a.frontLeft ?? a.frontRight ?? '') + ' ' + unitOf(s);
  const unit = /psi/i.test(sample) ? 'psi' : /kpa/i.test(sample) ? 'kPa' : 'bar';
  const placard = num(a.frontLeft_placard_max ?? a.frontLeft_placard);
  const low = placard ? Math.round(placard * 0.8 * 10) / 10 : unit === 'psi' ? 32 : unit === 'kPa' ? 220 : 2.2;
  return { unit, fl, fr, rl, rr, low };
}

/** Ford's update lifecycle ("artifact_retrieval_in_progress → installation_queued → deploying → success / failure") as a stage. */

/**
 * FordPass's picture of the car: its `image.fordpass_<vin>_vehicleimage` entity (owner, 2026-11-27).
 * By key on the device first; that entity is not always tied to the car's device, so then by its
 * entity id, matched on the VIN in the device name ("VIN: …") or, with one Ford, the only one.
 */
export function fordPicture(d: Device, ctx: HaContext): string | null {
  const pic = (id: string | undefined) => {
    const p = id ? ctx.states[id]?.attributes?.entity_picture : null;
    return typeof p === 'string' && p.trim() ? p.trim() : null;
  };
  const own = pic(entry(d, 'image', 'vehicleimage')?.entity_id);
  if (own) return own;
  const ids = Object.keys(ctx.states).filter((id) => /^image\.fordpass_.*vehicle_?image$/i.test(id));
  const vin = /([A-HJ-NPR-Z0-9]{17})/i.exec(d.info?.name ?? '')?.[1]?.toLowerCase() ?? null;
  const byVin = vin ? ids.find((id) => id.toLowerCase().includes(vin)) : undefined;
  return pic(byVin ?? (ids.length === 1 ? ids[0] : undefined)) ?? devicePicture(d, ctx);
}

export function fordUpdateStage(raw: string): UpdateStage {
  if (/fail|error|abort|cancel/i.test(raw)) return 'failed';
  if (/retriev|download/i.test(raw)) return 'downloading';
  if (/queue|pending|schedul|wait|ready/i.test(raw)) return 'queued';
  if (/deploy|install|activat|progress/i.test(raw)) return 'installing';
  return 'idle';
}

const READINESS: Record<string, string> = { low_lv_battery: '12 V battery low', short_safe_window: 'not enough time to install' };

/** Software from the firmware sensors: where an update stands, the next window, what blocks it, the last install. */
function software(s: (domain: string, key: string) => HAState | null): Software | null {
  const status = s('sensor', 'firmwareupgstatus');
  const last = s('sensor', 'lastfirmwareupdate');
  const schedule = s('sensor', 'otaschedule');
  const ready = s('sensor', 'otareadiness');
  const auto = s('switch', 'autosoftwareupdates');
  if (!status && !last && !schedule) return null;
  const raw = String(status?.attributes?.rawState ?? status?.state ?? '');
  const stage = /unsupported/i.test(raw) ? 'idle' : fordUpdateStage(raw);
  return {
    installed: last?.attributes?.firmwareVersion ? String(last.attributes.firmwareVersion) : null,
    latest: null,
    stage,
    lastUpdate: time(last?.state),
    nextWindow: time(schedule?.state),
    blocked: stage === 'queued' || stage === 'failed' ? (READINESS[String(ready?.state ?? '').toLowerCase()] ?? null) : null,
    auto: auto ? on(auto) : null
  };
}

function build(d: Device, ctx: HaContext): VehicleSource | null {
  const s = (domain: string, key: string) => state(ctx, d, domain, key);
  const id = (domain: string, key: string) => entry(d, domain, key)?.entity_id ?? null;
  const soc = s('sensor', 'soc');
  const fuel = s('sensor', 'fuel');
  const elVeh = s('sensor', 'elveh');
  const fuelRange = s('sensor', 'fuelrange');
  const tracker = s('device_tracker', 'tracker');
  const odometer = s('sensor', 'odometer');
  if (!soc && !fuel && !odometer && !tracker) {
    // Its entities exist but report nothing: the integration is down (often a FordPass login).
    if (!entry(d, 'sensor', 'odometer') && !entry(d, 'sensor', 'soc') && !entry(d, 'device_tracker', 'tracker')) return null;
    return offlineVehicle(d, ctx, { id: `fordpass:${d.id}`, kind: 'car', name: deviceName(d, d.info?.model ?? 'Ford'), make: 'Ford', model: d.info?.model ?? null, integration: 'fordpass', image: ctx.images?.car ?? null, picture: fordPicture(d, ctx) });
  }

  const fuelKm = num(fuelRange?.state);
  const powertrain = soc ? (fuelKm && fuelKm > 0 ? 'phev' : 'ev') : 'ice';
  const rangeState = powertrain === 'ice' ? fuelRange : elVeh;

  // Charging (EVs)
  const plug = s('sensor', 'elvehplug');
  const chg = s('sensor', 'elvehcharging');
  const target = s('select', 'elvehtargetcharge');
  const plugged = !!plug && /^(connected|plugged|true|on)/i.test(plug.state) && !/dis|not|unplug/i.test(plug.state);
  const readyKey = chg ? Object.keys(chg.attributes ?? {}).find((k) => /end.?time|estimat.*(end|finish)/i.test(k)) : undefined;
  const session = s('sensor', 'energytransferlogentry');
  const sessionKey = session ? Object.keys(session.attributes ?? {}).find((k) => /energy.*(consumed|transferred|added)|^energy$/i.test(k)) : undefined;
  const charging: Charging | null =
    powertrain !== 'ice' && (plug || chg)
      ? {
          plugged,
          state: chargeState(plugged, chg?.state ?? ''),
          power: num(s('sensor', 'elvehchargingpower')?.state),
          target: num(target?.state),
          targets: Array.isArray(target?.attributes?.options) ? (target.attributes.options as unknown[]).map((o) => num(o)).filter((n): n is number => n !== null).sort((a, b) => a - b) : [],
          readyAt: readyKey ? time(chg?.attributes?.[readyKey]) : null,
          lastSessionKwh: sessionKey ? num(session?.attributes?.[sessionKey]) : null
        }
      : null;

  // Remote start and climate
  const remote = s('switch', 'ignition');
  const remoteStatus = s('sensor', 'remotestartstatus');
  const tempNumber = s('number', 'rcctemperature');
  const tempSelect = s('select', 'rcctemperature');
  const tempRaw = tempNumber?.state ?? tempSelect?.state ?? null;
  const extras = EXTRAS.map((x) => ({ x, st: s(x.domain, x.key) })).filter((e) => e.st);
  // The "ignition" switch is FordPass's remote start (on while Ford's countdown runs); the status
  // sensor says "Active" or "Inactive" (exact words: "Inactive" contains "active"). The countdown
  // sensor is Ford's raw timer without the expiry check, so it counts only while running.
  const running = remote ? on(remote) : /^active$/i.test(remoteStatus?.state?.trim() ?? '');
  const left = minutesOf(s('sensor', 'remotestartcountdown'));
  const climate: Climate | null =
    remote || tempNumber || tempSelect
      ? {
          running,
          minutesLeft: running && left !== null && left > 0 ? left : null,
          remoteStart: !!remote,
          cabin: num(s('sensor', 'cabintemperature')?.state),
          outside: num(s('sensor', 'outsidetemp')?.state),
          target: tempRaw === null ? null : /^hi/i.test(tempRaw) ? 30.5 : /^lo/i.test(tempRaw) ? 15.5 : num(tempRaw.replace('_', '.')),
          extras: extras.map(({ x, st }) => ({ id: x.id, label: x.label, on: x.domain === 'switch' ? on(st) : seatOn(st) }))
        }
      : null;

  // Security
  const lock = s('lock', 'doorlock');
  const alarm = s('sensor', 'alarm');
  const alarmState = alarm?.state ?? '';
  const openNow = [...openings(s('sensor', 'doorstatus'), 'door'), ...openings(s('sensor', 'windowposition'), 'window')];

  // Motion
  const speedSt = s('sensor', 'speed');
  const speed = speedOf(speedSt);
  const gear = s('sensor', 'gearleverposition')?.state ?? null;
  const ignition = s('sensor', 'ignitionstatus')?.state ?? '';
  const speedId = id('sensor', 'speed');

  // Last trip
  const trip = s('sensor', 'lastenergyconsumed');
  const tripDist = num(trip?.attributes?.tripDistanceTraveled);
  const tripEnd = time(trip?.attributes?.tripUpdateTime) ?? time(trip?.last_changed);

  // Condition
  const battery = s('sensor', 'battery');
  const kwh = num(elVeh?.attributes?.maximumBatteryCapacity);
  const messages = num(s('sensor', 'messages')?.state) ?? 0;
  const sleep = s('sensor', 'deepsleep')?.state ?? '';

  const vehicle: Vehicle = {
    id: `fordpass:${d.id}`,
    kind: 'car',
    powertrain,
    name: deviceName(d, d.info?.model ?? 'Ford'),
    make: 'Ford',
    model: d.info?.model ?? null,
    image: ctx.images?.car ?? null,
    picture: fordPicture(d, ctx),
    deviceId: d.info?.id ?? null,
    integration: 'fordpass',
    seen: newest(soc, tracker, odometer, lock),
    offline: false,
    asleep: /deep|sleep|^on$|true/i.test(sleep) && !/not|off|false|^no/i.test(sleep),
    level: num((soc ?? fuel)?.state),
    range: num(rangeState?.state),
    unit: distanceUnit(rangeState ?? odometer),
    odometer: num(odometer?.state),
    charging,
    climate,
    security: {
      locked: lock ? (lock.state === 'locked' ? true : /unlock|open/.test(lock.state) ? false : null) : null,
      alarm: alarm ? (/trigger|alarming|sounding/i.test(alarmState) ? 'triggered' : /^(armed|set)/i.test(alarmState) ? 'armed' : 'disarmed') : null,
      open: openNow,
      stolen: false,
      crashed: false
    },
    place: placeOf(ctx, tracker),
    motion:
      speedSt || gear
        ? { moving: (speed ?? 0) > 3, speed, on: /on|run|start/i.test(ignition) && !/off/i.test(ignition), gear: gear ? gear.charAt(0).toUpperCase() : null, speeds: (speedId && ctx.speeds?.[speedId]) || [] }
        : null,
    today: null,
    lastTrip:
      tripDist !== null && tripEnd !== null
        ? { title: null, distance: tripDist, minutes: Math.round(num(trip?.attributes?.tripDuration) ?? 0), endedAt: tripEnd, energyKwh: num(trip?.state), co2SavedKg: null, calories: null }
        : null,
    lifetime: null,
    mode: null,
    condition: {
      tyres: tyres(s('sensor', 'tirepressure')),
      battery12v: num(battery?.attributes?.batteryVoltage),
      oil: num(s('sensor', 'oil')?.state),
      batteryHealth: null,
      batteryKwh: kwh !== null && kwh >= 5 && kwh <= 250 ? kwh : null,
      batteryTemp: num(chg?.attributes?.batteryTemperature),
      warnings: messages > 0 ? [messages === 1 ? '1 message from Ford' : `${messages} messages from Ford`] : [],
      software: software(s),
      batteryInserted: null
    },
    actions: [
      ...(lock ? (['lock', 'unlock'] as const) : []),
      ...(remote ? (['climate'] as const) : []),
      ...(id('button', 'evstart') || id('switch', 'elvehcharge') ? (['charge-start'] as const) : []),
      ...(id('button', 'evpause') || id('switch', 'elvehcharge') ? (['charge-pause'] as const) : []),
      ...(target ? (['target'] as const) : []),
      ...(id('button', 'hafshort') || id('button', 'hafdefault') ? (['honk'] as const) : []),
      ...(id('button', 'request_refresh') ? (['refresh'] as const) : [])
    ]
  };

  return {
    vehicle,
    speedEntity: speedId,
    calls: (a) => {
      switch (a.type) {
        case 'lock':
          return call('lock', 'lock', id('lock', 'doorlock'), {}, { state: 'locked' });
        case 'unlock':
          return call('lock', 'unlock', id('lock', 'doorlock'), {}, { state: 'unlocked' });
        case 'climate':
          return call('switch', a.on ? 'turn_on' : 'turn_off', id('switch', 'ignition'), {}, { state: a.on ? 'on' : 'off' });
        case 'extra': {
          const x = EXTRAS.find((e) => e.id === a.id);
          if (!x) return [];
          if (x.domain === 'switch') return call('switch', a.on ? 'turn_on' : 'turn_off', id('switch', x.key), {}, { state: a.on ? 'on' : 'off' });
          const option = seatOption(s('select', x.key), a.on);
          return option ? call('select', 'select_option', id('select', x.key), { option }, { state: option }) : [];
        }
        case 'charge': {
          const button = id('button', a.on ? 'evstart' : 'evpause');
          return button ? call('button', 'press', button) : call('switch', a.on ? 'turn_on' : 'turn_off', id('switch', 'elvehcharge'), {}, { state: a.on ? 'on' : 'off' });
        }
        case 'target': {
          const option = optionFor(target?.attributes?.options, a.pct);
          return option ? call('select', 'select_option', id('select', 'elvehtargetcharge'), { option }, { state: option }) : [];
        }
        case 'temp': {
          if (tempNumber) return call('number', 'set_value', id('number', 'rcctemperature'), { value: a.value }, { state: String(a.value) });
          const option = optionFor(tempSelect?.attributes?.options, a.value);
          return option ? call('select', 'select_option', id('select', 'rcctemperature'), { option }, { state: option }) : [];
        }
        case 'honk':
          return call('button', 'press', id('button', 'hafshort') ?? id('button', 'hafdefault'));
        case 'refresh':
          return call('button', 'press', id('button', 'request_refresh'));
      }
    }
  };
}

export const fordpass: VehicleAdapter = { id: 'fordpass', platform: 'fordpass', build };
