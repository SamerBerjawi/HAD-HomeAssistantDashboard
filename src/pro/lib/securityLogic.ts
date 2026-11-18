/**
 * Pure helpers for the pro Security page (docs/pro-ui/DESIGN.md 7.5): alarm modes and codes,
 * device grouping for the bento grid, and recent-activity sentences. No React, no store.
 */
import type { ResolvedEntity } from '@/types';

export type Tone = 'default' | 'success' | 'warning' | 'danger';

// ---------------------------------------------------------------- alarm

/** HA AlarmControlPanelEntityFeature bits. */
export const ALARM_FEATURE = { ARM_HOME: 1, ARM_AWAY: 2, ARM_NIGHT: 4, TRIGGER: 8, ARM_CUSTOM_BYPASS: 16, ARM_VACATION: 32 } as const;

export type AlarmModeId = 'disarmed' | 'armed_home' | 'armed_away' | 'armed_night';

export interface AlarmMode {
  id: AlarmModeId;
  label: string;
  service: string;
}

const ALL_MODES: (AlarmMode & { feature: number })[] = [
  { id: 'disarmed', label: 'Off', service: 'alarm_disarm', feature: 0 },
  { id: 'armed_home', label: 'Home', service: 'alarm_arm_home', feature: ALARM_FEATURE.ARM_HOME },
  { id: 'armed_away', label: 'Away', service: 'alarm_arm_away', feature: ALARM_FEATURE.ARM_AWAY },
  { id: 'armed_night', label: 'Night', service: 'alarm_arm_night', feature: ALARM_FEATURE.ARM_NIGHT }
];

/** Off plus the arm modes the panel supports. Without `supported_features`, all four. */
export function alarmModes(alarm: Pick<ResolvedEntity, 'attributes'>): AlarmMode[] {
  const features = alarm.attributes?.supported_features;
  return ALL_MODES.filter((m) => m.feature === 0 || typeof features !== 'number' || (features & m.feature) !== 0).map(
    ({ id, label, service }) => ({ id, label, service })
  );
}

export function alarmTone(state: string): Tone {
  if (state === 'triggered') return 'danger';
  if (state === 'arming' || state === 'pending' || state === 'disarming') return 'warning';
  if (state.startsWith('armed')) return 'success';
  return 'default';
}

