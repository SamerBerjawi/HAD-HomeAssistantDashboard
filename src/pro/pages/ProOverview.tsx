import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { useEnergyData } from '@/hooks/useEnergyData';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { LightingWidgetBody, SwitchesWidgetBody } from '../components/overview/ControlWidgets';
import {
  EnergyFlowWidgetBody,
  EnergyGaugesWidgetBody,
  EnergyUsageChartWidgetBody,
  EnergyUsageWidgetBody,
  PowerFlowChartWidgetBody,
  PowerFlowWidgetBody,
  SolarProductionChartWidgetBody,
  SolarProductionWidgetBody
} from '../components/overview/EnergyWidgets';
import { FansWidgetBody, VacuumsWidgetBody } from '../components/overview/FansVacuumWidgets';
import { MediaWidgetBody } from '../components/overview/MediaWidget';
import { OverviewTabsBar } from '../components/overview/OverviewTabsBar';
import { OverviewWidgetGrid } from '../components/overview/OverviewWidgetGrid';
import { FamilyPresenceWidgetBody } from '../components/overview/PresenceWidget';
import { ProOverviewSheets } from '../components/overview/ProOverviewSheets';
import {
  CamerasWidgetBody,
  SecurityAlarmWidgetBody
} from '../components/overview/SecurityAlarmCameraWidgets';
import { SensorDomainWidgetBody } from '../components/overview/SensorOpeningWidgets';
import { StatusPillsBar } from '../components/overview/StatusPillsBar';
import { HourlyForecastWidgetBody, WeatherForecastWidgetBody } from '../components/overview/WeatherWidgets';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useProOverviewActions } from '../hooks/useProOverviewActions';
import { useProOverviewLayout } from '../hooks/useProOverviewLayout';
import { useProOverviewModels } from '../hooks/useProOverviewModels';
import type { ProControlDomain } from '../lib/overviewControls';
import { energyViewForWidgetId, type ProOverviewEnergyView } from '../lib/overviewEnergy';
import type { OverviewStatusPill } from '../lib/overviewPills';
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

