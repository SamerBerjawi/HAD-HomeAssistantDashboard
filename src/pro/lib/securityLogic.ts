/**
 * Pure helpers for the pro Security page (docs/pro-ui/DESIGN.md 7.5): alarm modes and codes,
 * device grouping for the bento grid, and recent-activity sentences. No React, no store.
 */
import type { ResolvedEntity } from '@/types';

export type Tone = 'default' | 'success' | 'warning' | 'danger';

// ---------------------------------------------------------------- alarm

/** HA AlarmControlPanelEntityFeature bits. */
export const ALARM_FEATURE = { ARM_HOME: 1, ARM_AWAY: 2, ARM_NIGHT: 4, TRIGGER: 8, ARM_CUSTOM_BYPASS: 16, ARM_VACATION: 32 } as const;

export type AlarmModeId =
  | 'disarmed'
  | 'armed_home'
  | 'armed_away'
  | 'armed_night'
  | 'armed_vacation'
  | 'armed_custom_bypass';

export interface AlarmMode {
  id: AlarmModeId;
  label: string;
  service: string;
}

const ALL_MODES: (AlarmMode & { feature: number; optional?: boolean })[] = [
  { id: 'disarmed', label: 'Off', service: 'alarm_disarm', feature: 0 },
  { id: 'armed_home', label: 'Home', service: 'alarm_arm_home', feature: ALARM_FEATURE.ARM_HOME },
  { id: 'armed_away', label: 'Away', service: 'alarm_arm_away', feature: ALARM_FEATURE.ARM_AWAY },
  { id: 'armed_night', label: 'Night', service: 'alarm_arm_night', feature: ALARM_FEATURE.ARM_NIGHT },
  { id: 'armed_vacation', label: 'Vacation', service: 'alarm_arm_vacation', feature: ALARM_FEATURE.ARM_VACATION, optional: true },
  { id: 'armed_custom_bypass', label: 'Custom', service: 'alarm_arm_custom_bypass', feature: ALARM_FEATURE.ARM_CUSTOM_BYPASS, optional: true }
];

/** Off plus the arm modes the panel supports. Without `supported_features`, standard four. */
export function alarmModes(alarm: Pick<ResolvedEntity, 'attributes'>): AlarmMode[] {
  const features = alarm.attributes?.supported_features;
  return ALL_MODES.filter((m) => {
    if (m.feature === 0) return true;
    if (typeof features !== 'number') return !m.optional;
    return (features & m.feature) !== 0;
  }).map(({ id, label, service }) => ({ id, label, service }));
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

/** Arming Away, Night, or Vacation with open entries or unlocked locks asks for confirmation first. */
export function shouldConfirmArming(
  target: AlarmModeId,
  openCount: number,
  unlockedLockCount = 0
): boolean {
  return (
    openCount + unlockedLockCount > 0 &&
    (target === 'armed_away' || target === 'armed_night' || target === 'armed_vacation')
  );
}

export const LOW_BATTERY_THRESHOLD = 20;

export function groupHasDanger(items: readonly DeviceItem[]): boolean {
  return items.some((i) => i.tone === 'danger' && i.problem);
}

// ---------------------------------------------------------------- devices

export type DeviceKind = 'lock' | 'garage' | 'door' | 'window' | 'motion' | 'leak' | 'smoke' | 'siren';

export interface DeviceItem {
  entity: ResolvedEntity;
  kind: DeviceKind;
  /** Needs attention: open, unlocked, detected, sounding. */
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
  garages?: ResolvedEntity[];
  doorSensors: ResolvedEntity[];
  windowSensors: ResolvedEntity[];
  motionSensors: ResolvedEntity[];
  leakSensors: ResolvedEntity[];
  smokeSensors: ResolvedEntity[];
  sirens?: ResolvedEntity[];
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
    case 'garage': {
      if (s === 'opening' || s === 'closing') {
        return { entity, kind, problem: s === 'opening', stateLabel: s === 'opening' ? 'Opening…' : 'Closing…', tone: 'warning' };
      }
      const open = s === 'open';
      return { entity, kind, problem: open, stateLabel: open ? 'Open' : 'Closed', tone: open ? 'warning' : 'success' };
    }
    case 'siren': {
      const active = s === 'on';
      return { entity, kind, problem: active, stateLabel: active ? 'Sounding' : 'Idle', tone: active ? 'danger' : 'success' };
    }
    case 'door':
    case 'window':
      return { entity, kind, problem: s === 'on', stateLabel: s === 'on' ? 'Open' : 'Closed', tone: s === 'on' ? 'warning' : 'success' };
    case 'motion':
      return { entity, kind, problem: false, stateLabel: s === 'on' ? 'Detected' : 'Clear', tone: s === 'on' ? 'warning' : 'success' };
    default:
      return { entity, kind, problem: isOn(s), stateLabel: isOn(s) ? 'Detected' : kind === 'leak' ? 'Dry' : 'Clear', tone: isOn(s) ? 'danger' : 'success' };
  }
}

