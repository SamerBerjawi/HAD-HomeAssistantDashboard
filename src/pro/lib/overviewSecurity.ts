/**
 * Pure view-models for pro Overview Security, Cameras, Openings & Safety Sensor widgets and
 * detail sheets (docs/pro-ui/DESIGN.md 7.6). Reuses securityLogic and getCameraMotionStatus.
 */
import { getCameraMotionStatus } from '@/services/cameraIntegrationService';
import type { ResolvedEntity } from '@/types';
import { deriveShortName, resolveControlRoomName } from './overviewControls';
import type { PillTone } from './overviewPills';
import { timeAgo } from './pageSentences';
import {
  alarmCodeIsNumeric,
  alarmModes,
  alarmNeedsCode,
  alarmStateLabel,
  alarmTone,
  deviceItem,
  shouldConfirmArming,
  type AlarmMode,
  type AlarmModeId,
  type DeviceKind,
  type Tone
} from './securityLogic';

export type ProOverviewSensorDomain = 'doors' | 'windows' | 'motion' | 'leak' | 'smoke';

export interface ProOverviewSensorItem {
  entityId: string;
  domain: ProOverviewSensorDomain;
  name: string;
  shortName: string;
  roomName: string;
  isActive: boolean;
  isOffline: boolean;
  stateLabel: string;
  badgeTone: PillTone;
  lastChangedText: string;
}

export interface ProSensorRoomGroup {
  roomName: string;
  items: ProOverviewSensorItem[];
  activeCount: number;
  totalCount: number;
}

export interface ProOverviewSensorDomainModel {
  domain: ProOverviewSensorDomain;
  title: string;
  items: ProOverviewSensorItem[];
  activeItems: ProOverviewSensorItem[];
  activeCount: number;
  totalCount: number;
  activeRatioPct: number;
  isCriticalHazard: boolean;
  hasWarning: boolean;
  headlineText: string;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

export interface ProOverviewAlarmLockItem {
  entityId: string;
  name: string;
  shortName: string;
  roomName: string;
  state: string;
  isUnlocked: boolean;
  isJammed: boolean;
  isOffline: boolean;
  stateLabel: string;
  badgeTone: PillTone;
}

export interface ProOverviewAlarmModel {
  panel: ResolvedEntity | null;
  panels: ResolvedEntity[];
  state: string;
  stateLabel: string;
  tone: Tone;
  isTriggered: boolean;
  isArmed: boolean;
  isTransitioning: boolean;
  modes: AlarmMode[];
  currentMode: AlarmModeId | null;
  panelName: string;
  changedBy: string | null;
  changedAgoText: string | null;
  openings: ResolvedEntity[];
  openingsCount: number;
  locks: ProOverviewAlarmLockItem[];
  unlockedLocksCount: number;
  needsCodeFor: (mode: AlarmModeId) => boolean;
  codeIsNumeric: boolean;
  shouldConfirmArming: (mode: AlarmModeId) => boolean;
}

export interface ProOverviewCameraItem {
  entityId: string;
  name: string;
  roomName: string;
  state: string;
  isOffline: boolean;
  hasMotion: boolean;
  lastMotionText: string;
  entity: ResolvedEntity;
}

export interface ProOverviewCamerasModel {
  cameras: ProOverviewCameraItem[];
  featuredCamera: ProOverviewCameraItem | null;
  motionCount: number;
  offlineCount: number;
  totalCount: number;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

const DOMAIN_META: Record<
  ProOverviewSensorDomain,
  { deviceKind: DeviceKind; title: string; unitLabel: string }
> = {
  doors: { deviceKind: 'door', title: 'Entry doors', unitLabel: 'door' },
  windows: { deviceKind: 'window', title: 'Windows', unitLabel: 'window' },
  motion: { deviceKind: 'motion', title: 'Motion zones', unitLabel: 'motion zone' },
  leak: { deviceKind: 'leak', title: 'Water leaks', unitLabel: 'leak sensor' },
  smoke: { deviceKind: 'smoke', title: 'Smoke & fire', unitLabel: 'smoke detector' }
};

function formatEntityLastChanged(entity: ResolvedEntity): string {
  const raw =
    entity.last_changed ||
    (typeof entity.attributes?.last_changed === 'string' ? entity.attributes.last_changed : undefined);
  if (!raw) return 'Recently';
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return 'Recently';
  const diffMinutes = Math.max(0, (Date.now() - parsed) / 60000);
  return timeAgo(diffMinutes);
}

export function buildOverviewSensorDomainModel(
  domain: ProOverviewSensorDomain,
  entities: ResolvedEntity[]
): ProOverviewSensorDomainModel {
  const meta = DOMAIN_META[domain];

  const mapped: ProOverviewSensorItem[] = entities.map((entity) => {
    const dev = deviceItem(entity, meta.deviceKind);
    const name = entity.name || entity.attributes?.friendly_name || entity.entity_id;
    const roomName = resolveControlRoomName(entity);
    const isOffline = dev.stateLabel === 'Offline';
    const isActive =
      domain === 'motion'
        ? dev.stateLabel === 'Detected' || dev.stateLabel === 'Motion'
        : dev.problem;

    return {
      entityId: entity.entity_id,
      domain,
      name,
      shortName: deriveShortName(name, roomName),
      roomName,
      isActive,
      isOffline,
      stateLabel: dev.stateLabel,
      badgeTone: dev.tone,
      lastChangedText: formatEntityLastChanged(entity)
    };
  });

  const items = [...mapped].sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) ||
      Number(b.isOffline) - Number(a.isOffline) ||
      a.name.localeCompare(b.name)
  );
  const activeItems = items.filter((item) => item.isActive);
  const activeCount = activeItems.length;
  const totalCount = items.length;
  const activeRatioPct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  const isHazardDomain = domain === 'leak' || domain === 'smoke';
  const isCriticalHazard = isHazardDomain && activeCount > 0;
  const hasWarning = !isHazardDomain && activeCount > 0;

