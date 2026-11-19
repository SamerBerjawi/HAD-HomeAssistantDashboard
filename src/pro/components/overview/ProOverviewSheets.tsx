/**
 * Sheet/modal orchestration container for pro Overview (Add Widgets + domain Detail Sheets).
 * Extracted from ProOverview.tsx so the main page stays concise and within the 800-line guard.
 */
import type { EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import type { ProOverviewActions } from '../../hooks/useProOverviewActions';
import type { ProOverviewLayout } from '../../hooks/useProOverviewLayout';
import type { ProFansModel, ProVacuumsModel } from '../../lib/overviewAppliances';
import type { ProControlDomain, ProControlDomainModel } from '../../lib/overviewControls';
import type { ProOverviewEnergyModel, ProOverviewEnergyView } from '../../lib/overviewEnergy';
import type { ProMediaOverviewModel } from '../../lib/overviewMedia';
import type { ProOverviewPresenceModel } from '../../lib/overviewPresence';
import type {
  ProOverviewAlarmModel,
  ProOverviewCamerasModel,
  ProOverviewSensorDomain,
  ProOverviewSensorDomainModel
} from '../../lib/overviewSecurity';
import type { ProOverviewWeatherModel } from '../../lib/overviewWeather';
import type { ProWidgetCatalogItem } from '../../lib/overviewWidgets';
import { AddWidgetsSheet } from './AddWidgetsSheet';
import { AlarmDetailSheet, CamerasDetailSheet } from './AlarmCamerasDetailSheets';
import { ControlDetailSheet } from './ControlDetailSheet';
import { EnergyDetailSheet } from './EnergyDetailSheet';
import { FansDetailSheet } from './FansDetailSheet';
import { MediaDetailSheet } from './MediaDetailSheet';
import { PresenceDetailSheet } from './PresenceDetailSheet';
import { SensorsOpeningsDetailSheet } from './SensorsOpeningsDetailSheet';
import { VacuumsDetailSheet } from './VacuumsDetailSheet';
import { WeatherDetailSheet } from './WeatherDetailSheet';

interface ProOverviewSheetsProps {
  serverUrl: string;
  catalog: ProWidgetCatalogItem[];
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  layout: ProOverviewLayout;
  actions: ProOverviewActions;
  weatherModel: ProOverviewWeatherModel;
  presenceModel: ProOverviewPresenceModel;
  lightsModel: ProControlDomainModel;
  switchesModel: ProControlDomainModel;
  fansModel: ProFansModel;
  vacuumsModel: ProVacuumsModel;
  mediaModel: ProMediaOverviewModel;
  alarmModel: ProOverviewAlarmModel;
  camerasModel: ProOverviewCamerasModel;
  sensorModels: Record<ProOverviewSensorDomain, ProOverviewSensorDomainModel>;
  energyModel: ProOverviewEnergyModel;
  energyPeriod: EnergyHistoryPeriod;
  onSelectEnergyPeriod: (period: EnergyHistoryPeriod) => void;
  isAddWidgetsOpen: boolean;
  onAddWidgetsOpenChange: (open: boolean) => void;
  isWeatherSheetOpen: boolean;
  onWeatherSheetOpenChange: (open: boolean) => void;
  onSelectWeatherStation: (entityId: string) => void;
  isPresenceSheetOpen: boolean;
  onPresenceSheetOpenChange: (open: boolean) => void;
  selectedPersonId: string | null;
  onSelectPersonId: (entityId: string | null) => void;
  activeControlSheet: ProControlDomain | null;
  onCloseControlSheet: () => void;
  isFansSheetOpen: boolean;
  onFansSheetOpenChange: (open: boolean) => void;
  isVacuumsSheetOpen: boolean;
  onVacuumsSheetOpenChange: (open: boolean) => void;
  isMediaSheetOpen: boolean;
  onMediaSheetOpenChange: (open: boolean) => void;
  onSelectMediaEntityId: (entityId: string) => void;
  isAlarmSheetOpen: boolean;
  onAlarmSheetOpenChange: (open: boolean) => void;
  onSelectAlarmEntityId: (entityId: string) => void;
  isCamerasSheetOpen: boolean;
  onCamerasSheetOpenChange: (open: boolean) => void;
  onSelectCameraId: (entityId: string) => void;
  activeSensorSheet: ProOverviewSensorDomain | null;
  onSelectSensorSheet: (domain: ProOverviewSensorDomain | null) => void;
  activeEnergySheetView: ProOverviewEnergyView | null;
  onSelectEnergySheetView: (view: ProOverviewEnergyView | null) => void;
}

export function ProOverviewSheets({
  serverUrl,
  catalog,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  layout,
  actions,
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
  energyPeriod,
  onSelectEnergyPeriod,
  isAddWidgetsOpen,
  onAddWidgetsOpenChange,
  isWeatherSheetOpen,
  onWeatherSheetOpenChange,
  onSelectWeatherStation,
  isPresenceSheetOpen,
  onPresenceSheetOpenChange,
  selectedPersonId,
  onSelectPersonId,
  activeControlSheet,
  onCloseControlSheet,
  isFansSheetOpen,
  onFansSheetOpenChange,
  isVacuumsSheetOpen,
  onVacuumsSheetOpenChange,
  isMediaSheetOpen,
  onMediaSheetOpenChange,
  onSelectMediaEntityId,
  isAlarmSheetOpen,
  onAlarmSheetOpenChange,
  onSelectAlarmEntityId,
  isCamerasSheetOpen,
  onCamerasSheetOpenChange,
  onSelectCameraId,
  activeSensorSheet,
  onSelectSensorSheet,
  activeEnergySheetView,
  onSelectEnergySheetView
}: ProOverviewSheetsProps) {
  return (
    <>
      <AddWidgetsSheet
        isOpen={isAddWidgetsOpen}
        onOpenChange={onAddWidgetsOpenChange}
        catalog={catalog}
        tileSizes={tileSizes}
        hiddenTilesSet={hiddenTilesSet}
        hiddenFromAllSet={hiddenFromAllSet}
        onCycleSize={layout.handleCycleSize}
        onSetVisibilityMode={layout.handleSetVisibilityMode}
        onShowAllWidgets={layout.handleShowAllWidgets}
        onResetLayout={layout.handleResetLayout}
      />

      <WeatherDetailSheet
        isOpen={isWeatherSheetOpen}
        onOpenChange={onWeatherSheetOpenChange}
        model={weatherModel}
        onSelectStation={onSelectWeatherStation}
      />

      <PresenceDetailSheet
        isOpen={isPresenceSheetOpen}
        onOpenChange={onPresenceSheetOpenChange}
        model={presenceModel}
        selectedMemberId={selectedPersonId}
        onSelectMemberId={onSelectPersonId}
        serverUrl={serverUrl}
      />

      <ControlDetailSheet
        domain={activeControlSheet}
        onClose={onCloseControlSheet}
        model={activeControlSheet === 'switches' ? switchesModel : lightsModel}
        onToggleItem={actions.handleToggleControlItem}
        onToggleBatch={(forceOn) =>
          actions.handleToggleControlBatch(
            activeControlSheet === 'switches' ? 'switches' : 'lights',
            forceOn
          )
        }
        onChangeBrightness={actions.handleChangeLightBrightness}
      />

      <FansDetailSheet
        isOpen={isFansSheetOpen}
        onOpenChange={onFansSheetOpenChange}
        model={fansModel}
        onToggleFan={actions.handleToggleFan}
        onToggleBatch={actions.handleToggleFanBatch}
        onChangeSpeed={actions.handleChangeFanSpeed}
        onToggleOscillate={actions.handleToggleFanOscillate}
        onToggleDirection={actions.handleToggleFanDirection}
        onSelectPresetMode={actions.handleSelectFanPreset}
      />

      <VacuumsDetailSheet
        isOpen={isVacuumsSheetOpen}
        onOpenChange={onVacuumsSheetOpenChange}
        model={vacuumsModel}
        onAction={actions.handleVacuumAction}
        onChangeSuction={actions.handleChangeVacuumSuction}
      />

      <MediaDetailSheet
        isOpen={isMediaSheetOpen}
        onOpenChange={onMediaSheetOpenChange}
        model={mediaModel}
        serverUrl={serverUrl}
        onSelectPlayer={onSelectMediaEntityId}
        onPlayPause={actions.handleMediaPlayPause}
        onPrev={actions.handleMediaPrev}
        onNext={actions.handleMediaNext}
        onSeek={actions.handleMediaSeek}
        onVolumeChange={actions.handleMediaVolumeChange}
        onToggleMute={actions.handleMediaToggleMute}
        onTogglePower={actions.handleMediaTogglePower}
        onToggleShuffle={actions.handleMediaToggleShuffle}
        onCycleRepeat={actions.handleMediaCycleRepeat}
        onSelectSource={actions.handleMediaSelectSource}
        onSelectSoundMode={actions.handleMediaSelectSoundMode}
        onPlayQueueTrack={actions.handlePlayQueueTrack}
      />

      <AlarmDetailSheet
        isOpen={isAlarmSheetOpen}
        onOpenChange={onAlarmSheetOpenChange}
        model={alarmModel}
        onSelectPanel={onSelectAlarmEntityId}
        onExecuteMode={actions.handleExecuteAlarmMode}
        onSetLockState={actions.handleSetLockState}
        onLockAll={actions.handleLockAll}
        onInspectOpenings={() => {
          onAlarmSheetOpenChange(false);
          onSelectSensorSheet('doors');
        }}
      />

      <CamerasDetailSheet
        isOpen={isCamerasSheetOpen}
        onOpenChange={onCamerasSheetOpenChange}
        model={camerasModel}
        serverUrl={serverUrl}
        onSelectCamera={onSelectCameraId}
      />

      <SensorsOpeningsDetailSheet
        activeDomain={activeSensorSheet}
        onSelectDomain={onSelectSensorSheet}
        models={sensorModels}
      />

      <EnergyDetailSheet
        activeView={activeEnergySheetView}
        onSelectView={onSelectEnergySheetView}
        period={energyPeriod}
        onSelectPeriod={onSelectEnergyPeriod}
        model={energyModel}
      />
    </>
  );
}
