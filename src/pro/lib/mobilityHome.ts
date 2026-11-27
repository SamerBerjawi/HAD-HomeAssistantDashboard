/**
 * The Mobility page's model, restarted 2026-11-26 (docs/pro-ui/MOBILITY.md §0). Brand-neutral on
 * purpose: every car or bike, whatever integration it comes from (FordPass and Cowboy today;
 * Tesla, BMW, Mercedes, Volvo and others later), is mapped by an adapter into this one shape, and
 * the page draws only what a vehicle has. A part an integration does not offer is null (or an
 * empty list) and its section is left out, so a new car needs a new adapter, not a new page.
 *
 * Pure. The Mobility Studio fills it from sample vehicles; the live page will fill it from Home
 * Assistant once a direction is approved.
 */

export type VehicleKind = 'car' | 'bike';
export type Powertrain = 'ev' | 'phev' | 'ice';
export type DistanceUnit = 'km' | 'mi';

export type ChargeState = 'charging' | 'complete' | 'stopped' | 'waiting' | 'unplugged';

export interface Charging {
  plugged: boolean;
  state: ChargeState;
  /** kW while charging. */
  power: number | null;
  /** The charge it stops at, %. */
  target: number | null;
  /** Choices for the target (FordPass: 50–100 in steps); empty when it cannot be set. */
  targets: number[];
  /** When it reaches the target (epoch ms), if the integration says. */
  readyAt: number | null;
  /** The last session, kWh. */
  lastSessionKwh: number | null;
}

export interface Climate {
  running: boolean;
  /** Minutes left of a remote start. */
  minutesLeft: number | null;
  cabin: number | null;
  outside: number | null;
  target: number | null;
  /** What can be switched on with the climate (FordPass: windscreen, rear window, seats, wheel). */
  extras: { id: string; label: string; on: boolean }[];
  /** The climate comes on by starting the car remotely (FordPass's remote start switch), so the control says so. */
  remoteStart?: boolean;
}

export type Opening = 'door' | 'window' | 'boot' | 'bonnet' | 'charge-port';

export interface Security {
  locked: boolean | null;
  alarm: 'armed' | 'disarmed' | 'triggered' | null;
  /** What is open right now. */
  open: { what: Opening; where: string }[];
  /** Bikes: Cowboy reports stolen and crashed. */
  stolen: boolean;
  crashed: boolean;
}

export interface Place {
  lat: number;
  lon: number;
  /** The HA zone name ("Home", "Work"), or null when in none. */
  zone: string | null;
  address: string | null;
  /** When the position was last reported (epoch ms). */
  at: number | null;
}

export interface Motion {
  moving: boolean;
  speed: number | null;
  /** Ignition / power on. */
  on: boolean;
  gear: string | null;
  /** Speed over the last 24 h, one value per 15 min, oldest first. */
  speeds: number[];
}

export interface Trip {
  title: string | null;
  distance: number;
  minutes: number;
  endedAt: number;
  /** EVs: energy used, kWh. Bikes: CO₂ saved, kg and calories. */
  energyKwh: number | null;
  co2SavedKg: number | null;
  calories: number | null;
}

export interface Tyres {
  unit: string;
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
  /** Pressures below this are flagged. */
  low: number;
}

/** Where a software (car) or firmware (bike) update stands. */
export type UpdateStage = 'idle' | 'available' | 'downloading' | 'queued' | 'installing' | 'failed';

export interface Software {
  /** The version installed, when the make says. */
  installed: string | null;
  /** A newer version on offer (Cowboy names it; FordPass does not). */
  latest: string | null;
  stage: UpdateStage;
  /** When the last update was installed (epoch ms). */
  lastUpdate: number | null;
  /** The next window the car may install in (FordPass's weekly schedule). */
  nextWindow: number | null;
  /** Why a waiting update cannot install yet ("12 V battery low"). */
  blocked: string | null;
  /** Automatic updates on, when the make reports it. */
  auto: boolean | null;
}

export interface Condition {
  tyres: Tyres | null;
  /** 12 V battery, volts (or % on some makes). */
  battery12v: number | null;
  /** Oil life, % (ICE / PHEV). */
  oil: number | null;
  /** Traction (drive) battery health, % of its capacity when new (Cowboy reports it; cars when the integration does). */
  batteryHealth: number | null;
  /** Traction battery: usable capacity, kWh, when the integration reports it. */
  batteryKwh: number | null;
  /** Traction battery temperature, °C, when reported. */
  batteryTemp: number | null;
  /** Warnings the car reports ("Check engine", FordPass messages). */
  warnings: string[];
  software: Software | null;
  /** Bikes: the removable battery is in. */
  batteryInserted: boolean | null;
}

