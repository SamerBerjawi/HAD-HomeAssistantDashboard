/**
 * The Security page's model (docs/pro-ui/SECURITY.md): the home as the page sees it (alarm,
 * people, cameras and devices as Area tile models, the day's events), what needs a person
 * (`securityIssues`), the one clear answer (`securityVerdict`) and the alarm rules (critical
 * changes, codes). Pure: the live page fills it from Home Assistant (`securityHome.ts`), the
 * Security Studio from sample homes.
 */
import type { CameraTileModel, CoverTileModel, LockTileModel, MotionTileModel, OpeningTileModel, SafetyTileModel, TileAction } from '../areas/tileTypes';

export type ArmMode = 'disarmed' | 'armed_home' | 'armed_night' | 'armed_away';
/** HA's vacation and custom modes count as Away here; `pending` is the entry delay. */
export type AlarmState = ArmMode | 'arming' | 'pending' | 'triggered';
export type Tone = 'calm' | 'warning' | 'danger';
export type Detection = 'person' | 'vehicle' | 'package' | 'animal';

export type Placed<M> = M & { area: string };
export type SecurityCamera = Placed<CameraTileModel> & { outdoor: boolean; detection: Detection | null };
/** siren.*: no Area tile type exists; the page draws it with `pages/security/SirenTile.tsx`. */
export interface SirenModel {
  kind: 'siren';
  entityId: string;
  name: string;
  available: boolean;
  /** Sounding. */
  isOn: boolean;
  lastChanged: number | null;
  battery: number | null;
}
export type GarageModel = CoverTileModel & { deviceClass: 'garage' };
export type SecurityDevice = Placed<LockTileModel> | Placed<OpeningTileModel> | Placed<MotionTileModel> | Placed<SafetyTileModel> | Placed<GarageModel> | Placed<SirenModel>;

export interface SecurityEvent {
  id: string;
  at: number;
  kind: 'alarm' | 'lock' | 'opening' | 'motion' | 'camera' | 'safety' | 'person';
  text: string;
  tone: Tone;
}

export interface SecurityHome {
  alarm: {
    /** The alarm panel; null when HA has none (the page then has no mode controls). */
    entityId: string | null;
    state: AlarmState;
    /** The modes the panel supports, in ARM_MODES order. */
    modes: ArmMode[];
    changedBy: string | null;
    changedAt: number;
    cause: string | null;
    /** A siren is sounding. */
    siren: boolean;
    /** HA asks for a code to disarm / to arm, and whether it is digits. */
    codeToDisarm: boolean;
    codeToArm: boolean;
    codeNumeric: boolean;
  };
  people: { name: string; home: boolean }[];
  cameras: SecurityCamera[];
  devices: SecurityDevice[];
  events: SecurityEvent[];
}

export type SecurityAction =
  | { type: 'arm'; mode: ArmMode; code?: string }
  | { type: 'device'; id: string; action: TileAction }
  | { type: 'lockAll' }
  | { type: 'silence' };

export interface Issue {
  id: string;
  tone: Exclude<Tone, 'calm'>;
  text: string;
  area: string;
  /** The one fix, when there is one (Lock, Silence). */
  fix: { label: string; action: SecurityAction } | null;
}

export interface Verdict {
  tone: Tone;
  /** The answer, in a few words: "Home is secure", "2 things need you", "Alarm triggered". */
  title: string;
  /** One line under it. */
  detail: string;
}

export const ARM_MODES: { id: ArmMode; label: string }[] = [
  { id: 'disarmed', label: 'Off' },
  { id: 'armed_home', label: 'Home' },
  { id: 'armed_night', label: 'Night' },
  { id: 'armed_away', label: 'Away' }
];

export const LOW_BATTERY = 20;

export const isLock = (d: SecurityDevice): d is Placed<LockTileModel> => d.kind === 'lock';
export const isGarage = (d: SecurityDevice): d is Placed<GarageModel> => d.kind === 'cover';
export const isSiren = (d: SecurityDevice): d is Placed<SirenModel> => d.kind === 'siren';