const KIND_ORDER: DeviceKind[] = ['smoke', 'leak', 'siren', 'lock', 'garage', 'door', 'window', 'motion'];
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
  if (kind === 'siren') return problems ? `${problems} sounding` : 'All idle';
  if (kind === 'motion') {
    const active = items.filter((i) => i.stateLabel === 'Detected').length;
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
    ...(e.sirens || []).map((x) => deviceItem(x, 'siren')),
    ...e.locks.map((x) => deviceItem(x, 'lock')),
    ...(e.garages || []).map((x) => deviceItem(x, 'garage')),
    ...e.doorSensors.map((x) => deviceItem(x, 'door')),
    ...e.windowSensors.map((x) => deviceItem(x, 'window')),
    ...e.motionSensors.map((x) => deviceItem(x, 'motion'))
  ];
}

/** By type: Locks, Doors & windows (incl. garage/gate), Hazards, Sirens, Motion. Empty groups dropped. */
export function groupByType(e: SecurityEntities): DeviceGroup[] {
  const items = allItems(e);
  const of = (...kinds: DeviceKind[]) => items.filter((i) => kinds.includes(i.kind));
  const openingsItems = of('garage', 'door', 'window');
  const openingsTitle = (e.garages || []).length > 0 ? 'Doors, windows & gates' : 'Doors & windows';
  return [
    group('locks', 'Locks', 'lock', of('lock')),
    group('openings', openingsTitle, 'openings', openingsItems),
    group('hazards', 'Hazards', 'hazards', of('smoke', 'leak')),
    group('sirens', 'Sirens', 'siren', of('siren')),
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
  context_name?: string | null;
  context_domain?: string | null;
}

export type MotionDetectionKind = 'person' | 'pet' | 'animal' | 'vehicle' | 'package';

export interface ActivityEntityMeta {
  name: string;
  detection?: MotionDetectionKind;
  preposition?: 'in' | 'at';
}

export interface ActivityEvent {
  id: string;
  entityId: string;
  kind: DeviceKind | 'alarm';
  /** Specific detection subject for motion/camera AI sensors (person, pet, vehicle, package). */
  detection?: MotionDetectionKind;
  text: string;
  /** Optional room/area name when not already in the event sentence. */
  area?: string;
  /** Optional trigger context (person name or automation/script name). */
  source?: string;
  /** Epoch ms. */
  when: number;
  tone: Tone;
}

const DOMAIN_KIND = (entityId: string, kinds: Record<string, DeviceKind>): DeviceKind | 'alarm' | null =>
  entityId.startsWith('alarm_control_panel.') ? 'alarm' : kinds[entityId] ?? null;

const DETECTION_SUBJECT: Record<MotionDetectionKind, string> = {
  person: 'Person',
  pet: 'Pet',
  animal: 'Animal',
  vehicle: 'Vehicle',
  package: 'Package'
};

const STRIP_SENSOR_SUFFIX =
  /(?:^|[\s_-]+)(?:cell\s+motion\s+detection|motion\s+detection|person\s+detection|human\s+detection|pet\s+detection|animal\s+detection|vehicle\s+detection|package\s+detection|motion\s+sensor|occupancy\s+sensor|presence\s+sensor|motion|occupancy|presence|person|pet|animal|vehicle|package|detection|sensor)$/i;

const GENERIC_CAMERA_OR_SENSOR =
  /\b(tapo|c\d{3}|reolink|unifi|wyze|eufy|hikvision|dahua|amcrest|frigate|arlo|blink|camera|cam|sensor)\b/i;

function stripGenericSensorLabel(raw: string | null | undefined): string {
  if (!raw) return '';
  let out = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    const next = out.replace(STRIP_SENSOR_SUFFIX, '').trim();
    if (next === out) break;
    out = next;
  }
  return out.replace(/^[-–—:·\s]+|[-–—:·\s]+$/g, '');
}

