/**
 * Rich page subtitles for the pro header (docs/pro-ui/DESIGN.md 7.4): a natural sentence with
 * inline HeroUI chips, in the spirit of the classic *HeaderSentence components. Every builder here
 * is pure (plain numbers in, sentence parts out) so the wording is unit-tested; the hooks that feed
 * them live in src/pro/components/PageSentence.tsx.
 */
import type { IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  ArrowUp01Icon,
  BatteryCharging01Icon,
  BatteryFullIcon,
  Bicycle01Icon,
  BlindsIcon,
  BulbIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CloudAngledRainIcon,
  CloudBigRainIcon,
  CloudIcon,
  CloudSnowIcon,
  CpuIcon,
  Door01Icon,
  Download04Icon,
  DropletIcon,
  FastWindIcon,
  FireIcon,
  FlashIcon,
  HardDriveIcon,
  HeartPulseIcon,
  Home01Icon,
  LayoutGridIcon,
  Location01Icon,
  Moon02Icon,
  MusicNote01Icon,
  PauseIcon,
  PlayCircleIcon,
  PlayIcon,
  PlugSocketIcon,
  PuzzleIcon,
  RamMemoryIcon,
  Robot01Icon,
  Route01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  SnowIcon,
  SolarPanel01Icon,
  SparklesIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  Sun03Icon,
  SunCloud02Icon,
  ThermometerIcon,
  Tv01Icon,
  Upload04Icon,
  UserGroupIcon,
  UserIcon,
  WalkingIcon,
  Wifi01Icon,
  WorkflowSquare01Icon,
  WorkoutRunIcon
} from '@hugeicons/core-free-icons';

export type ChipTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export interface SentenceChip {
  icon: IconSvgElement;
  label: string;
  tone: ChipTone;
}
export type SentencePart = string | SentenceChip;

const chip = (icon: IconSvgElement, label: string, tone: ChipTone = 'accent'): SentenceChip => ({ icon, label, tone });

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** Plain text of a sentence (chips become their label). Used by tests and as an accessible fallback. */
export function sentenceText(parts: SentencePart[]): string {
  return parts.map((p) => (typeof p === 'string' ? p : p.label)).join('');
}

/** "a", "a and b", "a, b and c" over clauses. */
function joinClauses(clauses: SentencePart[][]): SentencePart[] {
  const out: SentencePart[] = [];
  clauses.forEach((clause, i) => {
    if (i > 0) out.push(i === clauses.length - 1 ? ' and ' : ', ');
    out.push(...clause);
  });
  return out;
}

/** Capitalises the first text part and ends the sentence with a full stop. */
function finish(parts: SentencePart[]): SentencePart[] {
  const out = [...parts];
  const first = out[0];
  if (typeof first === 'string' && first.length > 0) out[0] = first[0].toUpperCase() + first.slice(1);
  out.push('.');
  return out;
}

const pct = (n: number) => `${Math.round(n)}%`;
const truncate = (s: string, max = 40) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

// ---------------------------------------------------------------------------------------------
// Overview (title greeting + weather and presence)

export function timeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

const CONDITIONS: Record<string, { label: string; icon: IconSvgElement }> = {
  sunny: { label: 'sunny', icon: Sun03Icon },
  'clear-night': { label: 'clear', icon: Moon02Icon },
  partlycloudy: { label: 'partly cloudy', icon: SunCloud02Icon },
  cloudy: { label: 'cloudy', icon: CloudIcon },
  fog: { label: 'foggy', icon: CloudIcon },
  rainy: { label: 'rainy', icon: CloudAngledRainIcon },
  pouring: { label: 'pouring', icon: CloudBigRainIcon },
  lightning: { label: 'stormy', icon: CloudBigRainIcon },
  'lightning-rainy': { label: 'stormy', icon: CloudBigRainIcon },
  snowy: { label: 'snowy', icon: SnowIcon },
  'snowy-rainy': { label: 'sleeting', icon: CloudSnowIcon },
  hail: { label: 'hailing', icon: CloudSnowIcon },
  windy: { label: 'windy', icon: FastWindIcon },
  'windy-variant': { label: 'windy', icon: FastWindIcon },
  exceptional: { label: 'unusual', icon: Alert02Icon }
};

export interface OverviewInput {
  weather?: { temperature: number; unit: string; condition: string; humidity?: number; windSpeed?: number; windUnit?: string };
  peopleHome: number;
  peopleTotal: number;
}

