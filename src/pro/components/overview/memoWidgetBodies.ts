/**
 * Memoized Overview widget bodies (audit P4, 2026-11-19). ProOverview re-renders on every HA state
 * tick; with these, a widget only re-renders when its own model, size or handlers change. The
 * handlers ProOverview passes are stable (useCallback / useMemo), so memo can do its job.
 */
import { memo } from 'react';
import { LightingWidgetBody, SwitchesWidgetBody } from './ControlWidgets';
import {
  EnergyFlowWidgetBody,
  EnergyUsageChartWidgetBody,
  EnergyUsageWidgetBody,
  PowerFlowChartWidgetBody,
  PowerFlowWidgetBody,
  SolarProductionChartWidgetBody,
  SolarProductionWidgetBody
} from './EnergyWidgets';
import { EnergyGaugesWidgetBody as EnergyGaugesWidgetBodyRaw } from './EnergyGaugesWidget';
import { FansWidgetBody, VacuumsWidgetBody } from './FansVacuumWidgets';
import { MediaWidgetBody } from './MediaWidget';
import { FamilyPresenceWidgetBody } from './PresenceWidget';
import { CamerasWidgetBody, SecurityAlarmWidgetBody } from './SecurityAlarmCameraWidgets';
import { SensorDomainWidgetBody } from './SensorOpeningWidgets';
import { HourlyForecastWidgetBody, WeatherForecastWidgetBody } from './WeatherWidgets';

export const MemoWeather = memo(WeatherForecastWidgetBody);
export const MemoHourly = memo(HourlyForecastWidgetBody);
export const MemoPresence = memo(FamilyPresenceWidgetBody);
export const MemoLighting = memo(LightingWidgetBody);
export const MemoSwitches = memo(SwitchesWidgetBody);
export const MemoFans = memo(FansWidgetBody);
export const MemoVacuums = memo(VacuumsWidgetBody);
export const MemoMedia = memo(MediaWidgetBody);
export const MemoAlarm = memo(SecurityAlarmWidgetBody);
export const MemoCameras = memo(CamerasWidgetBody);
export const MemoSensor = memo(SensorDomainWidgetBody);
export const MemoPowerFlow = memo(PowerFlowWidgetBody);
export const MemoPowerFlowChart = memo(PowerFlowChartWidgetBody);
export const MemoEnergyUsage = memo(EnergyUsageWidgetBody);
export const MemoEnergyUsageChart = memo(EnergyUsageChartWidgetBody);
export const MemoSolar = memo(SolarProductionWidgetBody);
export const MemoSolarChart = memo(SolarProductionChartWidgetBody);
export const MemoEnergyGauges = memo(EnergyGaugesWidgetBodyRaw);
export const MemoEnergyFlow = memo(EnergyFlowWidgetBody);