export function alarmStateLabel(state: string): string {
  const labels: Record<string, string> = {
    disarmed: 'Disarmed',
    armed_home: 'Armed home',
    armed_away: 'Armed away',
    armed_night: 'Armed night',
    armed_vacation: 'Armed vacation',
    armed_custom_bypass: 'Armed custom',
    arming: 'Arming…',
    disarming: 'Disarming…',
    pending: 'Entry delay',
    triggered: 'Triggered',
    unavailable: 'Unavailable'
  };
  return labels[state] ?? state.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** Whether HA needs a code for this change (`code_format`, and `code_arm_required` for arming). */
export function alarmNeedsCode(alarm: Pick<ResolvedEntity, 'attributes'>, target: AlarmModeId): boolean {
  const format = alarm.attributes?.code_format;
  if (!format) return false;
  if (target === 'disarmed') return true;
  return alarm.attributes?.code_arm_required !== false;
}

export function alarmCodeIsNumeric(alarm: Pick<ResolvedEntity, 'attributes'>): boolean {
  return alarm.attributes?.code_format !== 'text';
}

/** Arming Away or Night with openings open asks for confirmation first. */
export function shouldConfirmArming(target: AlarmModeId, openCount: number): boolean {
  return openCount > 0 && (target === 'armed_away' || target === 'armed_night');
}

// ---------------------------------------------------------------- devices

export type DeviceKind = 'lock' | 'door' | 'window' | 'motion' | 'leak' | 'smoke';

export interface DeviceItem {
  entity: ResolvedEntity;
  kind: DeviceKind;
  /** Needs attention: open, unlocked, detected. */
  problem: boolean;
  stateLabel: string;
  tone: Tone;
}

export interface DeviceGroup {
  id: string;
  title: string;
  /** Group kind for the icon; 'room' in the room view. */
  kind: DeviceKind | 'openings' | 'hazards' | 'room';
  items: DeviceItem[];
  problems: number;
  /** "1 open", "2 unlocked", "All clear". */
  summary: string;
}

export interface SecurityEntities {
  locks: ResolvedEntity[];
  doorSensors: ResolvedEntity[];
  windowSensors: ResolvedEntity[];
  motionSensors: ResolvedEntity[];
  leakSensors: ResolvedEntity[];
  smokeSensors: ResolvedEntity[];
}

const isOn = (s: string) => s === 'on' || s === 'detected' || s === 'wet';

export function deviceItem(entity: ResolvedEntity, kind: DeviceKind): DeviceItem {
  const s = entity.state;
  if (s === 'unavailable' || s === 'unknown') return { entity, kind, problem: false, stateLabel: 'Offline', tone: 'danger' };
  switch (kind) {
    case 'lock': {
      if (s === 'jammed') return { entity, kind, problem: true, stateLabel: 'Jammed', tone: 'danger' };
      if (s === 'locking' || s === 'unlocking') return { entity, kind, problem: false, stateLabel: s === 'locking' ? 'Locking…' : 'Unlocking…', tone: 'warning' };
      const open = s === 'unlocked' || s === 'open' || s === 'opening';
      return { entity, kind, problem: open, stateLabel: open ? 'Unlocked' : 'Locked', tone: open ? 'warning' : 'success' };
    }
    case 'door':
    case 'window':
      return { entity, kind, problem: s === 'on', stateLabel: s === 'on' ? 'Open' : 'Closed', tone: s === 'on' ? 'warning' : 'success' };
    case 'motion':
      return { entity, kind, problem: false, stateLabel: s === 'on' ? 'Motion' : 'Clear', tone: s === 'on' ? 'warning' : 'success' };
    default:
      return { entity, kind, problem: isOn(s), stateLabel: isOn(s) ? 'Detected' : kind === 'leak' ? 'Dry' : 'Clear', tone: isOn(s) ? 'danger' : 'success' };
  }
}

const KIND_ORDER: DeviceKind[] = ['smoke', 'leak', 'lock', 'door', 'window', 'motion'];
const name = (e: ResolvedEntity) => e.name || (e.attributes?.friendly_name as string | undefined) || e.entity_id;

/** Problems first, then active motion, then by name. */
export function sortItems(items: DeviceItem[]): DeviceItem[] {
  return [...items].sort(
    (a, b) =>
      Number(b.problem) - Number(a.problem) ||
      Number(b.tone === 'warning' || b.tone === 'danger') - Number(a.tone === 'warning' || a.tone === 'danger') ||
      name(a.entity).localeCompare(name(b.entity))
  );
}

function summary(kind: DeviceGroup['kind'], items: DeviceItem[]): string {
  const problems = items.filter((i) => i.problem).length;
  if (kind === 'lock') return problems ? `${problems} unlocked` : 'All locked';
  if (kind === 'openings') return problems ? `${problems} open` : 'All closed';
  if (kind === 'hazards') return problems ? `${problems} detected` : 'All clear';
  if (kind === 'motion') {
    const active = items.filter((i) => i.stateLabel === 'Motion').length;
    return active ? `${active} active` : 'All clear';
  }
  return problems ? `${problems} ${problems === 1 ? 'alert' : 'alerts'}` : 'All clear';
}

function group(id: string, title: string, kind: DeviceGroup['kind'], items: DeviceItem[]): DeviceGroup {
  const sorted = sortItems(items);
  return { id, title, kind, items: sorted, problems: sorted.filter((i) => i.problem).length, summary: summary(kind, sorted) };
}

function allItems(e: SecurityEntities): DeviceItem[] {
  return [
    ...e.smokeSensors.map((x) => deviceItem(x, 'smoke')),
    ...e.leakSensors.map((x) => deviceItem(x, 'leak')),
    ...e.locks.map((x) => deviceItem(x, 'lock')),
    ...e.doorSensors.map((x) => deviceItem(x, 'door')),
    ...e.windowSensors.map((x) => deviceItem(x, 'window')),
    ...e.motionSensors.map((x) => deviceItem(x, 'motion'))
  ];
}

/** By type: Locks, Doors & windows, Motion, Hazards. Empty groups are dropped. */
export function groupByType(e: SecurityEntities): DeviceGroup[] {
  const items = allItems(e);
  const of = (...kinds: DeviceKind[]) => items.filter((i) => kinds.includes(i.kind));
  return [
    group('locks', 'Locks', 'lock', of('lock')),
    group('openings', 'Doors & windows', 'openings', of('door', 'window')),
    group('hazards', 'Hazards', 'hazards', of('smoke', 'leak')),
    group('motion', 'Motion', 'motion', of('motion'))
  ].filter((g) => g.items.length > 0);
}

/** By room: one group per area, ordered by floor level then area name; unassigned last. */
export function groupByRoom(e: SecurityEntities): DeviceGroup[] {
  const buckets = new Map<string, { title: string; floorLevel: number; floorName: string; items: DeviceItem[] }>();
  for (const item of allItems(e)) {
    const area = item.entity.area;
    const key = area?.area_id ?? item.entity.area_id ?? '_none';
    const title = area?.name ?? (item.entity.area_id ? item.entity.area_id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'No room');
    const floor = item.entity.floor;
    if (!buckets.has(key)) {
      buckets.set(key, { title, floorLevel: key === '_none' ? Infinity : floor?.level ?? 999, floorName: floor?.name ?? '', items: [] });
    }
    buckets.get(key)!.items.push(item);
  }
  return [...buckets.entries()]
    .sort(([, a], [, b]) => a.floorLevel - b.floorLevel || a.title.localeCompare(b.title))
    .map(([key, b]) => {
      const g = group(`room-${key}`, b.title, 'room', b.items);
      return b.floorName ? { ...g, summary: `${b.floorName} · ${g.summary}` } : g;
    });
}

/** Kind-based sort key used where hazards must lead (attention card). */
export function kindRank(kind: DeviceKind): number {
  return KIND_ORDER.indexOf(kind);
}

/**
 * Bento column span from content (7.5): 1–3 devices one column, 4+ two (with a two-column list
 * inside). Heights are measured by the grid itself (masonry rows). Returns Tailwind classes.
 */
export function bentoSpan(count: number): string {
  return count >= 4 ? 'md:col-span-2' : 'col-span-1';
}

/** Placement order for the bento grid: biggest groups first so small cards fill the gaps beside them. */
export function packOrder<T extends { items: unknown[] }>(groups: T[]): T[] {
  return [...groups].sort((a, b) => b.items.length - a.items.length);
}

// ---------------------------------------------------------------- activity

export interface LogbookEntry {
  entity_id?: string;
  state?: string;
  when: number | string;
  name?: string;
  context_user_id?: string | null;
}

export interface ActivityEvent {
  id: string;
  entityId: string;
  kind: DeviceKind | 'alarm';
  text: string;
  /** Epoch ms. */
  when: number;
  tone: Tone;
}

const DOMAIN_KIND = (entityId: string, kinds: Record<string, DeviceKind>): DeviceKind | 'alarm' | null =>
  entityId.startsWith('alarm_control_panel.') ? 'alarm' : kinds[entityId] ?? null;

/** One sentence per state change, e.g. "Front door unlocked by Samer". Unknown states are skipped. */
export function activitySentence(kind: DeviceKind | 'alarm', who: string, state: string, by?: string): { text: string; tone: Tone } | null {
  const suffix = by ? ` by ${by}` : '';
  switch (kind) {
    case 'alarm':
      if (state === 'triggered') return { text: `${who} triggered`, tone: 'danger' };
      if (state === 'disarmed') return { text: `${who} disarmed${suffix}`, tone: 'default' };
      if (state.startsWith('armed')) return { text: `${who} ${alarmStateLabel(state).toLowerCase()}${suffix}`, tone: 'success' };
      return null;
    case 'lock':
      if (state === 'locked') return { text: `${who} locked${suffix}`, tone: 'success' };
      if (state === 'unlocked' || state === 'open') return { text: `${who} unlocked${suffix}`, tone: 'warning' };
      if (state === 'jammed') return { text: `${who} jammed`, tone: 'danger' };
      return null;
    case 'door':
    case 'window':
      if (state === 'on') return { text: `${who} opened`, tone: 'warning' };
      if (state === 'off') return { text: `${who} closed`, tone: 'default' };
      return null;
    case 'motion':
      return state === 'on' ? { text: `Motion at ${who}`, tone: 'warning' } : null;
    default:
      return isOn(state) ? { text: `${who}: ${kind === 'leak' ? 'leak' : 'smoke'} detected`, tone: 'danger' } : null;
  }
}

const toMs = (when: number | string) => (typeof when === 'number' ? (when < 1e12 ? when * 1000 : when) : Date.parse(when));

/**
 * Turns HA logbook rows into timeline events, newest first. `kinds` maps entity ids to device
 * kinds, `names` gives display names, `users` maps HA user ids to person names.
 */
export function buildActivity(
  rows: LogbookEntry[],
  kinds: Record<string, DeviceKind>,
  names: Record<string, string>,
  users: Record<string, string>
): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  for (const row of rows) {
    if (!row.entity_id || row.state === undefined) continue;
    const kind = DOMAIN_KIND(row.entity_id, kinds);
    if (!kind) continue;
    const when = toMs(row.when);
    if (Number.isNaN(when)) continue;
    const by = row.context_user_id ? users[row.context_user_id] : undefined;
    const s = activitySentence(kind, names[row.entity_id] ?? row.name ?? row.entity_id, row.state, by);
    if (s) out.push({ id: `${row.entity_id}-${when}-${row.state}`, entityId: row.entity_id, kind, when, ...s });
  }
  return out.sort((a, b) => b.when - a.when);
}