export function overviewSentence({ weather, peopleHome, peopleTotal }: OverviewInput): SentencePart[] {
  const parts: SentencePart[] = [];
  if (weather) {
    const c = CONDITIONS[weather.condition] ?? { label: weather.condition.replace(/[-_]/g, ' '), icon: SunCloud02Icon };
    parts.push("it's ", chip(c.icon, `${Math.round(weather.temperature)}${weather.unit} and ${c.label}`), ' outside');
    const extras: SentencePart[][] = [];
    if (weather.humidity !== undefined) extras.push([chip(DropletIcon, `${Math.round(weather.humidity)}% humidity`, 'default')]);
    if (weather.windSpeed !== undefined && weather.windSpeed > 0)
      extras.push([chip(FastWindIcon, `${Math.round(weather.windSpeed)} ${weather.windUnit ?? 'km/h'} wind`, 'default')]);
    if (extras.length) parts.push(' with ', ...joinClauses(extras));
  } else {
    parts.push("weather isn't available from Home Assistant");
  }
  if (peopleTotal > 0) {
    parts.push(', and ');
    if (peopleHome === 0) parts.push(chip(UserGroupIcon, 'nobody', 'default'), ' is home');
    else if (peopleHome === peopleTotal)
      parts.push(chip(UserGroupIcon, peopleTotal === 1 ? 'you' : `all ${peopleTotal}`, 'success'), peopleTotal === 1 ? ' are home' : ' are home');
    else parts.push(chip(UserGroupIcon, `${peopleHome} of ${peopleTotal}`, 'success'), ' are home');
  }
  return finish(parts);
}

// ---------------------------------------------------------------------------------------------
// Rooms

export interface RoomsInput {
  lightsOn: number;
  doorsOpen: number;
  windowsOpen: number;
  motionRooms: number;
  mediaPlaying: number;
}

export function roomsSentence(i: RoomsInput): SentencePart[] {
  const clauses: SentencePart[][] = [];
  clauses.push(i.lightsOn > 0 ? [chip(BulbIcon, plural(i.lightsOn, 'light'), 'warning'), ' on'] : ['all lights are ', chip(BulbIcon, 'off', 'default')]);
  const openings: SentencePart[][] = [];
  if (i.doorsOpen > 0) openings.push([chip(Door01Icon, plural(i.doorsOpen, 'door'), 'warning')]);
  if (i.windowsOpen > 0) openings.push([chip(BlindsIcon, plural(i.windowsOpen, 'window'), 'warning')]);
  clauses.push(openings.length ? [...joinClauses(openings), ' open'] : ['doors and windows are ', chip(CheckmarkCircle02Icon, 'closed', 'success')]);
  if (i.motionRooms > 0) clauses.push(['motion in ', chip(WalkingIcon, plural(i.motionRooms, 'room'), 'default')]);
  if (i.mediaPlaying > 0) clauses.push([chip(MusicNote01Icon, plural(i.mediaPlaying, 'player'), 'accent'), ' playing']);
  return finish(['right now: ', ...joinClauses(clauses)]);
}

// ---------------------------------------------------------------------------------------------
// Energy

export interface EnergyInput {
  configured: boolean;
  homeKW: number;
  solarKW: number;
  /** Positive = importing, negative = exporting. */
  gridKW: number;
  batterySoC: number | null;
}

export const formatPower = (kw: number) => (Math.abs(kw) < 1 ? `${Math.round(kw * 1000)} W` : `${kw.toFixed(1)} kW`);

export function energySentence(i: EnergyInput): SentencePart[] {
  if (!i.configured) return finish(["the Energy dashboard isn't set up in Home Assistant yet"]);
  const clauses: SentencePart[][] = [['the house is using ', chip(FlashIcon, formatPower(i.homeKW))]];
  if (i.solarKW > 0.05) clauses.push(['solar is producing ', chip(SolarPanel01Icon, formatPower(i.solarKW), 'success')]);
  if (i.gridKW < -0.05) clauses.push([chip(PlugSocketIcon, formatPower(-i.gridKW), 'success'), ' goes back to the grid']);
  else if (i.gridKW > 0.05) clauses.push([chip(PlugSocketIcon, formatPower(i.gridKW), 'default'), ' comes from the grid']);
  if (i.batterySoC !== null) clauses.push(['the battery is at ', chip(BatteryFullIcon, pct(i.batterySoC), i.batterySoC < 20 ? 'warning' : 'success')]);
  return finish(joinClauses(clauses));
}

// ---------------------------------------------------------------------------------------------
// Security

export interface SecurityInput {
  alarmState?: string;
  locks: number;
  unlocked: number;
  contactSensors: number;
  doorsOpen: number;
  windowsOpen: number;
  hazards: number;
  motion: number;
}

