import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useUserConfig } from '@/contexts/ConfigContext';
import { classifyBinarySensors } from '@/lib/entityClassifiers';
import { getConfiguredRtspCameras } from '@/lib/cameraSources';
import type { ResolvedEntity } from '@/types';
import { LOW_BATTERY_THRESHOLD, type DeviceKind } from '../lib/securityLogic';

const isVisible = (e: ResolvedEntity) => !e.hidden && !e.disabled_by;
const isHazardOn = (e: ResolvedEntity) => e.state === 'on' || e.state === 'detected' || e.state === 'wet';
const isUnlocked = (e: ResolvedEntity) => e.state === 'unlocked' || e.state === 'open';
const isJammed = (e: ResolvedEntity) => e.state === 'jammed';
const isOffline = (e: ResolvedEntity) => e.state === 'unavailable' || e.state === 'unknown';

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

/** Security entities grouped the same way as the classic SecurityView, for the pro page. */
export function useSecurityData() {
  const { config } = useUserConfig();
  const { domainGroups, selectedAlarmEntityId, isLoading } = useAutoLayoutStore(
    useShallow((s) => ({
      domainGroups: s.domainGroups,
      selectedAlarmEntityId: s.selectedAlarmEntityId,
      isLoading: s.isLoading
    }))
  );

  return useMemo(() => {
    const alarms = [...(domainGroups['alarm_control_panel'] || [])]
      .filter((a) => !a.disabled_by)
      .sort((a, b) => Number(a.hidden) - Number(b.hidden) || entityName(a).localeCompare(entityName(b)));
    const locks = (domainGroups['lock'] || []).filter(isVisible);
    const cameras = getConfiguredRtspCameras(config.cameras?.sources, domainGroups['camera'] || []);
    const people = [...(domainGroups['person'] || [])].filter(isVisible);
    const { doorSensors, windowSensors, motionSensors, leakSensors, smokeSensors } =
      classifyBinarySensors((domainGroups['binary_sensor'] || []).filter(isVisible));

    const openDoors = doorSensors.filter((d) => d.state === 'on');
    const openWindows = windowSensors.filter((w) => w.state === 'on');
    const unlockedLocks = locks.filter(isUnlocked);
    const jammedLocks = locks.filter(isJammed);
    const activeHazards = [...leakSensors, ...smokeSensors].filter(isHazardOn);
    const activeMotion = motionSensors.filter((m) => m.state === 'on');

    // Match battery sensors to security devices via device_id.
    const batteryByDeviceId = new Map<string, number>();
    for (const s of domainGroups['sensor'] || []) {
      if (s.disabled_by || !s.device_id) continue;
      if (s.attributes?.device_class !== 'battery') continue;
      const pct = Number.parseFloat(s.state);
      if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
        batteryByDeviceId.set(s.device_id, Math.round(pct));
      }
    }

    const deviceBatteryByEntityId: Record<string, number> = {};
    const lowBatteryDevices: LowBatteryDevice[] = [];
    const offlineDevices: OfflineSecurityDevice[] = [];

    const trackedPairs: Array<[ResolvedEntity[], DeviceKind]> = [
      [smokeSensors, 'smoke'],
      [leakSensors, 'leak'],
      [locks, 'lock'],
      [doorSensors, 'door'],
      [windowSensors, 'window'],
      [motionSensors, 'motion']
    ];

    for (const [list, kind] of trackedPairs) {
      for (const e of list) {
        if (isOffline(e)) {
          offlineDevices.push({ entity: e, kind });
        }
        const attrBatt = typeof e.attributes?.battery_level === 'number'
          ? Math.round(e.attributes.battery_level)
          : e.device_id
            ? batteryByDeviceId.get(e.device_id)
            : undefined;
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
      alarms,
      activeAlarm: alarms.find((a) => a.entity_id === selectedAlarmEntityId) || alarms[0],
      locks,
      cameras,
      people,
      doorSensors,
      windowSensors,
      motionSensors,
      leakSensors,
      smokeSensors,
      openDoors,
      openWindows,
      unlockedLocks,
      jammedLocks,
      activeHazards,
      activeMotion,
      deviceBatteryByEntityId,
      lowBatteryDevices,
      offlineDevices,
      attentionCount:
        openDoors.length +
        openWindows.length +
        unlockedLocks.length +
        jammedLocks.length +
        activeHazards.length,
      total:
        alarms.length +
        locks.length +
        cameras.length +
        doorSensors.length +
        windowSensors.length +
        motionSensors.length +
        leakSensors.length +
        smokeSensors.length
    };
  }, [domainGroups, selectedAlarmEntityId, isLoading, config.cameras?.sources]);
}