/** Something the page can ask the vehicle to do, when the integration offers it. */
export type VehicleActionId = 'lock' | 'unlock' | 'climate' | 'charge-start' | 'charge-pause' | 'target' | 'honk' | 'refresh';

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  powertrain: Powertrain;
  /** The owner's name for it. */
  name: string;
  make: string | null;
  model: string | null;
  /** The owner's own picture (uploaded on this page or the Room page, or classic Mobility's vehicle image). */
  image: string | null;
  /** The picture its integration gives it in Home Assistant (an entity_picture path), used when the owner set none. */
  picture?: string | null;
  /** Its Home Assistant device, which the owner's picture choice is saved under (shared with the Room page's car tile). */
  deviceId?: string | null;
  /** Which adapter made it ("fordpass", "cowboy", …). */
  integration: string;
  /** When the vehicle last reported (epoch ms). */
  seen: number | null;
  /** The car is asleep and not reporting (FordPass deep sleep). */
  asleep: boolean;
  /** Its integration reports nothing (every entity unavailable): the page keeps it, says so, and shows what it last knew. */
  offline: boolean;
  /** Battery (EV / bike) or tank (ICE), %. */
  level: number | null;
  range: number | null;
  unit: DistanceUnit;
  odometer: number | null;
  charging: Charging | null;
  climate: Climate | null;
  security: Security;
  place: Place | null;
  motion: Motion | null;
  /** Distance today. */
  today: number | null;
  lastTrip: Trip | null;
  /** Bikes: lifetime CO₂ saved, kg; hours ridden. */
  lifetime: { co2SavedKg: number | null; hours: number | null } | null;
  /** Bikes: the ride mode last used ("Adaptive", "Eco"). */
  mode: string | null;
  condition: Condition;
  actions: VehicleActionId[];
}

/** What the page asks a vehicle to do; an adapter turns it into Home Assistant service calls. */
export type MobilityAction =
  | { type: 'lock' }
  | { type: 'unlock' }
  | { type: 'climate'; on: boolean }
  | { type: 'extra'; id: string; on: boolean }
  | { type: 'charge'; on: boolean }
  | { type: 'target'; pct: number }
  | { type: 'temp'; value: number }
  | { type: 'honk' }
  | { type: 'refresh' };

export interface MobilityHome {
  now: number;
  vehicles: Vehicle[];
}

// ---------------------------------------------------------------------------------------------
// Ready to go? The page's one clear answer for a vehicle.
// ---------------------------------------------------------------------------------------------

export type Tone = 'good' | 'info' | 'warn' | 'bad';

export interface Check {
  id: string;
  /** "Locked", "Plugged in, charging", "Tyre low (front left)". */
  label: string;
  tone: Tone;
}

export interface Readiness {
  tone: Tone;
  /** The answer in a few words: "Ready to go", "Charging, ready by 07:10", "Unlocked". */
  title: string;
  /** One line under it: range and where it is. */
  detail: string;
  /** The checks behind the answer, worst first. */
  checks: Check[];
}