function alarmChip(state: string): SentenceChip {
  const label = state.replace(/_/g, ' ');
  if (state === 'triggered') return chip(Alert02Icon, label, 'danger');
  if (state.startsWith('armed')) return chip(Shield01Icon, label, 'success');
  if (state === 'arming' || state === 'pending') return chip(Shield01Icon, label, 'warning');
  // Disarmed (or any other state): orange, the house is not protected.
  return chip(Shield01Icon, label, 'warning');
}

export function securitySentence(i: SecurityInput): SentencePart[] {
  const clauses: SentencePart[][] = [];
  if (i.alarmState) clauses.push(['the alarm is ', alarmChip(i.alarmState)]);
  if (i.locks > 0) {
    const locked = i.locks - i.unlocked;
    clauses.push([chip(i.unlocked ? SquareUnlock02Icon : SquareLock02Icon, `${locked} of ${plural(i.locks, 'lock')}`, i.unlocked ? 'warning' : 'success'), ' locked']);
  }
  if (i.contactSensors > 0) {
    const openings: SentencePart[][] = [];
    if (i.doorsOpen > 0) openings.push([chip(Door01Icon, plural(i.doorsOpen, 'door'), 'warning')]);
    if (i.windowsOpen > 0) openings.push([chip(BlindsIcon, plural(i.windowsOpen, 'window'), 'warning')]);
    clauses.push(openings.length ? [...joinClauses(openings), ' open'] : ['doors and windows are ', chip(CheckmarkCircle02Icon, 'closed', 'success')]);
  }
  if (i.hazards > 0) clauses.push([chip(FireIcon, plural(i.hazards, 'hazard'), 'danger'), ' detected']);
  if (i.motion > 0) clauses.push(['motion on ', chip(WalkingIcon, plural(i.motion, 'sensor'), 'warning')]);
  if (clauses.length === 0) return finish(['no security devices found in Home Assistant']);
  return finish(joinClauses(clauses));
}

// ---------------------------------------------------------------------------------------------
// Media

export interface MediaInput {
  playing: { title: string; area: string; isTv: boolean }[];
}

export function mediaSentence({ playing }: MediaInput): SentencePart[] {
  if (playing.length === 0) return finish(['nothing is playing, all players are ', chip(PauseIcon, 'idle', 'default')]);
  const first = playing[0];
  const titleChip = chip(first.isTv ? Tv01Icon : MusicNote01Icon, `“${truncate(first.title)}”`);
  if (playing.length === 1) return finish([titleChip, ' is playing in the ', chip(Home01Icon, first.area, 'default')]);
  const rooms = new Set(playing.map((p) => p.area)).size;
  return finish([chip(PlayIcon, plural(playing.length, 'player')), ' are playing in ', chip(Home01Icon, plural(rooms, 'room'), 'default'), ', including ', titleChip]);
}

// ---------------------------------------------------------------------------------------------
// Mobility

export interface MobilityInput {
  car?: { soc?: number; range?: number; rangeUnit?: string; charging: boolean; plugged: boolean; locked: boolean };
  bike?: { battery?: number; rangeKm?: number; locked: boolean };
}

export function mobilitySentence({ car, bike }: MobilityInput): SentencePart[] {
  const clauses: SentencePart[][] = [];
  if (car) {
    const c: SentencePart[] = ['the car'];
    if (car.soc !== undefined) c.push(' is at ', chip(car.charging ? BatteryCharging01Icon : BatteryFullIcon, pct(car.soc), car.soc < 20 ? 'warning' : 'success'));
    if (car.range !== undefined) c.push(' with ', chip(Route01Icon, `${Math.round(car.range)} ${car.rangeUnit ?? 'km'} range`, 'default'));
    if (car.charging) c.push(', ', chip(BatteryCharging01Icon, 'charging', 'accent'));
    else if (car.plugged) c.push(', ', chip(PlugSocketIcon, 'plugged in', 'default'));
    c.push(', ', chip(car.locked ? SquareLock02Icon : SquareUnlock02Icon, car.locked ? 'locked' : 'unlocked', car.locked ? 'success' : 'warning'));
    clauses.push(c);
  }
  if (bike) {
    const b: SentencePart[] = ['the bike'];
    if (bike.battery !== undefined) b.push(' is at ', chip(Bicycle01Icon, pct(bike.battery), bike.battery < 20 ? 'warning' : 'success'));
    if (bike.rangeKm !== undefined) b.push(' with ', chip(Route01Icon, `${Math.round(bike.rangeKm)} km range`, 'default'));
    b.push(', ', chip(bike.locked ? SquareLock02Icon : SquareUnlock02Icon, bike.locked ? 'locked' : 'unlocked', bike.locked ? 'success' : 'warning'));
    clauses.push(b);
  }
  if (clauses.length === 0) return finish(['no vehicles found in Home Assistant']);
  const out: SentencePart[] = [];
  clauses.forEach((c, i) => {
    if (i > 0) out.push('; ');
    out.push(...c);
  });
  return finish(out);
}

