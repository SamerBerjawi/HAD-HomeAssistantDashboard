/**
 * Pure view-models and room-grouping helpers for pro Overview Fans & Vacuums widgets and detail
 * sheets (docs/pro-ui/DESIGN.md 7.6). Reuses detectFanCapabilities and VacuumDeviceData models.
 */
import { detectFanCapabilities } from '@/services/fanClassification';
import type { ResolvedEntity } from '@/types';
import type { VacuumDeviceData } from '@/types/vacuum';
import { deriveShortName, resolveControlRoomName } from './overviewControls';
import type { PillTone } from './overviewPills';

export interface ProFanItem {
  entityId: string;
  name: string;
  shortName: string;
  roomName: string;
  isOn: boolean;
  percentage: number;
  supportsSpeed: boolean;
  oscillating: boolean;
  supportsOscillation: boolean;
  direction: 'forward' | 'reverse' | null;
  supportsDirection: boolean;
  presetMode: string | null;
  presetModes: string[];
}

export interface ProFanRoomGroup {
  roomName: string;
  items: ProFanItem[];
  onCount: number;
  totalCount: number;
}

export interface ProFansModel {
  items: ProFanItem[];
  onItems: ProFanItem[];
  onCount: number;
  totalCount: number;
  onRatioPct: number;
  avgSpeedPct: number | null;
  oscillatingCount: number;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

export type ProVacuumState = 'cleaning' | 'returning' | 'paused' | 'error' | 'docked' | 'idle';

export interface ProVacuumItem {
  entityId: string;
  name: string;
  roomName: string;
  state: ProVacuumState;
  statusLabel: string;
  badgeText: string;
  badgeTone: PillTone;
  batteryPct: number | null;
  batteryTone: PillTone;
  batteryCharging: boolean;
  fanSpeed: string | null;
  fanSpeedList: string[];
  currentRoom: string;
  cleanedAreaM2?: number;
  cleaningTimeMinutes?: number;
  isCleaning: boolean;
  isPaused: boolean;
  isReturning: boolean;
  isDocked: boolean;
  isError: boolean;
  /** The vacuum's maps (camera / image entities, newest first as discovered); the first is the latest. */
  maps?: { id: string; name: string; picture: string | null }[];
}

export interface ProVacuumsModel {
  items: ProVacuumItem[];
  primaryVacuum: ProVacuumItem | null;
  cleaningCount: number;
  totalCount: number;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

const DEFAULT_VACUUM_SPEEDS = ['Quiet', 'Balanced', 'Turbo', 'Max'];

export function buildFansOverviewModel(
  fanEntities: ResolvedEntity[],
  allEntities: ResolvedEntity[] = fanEntities
): ProFansModel {
  const mapped: ProFanItem[] = fanEntities.map((entity) => {
    const caps = detectFanCapabilities(entity, allEntities);
    const name = entity.name || entity.attributes?.friendly_name || entity.entity_id;
    const roomName = resolveControlRoomName(entity);
    const percentage = caps.isOn ? Math.max(1, Math.min(100, Math.round(caps.percentage || 66))) : 0;

    return {
      entityId: entity.entity_id,
      name,
      shortName: deriveShortName(name, roomName),
      roomName,
      isOn: caps.isOn,
      percentage,
      supportsSpeed: caps.supportsSpeed,
      oscillating: caps.isOscillating,
      supportsOscillation: caps.supportsOscillation,
      direction: caps.supportsDirection ? (caps.currentDirection ?? 'forward') : null,
      supportsDirection: caps.supportsDirection,
      presetMode: caps.currentPresetMode ?? null,
      presetModes: caps.presetModes
    };
  });

  const items = [...mapped].sort(
    (a, b) => Number(b.isOn) - Number(a.isOn) || a.name.localeCompare(b.name)
  );
  const onItems = items.filter((item) => item.isOn);
  const onCount = onItems.length;
  const totalCount = items.length;
  const onRatioPct = totalCount > 0 ? Math.round((onCount / totalCount) * 100) : 0;
  const oscillatingCount = onItems.filter((item) => item.oscillating).length;

  const avgSpeedPct =
    onCount > 0
      ? Math.round(onItems.reduce((sum, item) => sum + item.percentage, 0) / onCount)
      : null;

  const badgeTone: PillTone = onCount > 0 ? 'accent' : 'default';
  const badgeText =
    onCount > 0
      ? avgSpeedPct !== null
        ? `${avgSpeedPct}% avg`
        : `${onCount} on`
      : 'All off';

  let subtitleText: string;
  if (totalCount === 0) {
    subtitleText = 'No fan entities found';
  } else if (onCount > 0) {
    const oscNote = oscillatingCount > 0 ? ` · ${oscillatingCount} oscillating` : '';
    subtitleText = `${onCount} of ${totalCount} running · Avg ${avgSpeedPct ?? 0}%${oscNote}`;
  } else {
    subtitleText = `All fans off · ${totalCount} ready`;
  }

  return {
    items,
    onItems,
    onCount,
    totalCount,
    onRatioPct,
    avgSpeedPct,
    oscillatingCount,
    badgeText,
    badgeTone,
    subtitleText
  };
}

export function filterAndGroupFanItems(
  items: ProFanItem[],
  opts: { query?: string; onlyOn?: boolean } = {}
): ProFanRoomGroup[] {
  const q = (opts.query || '').trim().toLowerCase();
  const onlyOn = Boolean(opts.onlyOn);

  const filtered = items.filter((item) => {
    if (onlyOn && !item.isOn) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.roomName.toLowerCase().includes(q) ||
      item.entityId.toLowerCase().includes(q)
    );
  });