/**
 * Resolves a human-friendly detection subject (`Person`, `Pet`, `Motion`, etc.) and place
 * (`in Living Room`, `at Entrance Door Bell`) for a motion/AI binary sensor so activity rows
 * never read "Motion detected at Motion" or "Motion detected at Person Detection".
 */
export function resolveMotionActivityMeta(entity: ResolvedEntity): ActivityEntityMeta {
  const friendly = typeof entity.attributes?.friendly_name === 'string' ? entity.attributes.friendly_name : '';
  const hay = `${entity.entity_id} ${entity.name ?? ''} ${friendly}`;

  let detection: MotionDetectionKind | undefined;
  if (/\b(person|human|face)\b|_person\b/i.test(hay)) detection = 'person';
  else if (/\b(pet|dog|cat)\b|_pet\b/i.test(hay)) detection = 'pet';
  else if (/\banimal\b|_animal\b/i.test(hay)) detection = 'animal';
  else if (/\b(vehicle|car|truck)\b|_vehicle\b|_car\b/i.test(hay)) detection = 'vehicle';
  else if (/\b(package|parcel|delivery)\b|_package\b/i.test(hay)) detection = 'package';

  const areaName = entity.area?.name?.trim() || '';
  const rawDeviceName = (entity.device?.name_by_user || entity.device?.name || '').trim();
  const deviceModel = (entity.device?.model || '').trim().toLowerCase();

  const cleanedEntity = stripGenericSensorLabel(entity.name);
  const cleanedFriendly = stripGenericSensorLabel(friendly);
  const cleanedDevice = stripGenericSensorLabel(rawDeviceName);

  const candidate = cleanedEntity || cleanedFriendly || cleanedDevice;
  const candidateLower = candidate.toLowerCase();
  const isGenericDevice =
    !candidate ||
    (areaName && candidateLower === areaName.toLowerCase()) ||
    GENERIC_CAMERA_OR_SENSOR.test(candidate) ||
    (deviceModel.length >= 3 && candidateLower.includes(deviceModel));

  if (areaName && isGenericDevice) {
    return { name: areaName, detection, preposition: 'in' };
  }

  const fallback =
    candidate || areaName || rawDeviceName || entity.name || friendly || entity.entity_id;
  return {
    name: fallback,
    detection,
    preposition: areaName && fallback.toLowerCase() === areaName.toLowerCase() ? 'in' : 'at'
  };
}

/**
 * Explicit, unambiguous sentence per state change (e.g. "Front door unlocked by Samer",
 * "Motion detected at Entrance Door Bell", "Person detected in Living Room"). Unknown states are skipped.
 */