// ---------------------------------------------------------------------------------------------
// Health

export interface HealthInput {
  deviceName?: string;
  steps?: number;
  activeKcal?: number;
  heartRate?: number;
}

export function healthSentence(i: HealthInput): SentencePart[] {
  if (!i.deviceName) return finish(['no health data found from the Home Assistant Companion app'] );
  const activity: SentencePart[][] = [];
  if (i.steps !== undefined) activity.push([chip(WorkoutRunIcon, plural(Math.round(i.steps), 'step'))]);
  if (i.activeKcal !== undefined) activity.push([chip(FireIcon, `${Math.round(i.activeKcal).toLocaleString('en-US')} kcal`, 'warning')]);
  const parts: SentencePart[] = [chip(SmartPhone01Icon, i.deviceName, 'default')];
  if (activity.length) parts.push(' logged ', ...joinClauses(activity), ' today');
  else parts.push(' is connected');
  if (i.heartRate !== undefined) parts.push(', heart rate ', chip(HeartPulseIcon, `${Math.round(i.heartRate)} bpm`, 'danger'));
  return finish(parts);
}

// ---------------------------------------------------------------------------------------------
// Vacuums

export interface VacuumsInput {
  vacuums: { name: string; state: string; battery: number; room?: string }[];
}

export function vacuumsSentence({ vacuums }: VacuumsInput): SentencePart[] {
  if (vacuums.length === 0) return finish(['no robot vacuums found in Home Assistant']);
  const err = vacuums.find((v) => v.state === 'error');
  if (err) return finish([chip(Alert02Icon, err.name, 'danger'), ' needs attention', ...(err.room ? [' in the ', chip(Location01Icon, err.room, 'default')] : [])]);
  const cleaning = vacuums.filter((v) => v.state === 'cleaning');
  if (cleaning.length) {
    const v = cleaning[0];
    const parts: SentencePart[] = [chip(Robot01Icon, v.name), ' is cleaning'];
    if (v.room) parts.push(' the ', chip(Location01Icon, v.room, 'default'));
    parts.push(' at ', chip(BatteryFullIcon, pct(v.battery), v.battery < 20 ? 'warning' : 'default'), ' battery');
    if (cleaning.length > 1) parts.push(`, with ${cleaning.length - 1} more cleaning`);
    return finish(parts);
  }
  const returning = vacuums.find((v) => v.state === 'returning');
  if (returning) return finish([chip(Robot01Icon, returning.name), ' is heading back to the dock']);
  const paused = vacuums.find((v) => v.state === 'paused');
  if (paused) return finish([chip(Robot01Icon, paused.name, 'warning'), ' is paused']);
  const lowest = Math.min(...vacuums.map((v) => v.battery));
  const who = vacuums.length === 1 ? chip(Robot01Icon, vacuums[0].name, 'default') : chip(Robot01Icon, `All ${vacuums.length} vacuums`, 'default');
  return finish([who, vacuums.length === 1 ? ' is ' : ' are ', chip(CheckmarkCircle02Icon, 'docked', 'success'), ' with ', chip(BatteryFullIcon, pct(lowest), lowest < 20 ? 'warning' : 'default'), vacuums.length === 1 ? ' battery' : ' battery or more']);
}

// ---------------------------------------------------------------------------------------------
// System

export interface SystemInput {
  cpu?: number;
  memory?: number;
  disk?: number;
  cpuTemp?: number;
  tempUnit?: string;
}

export function systemSentence(i: SystemInput): SentencePart[] {
  const clauses: SentencePart[][] = [];
  if (i.cpu !== undefined) clauses.push([chip(CpuIcon, `${pct(i.cpu)} CPU`, i.cpu > 85 ? 'warning' : 'default')]);
  if (i.memory !== undefined) clauses.push([chip(RamMemoryIcon, `${pct(i.memory)} memory`, i.memory > 90 ? 'warning' : 'default')]);
  if (i.disk !== undefined) clauses.push([chip(HardDriveIcon, `${pct(i.disk)} disk`, i.disk > 90 ? 'danger' : i.disk > 75 ? 'warning' : 'default')]);
  if (clauses.length === 0 && i.cpuTemp === undefined) return finish(['no host sensors found, add the System Monitor integration in Home Assistant']);
  const parts: SentencePart[] = clauses.length ? ['the host is using ', ...joinClauses(clauses)] : ['the host'];
  if (i.cpuTemp !== undefined)
    parts.push(clauses.length ? ', with the CPU at ' : ' CPU is at ', chip(ThermometerIcon, `${Math.round(i.cpuTemp)}${i.tempUnit ?? '°C'}`, i.cpuTemp > 80 ? 'warning' : 'default'));
  return finish(parts);
}