const RANK: Record<Tone, number> = { bad: 0, warn: 1, info: 2, good: 3 };
export const fmtDistance = (n: number, unit: DistanceUnit) => `${Math.round(n).toLocaleString()} ${unit}`;
export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ago(t: number | null, now: number): string {
  if (t === null) return 'never';
  const m = Math.max(0, Math.round((now - t) / 60_000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

/** "Tue 02:00", or just "02:00" today. */
export function dayClock(t: number, now: number): string {
  const d = new Date(t);
  return new Date(now).toDateString() === d.toDateString() ? clock(t) : `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${clock(t)}`;
}

/**
 * The update in words: `value` for the Condition card, `check` for the hero's checks (null when
 * all is well), and a tone. Installing is a warning: most cars cannot be driven meanwhile.
 */
export function softwareLine(s: Software, kind: VehicleKind, now: number): { value: string; check: string | null; tone: Tone } {
  const what = kind === 'bike' ? 'Firmware' : 'Software';
  switch (s.stage) {
    case 'installing':
      return { value: 'Installing…', check: `Installing a ${what.toLowerCase()} update`, tone: 'warn' };
    case 'downloading':
      return { value: 'Downloading update', check: `Downloading a ${what.toLowerCase()} update`, tone: 'info' };
    case 'failed':
      return { value: 'Update failed', check: `${what} update failed`, tone: 'warn' };
    case 'queued':
      if (s.blocked) return { value: `Waiting: ${s.blocked}`, check: `Update waiting: ${s.blocked}`, tone: 'warn' };
      return s.nextWindow
        ? { value: `Installs ${dayClock(s.nextWindow, now)}`, check: `Update installs ${dayClock(s.nextWindow, now)}`, tone: 'info' }
        : { value: 'Ready to install', check: `${what} update ready to install`, tone: 'info' };
    case 'available':
      return { value: s.latest ? `${s.latest} ready` : 'Update ready', check: s.latest ? `Update ${s.latest} available` : `${what} update available`, tone: 'info' };
    default:
      return {
        value: s.installed ? `${s.installed}, up to date` : s.lastUpdate ? `Updated ${new Date(s.lastUpdate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Up to date',
        check: null,
        tone: 'good'
      };
  }
}

/** Low means under this share of a charge, or under this range. */
const LOW_LEVEL = 20;

export function lowTyres(t: Tyres | null): string[] {
  if (!t) return [];
  const names: [keyof Tyres, string][] = [['fl', 'front left'], ['fr', 'front right'], ['rl', 'rear left'], ['rr', 'rear right']];
  return names.filter(([k]) => typeof t[k] === 'number' && (t[k] as number) < t.low).map(([, n]) => n);
}

/** How old the numbers are before the page says so (a parked car may report rarely). */
export const STALE_MS = 6 * 3600_000;

/** A line about how fresh the numbers are, or null when they are fresh. */
export function freshness(v: Vehicle, now: number): { text: string; tone: Tone } | null {
  if (v.offline) return { text: `${v.integration === 'fordpass' ? 'FordPass' : v.integration === 'cowboy' ? 'Cowboy' : 'Its integration'} isn’t reporting${v.seen ? `; last heard from ${ago(v.seen, now)}` : ''}. Check it in Home Assistant.`, tone: 'warn' };
  if (v.asleep) return { text: `Asleep to save its 12 V battery. These numbers are from ${ago(v.seen, now)}.`, tone: 'info' };
  if (v.seen !== null && now - v.seen > STALE_MS && !v.motion?.moving) return { text: `Last heard from ${ago(v.seen, now)}.`, tone: 'info' };
  return null;
}

export function readiness(v: Vehicle, now: number): Readiness {
  // The hero's freshness note says since when.
  if (v.offline) return { tone: 'warn', title: 'Not reporting', detail: '', checks: [] };
  const checks: Check[] = [];
  const s = v.security;
  if (s.stolen) checks.push({ id: 'stolen', label: 'Reported stolen', tone: 'bad' });
  if (s.crashed) checks.push({ id: 'crashed', label: 'Crash detected', tone: 'bad' });
  if (s.alarm === 'triggered') checks.push({ id: 'alarm', label: 'Alarm going off', tone: 'bad' });
  if (s.locked === false && !v.motion?.moving) checks.push({ id: 'lock', label: 'Unlocked', tone: 'warn' });
  else if (s.locked === true) checks.push({ id: 'lock', label: 'Locked', tone: 'good' });
  for (const o of s.open) checks.push({ id: `open-${o.what}-${o.where}`, label: `${o.where} ${o.what === 'charge-port' ? 'charge port' : o.what} open`.replace(/^./, (c) => c.toUpperCase()), tone: 'warn' });
  const tyres = lowTyres(v.condition.tyres);
  if (tyres.length) checks.push({ id: 'tyres', label: `Tyre low (${tyres.join(', ')})`, tone: 'warn' });
  if (v.condition.warnings.length) checks.push({ id: 'warnings', label: v.condition.warnings[0], tone: 'warn' });
  if (v.condition.batteryInserted === false) checks.push({ id: 'battery-out', label: 'Battery not in the bike', tone: 'warn' });
  if (v.level !== null && v.level < LOW_LEVEL && v.charging?.state !== 'charging') checks.push({ id: 'level', label: `Low ${v.powertrain === 'ice' ? 'fuel' : 'charge'}, ${v.level}%`, tone: 'warn' });
  const c = v.charging;
  if (c?.state === 'charging') checks.push({ id: 'charge', label: c.readyAt ? `Charging, ${c.target ?? 100}% by ${clock(c.readyAt)}` : 'Charging', tone: 'info' });
  else if (c?.plugged) checks.push({ id: 'charge', label: c.state === 'complete' ? 'Plugged in, charged' : c.state === 'waiting' ? 'Plugged in, waiting to charge' : 'Plugged in, not charging', tone: c.state === 'stopped' ? 'warn' : 'good' });
  if (v.climate?.running) checks.push({ id: 'climate', label: v.climate.remoteStart ? 'Remote start on' : `Climate on${v.climate.target !== null ? `, ${v.climate.target}°` : ''}`, tone: 'info' });
  const sw = v.condition.software ? softwareLine(v.condition.software, v.kind, now) : null;
  if (sw && sw.check) checks.push({ id: 'software', label: sw.check, tone: sw.tone });
  checks.sort((a, b) => RANK[a.tone] - RANK[b.tone]);

  const where = v.motion?.moving ? 'on the move' : v.place?.zone ? `at ${v.place.zone}` : v.place?.address ? `near ${v.place.address}` : v.place ? 'away' : '';
  const range = v.range !== null ? `${fmtDistance(v.range, v.unit)} range` : v.level !== null ? `${v.level}%` : '';
  // Asleep or stale is said by the hero's freshness note (`freshness`), not here.
  const detail = [range, where].filter(Boolean).join(' · ');
  const worst = checks[0];

  if (worst?.tone === 'bad') return { tone: 'bad', title: worst.label, detail, checks };
  if (v.motion?.moving) return { tone: 'info', title: v.motion.speed !== null ? `Driving, ${Math.round(v.motion.speed)} ${v.unit === 'mi' ? 'mph' : 'km/h'}` : 'On the move', detail, checks };
  if (worst?.tone === 'warn') return { tone: 'warn', title: checks.filter((x) => x.tone === 'warn').length > 1 ? `${checks.filter((x) => x.tone === 'warn').length} things to check` : worst.label, detail, checks };
  if (c?.state === 'charging') return { tone: 'info', title: c.readyAt ? `Charging, ready by ${clock(c.readyAt)}` : 'Charging', detail, checks };
  return { tone: 'good', title: 'Ready to go', detail, checks };
}

/** The fleet's answer: the worst vehicle's, or "All ready" when every one is. */
export function fleetReadiness(home: MobilityHome) {
  const all = home.vehicles.map((v) => ({ v, r: readiness(v, home.now) }));
  const worst = [...all].sort((a, b) => RANK[a.r.tone] - RANK[b.r.tone])[0];
  return { all, worst, allReady: all.every((x) => x.r.tone === 'good') };
}

export const has = (v: Vehicle, a: VehicleActionId) => v.actions.includes(a);

// ---------------------------------------------------------------------------------------------
// Today's drives, read from the speed history (FordPass reports speed; most makes do).
// ---------------------------------------------------------------------------------------------

export interface Drive {
  from: number;
  to: number;
  /** Rough distance: average speed × time. */
  distance: number;
  top: number;
}

/**
 * Runs of motion in the last 24 h of speeds (one value per 15 min, oldest first, ending now).
 * A drive is consecutive slots above walking pace; its distance is an estimate.
 */
export function drivesFromSpeeds(speeds: readonly number[], now: number, slotMin = 15): Drive[] {
  const out: Drive[] = [];
  const slot = slotMin * 60_000;
  const start = now - (speeds.length - 1) * slot;
  let i = 0;
  while (i < speeds.length) {
    if (speeds[i] <= 5) {
      i++;
      continue;
    }
    let j = i;
    while (j < speeds.length && speeds[j] > 5) j++;
    const run = speeds.slice(i, j);
    const avg = run.reduce((a, b) => a + b, 0) / run.length;
    out.push({ from: start + i * slot, to: start + j * slot, distance: Math.round(avg * (run.length * slotMin) / 60 * 10) / 10, top: Math.max(...run) });
    i = j;
  }
  return out;
}

/** What the controls do to a sample vehicle (studio and demo mode), so they can be tried without Home Assistant. */
export function applySampleAction(v: Vehicle, a: MobilityAction): Vehicle {
  switch (a.type) {
    case 'lock':
    case 'unlock':
      return { ...v, security: { ...v.security, locked: a.type === 'lock' } };
    case 'climate':
      return v.climate ? { ...v, climate: { ...v.climate, running: a.on, minutesLeft: a.on ? 15 : null } } : v;
    case 'extra':
      return v.climate ? { ...v, climate: { ...v.climate, extras: v.climate.extras.map((e) => (e.id === a.id ? { ...e, on: a.on } : e)) } } : v;
    case 'charge':
      return v.charging ? { ...v, charging: { ...v.charging, state: a.on ? 'charging' : 'stopped', power: a.on ? 7.2 : null } } : v;
    case 'temp':
      return v.climate ? { ...v, climate: { ...v.climate, target: a.value } } : v;
    case 'target':
      return v.charging ? { ...v, charging: { ...v.charging, target: a.pct } } : v;
    default:
      return v;
  }
}

