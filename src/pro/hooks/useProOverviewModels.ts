/**
 * Domain view-model composition hook for pro Overview (Component 9 cleanup):
 * gathers classified HA entities, live energy telemetry, and pure builder outputs for
 * widgets, status pills, category tabs, and detail sheets.
 */
import { useMemo } from 'react';
import type { HAArea, HADevice, HAEntityRegistryEntry, HAFloor, HAState, HAZone, ResolvedEntity } from '@/types';
import type { UseEnergyDataResult } from '@/hooks/useEnergyData';
import type { OverviewTabId } from '../lib/overviewTabs';
import type { ProOverviewSensorDomain } from '../lib/overviewSecurity';
import { haWebSocketService } from '@/services/haWebSocket';
import { classifyOverviewEntities, resolvePersonZoneDetails } from '@/services/overview/entityGroups';
import { summarizePlayingMedia, summarizeVacuums } from '@/services/overview/headerSummary';
import { discoverVacuumDevices } from '@/services/vacuumDiscovery';
import { buildFansOverviewModel, buildVacuumsOverviewModel } from '../lib/overviewAppliances';
import { buildControlDomainModel } from '../lib/overviewControls';
import { buildOverviewEnergyModel } from '../lib/overviewEnergy';
import { buildMediaOverviewModel } from '../lib/overviewMedia';
import { buildOverviewStatusPills } from '../lib/overviewPills';
import { buildOverviewPresenceModel } from '../lib/overviewPresence';
import {
  buildOverviewAlarmModel,
  buildOverviewCamerasModel,
  buildOverviewSensorDomainModel
} from '../lib/overviewSecurity';
import { buildProOverviewTabs } from '../lib/overviewTabs';
import { buildOverviewWeatherModel } from '../lib/overviewWeather';
import { buildProOverviewSummariesFromModels } from '../lib/overviewWidgetSummaries';
import type { CameraSourceConfig } from '@/types/userConfig';

interface UseProOverviewModelsParams {
  domainGroups: Record<string, ResolvedEntity[]>;
  resolvedEntities: Record<string, ResolvedEntity>;
  resolvedZones: HAZone[];
  areas: HAArea[];
  floors: HAFloor[];
  states: Record<string, HAState>;
  entityRegistry: HAEntityRegistryEntry[];
  devices: HADevice[];
  cameraSources: Record<string, CameraSourceConfig> | undefined;
  selectedAlarmEntityId: string | null;
  selectedWeatherEntityId: string | null;
  selectedMediaEntityId: string | null;
  selectedCameraId: string | null;
  sunState: string | undefined;
  energyData: UseEnergyDataResult;
  isEditMode: boolean;
}

export type ProOverviewTabsList = {
  id: OverviewTabId;
  label: string;
  count: number;
}[];