  let headlineText: string;
  let badgeText: string;
  let badgeTone: PillTone;

  if (domain === 'doors' || domain === 'windows') {
    headlineText = activeCount > 0 ? `${activeCount} open` : 'All closed';
    badgeText = activeCount > 0 ? `${activeCount} open` : 'Closed';
    badgeTone = activeCount > 0 ? 'warning' : 'success';
  } else if (domain === 'motion') {
    headlineText = activeCount > 0 ? `${activeCount} active` : 'Clear';
    badgeText = activeCount > 0 ? 'Motion' : 'Clear';
    badgeTone = activeCount > 0 ? 'warning' : 'success';
  } else if (domain === 'leak') {
    headlineText = activeCount > 0 ? `${activeCount} leak` : 'Dry';
    badgeText = activeCount > 0 ? 'Leak alert' : 'Dry';
    badgeTone = activeCount > 0 ? 'danger' : 'success';
  } else {
    headlineText = activeCount > 0 ? `${activeCount} alert` : 'Clear';
    badgeText = activeCount > 0 ? 'Smoke alert' : 'Safe';
    badgeTone = activeCount > 0 ? 'danger' : 'success';
  }

  let subtitleText: string;
  if (totalCount === 0) {
    subtitleText = `No ${meta.unitLabel}s configured`;
  } else if (activeCount > 0) {
    const names = activeItems
      .slice(0, 2)
      .map((i) => i.roomName !== 'General' ? i.roomName : i.shortName)
      .join(', ');
    subtitleText = `${names}${activeCount > 2 ? ` +${activeCount - 2}` : ''}`;
  } else {
    subtitleText = `${totalCount} ${meta.unitLabel}${totalCount === 1 ? '' : 's'} · All clear`;
  }