/** Everything that needs a person, worst first. Each has at most one fix. */
export function securityIssues(home: SecurityHome): Issue[] {
  const out: Issue[] = [];
  if (home.alarm.state === 'triggered') {
    out.push({ id: 'alarm', tone: 'danger', text: home.alarm.siren ? 'Siren is sounding' : 'Alarm triggered', area: '', fix: home.alarm.siren ? { label: 'Silence', action: { type: 'silence' } } : null });
  }
  for (const d of home.devices) {
    if (d.kind === 'safety' && d.available && d.isOn) out.push({ id: d.entityId, tone: 'danger', text: d.deviceClass === 'moisture' ? `Water detected · ${d.name}` : `Smoke detected · ${d.name}`, area: d.area, fix: null });
  }
  if (home.alarm.state !== 'triggered') {
    for (const d of home.devices) {
      if (isSiren(d) && d.available && d.isOn) out.push({ id: d.entityId, tone: 'danger', text: `${d.name} is sounding`, area: d.area, fix: { label: 'Silence', action: { type: 'device', id: d.entityId, action: { type: 'toggle' } } } });
    }
  }
  for (const d of home.devices) {
    if (isLock(d) && d.state === 'jammed') out.push({ id: d.entityId, tone: 'danger', text: `${d.name} is jammed`, area: d.area, fix: null });
  }
  for (const d of home.devices) {
    if (isLock(d) && d.available && (d.state === 'unlocked' || d.state === 'open')) {
      out.push({ id: d.entityId, tone: 'warning', text: `${d.name} is unlocked`, area: d.area, fix: { label: 'Lock', action: { type: 'device', id: d.entityId, action: { type: 'lock', cmd: 'lock' } } } });
    }
  }
  for (const d of home.devices) {
    if (isGarage(d) && d.available && d.isOn) out.push({ id: d.entityId, tone: 'warning', text: `${d.name} is open`, area: d.area, fix: { label: 'Close', action: { type: 'device', id: d.entityId, action: { type: 'cover', cmd: 'close' } } } });
  }
  for (const d of home.devices) {
    if (d.kind === 'opening' && d.available && d.isOn) out.push({ id: d.entityId, tone: 'warning', text: `${d.name} is open`, area: d.area, fix: null });
  }
  for (const d of [...home.devices, ...home.cameras]) {
    if (!d.available) out.push({ id: `${d.entityId}:offline`, tone: 'warning', text: `${d.name}${d.kind === 'camera' ? ' camera' : ''} is offline`, area: d.area, fix: null });
  }
  for (const d of home.devices) {
    if (d.available && 'battery' in d && d.battery !== null && d.battery < LOW_BATTERY) out.push({ id: `${d.entityId}:battery`, tone: 'warning', text: `${d.name} battery at ${d.battery}%`, area: d.area, fix: null });
  }
  return out;
}

const MODE_WORD: Record<AlarmState, string> = {
  disarmed: 'Alarm off',
  armed_home: 'Armed home',
  armed_night: 'Armed night',
  armed_away: 'Armed away',
  arming: 'Arming',
  pending: 'Entry delay',
  triggered: 'Alarm triggered'
};
export const alarmWord = (s: AlarmState) => MODE_WORD[s];

/** The page's one clear answer. */
export function securityVerdict(home: SecurityHome, issues = securityIssues(home)): Verdict {
  const home_ = home.people.filter((p) => p.home).length;
  const who = home_ === 0 ? 'Nobody home' : home_ === home.people.length && home_ > 1 ? 'Everyone home' : `${home_} home`;
  const panel = home.alarm.entityId !== null;
  const line = [panel ? MODE_WORD[home.alarm.state] : null, home.people.length ? who : null].filter(Boolean).join(' · ');
  const danger = issues.filter((i) => i.tone === 'danger');
  if (home.alarm.state === 'triggered') return { tone: 'danger', title: 'Alarm triggered', detail: [home.alarm.cause, home.alarm.siren ? 'Siren on' : null, home.people.length ? who : null].filter(Boolean).join(' · ') };
  if (danger.length) return { tone: 'danger', title: danger.length === 1 ? danger[0].text : `${danger.length} alerts`, detail: line };
  if (issues.length === 1) return { tone: 'warning', title: issues[0].text, detail: line };
  if (issues.length) return { tone: 'warning', title: `${issues.length} things need you`, detail: line };
  return { tone: 'calm', title: home.alarm.state === 'disarmed' ? 'All locked and closed' : 'Home is secure', detail: line };
}


export const hasUnlocked = (home: SecurityHome) => home.devices.some((d) => isLock(d) && d.available && (d.state === 'unlocked' || d.state === 'open'));

export const ARMED = (s: AlarmState) => s !== 'disarmed' && s !== 'arming';

/** The mode a single big control should offer next: off when armed, Away when nobody is home, else Home. */
export function suggestedMode(home: SecurityHome): ArmMode {
  if (ARMED(home.alarm.state)) return 'disarmed';
  const want: ArmMode = home.people.some((p) => p.home) ? 'armed_home' : 'armed_away';
  return home.alarm.modes.includes(want) ? want : (home.alarm.modes.find((m) => m !== 'disarmed') ?? 'disarmed');
}

/** Critical changes need press-and-hold (or a slide): Away, Night, and turning an armed alarm off. */
export function isCritical(home: SecurityHome, mode: ArmMode): boolean {
  return mode === 'armed_away' || mode === 'armed_night' || (mode === 'disarmed' && ARMED(home.alarm.state));
}

/** Whether HA asks for the code for this change (`code_format`, `code_arm_required`). */
export const needsCode = (home: SecurityHome, mode: ArmMode) => (mode === 'disarmed' ? ARMED(home.alarm.state) && home.alarm.codeToDisarm : home.alarm.codeToArm);