const SENSOR_WIDGET_IDS = new Set<ProOverviewSensorDomain>(['doors', 'windows', 'motion', 'leak', 'smoke']);

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
  const [isAddWidgetsOpen, setIsAddWidgetsOpen] = useState(false);
  const [isWeatherSheetOpen, setIsWeatherSheetOpen] = useState(false);
  const [isPresenceSheetOpen, setIsPresenceSheetOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeControlSheet, setActiveControlSheet] = useState<ProControlDomain | null>(null);
  const [isFansSheetOpen, setIsFansSheetOpen] = useState(false);
  const [isVacuumsSheetOpen, setIsVacuumsSheetOpen] = useState(false);
  const [isMediaSheetOpen, setIsMediaSheetOpen] = useState(false);
  const [selectedMediaEntityId, setSelectedMediaEntityId] = useState<string | null>(null);
  const [isAlarmSheetOpen, setIsAlarmSheetOpen] = useState(false);
  const [isCamerasSheetOpen, setIsCamerasSheetOpen] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [activeSensorSheet, setActiveSensorSheet] = useState<ProOverviewSensorDomain | null>(null);
  const [activeEnergySheetView, setActiveEnergySheetView] = useState<ProOverviewEnergyView | null>(null);

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
    areas: areas || [],
    floors: floors || [],
    states: states || {},
    entityRegistry: entityRegistry || [],
    devices: devices || [],
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
    onOpenAddWidgets: () => setIsAddWidgetsOpen(true)
  });

  const handleOpenPresence = useCallback((entityId?: string) => {
    if (entityId) setSelectedPersonId(entityId);
    setIsPresenceSheetOpen(true);
  }, []);

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

  const handleOpenWidgetDetails = useCallback(
    (widgetId: string) => {
      const energyView = energyViewForWidgetId(widgetId);
      if (energyView) {
        setActiveEnergySheetView(energyView);
        return;
      }
      if (widgetId === 'weather' || widgetId === 'weather_hourly') {
        setIsWeatherSheetOpen(true);
      } else if (widgetId === 'users') {
        handleOpenPresence();
      } else if (widgetId === 'lights' || widgetId === 'switches') {
        setActiveControlSheet(widgetId);
      } else if (widgetId === 'fans') {
        setIsFansSheetOpen(true);
      } else if (widgetId === 'vacuums') {
        setIsVacuumsSheetOpen(true);
      } else if (widgetId === 'media') {
        setIsMediaSheetOpen(true);
      } else if (widgetId === 'alarm') {
        setIsAlarmSheetOpen(true);
      } else if (widgetId === 'cameras') {
        setIsCamerasSheetOpen(true);
      } else if (widgetId.startsWith('camera:')) {
        setSelectedCameraId(widgetId.slice('camera:'.length));
        setIsCamerasSheetOpen(true);
      } else if (SENSOR_WIDGET_IDS.has(widgetId as ProOverviewSensorDomain)) {
        setActiveSensorSheet(widgetId as ProOverviewSensorDomain);
      }
    },
    [handleOpenPresence]
  );

  const handleActivatePill = useCallback(
    (pill: OverviewStatusPill) => {
      if (pill.kind === 'person' && pill.person?.entityId) {
        handleOpenPresence(pill.person.entityId);
      } else if (pill.kind === 'lights') {
        setActiveControlSheet('lights');
      } else if (pill.kind === 'switches') {
        setActiveControlSheet('switches');
      } else if (pill.kind === 'fans') {
        setIsFansSheetOpen(true);
      } else if (pill.kind === 'vacuums') {
        setIsVacuumsSheetOpen(true);
      } else if (pill.kind === 'media') {
        setIsMediaSheetOpen(true);
      } else if (pill.kind === 'alarm') {
        setIsAlarmSheetOpen(true);
      } else if (
        pill.kind === 'doors' ||
        pill.kind === 'windows' ||
        pill.kind === 'motion' ||
        pill.kind === 'leak' ||
        pill.kind === 'smoke'
      ) {
        setActiveSensorSheet(pill.kind);
      }
    },
    [handleOpenPresence]
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
      if (SENSOR_WIDGET_IDS.has(widget.id as ProOverviewSensorDomain)) {
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
        return <WeatherForecastWidgetBody model={weatherModel} size={size} />;
      }
      if (widget.id === 'weather_hourly') {
        return <HourlyForecastWidgetBody model={weatherModel} size={size} />;
      }
      if (widget.id === 'users') {
        return (
          <FamilyPresenceWidgetBody
            model={presenceModel}
            size={size}
            serverUrl={serverUrl}
            onOpenMember={handleOpenPresence}
          />
        );
      }
      if (widget.id === 'lights') {
        return (
          <LightingWidgetBody
            model={lightsModel}
            size={size}
            onToggleItem={actions.handleToggleControlItem}
            onToggleBatch={(forceOn) => actions.handleToggleControlBatch('lights', forceOn)}
            onChangeBrightness={actions.handleChangeLightBrightness}
            onOpenSheet={() => setActiveControlSheet('lights')}
          />
        );
      }
      if (widget.id === 'switches') {
        return (
          <SwitchesWidgetBody
            model={switchesModel}
            size={size}
            onToggleItem={actions.handleToggleControlItem}
            onToggleBatch={(forceOn) => actions.handleToggleControlBatch('switches', forceOn)}
            onOpenSheet={() => setActiveControlSheet('switches')}
          />
        );
      }
      if (widget.id === 'fans') {
        return (
          <FansWidgetBody
            model={fansModel}
            size={size}
            onToggleFan={actions.handleToggleFan}
            onToggleBatch={actions.handleToggleFanBatch}
            onChangeSpeed={actions.handleChangeFanSpeed}
            onToggleOscillate={actions.handleToggleFanOscillate}
            onOpenSheet={() => setIsFansSheetOpen(true)}
          />
        );
      }
      if (widget.id === 'vacuums') {
        return (
          <VacuumsWidgetBody
            model={vacuumsModel}
            size={size}
            onAction={actions.handleVacuumAction}
            onChangeSuction={actions.handleChangeVacuumSuction}
            onOpenSheet={() => setIsVacuumsSheetOpen(true)}
          />
        );
      }
      if (widget.id === 'media') {
        return (
          <MediaWidgetBody
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
            onOpenSheet={() => setIsMediaSheetOpen(true)}
          />
        );
      }
      if (widget.id === 'alarm') {
        return (
          <SecurityAlarmWidgetBody
            model={alarmModel}
            size={size}
            onExecuteMode={actions.handleExecuteAlarmMode}
            onSetLockState={actions.handleSetLockState}
            onLockAll={actions.handleLockAll}
            onOpenOpenings={() => setActiveSensorSheet('doors')}
          />
        );
      }
      if (widget.id === 'cameras') {
        return (
          <CamerasWidgetBody
            model={camerasModel}
            size={size}
            serverUrl={serverUrl}
            onSelectCamera={setSelectedCameraId}
          />
        );
      }
      if (widget.id.startsWith('camera:')) {
        const camId = widget.id.slice('camera:'.length);
        const camItem = camerasModel.cameras.find((c) => c.entityId === camId);
        const singleModel = camItem
          ? {
              ...camerasModel,
              cameras: [camItem],
              featuredCamera: camItem,
              totalCount: 1
            }
          : camerasModel;
        return (
          <CamerasWidgetBody
            model={singleModel}
            size={size}
            serverUrl={serverUrl}
            onSelectCamera={setSelectedCameraId}
          />
        );
      }
      if (widget.id === 'power_flow') {
        return <PowerFlowWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'power_flow_chart') {
        return <PowerFlowChartWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_usage') {
        return <EnergyUsageWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_usage_chart') {
        return <EnergyUsageChartWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'solar_production') {
        return <SolarProductionWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'solar_production_chart') {
        return <SolarProductionChartWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_gauges') {
        return <EnergyGaugesWidgetBody model={energyModel} size={size} />;
      }
      if (widget.id === 'energy_flow') {
        return <EnergyFlowWidgetBody model={energyModel} size={size} />;
      }
      if (SENSOR_WIDGET_IDS.has(widget.id as ProOverviewSensorDomain)) {
        return (
          <SensorDomainWidgetBody
            model={sensorModels[widget.id as ProOverviewSensorDomain]}
            size={size}
            onOpenSheet={(domain) => setActiveSensorSheet(domain)}
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
      actions
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
        onOpenAddWidgets={() => setIsAddWidgetsOpen(true)}
        onToggleHideBadges={layout.handleToggleHideBadges}
        onToggleGroupBySections={layout.handleToggleGroupBySections}
        onResetLayout={layout.handleResetLayout}
        onDoneEditMode={layout.handleDoneEditMode}
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
        onOpenAddWidgets={() => setIsAddWidgetsOpen(true)}
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
        isAddWidgetsOpen={isAddWidgetsOpen}
        onAddWidgetsOpenChange={setIsAddWidgetsOpen}
        isWeatherSheetOpen={isWeatherSheetOpen}
        onWeatherSheetOpenChange={setIsWeatherSheetOpen}
        onSelectWeatherStation={setSelectedWeatherEntityId}
        isPresenceSheetOpen={isPresenceSheetOpen}
        onPresenceSheetOpenChange={setIsPresenceSheetOpen}
        selectedPersonId={selectedPersonId}
        onSelectPersonId={setSelectedPersonId}
        activeControlSheet={activeControlSheet}
        onCloseControlSheet={() => setActiveControlSheet(null)}
        isFansSheetOpen={isFansSheetOpen}
        onFansSheetOpenChange={setIsFansSheetOpen}
        isVacuumsSheetOpen={isVacuumsSheetOpen}
        onVacuumsSheetOpenChange={setIsVacuumsSheetOpen}
        isMediaSheetOpen={isMediaSheetOpen}
        onMediaSheetOpenChange={setIsMediaSheetOpen}
        onSelectMediaEntityId={setSelectedMediaEntityId}
        isAlarmSheetOpen={isAlarmSheetOpen}
        onAlarmSheetOpenChange={setIsAlarmSheetOpen}
        onSelectAlarmEntityId={setSelectedAlarmEntityId}
        isCamerasSheetOpen={isCamerasSheetOpen}
        onCamerasSheetOpenChange={setIsCamerasSheetOpen}
        onSelectCameraId={setSelectedCameraId}
        activeSensorSheet={activeSensorSheet}
        onSelectSensorSheet={setActiveSensorSheet}
        activeEnergySheetView={activeEnergySheetView}
        onSelectEnergySheetView={setActiveEnergySheetView}
      />
    </div>
  );
}