  return {
    domain,
    title: meta.title,
    items,
    activeItems,
    activeCount,
    totalCount,
    activeRatioPct,
    isCriticalHazard,
    hasWarning,
    headlineText,
    badgeText,
    badgeTone,
    subtitleText
  };
}

export function filterAndGroupSensorItems(
  items: ProOverviewSensorItem[],
  opts: { query?: string; onlyActive?: boolean } = {}
): ProSensorRoomGroup[] {
  const q = (opts.query || '').trim().toLowerCase();
  const onlyActive = Boolean(opts.onlyActive);

  const filtered = items.filter((item) => {
    if (onlyActive && !item.isActive) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.roomName.toLowerCase().includes(q) ||
      item.entityId.toLowerCase().includes(q)
    );
  });

  const byRoom = new Map<string, ProOverviewSensorItem[]>();
  for (const item of filtered) {
    const list = byRoom.get(item.roomName);
    if (list) list.push(item);
    else byRoom.set(item.roomName, [item]);
  }

  return Array.from(byRoom.entries())
    .map(([roomName, roomItems]) => ({
      roomName,
      items: roomItems,
      activeCount: roomItems.filter((i) => i.isActive).length,
      totalCount: roomItems.length
    }))
    .sort((a, b) => Number(b.activeCount > 0) - Number(a.activeCount > 0) || a.roomName.localeCompare(b.roomName));
}

export function buildOverviewAlarmModel(params: {
  alarms: ResolvedEntity[];
  selectedAlarmEntityId?: string | null;
  openDoors: ResolvedEntity[];
  openWindows: ResolvedEntity[];
  locks: ResolvedEntity[];
}): ProOverviewAlarmModel {
  const { alarms, selectedAlarmEntityId, openDoors, openWindows, locks } = params;
  const visibleAlarms = [...alarms]
    .filter((a) => !a.disabled_by)
    .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)));

  const panel =
    (selectedAlarmEntityId
      ? visibleAlarms.find((a) => a.entity_id === selectedAlarmEntityId)
      : undefined) ||
    visibleAlarms.find(
      (a) =>
        a.state &&
        (a.state.startsWith('armed_') ||
          ['triggered', 'arming', 'pending', 'disarming'].includes(a.state))
    ) ||
    visibleAlarms[0] ||
    null;

  const state = panel?.state || 'disarmed';
  const rawPanelName =
    panel?.name ||
    (typeof panel?.attributes?.friendly_name === 'string' ? panel.attributes.friendly_name : '') ||
    'Security alarm';
  const panelName = rawPanelName.replace(/Homz/gi, 'HAD');

  const modes = panel ? alarmModes(panel) : [];
  const currentMode = modes.find((m) => m.id === state)?.id ?? null;

  const changedBy =
    typeof panel?.attributes?.changed_by === 'string' && panel.attributes.changed_by.trim()
      ? panel.attributes.changed_by.trim()
      : null;

  const rawChangedAt =
    panel?.last_changed ||
    (typeof panel?.attributes?.last_changed === 'string' ? panel.attributes.last_changed : undefined);
  let changedAgoText: string | null = null;
  if (rawChangedAt) {
    const mins = (Date.now() - Date.parse(rawChangedAt)) / 60000;
    if (!Number.isNaN(mins) && mins >= 0) {
      changedAgoText = timeAgo(mins);
    }
  }

  const mappedLocks: ProOverviewAlarmLockItem[] = locks
    .filter((l) => !l.disabled_by)
    .map((entity) => {
      const dev = deviceItem(entity, 'lock');
      const name = entity.name || entity.attributes?.friendly_name || entity.entity_id;
      const roomName = resolveControlRoomName(entity);
      return {
        entityId: entity.entity_id,
        name,
        shortName: deriveShortName(name, roomName),
        roomName,
        state: entity.state,
        isUnlocked: dev.stateLabel === 'Unlocked',
        isJammed: dev.stateLabel === 'Jammed',
        isOffline: dev.stateLabel === 'Offline',
        stateLabel: dev.stateLabel,
        badgeTone: dev.tone
      };
    })
    .sort(
      (a, b) =>
        Number(b.isJammed || b.isUnlocked) - Number(a.isJammed || a.isUnlocked) ||
        a.name.localeCompare(b.name)
    );

  const openings = [...openDoors, ...openWindows];

  return {
    panel,
    panels: visibleAlarms,
    state,
    stateLabel: panel ? alarmStateLabel(state) : 'No panel',
    tone: panel ? alarmTone(state) : 'default',
    isTriggered: state === 'triggered',
    isArmed: state.startsWith('armed'),
    isTransitioning: state === 'arming' || state === 'pending' || state === 'disarming',
    modes,
    currentMode,
    panelName,
    changedBy,
    changedAgoText,
    openings,
    openingsCount: openings.length,
    locks: mappedLocks,
    unlockedLocksCount: mappedLocks.filter((l) => l.isUnlocked).length,
    needsCodeFor: (mode) => (panel ? alarmNeedsCode(panel, mode) : false),
    codeIsNumeric: panel ? alarmCodeIsNumeric(panel) : true,
    shouldConfirmArming: (mode) => shouldConfirmArming(mode, openings.length)
  };
}

