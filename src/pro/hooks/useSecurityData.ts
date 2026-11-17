import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useUserConfig } from '@/contexts/ConfigContext';
import { classifyBinarySensors } from '@/lib/entityClassifiers';
import { getConfiguredRtspCameras } from '@/lib/cameraSources';
import type { ResolvedEntity } from '@/types';

const isVisible = (e: ResolvedEntity) => !e.hidden && !e.disabled_by;
const isHazardOn = (e: ResolvedEntity) => e.state === 'on' || e.state === 'detected' || e.state === 'wet';
const isUnlocked = (e: ResolvedEntity) => e.state === 'unlocked' || e.state === 'open';

export function entityName(e: ResolvedEntity): string {
  return e.name || (e.attributes?.friendly_name as string | undefined) || e.entity_id;
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
    const alarms = (domainGroups['alarm_control_panel'] || []).filter(isVisible);
    const locks = (domainGroups['lock'] || []).filter(isVisible);
    const cameras = getConfiguredRtspCameras(config.cameras?.sources, domainGroups['camera'] || []);
    const people = [...(domainGroups['person'] || [])].filter(isVisible);
    const { doorSensors, windowSensors, motionSensors, leakSensors, smokeSensors } =
      classifyBinarySensors((domainGroups['binary_sensor'] || []).filter(isVisible));

    const openDoors = doorSensors.filter((d) => d.state === 'on');
    const openWindows = windowSensors.filter((w) => w.state === 'on');
    const unlockedLocks = locks.filter(isUnlocked);
    const activeHazards = [...leakSensors, ...smokeSensors].filter(isHazardOn);
    const activeMotion = motionSensors.filter((m) => m.state === 'on');

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
      activeHazards,
      activeMotion,
      attentionCount: openDoors.length + openWindows.length + unlockedLocks.length + activeHazards.length,
      total:
        alarms.length + locks.length + cameras.length + doorSensors.length + windowSensors.length +
        motionSensors.length + leakSensors.length + smokeSensors.length
    };
  }, [domainGroups, selectedAlarmEntityId, isLoading, config.cameras?.sources]);
}
