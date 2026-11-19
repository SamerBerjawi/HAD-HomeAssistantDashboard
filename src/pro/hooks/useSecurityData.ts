import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useUserConfig } from '@/contexts/ConfigContext';
import { classifyBinarySensors, isBatteryEntity } from '@/lib/entityClassifiers';
import { getConfiguredRtspCameras } from '@/lib/cameraSources';
import type { ResolvedEntity } from '@/types';
import { LOW_BATTERY_THRESHOLD, type DeviceKind } from '../lib/securityLogic';

const isVisible = (e: ResolvedEntity) => !e.hidden && !e.disabled_by;
const isHazardOn = (e: ResolvedEntity) => e.state === 'on' || e.state === 'detected' || e.state === 'wet';
const isUnlocked = (e: ResolvedEntity) => e.state === 'unlocked' || e.state === 'open';
const isJammed = (e: ResolvedEntity) => e.state === 'jammed';
const isOffline = (e: ResolvedEntity) => e.state === 'unavailable' || e.state === 'unknown';
const isSecurityCover = (e: ResolvedEntity) => {
  const dc = e.attributes?.device_class;
  return dc === 'garage' || dc === 'gate';
};
const isCoverOpen = (e: ResolvedEntity) => e.state === 'open' || e.state === 'opening';

export function entityName(e: ResolvedEntity): string {
  return e.name || (e.attributes?.friendly_name as string | undefined) || e.entity_id;
}

export interface LowBatteryDevice {
  entity: ResolvedEntity;
  kind: DeviceKind;
  batteryPct: number;
}

export interface OfflineSecurityDevice {
  entity: ResolvedEntity;
  kind: DeviceKind;
}

/** Security entities grouped for the pro Security page, including garage/gate covers and sirens. */
export function useSecurityData() {
  const { config } = useUserConfig();
  const { domainGroups, selectedAlarmEntityId, isLoading, serverUrl } = useAutoLayoutStore(
    useShallow((s) => ({
      domainGroups: s.domainGroups,
      selectedAlarmEntityId: s.selectedAlarmEntityId,
      isLoading: s.isLoading,
      serverUrl: s.serverUrl
    }))
  );

  return useMemo(() => {
    const alarms = [...(domainGroups['alarm_control_panel'] || [])]
      .filter((a) => !a.disabled_by)
      .sort((a, b) => Number(a.hidden) - Number(b.hidden) || entityName(a).localeCompare(entityName(b)));
    const locks = (domainGroups['lock'] || []).filter(isVisible);
    const garages = (domainGroups['cover'] || []).filter((c) => isVisible(c) && isSecurityCover(c));
    const sirens = (domainGroups['siren'] || []).filter(isVisible);
    const cameras = getConfiguredRtspCameras(config.cameras?.sources, domainGroups['camera'] || []);
    const people = [...(domainGroups['person'] || [])].filter(isVisible);
    const { doorSensors, windowSensors, motionSensors, leakSensors, smokeSensors } =
      classifyBinarySensors((domainGroups['binary_sensor'] || []).filter(isVisible));

    const openDoors = doorSensors.filter((d) => d.state === 'on');
    const openWindows = windowSensors.filter((w) => w.state === 'on');
    const openGarages = garages.filter(isCoverOpen);
    const unlockedLocks = locks.filter(isUnlocked);
    const jammedLocks = locks.filter(isJammed);
    const activeHazards = [...leakSensors, ...smokeSensors].filter(isHazardOn);
    const activeSirens = sirens.filter((s) => s.state === 'on');
    const activeMotion = motionSensors.filter((m) => m.state === 'on');

    const batteryByDeviceId = new Map<string, number>();
    const batteryBySlug = new Map<string, number>();
    for (const s of domainGroups['sensor'] || []) {
      if (s.disabled_by || !isBatteryEntity(s)) continue;
      const pct = Number.parseFloat(s.state);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) continue;
      const rounded = Math.round(pct);
      if (s.device_id) batteryByDeviceId.set(s.device_id, rounded);
      const slug = s.entity_id
        .replace(/^sensor\./, '')
        .replace(/_(battery_level|battery_percentage|battery|bat)$/, '');
      if (slug) batteryBySlug.set(slug, rounded);
    }

    const deviceBatteryByEntityId: Record<string, number> = {};
    const lowBatteryDevices: LowBatteryDevice[] = [];
    const offlineDevices: OfflineSecurityDevice[] = [];

    const trackedPairs: Array<[ResolvedEntity[], DeviceKind]> = [
      [smokeSensors, 'smoke'],
      [leakSensors, 'leak'],
      [sirens, 'siren'],
      [locks, 'lock'],
      [garages, 'garage'],
      [doorSensors, 'door'],
      [windowSensors, 'window'],
      [motionSensors, 'motion']
    ];

    for (const [list, kind] of trackedPairs) {
      for (const e of list) {
        if (isOffline(e)) {
          offlineDevices.push({ entity: e, kind });
        }
        const entSlug = e.entity_id.replace(/^[^.]+\./, '');
        const attrBatt =
          typeof e.attributes?.battery_level === 'number'
            ? Math.round(e.attributes.battery_level)
            : typeof e.attributes?.battery === 'number'
              ? Math.round(e.attributes.battery)
              : e.device_id && batteryByDeviceId.has(e.device_id)
                ? batteryByDeviceId.get(e.device_id)
                : batteryBySlug.get(entSlug);
        if (typeof attrBatt === 'number' && Number.isFinite(attrBatt)) {
          deviceBatteryByEntityId[e.entity_id] = attrBatt;
          if (attrBatt < LOW_BATTERY_THRESHOLD) {
            lowBatteryDevices.push({ entity: e, kind, batteryPct: attrBatt });
          }
        }
      }
    }

    return {
      isLoading,
      serverUrl,
      alarms,
      activeAlarm: alarms.find((a) => a.entity_id === selectedAlarmEntityId) || alarms[0],
      locks,
      garages,
      sirens,
      cameras,
      people,
      doorSensors,
      windowSensors,
      motionSensors,
      leakSensors,
      smokeSensors,
      openDoors,
      openWindows,
      openGarages,
      unlockedLocks,
      jammedLocks,
      activeHazards,
      activeSirens,
      activeMotion,
      deviceBatteryByEntityId,
      lowBatteryDevices,
      offlineDevices,
      attentionCount:
        openDoors.length +
        openWindows.length +
        openGarages.length +
        unlockedLocks.length +
        jammedLocks.length +
        activeHazards.length +
        activeSirens.length,
      total:
        alarms.length +
        locks.length +
        garages.length +
        sirens.length +
        cameras.length +
        doorSensors.length +
        windowSensors.length +
        motionSensors.length +
        leakSensors.length +
        smokeSensors.length
    };
  }, [domainGroups, selectedAlarmEntityId, isLoading, serverUrl, config.cameras?.sources]);
}