  const byRoom = new Map<string, ProFanItem[]>();
  for (const item of filtered) {
    const list = byRoom.get(item.roomName);
    if (list) list.push(item);
    else byRoom.set(item.roomName, [item]);
  }

  return Array.from(byRoom.entries())
    .map(([roomName, roomItems]) => ({
      roomName,
      items: roomItems,
      onCount: roomItems.filter((i) => i.isOn).length,
      totalCount: roomItems.length
    }))
    .sort((a, b) => Number(b.onCount > 0) - Number(a.onCount > 0) || a.roomName.localeCompare(b.roomName));
}

function normalizeVacuumState(raw: string | undefined): ProVacuumState {
  const val = (raw || 'docked').toLowerCase().trim();
  if (val === 'error' || val === 'fault' || val === 'problem') return 'error';
  if (val === 'cleaning' || val === 'on') return 'cleaning';
  if (val === 'returning') return 'returning';
  if (val === 'paused' || val === 'pause') return 'paused';
  if (val === 'idle' || val === 'standby' || val === 'off') return 'idle';
  return 'docked';
}

function describeVacuumStatus(state: ProVacuumState, currentRoom: string): {
  statusLabel: string;
  badgeText: string;
  badgeTone: PillTone;
} {
  if (state === 'cleaning') {
    return {
      statusLabel: currentRoom ? `Cleaning ${currentRoom}` : 'Cleaning floor',
      badgeText: 'Cleaning',
      badgeTone: 'success'
    };
  }
  if (state === 'returning') {
    return { statusLabel: 'Returning to dock', badgeText: 'Returning', badgeTone: 'warning' };
  }
  if (state === 'paused') {
    return {
      statusLabel: currentRoom ? `Paused in ${currentRoom}` : 'Cleaning paused',
      badgeText: 'Paused',
      badgeTone: 'warning'
    };
  }
  if (state === 'error') {
    return { statusLabel: 'Needs attention', badgeText: 'Error', badgeTone: 'danger' };
  }
  if (state === 'idle') {
    return { statusLabel: 'Idle', badgeText: 'Idle', badgeTone: 'default' };
  }
  return { statusLabel: 'Docked & charged', badgeText: 'Docked', badgeTone: 'default' };
}

function resolveBatteryTone(batteryPct: number | null): PillTone {
  if (batteryPct === null) return 'default';
  if (batteryPct < 20) return 'danger';
  if (batteryPct < 50) return 'warning';
  return 'success';
}

export function buildVacuumsOverviewModel(
  discoveredVacuums: VacuumDeviceData[],
  vacuumEntities: ResolvedEntity[] = []
): ProVacuumsModel {
  const sourceItems: ProVacuumItem[] =
    discoveredVacuums.length > 0
      ? discoveredVacuums.map((vac) => {
          const state = normalizeVacuumState(vac.state);
          const currentRoom = vac.currentRoom || vac.areaName || 'Home';
          const status = describeVacuumStatus(state, currentRoom);
          const batteryPct =
            typeof vac.batteryLevel === 'number' && Number.isFinite(vac.batteryLevel)
              ? Math.max(0, Math.min(100, Math.round(vac.batteryLevel)))
              : null;
          const speedList = vac.fanSpeedList.length > 0 ? vac.fanSpeedList : DEFAULT_VACUUM_SPEEDS;

          return {
            entityId: vac.entityId,
            name: vac.name,
            roomName: vac.areaName || currentRoom || 'Home',
            state,
            statusLabel: status.statusLabel,
            badgeText: status.badgeText,
            badgeTone: status.badgeTone,
            batteryPct,
            batteryTone: resolveBatteryTone(batteryPct),
            batteryCharging: Boolean(vac.batteryCharging),
            fanSpeed: vac.fanSpeed ?? speedList[1] ?? null,
            fanSpeedList: speedList,
            currentRoom,
            cleanedAreaM2: vac.cleanedAreaM2,
            cleaningTimeMinutes: vac.cleaningTimeMinutes,
            isCleaning: state === 'cleaning',
            isPaused: state === 'paused',
            isReturning: state === 'returning',
            isDocked: state === 'docked',
            isError: state === 'error',
            maps: vac.availableMaps.map((mp) => ({ id: mp.id, name: mp.name, picture: mp.imageUrl ?? null }))
          };
        })
      : vacuumEntities.map((entity) => {
          const state = normalizeVacuumState(entity.state);
          const roomName = resolveControlRoomName(entity);
          const currentRoom =
            typeof entity.attributes?.current_room === 'string' && entity.attributes.current_room.trim()
              ? entity.attributes.current_room.trim()
              : roomName;
          const status = describeVacuumStatus(state, currentRoom);
          const rawBat = entity.attributes?.battery_level ?? entity.attributes?.battery;
          const batteryPct =
            typeof rawBat === 'number' && Number.isFinite(rawBat)
              ? Math.max(0, Math.min(100, Math.round(rawBat)))
              : null;
          const rawSpeedList = Array.isArray(entity.attributes?.fan_speed_list)
            ? entity.attributes.fan_speed_list.filter((s: unknown): s is string => typeof s === 'string')
            : [];
          const fanSpeedList = rawSpeedList.length > 0 ? rawSpeedList : DEFAULT_VACUUM_SPEEDS;

          return {
            entityId: entity.entity_id,
            name: entity.name || entity.attributes?.friendly_name || entity.entity_id,
            roomName,
            state,
            statusLabel: status.statusLabel,
            badgeText: status.badgeText,
            badgeTone: status.badgeTone,
            batteryPct,
            batteryTone: resolveBatteryTone(batteryPct),
            batteryCharging: state === 'docked' || Boolean(entity.attributes?.charging),
            fanSpeed: typeof entity.attributes?.fan_speed === 'string' ? entity.attributes.fan_speed : null,
            fanSpeedList,
            currentRoom,
            isCleaning: state === 'cleaning',
            isPaused: state === 'paused',
            isReturning: state === 'returning',
            isDocked: state === 'docked',
            isError: state === 'error'
          };
        });

  const items = [...sourceItems].sort(
    (a, b) =>
      Number(b.isError) - Number(a.isError) ||
      Number(b.isCleaning) - Number(a.isCleaning) ||
      Number(b.isReturning || b.isPaused) - Number(a.isReturning || a.isPaused) ||
      a.name.localeCompare(b.name)
  );

  const cleaningCount = items.filter((v) => v.isCleaning).length;
  const errorCount = items.filter((v) => v.isError).length;
  const primaryVacuum = items[0] ?? null;

  let badgeTone: PillTone = 'default';
  let badgeText = 'Idle';
  if (errorCount > 0) {
    badgeTone = 'danger';
    badgeText = 'Attention';
  } else if (cleaningCount > 0) {
    badgeTone = 'success';
    badgeText = cleaningCount === 1 ? 'Cleaning' : `${cleaningCount} active`;
  } else if (primaryVacuum) {
    badgeTone = primaryVacuum.badgeTone;
    badgeText = primaryVacuum.badgeText;
  }

  let subtitleText: string;
  if (!primaryVacuum) {
    subtitleText = 'No robot vacuums found';
  } else if (cleaningCount > 0) {
    subtitleText = `${primaryVacuum.name} · ${primaryVacuum.statusLabel}`;
  } else {
    const batSuffix = primaryVacuum.batteryPct !== null ? ` · ${primaryVacuum.batteryPct}%` : '';
    subtitleText = `${primaryVacuum.name} · ${primaryVacuum.statusLabel}${batSuffix}`;
  }

  return {
    items,
    primaryVacuum,
    cleaningCount,
    totalCount: items.length,
    badgeText,
    badgeTone,
    subtitleText
  };
}