// ---------------------------------------------------------------------------------------------
// Network

export interface NetworkInput {
  downloadMbps?: number;
  uploadMbps?: number;
  blockedPercent?: number;
  clients?: number;
}

export function networkSentence(i: NetworkInput): SentencePart[] {
  const clauses: SentencePart[][] = [];
  if (i.downloadMbps !== undefined && i.uploadMbps !== undefined)
    clauses.push(['the last speed test measured ', chip(Download04Icon, `${Math.round(i.downloadMbps)} Mbps`), ' down and ', chip(Upload04Icon, `${Math.round(i.uploadMbps)} Mbps`), ' up']);
  if (i.blockedPercent !== undefined) clauses.push(['AdGuard blocked ', chip(Shield01Icon, `${i.blockedPercent.toFixed(1)}%`, 'success'), ' of DNS queries']);
  if (i.clients !== undefined) clauses.push([chip(Wifi01Icon, plural(i.clients, 'device'), 'default'), i.clients === 1 ? ' is connected' : ' are connected']);
  if (clauses.length === 0) return finish(['no network sensors found (Speedtest, AdGuard Home or router)']);
  return finish(joinClauses(clauses));
}

// ---------------------------------------------------------------------------------------------
// Automations

export interface AutomationsInput {
  automationsOn: number;
  automationsTotal: number;
  scenes: number;
  scriptsRunning: number;
  last?: { name: string; minutesAgo: number };
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  const days = Math.round(minutes / (60 * 24));
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function automationsSentence(i: AutomationsInput): SentencePart[] {
  if (i.automationsTotal === 0 && i.scenes === 0) return finish(['no automations or scenes in Home Assistant yet']);
  const clauses: SentencePart[][] = [];
  if (i.automationsTotal > 0)
    clauses.push([chip(WorkflowSquare01Icon, `${i.automationsOn} of ${plural(i.automationsTotal, 'automation')}`, i.automationsOn === i.automationsTotal ? 'success' : 'default'), ' on']);
  if (i.scenes > 0) clauses.push([chip(PlayCircleIcon, plural(i.scenes, 'scene'), 'default'), ' ready']);
  if (i.scriptsRunning > 0) clauses.push([chip(PlayIcon, plural(i.scriptsRunning, 'script'), 'accent'), ' running']);
  const parts = joinClauses(clauses);
  if (i.last) parts.push(', last run ', chip(Clock01Icon, `${truncate(i.last.name, 32)}, ${timeAgo(i.last.minutesAgo)}`, 'default'));
  return finish(parts);
}

// ---------------------------------------------------------------------------------------------
// Integrations

export interface IntegrationsInput {
  devices: number;
  entities: number;
  updates: number;
}

export function integrationsSentence(i: IntegrationsInput): SentencePart[] {
  const parts: SentencePart[] = [
    'Home Assistant manages ',
    chip(PuzzleIcon, plural(i.devices, 'device'), 'default'),
    ' and ',
    chip(LayoutGridIcon, plural(i.entities, 'entity', 'entities'), 'default')
  ];
  if (i.updates > 0) parts.push(', with ', chip(ArrowUp01Icon, plural(i.updates, 'update'), 'warning'), ' available');
  else parts.push(', and everything is ', chip(CheckmarkCircle02Icon, 'up to date', 'success'));
  return finish(parts);
}

// ---------------------------------------------------------------------------------------------
// Settings

export interface SettingsInput {
  isDemo: boolean;
  version?: string | null;
  userName?: string;
  visiblePages: number;
  totalPages: number;
}

export function settingsSentence(i: SettingsInput): SentencePart[] {
  const pages = chip(LayoutGridIcon, `${i.visiblePages} of ${i.totalPages} pages`, 'default');
  if (i.isDemo) return finish(["you're exploring the ", chip(SparklesIcon, 'demo', 'accent'), ' with sample data, and ', pages, ' are visible']);
  const parts: SentencePart[] = ['connected to Home Assistant'];
  if (i.version) parts.push(' ', chip(Home01Icon, `v${i.version}`, 'default'));
  if (i.userName) parts.push(' as ', chip(UserIcon, i.userName, 'default'));
  parts.push(', with ', pages, ' visible');
  return finish(parts);
}