export function useProOverviewModels(p: UseProOverviewModelsParams) {
  const isDemo = haWebSocketService.isDemo();

  const groups = useMemo(
    () => classifyOverviewEntities(p.domainGroups, p.resolvedEntities, p.cameraSources),
    [p.domainGroups, p.resolvedEntities, p.cameraSources]
  );

  const alarmEntity = useMemo(() => {
    const alarms = [...(p.domainGroups['alarm_control_panel'] || [])]
      .filter((a) => !a.disabled_by)
      .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)));
    if (p.selectedAlarmEntityId) {
      const selected = alarms.find((a) => a.entity_id === p.selectedAlarmEntityId);
      if (selected) return selected;
    }
    return (
      alarms.find(
        (a) =>
          a.state && (a.state.startsWith('armed_') || ['triggered', 'arming', 'pending', 'disarming'].includes(a.state))
      ) || alarms[0]
    );
  }, [p.domainGroups, p.selectedAlarmEntityId]);

  const unlockedLocksCount = useMemo(
    () =>
      (p.domainGroups['lock'] || []).filter(
        (lock) => !lock.hidden && !lock.disabled_by && (lock.state === 'unlocked' || lock.state === 'open')
      ).length,
    [p.domainGroups]
  );

  const peoplePool = useMemo(() => {
    const visiblePeople = (p.domainGroups['person'] || []).filter((e) => !e.hidden && !e.disabled_by);
    return visiblePeople.length > 0 ? visiblePeople : groups.userEntities;
  }, [p.domainGroups, groups.userEntities]);

  const peopleInZones = useMemo(
    () =>
      peoplePool
        .map((entity) => ({ entity, ...resolvePersonZoneDetails(entity, p.resolvedZones) }))
        .filter((entry) => entry.isInKnownZone),
    [peoplePool, p.resolvedZones]
  );

  const { vacuums: discoveredVacuums } = useMemo(
    () => discoverVacuumDevices(groups.vacuumEntities, p.resolvedEntities, p.states, p.entityRegistry, p.devices),
    [groups.vacuumEntities, p.resolvedEntities, p.states, p.entityRegistry, p.devices]
  );

  const vacuumSummary = useMemo(
    () => summarizeVacuums(discoveredVacuums, groups.vacuumEntities),
    [discoveredVacuums, groups.vacuumEntities]
  );

  const activeVacuumsCount = useMemo(() => {
    const discoveredCleaning = discoveredVacuums.filter((v) => v.state === 'cleaning').length;
    return discoveredCleaning > 0 ? discoveredCleaning : groups.activeVacuums.length;
  }, [discoveredVacuums, groups.activeVacuums.length]);

  const solarSelfSufficiencyPct = useMemo(() => {
    const { homeConsumptionKW, solarPowerKW, batteryDischargePowerKW } = p.energyData.realtime;
    if (homeConsumptionKW <= 0) return null;
    return Math.min(100, Math.max(0, ((solarPowerKW + batteryDischargePowerKW) / homeConsumptionKW) * 100));
  }, [p.energyData.realtime]);

  const pills = useMemo(
    () =>
      buildOverviewStatusPills({
        activeSmoke: groups.activeSmoke,
        activeLeaks: groups.activeLeaks,
        alarmEntity,
        openDoors: groups.openDoors,
        openWindows: groups.openWindows,
        activeMotion: groups.activeMotion,
        peopleInZones,
        onLights: groups.onLights,
        onSwitches: groups.onSwitches,
        activeFans: groups.activeFans,
        cleaningVacuumsCount: activeVacuumsCount,
        playingMedia: groups.playingMediaEntities
      }),
    [groups, alarmEntity, peopleInZones, activeVacuumsCount]
  );

  const tabs = useMemo(
    () =>
      buildProOverviewTabs({
        onLightsCount: groups.onLights.length,
        onSwitchesCount: groups.onSwitches.length,
        switchesTotalCount: groups.switchEntities.length,
        openDoorsCount: groups.openDoors.length,
        openWindowsCount: groups.openWindows.length,
        activeMotionCount: groups.activeMotion.length,
        activeLeaksCount: groups.activeLeaks.length,
        activeSmokeCount: groups.activeSmoke.length,
        unlockedLocksCount,
        solarSelfSufficiencyPct,
        activeFansCount: groups.activeFans.length,
        playingMediaCount: groups.playingMediaEntities.length,
        vacuumsTotalCount: groups.vacuumEntities.length,
        activeVacuumsCount,
        camerasCount: groups.surveillanceCameras.length,
        isEditMode: p.isEditMode
      }),
    [groups, unlockedLocksCount, solarSelfSufficiencyPct, activeVacuumsCount, p.isEditMode]
  );

  const allResolvedList = useMemo(() => Object.values(p.resolvedEntities), [p.resolvedEntities]);

  const weatherModel = useMemo(
    () =>
      buildOverviewWeatherModel({
        weatherEntities: groups.weatherEntities,
        selectedWeatherEntityId: p.selectedWeatherEntityId,
        sunState: p.sunState,
        isDemo
      }),
    [groups.weatherEntities, p.selectedWeatherEntityId, p.sunState, isDemo]
  );

  const presenceModel = useMemo(
    () =>
      buildOverviewPresenceModel({
        peopleEntities: peoplePool,
        resolvedZones: p.resolvedZones,
        isDemo
      }),
    [peoplePool, p.resolvedZones, isDemo]
  );

  const lightsModel = useMemo(() => buildControlDomainModel('lights', groups.lightEntities), [groups.lightEntities]);

  const switchesModel = useMemo(() => buildControlDomainModel('switches', groups.switchEntities), [groups.switchEntities]);

  const fansModel = useMemo(
    () => buildFansOverviewModel(groups.fanEntities, allResolvedList),
    [groups.fanEntities, allResolvedList]
  );

  const vacuumsModel = useMemo(
    () => buildVacuumsOverviewModel(discoveredVacuums, groups.vacuumEntities),
    [discoveredVacuums, groups.vacuumEntities]
  );

  const mediaModel = useMemo(
    () =>
      buildMediaOverviewModel({
        mediaEntities: groups.mediaEntities,
        selectedEntityId: p.selectedMediaEntityId,
        devices: p.devices,
        allEntities: allResolvedList,
        isDemo
      }),
    [groups.mediaEntities, p.selectedMediaEntityId, p.devices, allResolvedList, isDemo]
  );

  const alarmModel = useMemo(
    () =>
      buildOverviewAlarmModel({
        alarms: p.domainGroups['alarm_control_panel'] || [],
        selectedAlarmEntityId: p.selectedAlarmEntityId,
        openDoors: groups.openDoors,
        openWindows: groups.openWindows,
        locks: p.domainGroups['lock'] || []
      }),
    [p.domainGroups, p.selectedAlarmEntityId, groups.openDoors, groups.openWindows]
  );

  const camerasModel = useMemo(
    () =>
      buildOverviewCamerasModel({
        cameras: groups.surveillanceCameras,
        binarySensors: p.domainGroups['binary_sensor'] || [],
        selectedCameraId: p.selectedCameraId
      }),
    [groups.surveillanceCameras, p.domainGroups, p.selectedCameraId]
  );

  const sensorModels = useMemo<Record<ProOverviewSensorDomain, ReturnType<typeof buildOverviewSensorDomainModel>>>(
    () => ({
      doors: buildOverviewSensorDomainModel('doors', groups.doorSensors),
      windows: buildOverviewSensorDomainModel('windows', groups.windowSensors),
      motion: buildOverviewSensorDomainModel('motion', groups.motionSensors),
      leak: buildOverviewSensorDomainModel('leak', groups.leakSensors),
      smoke: buildOverviewSensorDomainModel('smoke', groups.smokeSensors)
    }),
    [groups.doorSensors, groups.windowSensors, groups.motionSensors, groups.leakSensors, groups.smokeSensors]
  );

  const energyModel = useMemo(
    () =>
      buildOverviewEnergyModel({
        ...p.energyData,
        resolvedEntities: p.resolvedEntities,
        areas: p.areas,
        floors: p.floors
      }),
    [p.energyData, p.resolvedEntities, p.areas, p.floors]
  );

  const summaries = useMemo(
    () =>
      buildProOverviewSummariesFromModels({
        groups,
        peoplePool,
        weather: weatherModel,
        energy: p.energyData,
        mediaSummary: summarizePlayingMedia(groups.playingMediaEntities),
        vacuumSummary,
        alarmEntity
      }),
    [groups, peoplePool, weatherModel, p.energyData, vacuumSummary, alarmEntity]
  );

  return {
    isDemo,
    groups,
    pills,
    tabs,
    weatherModel,
    presenceModel,
    lightsModel,
    switchesModel,
    fansModel,
    vacuumsModel,
    mediaModel,
    alarmModel,
    camerasModel,
    sensorModels,
    energyModel,
    summaries
  };
}