export function buildOverviewCamerasModel(params: {
  cameras: ResolvedEntity[];
  binarySensors: ResolvedEntity[];
  selectedCameraId?: string | null;
}): ProOverviewCamerasModel {
  const { cameras, binarySensors, selectedCameraId } = params;

  const mapped: ProOverviewCameraItem[] = cameras.map((camera) => {
    const motion = getCameraMotionStatus(camera, binarySensors);
    const isOffline = camera.state === 'unavailable' || camera.state === 'off';
    const name = camera.name || camera.attributes?.friendly_name || camera.entity_id;
    const roomName = resolveControlRoomName(camera);

    return {
      entityId: camera.entity_id,
      name,
      roomName,
      state: camera.state || 'idle',
      isOffline,
      hasMotion: motion.isMotionActive,
      lastMotionText: motion.isMotionActive ? 'Motion active' : motion.lastMotionText,
      entity: camera
    };
  });

  const sorted = [...mapped].sort(
    (a, b) =>
      Number(b.hasMotion) - Number(a.hasMotion) ||
      Number(a.isOffline) - Number(b.isOffline) ||
      a.name.localeCompare(b.name)
  );

  const featuredCamera =
    (selectedCameraId ? sorted.find((c) => c.entityId === selectedCameraId) : undefined) ||
    sorted[0] ||
    null;

  const motionCount = sorted.filter((c) => c.hasMotion).length;
  const offlineCount = sorted.filter((c) => c.isOffline).length;
  const totalCount = sorted.length;

  let badgeTone: PillTone = 'success';
  let badgeText = 'Ready';
  if (totalCount === 0) {
    badgeTone = 'default';
    badgeText = 'None';
  } else if (motionCount > 0) {
    badgeTone = 'warning';
    badgeText = motionCount === 1 ? 'Motion' : `${motionCount} motion`;
  } else if (offlineCount === totalCount) {
    badgeTone = 'danger';
    badgeText = 'Offline';
  }

  let subtitleText: string;
  if (totalCount === 0) {
    subtitleText = 'Add RTSP / go2rtc cameras in Settings';
  } else if (motionCount > 0) {
    const activeCam = sorted.find((c) => c.hasMotion);
    subtitleText = `${activeCam?.name || 'Camera'} detected motion`;
  } else {
    subtitleText = `${totalCount} camera${totalCount === 1 ? '' : 's'} ready`;
  }

  return {
    cameras: sorted,
    featuredCamera,
    motionCount,
    offlineCount,
    totalCount,
    badgeText,
    badgeTone,
    subtitleText
  };
}
