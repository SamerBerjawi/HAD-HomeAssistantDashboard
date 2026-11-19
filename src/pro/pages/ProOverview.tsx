import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { useEnergyData } from '@/hooks/useEnergyData';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { HAArea, HADevice, HAEntityRegistryEntry, HAFloor, HAState } from '@/types';
import {
  MemoAlarm,
  MemoCameras,
  MemoEnergyFlow,
  MemoEnergyGauges,
  MemoEnergyUsage,
  MemoEnergyUsageChart,
  MemoFans,
  MemoHourly,
  MemoLighting,
  MemoMedia,
  MemoPowerFlow,
  MemoPowerFlowChart,
  MemoPresence,
  MemoSensor,
  MemoSolar,
  MemoSolarChart,
  MemoSwitches,
  MemoVacuums,
  MemoWeather
} from '../components/overview/memoWidgetBodies';
import { OverviewTabsBar } from '../components/overview/OverviewTabsBar';
import { OverviewWidgetGrid } from '../components/overview/OverviewWidgetGrid';
import { ProOverviewSheets } from '../components/overview/ProOverviewSheets';
import { StatusPillsBar } from '../components/overview/StatusPillsBar';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useProOverviewActions } from '../hooks/useProOverviewActions';
import { useProOverviewLayout } from '../hooks/useProOverviewLayout';
import { useProOverviewModels } from '../hooks/useProOverviewModels';
import type { OverviewStatusPill } from '../lib/overviewPills';
import { isSensorDomain, sheetForPill, sheetForWidget, type OverviewSheet } from '../lib/overviewSheets';
import type { ProOverviewSensorDomain } from '../lib/overviewSecurity';
import type { OverviewTabId } from '../lib/overviewTabs';
import {
  buildOverviewSections,
  getProGroupBySections,
  getProSectionOrder
} from '../lib/overviewSections';
import {
  buildProWidgetCatalog,
  filterProDisplayWidgets,
  type ProWidgetCatalogItem,
  type ProWidgetSize
} from '../lib/overviewWidgets';

// Stable fallbacks so model memos don't re-run on every render while the store is still empty.
const EMPTY_AREAS: HAArea[] = [];
const EMPTY_FLOORS: HAFloor[] = [];
const EMPTY_STATES: Record<string, HAState> = {};
const EMPTY_REGISTRY: HAEntityRegistryEntry[] = [];
const EMPTY_DEVICES: HADevice[] = [];

const INTERACTIVE_WIDGET_IDS = new Set([
  'weather',
  'weather_hourly',
  'users',
  'lights',
  'switches',
  'fans',
  'vacuums',
  'media',
  'alarm',
  'cameras',
  'power_flow',
  'power_flow_chart',
  'energy_usage',
  'energy_usage_chart',
  'solar_production',
  'solar_production_chart',
  'energy_gauges',
  'energy_flow',
  'doors',
  'windows',
  'motion',
  'leak',
  'smoke'
]);


/**
 * Pro Overview page (docs/pro-ui/DESIGN.md 7.6): Active status pills bar, Category filter tabs &
 * Edit Mode controls, Customizable multi-size widget grid, and per-domain ProSheet inspectors.
 */