export function activitySentence(
  kind: DeviceKind | 'alarm',
  who: string,
  state: string,
  by?: string,
  viaAutomation?: string,
  opts?: { detection?: MotionDetectionKind; preposition?: 'in' | 'at' }
): { text: string; tone: Tone } | null {
  const actor = by ? ` by ${by}` : viaAutomation ? ` via ${viaAutomation}` : '';
  switch (kind) {
    case 'alarm':
      if (state === 'triggered') return { text: `Alarm triggered — ${who}`, tone: 'danger' };
      if (state === 'pending') return { text: `${who}: entry delay started`, tone: 'warning' };
      if (state === 'arming') return { text: `${who} arming${actor}`, tone: 'warning' };
      if (state === 'disarmed') return { text: `${who} disarmed${actor}`, tone: 'default' };
      if (state.startsWith('armed')) {
        return { text: `${who} ${alarmStateLabel(state).toLowerCase()}${actor}`, tone: 'success' };
      }
      return null;
    case 'lock':
      if (state === 'locked') return { text: `${who} locked${actor}`, tone: 'success' };
      if (state === 'unlocked' || state === 'open') return { text: `${who} unlocked${actor}`, tone: 'warning' };
      if (state === 'jammed') return { text: `${who} jammed — check lock`, tone: 'danger' };
      return null;
    case 'garage':
      if (state === 'open') return { text: `${who} opened${actor}`, tone: 'warning' };
      if (state === 'closed') return { text: `${who} closed${actor}`, tone: 'success' };
      return null;
    case 'siren':
      if (state === 'on') return { text: `${who} siren activated${actor}`, tone: 'danger' };
      if (state === 'off') return { text: `${who} siren silenced${actor}`, tone: 'default' };
      return null;
    case 'door':
    case 'window':
      if (state === 'on') return { text: `${who} opened`, tone: 'warning' };
      if (state === 'off') return { text: `${who} closed`, tone: 'default' };
      return null;
    case 'motion': {
      if (state !== 'on') return null;
      const subject = opts?.detection ? DETECTION_SUBJECT[opts.detection] : 'Motion';
      const prep = opts?.preposition ?? 'at';
      return { text: `${subject} detected ${prep} ${who}`, tone: 'warning' };
    }
    default: {
      const hazardLabel = kind === 'leak' ? 'Water leak' : 'Smoke';
      if (isOn(state)) return { text: `${hazardLabel} detected at ${who}`, tone: 'danger' };
      if (state === 'off' || state === 'clear' || state === 'dry') {
        return { text: `${hazardLabel} cleared at ${who}`, tone: 'success' };
      }
      return null;
    }
  }
}

const toMs = (when: number | string) => (typeof when === 'number' ? (when < 1e12 ? when * 1000 : when) : Date.parse(when));

/**
 * Turns HA logbook rows into timeline events, newest first. `kinds` maps entity ids to device
 * kinds, `names` gives display names, `users` maps HA user ids to person names, optional
 * `areas` maps entity ids to room names, and optional `meta` carries motion detection subjects/places.
 */
export function buildActivity(
  rows: LogbookEntry[],
  kinds: Record<string, DeviceKind>,
  names: Record<string, string>,
  users: Record<string, string>,
  areas: Record<string, string> = {},
  meta: Record<string, ActivityEntityMeta> = {}
): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  for (const row of rows) {
    if (!row.entity_id || row.state === undefined) continue;
    const kind = DOMAIN_KIND(row.entity_id, kinds);
    if (!kind) continue;
    const when = toMs(row.when);
    if (Number.isNaN(when)) continue;
    const by = row.context_user_id ? users[row.context_user_id] : undefined;
    const via = !by && row.context_name ? row.context_name : undefined;
    const entityMeta = meta[row.entity_id];
    const who = entityMeta?.name ?? names[row.entity_id] ?? row.name ?? row.entity_id;
    const s = activitySentence(kind, who, row.state, by, via, {
      detection: entityMeta?.detection,
      preposition: entityMeta?.preposition
    });
    if (!s) continue;
    const rawArea = areas[row.entity_id];
    const area =
      rawArea && !s.text.toLowerCase().includes(rawArea.toLowerCase()) ? rawArea : undefined;
    const source = by ? `by ${by}` : via ? `via ${via}` : undefined;
    out.push({
      id: `${row.entity_id}-${when}-${row.state}`,
      entityId: row.entity_id,
      kind,
      detection: entityMeta?.detection,
      area,
      source,
      when,
      ...s
    });
  }
  return out.sort((a, b) => b.when - a.when);
}