export default function ProOverview() {
  const {
    domainGroups,
    resolvedEntities,
    resolvedZones,
    areas,
    floors,
    states,
    entityRegistry,
    devices,
    selectedAlarmEntityId,
    setSelectedAlarmEntityId,
    selectedWeatherEntityId,
    setSelectedWeatherEntityId,
    callHAService,
    updateEntityState,
    sunState,
    serverUrl
  } = useAutoLayoutStore(
    useShallow((s) => ({
      domainGroups: s.domainGroups,
      resolvedEntities: s.resolvedEntities,
      resolvedZones: s.resolvedZones,
      areas: s.areas,
      floors: s.floors,
      states: s.states,
      entityRegistry: s.entityRegistry,
      devices: s.devices,
      selectedAlarmEntityId: s.selectedAlarmEntityId,
      setSelectedAlarmEntityId: s.setSelectedAlarmEntityId,
      selectedWeatherEntityId: s.selectedWeatherEntityId,
      setSelectedWeatherEntityId: s.setSelectedWeatherEntityId,
      callHAService: s.callHAService,
      updateEntityState: s.updateEntityState,
      sunState: s.states?.['sun.sun']?.state,
      serverUrl: s.serverUrl
    }))
  );
  const { config, updateConfig, flushPendingSave } = useUserConfig();
  const { isEditMode, setEditMode } = useEditMode();
  const energyData = useEnergyData();

  const [activeTab, setActiveTab] = useState<OverviewTabId>('all');
  const [sheet, setSheet] = useState<OverviewSheet | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedMediaEntityId, setSelectedMediaEntityId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const openSheet = useCallback((next: OverviewSheet | null) => {
    if (next?.kind === 'presence' && next.personId) setSelectedPersonId(next.personId);
    if (next?.kind === 'cameras' && next.cameraId) setSelectedCameraId(next.cameraId);
    setSheet(next);
  }, []);
  /** onOpenChange for a sheet that has no payload: opens it, or closes it if it is the open one. */
  const sheetOpenChange = useCallback(
    (kind: 'addWidgets' | 'weather' | 'presence' | 'fans' | 'vacuums' | 'media' | 'alarm' | 'cameras') => (open: boolean) =>
      setSheet((cur) => (open ? { kind } : cur?.kind === kind ? null : cur)),
    []
  );

  const {
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
  } = useProOverviewModels({
    domainGroups,
    resolvedEntities,
    resolvedZones,
    areas: areas ?? EMPTY_AREAS,
    floors: floors ?? EMPTY_FLOORS,
    states: states ?? EMPTY_STATES,
    entityRegistry: entityRegistry ?? EMPTY_REGISTRY,
    devices: devices ?? EMPTY_DEVICES,
    cameraSources: config.cameras?.sources,
    selectedAlarmEntityId,
    selectedWeatherEntityId,
    selectedMediaEntityId,
    selectedCameraId,
    sunState,
    energyData,
    isEditMode
  });

  const overviewConfig = config.overview || {};
  const hideBadges = Boolean(overviewConfig.hideBadges);
  const groupBySections = getProGroupBySections(config);
  const savedSectionOrder = getProSectionOrder(config);
  const hiddenTilesSet = useMemo(() => new Set(overviewConfig.hiddenTiles || []), [overviewConfig.hiddenTiles]);
  const hiddenFromAllSet = useMemo(
    () => new Set(overviewConfig.hiddenFromAllTiles || []),
    [overviewConfig.hiddenFromAllTiles]
  );

  const catalog = useMemo(
    () => buildProWidgetCatalog(groups.surveillanceCameras),
    [groups.surveillanceCameras]
  );

  const { currentTileOrder, displayWidgetIds } = useMemo(
    () =>
      filterProDisplayWidgets({
        savedTileOrder: overviewConfig.tileOrder,
        switchEntities: groups.switchEntities,
        vacuumEntities: groups.vacuumEntities,
        surveillanceCameras: groups.surveillanceCameras,
        isEditMode,
        hiddenTilesSet,
        hiddenFromAllSet,
        activeOverviewTab: activeTab
      }),
    [
      overviewConfig.tileOrder,
      groups.switchEntities,
      groups.vacuumEntities,
      groups.surveillanceCameras,
      isEditMode,
      hiddenTilesSet,
      hiddenFromAllSet,
      activeTab
    ]
  );

  const sections = useMemo(
    () =>
      buildOverviewSections({
        widgetIds: displayWidgetIds,
        catalog,
        tileSizes: overviewConfig.tileSizes,
        savedSectionOrder
      }),
    [displayWidgetIds, catalog, overviewConfig.tileSizes, savedSectionOrder]
  );
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    if (isEditMode || !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('all');
    }
  }, [isEditMode, tabs, activeTab]);

  const layout = useProOverviewLayout({
    catalog,
    currentTileOrder,
    displayWidgetIds,
    tileSizes: overviewConfig.tileSizes,
    hiddenTilesSet,
    hiddenFromAllSet,
    hideBadges,
    groupBySections,
    sectionIds,
    isEditMode,
    setEditMode,
    updateConfig,
    flushPendingSave,
    onOpenAddWidgets: () => openSheet({ kind: 'addWidgets' })
  });

  const actions = useProOverviewActions({
    isDemo,
    lightsModel,
    switchesModel,
    fansModel,
    mediaModel,
    alarmModel,
    callHAService,
    updateEntityState
  });

  const handleOpenPresence = useCallback((personId?: string) => openSheet({ kind: 'presence', personId }), [openSheet]);

  const handleOpenWidgetDetails = useCallback((widgetId: string) => {
    const next = sheetForWidget(widgetId);
    if (next) openSheet(next);
  }, [openSheet]);

  const handleActivatePill = useCallback((pill: OverviewStatusPill) => {
    const next = sheetForPill(pill);
    if (next) openSheet(next);
  }, [openSheet]);

  // Stable handlers for the memoized widget bodies.
  const { handleToggleControlBatch } = actions;
  const openers = useMemo(
    () => ({
      lights: () => openSheet({ kind: 'control', domain: 'lights' }),
      switches: () => openSheet({ kind: 'control', domain: 'switches' }),
      fans: () => openSheet({ kind: 'fans' }),
      vacuums: () => openSheet({ kind: 'vacuums' }),
      media: () => openSheet({ kind: 'media' }),
      doors: () => openSheet({ kind: 'sensor', domain: 'doors' }),
      sensor: (domain: ProOverviewSensorDomain) => openSheet({ kind: 'sensor', domain }),
      toggleLights: (forceOn: boolean) => handleToggleControlBatch('lights', forceOn),
      toggleSwitches: (forceOn: boolean) => handleToggleControlBatch('switches', forceOn)
    }),
    [openSheet, handleToggleControlBatch]
  );

  const singleCameraModels = useMemo(
    () => new Map(camerasModel.cameras.map((cam) => [cam.entityId, { ...camerasModel, cameras: [cam], featuredCamera: cam, totalCount: 1 }])),
    [camerasModel]
  );

  const getWidgetCardClassName = useCallback(
    (widget: ProWidgetCatalogItem) => {
      if (widget.id === 'lights' && lightsModel.onCount > 0) {
        return 'bg-[color-mix(in_oklab,var(--surface)_88%,var(--warning)_12%)]! ring-1 ring-warning/30';
      }
      if (widget.id === 'media') {
        return 'overflow-hidden';
      }
      if (widget.id === 'alarm' && alarmModel.isTriggered) {
        return 'overflow-hidden bg-[color-mix(in_oklab,var(--surface)_84%,var(--danger)_16%)]! ring-1 ring-danger/45';
      }
      if (widget.id === 'alarm' && alarmModel.isTransitioning) {
        return 'bg-[color-mix(in_oklab,var(--surface)_88%,var(--warning)_12%)]! ring-1 ring-warning/30';
      }
      if (isSensorDomain(widget.id)) {
        const sensorModel = sensorModels[widget.id as ProOverviewSensorDomain];
        if (sensorModel.isCriticalHazard) {
          return 'overflow-hidden bg-[color-mix(in_oklab,var(--surface)_84%,var(--danger)_16%)]! ring-1 ring-danger/45';
        }
        if (sensorModel.hasWarning) {
          return 'bg-[color-mix(in_oklab,var(--surface)_88%,var(--warning)_12%)]! ring-1 ring-warning/30';
        }
      }
      return undefined;
    },
    [lightsModel.onCount, alarmModel.isTriggered, alarmModel.isTransitioning, sensorModels]
  );

  const renderWidgetBody = useCallback(
    (widget: ProWidgetCatalogItem, size: ProWidgetSize) => {
      if (widget.id === 'weather') {
        return <MemoWeather model={weatherModel} size={size} />;
      }
      if (widget.id === 'weather_hourly') {
        return <MemoHourly model={weatherModel} size={size} />;
      }
      if (widget.id === 'users') {
        return (
          <MemoPresence
            model={presenceModel}
            size={size}
            serverUrl={serverUrl}
            onOpenMember={handleOpenPresence}
          />
        );
      }
      if (widget.id === 'lights') {
        return (
          <MemoLighting
            model={lightsModel}
            size={size}
            onToggleItem={actions.handleToggleControlItem}
            onToggleBatch={openers.toggleLights}
            onChangeBrightness={actions.handleChangeLightBrightness}
            onOpenSheet={openers.lights}
          />
        );
      }
      if (widget.id === 'switches') {
        return (
          <MemoSwitches
            model={switchesModel}
            size={size}
            onToggleItem={actions.handleToggleControlItem}
            onToggleBatch={openers.toggleSwitches}
            onOpenSheet={openers.switches}
          />
        );
      }
      if (widget.id === 'fans') {
        return (
          <MemoFans
            model={fansModel}
            size={size}
            onToggleFan={actions.handleToggleFan}
            onToggleBatch={actions.handleToggleFanBatch}
            onChangeSpeed={actions.handleChangeFanSpeed}
            onToggleOscillate={actions.handleToggleFanOscillate}
            onOpenSheet={openers.fans}
          />
        );
      }
      if (widget.id === 'vacuums') {
        return (
          <MemoVacuums
            model={vacuumsModel}
            size={size}
            onAction={actions.handleVacuumAction}
            onChangeSuction={actions.handleChangeVacuumSuction}
            onOpenSheet={openers.vacuums}
          />
        );
      }
      if (widget.id === 'media') {
        return (
          <MemoMedia
            model={mediaModel}
            size={size}
            serverUrl={serverUrl}
            onSelectPlayer={setSelectedMediaEntityId}
            onPlayPause={actions.handleMediaPlayPause}
            onPrev={actions.handleMediaPrev}
            onNext={actions.handleMediaNext}
            onSeek={actions.handleMediaSeek}
            onVolumeChange={actions.handleMediaVolumeChange}
            onToggleMute={actions.handleMediaToggleMute}
            onToggleShuffle={actions.handleMediaToggleShuffle}
            onCycleRepeat={actions.handleMediaCycleRepeat}
            onSelectSource={actions.handleMediaSelectSource}
            onPlayQueueTrack={actions.handlePlayQueueTrack}
            onOpenSheet={openers.media}
          />
        );
      }
      if (widget.id === 'alarm') {
        return (
          <MemoAlarm
            model={alarmModel}
            size={size}
            onExecuteMode={actions.handleExecuteAlarmMode}
            onSetLockState={actions.handleSetLockState}
            onLockAll={actions.handleLockAll}
            onOpenOpenings={openers.doors}
          />
        );
      }
      if (widget.id === 'cameras') {
        return (
          <MemoCameras
            model={camerasModel}
            size={size}
            serverUrl={serverUrl}
            onSelectCamera={setSelectedCameraId}
          />
        );
      }
      if (widget.id.startsWith('camera:')) {
        const camId = widget.id.slice('camera:'.length);
        const singleModel = singleCameraModels.get(camId) ?? camerasModel;
        return (
          <MemoCameras
            model={singleModel}
            size={size}
            serverUrl={serverUrl}
            onSelectCamera={setSelectedCameraId}
          />
        );
      }
      if (widget.id === 'power_flow') {
        return <MemoPowerFlow model={energyModel} size={size} />;
      }
      if (widget.id === 'power_flow_chart') {
        return <MemoPowerFlowChart model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_usage') {
        return <MemoEnergyUsage model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_usage_chart') {
        return <MemoEnergyUsageChart model={energyModel} size={size} />;
      }
      if (widget.id === 'solar_production') {
        return <MemoSolar model={energyModel} size={size} />;
      }
      if (widget.id === 'solar_production_chart') {
        return <MemoSolarChart model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_gauges') {
        return <MemoEnergyGauges model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_flow') {
        return <MemoEnergyFlow model={energyModel} size={size} />;
      }
      if (isSensorDomain(widget.id)) {
        return (
          <MemoSensor
            model={sensorModels[widget.id as ProOverviewSensorDomain]}
            size={size}
            onOpenSheet={openers.sensor}
          />
        );
      }
      return null;
    },
    [
      weatherModel,
      presenceModel,
      lightsModel,
      switchesModel,
      fansModel,
      vacuumsModel,
      mediaModel,
      alarmModel,
      camerasModel,
      energyModel,
      sensorModels,
      serverUrl,
      handleOpenPresence,
      actions,
      openers,
      singleCameraModels
    ]
  );

  useProPageHeader({ menu: layout.headerMenu });

  return (
    <div className="flex flex-col gap-4">
      <StatusPillsBar
        pills={pills}
        serverUrl={serverUrl}
        hideBadges={hideBadges}
        isEditMode={isEditMode}
        onToggleHideBadges={layout.handleToggleHideBadges}
        onActivatePill={handleActivatePill}
      />

      <OverviewTabsBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isEditMode={isEditMode}
        onToggleEditMode={layout.handleToggleEditMode}
        hiddenWidgetsCount={hiddenTilesSet.size}
        hideBadges={hideBadges}
        groupBySections={groupBySections}
        onOpenAddWidgets={() => openSheet({ kind: 'addWidgets' })}
        onToggleHideBadges={layout.handleToggleHideBadges}
        onToggleGroupBySections={layout.handleToggleGroupBySections}
        onResetLayout={layout.handleResetLayout}
      />

      <OverviewWidgetGrid
        widgetIds={displayWidgetIds}
        catalog={catalog}
        summaries={summaries}
        tileSizes={overviewConfig.tileSizes}
        hiddenTilesSet={hiddenTilesSet}
        hiddenFromAllSet={hiddenFromAllSet}
        activeTab={activeTab}
        groupBySections={groupBySections}
        sections={sections}
        isEditMode={isEditMode}
        onReorder={layout.handleReorder}
        onReorderSectionWidgets={layout.handleReorderSectionWidgets}
        onReorderSections={layout.handleReorderSections}
        onMoveSection={layout.handleMoveSection}
        onMoveWidget={layout.handleMoveWidget}
        onSetSize={layout.handleSetSize}
        onToggleHide={layout.handleToggleHide}
        onOpenAddWidgets={() => openSheet({ kind: 'addWidgets' })}
        onResetTab={() => setActiveTab('all')}
        onSelectTab={setActiveTab}
        interactiveWidgetIds={INTERACTIVE_WIDGET_IDS}
        onOpenWidgetDetails={handleOpenWidgetDetails}
        renderWidgetBody={renderWidgetBody}
        getWidgetCardClassName={getWidgetCardClassName}
      />

      <ProOverviewSheets
        serverUrl={serverUrl}
        catalog={catalog}
        tileSizes={overviewConfig.tileSizes}
        hiddenTilesSet={hiddenTilesSet}
        hiddenFromAllSet={hiddenFromAllSet}
        layout={layout}
        actions={actions}
        weatherModel={weatherModel}
        presenceModel={presenceModel}
        lightsModel={lightsModel}
        switchesModel={switchesModel}
        fansModel={fansModel}
        vacuumsModel={vacuumsModel}
        mediaModel={mediaModel}
        alarmModel={alarmModel}
        camerasModel={camerasModel}
        sensorModels={sensorModels}
        energyModel={energyModel}
        energyPeriod={energyData.period}
        onSelectEnergyPeriod={energyData.setPeriod}
        isAddWidgetsOpen={sheet?.kind === 'addWidgets'}
        onAddWidgetsOpenChange={sheetOpenChange('addWidgets')}
        isWeatherSheetOpen={sheet?.kind === 'weather'}
        onWeatherSheetOpenChange={sheetOpenChange('weather')}
        onSelectWeatherStation={setSelectedWeatherEntityId}
        isPresenceSheetOpen={sheet?.kind === 'presence'}
        onPresenceSheetOpenChange={sheetOpenChange('presence')}
        selectedPersonId={selectedPersonId}
        onSelectPersonId={setSelectedPersonId}
        activeControlSheet={sheet?.kind === 'control' ? sheet.domain : null}
        onCloseControlSheet={() => setSheet((cur) => (cur?.kind === 'control' ? null : cur))}
        isFansSheetOpen={sheet?.kind === 'fans'}
        onFansSheetOpenChange={sheetOpenChange('fans')}
        isVacuumsSheetOpen={sheet?.kind === 'vacuums'}
        onVacuumsSheetOpenChange={sheetOpenChange('vacuums')}
        isMediaSheetOpen={sheet?.kind === 'media'}
        onMediaSheetOpenChange={sheetOpenChange('media')}
        onSelectMediaEntityId={setSelectedMediaEntityId}
        isAlarmSheetOpen={sheet?.kind === 'alarm'}
        onAlarmSheetOpenChange={sheetOpenChange('alarm')}
        onSelectAlarmEntityId={setSelectedAlarmEntityId}
        isCamerasSheetOpen={sheet?.kind === 'cameras'}
        onCamerasSheetOpenChange={sheetOpenChange('cameras')}
        onSelectCameraId={setSelectedCameraId}
        activeSensorSheet={sheet?.kind === 'sensor' ? sheet.domain : null}
        onSelectSensorSheet={(domain) => setSheet((cur) => (domain ? { kind: 'sensor', domain } : cur?.kind === 'sensor' ? null : cur))}
        activeEnergySheetView={sheet?.kind === 'energy' ? sheet.view : null}
        onSelectEnergySheetView={(view) => setSheet((cur) => (view ? { kind: 'energy', view } : cur?.kind === 'energy' ? null : cur))}
      />
    </div>
  );
}
