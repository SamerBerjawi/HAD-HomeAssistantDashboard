/**
 * Pure summary builders for pro Overview widget cards (Components 3 preview content prior to
 * dedicated per-domain widget components in Components 4+). No React, no store.
 */
import type { ResolvedEntity } from '@/types';
import { formatPower } from './pageSentences';
import { alarmStateLabel } from './securityLogic';
import type { ProWidgetLiveSummary } from './overviewWidgets';

export interface BuildProWidgetSummariesInput {
  weather: {
    currentTemp: number;
    tempUnit: string;
    condition: string;
    humidity: number;
    high: number;
    low: number;
    nextDaySummary?: string;
    nextHoursSummary?: string;
  };
  peopleHomeCount: number;
  peopleTotalCount: number;
  peopleNamesSummary: string;
  onLightsCount: number;
  totalLightsCount: number;
  activeLightsSummary: string;
  onSwitchesCount: number;
  totalSwitchesCount: number;
  activeSwitchesSummary: string;
  vacuumStatus: string;
  vacuumBattery?: number;
  vacuumRoom?: string;
  vacuumName: string;
  activeFansCount: number;
  totalFansCount: number;
  playingMediaCount: number;
  playingSongTitle?: string;
  mediaDetail: string;
  alarmState?: string;
  alarmName: string;
  surveillanceCameras: ResolvedEntity[];
  energy: {
    homeKW: number;
    solarKW: number;
    gridImportKW: number;
    gridExportKW: number;
    batterySoC: number | null;
    homeKwh: number;
    gridImportKwh: number;
    gridExportKwh: number;
    solarYieldKwh: number;
    solarOffsetPct: number;
    solarForecastKwh?: number;
  };
  openDoorsCount: number;
  totalDoorsCount: number;
  openDoorsNames: string;
  openWindowsCount: number;
  totalWindowsCount: number;
  openWindowsNames: string;
  activeMotionCount: number;
  totalMotionCount: number;
  activeMotionNames: string;
  activeLeaksCount: number;
  totalLeaksCount: number;
  activeSmokeCount: number;
  totalSmokeCount: number;
}

export function buildProWidgetSummaries(i: BuildProWidgetSummariesInput): Record<string, ProWidgetLiveSummary> {
  const condLabel = i.weather.condition.replace(/[-_]/g, ' ');
  const alarmState = i.alarmState || 'unavailable';
  const alarmBadgeTone =
    alarmState === 'triggered'
      ? 'danger'
      : alarmState.startsWith('armed')
      ? 'success'
      : alarmState === 'unavailable'
      ? 'default'
      : 'warning';

  const netGridKw = i.energy.gridImportKW - i.energy.gridExportKW;
  const gridLabel =
    netGridKw < -0.05
      ? `Exporting ${formatPower(-netGridKw)}`
      : netGridKw > 0.05
      ? `Importing ${formatPower(netGridKw)}`
      : 'Grid balanced';

  const summaries: Record<string, ProWidgetLiveSummary> = {
    weather: {
      headline: `${Math.round(i.weather.currentTemp)}${i.weather.tempUnit}`,
      subtitle: `${condLabel} · H ${Math.round(i.weather.high)}° / L ${Math.round(i.weather.low)}° · ${Math.round(i.weather.humidity)}% humidity`,
      detail: i.weather.nextDaySummary || 'Daily forecast ready.',
      badgeText: condLabel,
      badgeTone: 'accent'
    },
    weather_hourly: {
      headline: `${Math.round(i.weather.currentTemp)}${i.weather.tempUnit}`,
      subtitle: `Next hours · H ${Math.round(i.weather.high)}° / L ${Math.round(i.weather.low)}°`,
      detail: i.weather.nextHoursSummary || 'Hourly forecast ready.',
      badgeText: 'Hourly',
      badgeTone: 'accent'
    },
    users: {
      headline: i.peopleTotalCount > 0 ? `${i.peopleHomeCount} of ${i.peopleTotalCount} home` : 'No members',
      subtitle: i.peopleTotalCount > 0 ? 'Household presence' : 'Add person entities in Home Assistant',
      detail: i.peopleNamesSummary || undefined,
      badgeText: i.peopleHomeCount > 0 ? `${i.peopleHomeCount} home` : 'Away',
      badgeTone: i.peopleHomeCount > 0 ? 'success' : 'default'
    },
    lights: {
      headline: `${i.onLightsCount} / ${i.totalLightsCount} on`,
      subtitle: i.onLightsCount > 0 ? 'Active lighting' : 'All lights off',
      detail: i.activeLightsSummary || 'Tap Lights later to toggle or dim rooms.',
      badgeText: i.onLightsCount > 0 ? `${i.onLightsCount} on` : 'Off',
      badgeTone: i.onLightsCount > 0 ? 'warning' : 'success'
    },
    switches: {
      headline: `${i.onSwitchesCount} / ${i.totalSwitchesCount} on`,
      subtitle: i.onSwitchesCount > 0 ? 'Active smart switches' : 'All switches off',
      detail: i.activeSwitchesSummary || 'No switches currently active.',
      badgeText: i.onSwitchesCount > 0 ? `${i.onSwitchesCount} on` : 'Idle',
      badgeTone: i.onSwitchesCount > 0 ? 'accent' : 'default'
    },
    vacuums: {
      headline: i.vacuumStatus,
      subtitle: `${i.vacuumName}${i.vacuumBattery !== undefined ? ` · ${Math.round(i.vacuumBattery)}%` : ''}`,
      detail: i.vacuumRoom ? `Current area: ${i.vacuumRoom}` : 'Ready on dock.',
      badgeText: i.vacuumRoom || i.vacuumStatus,
      badgeTone: i.vacuumStatus.toLowerCase() === 'cleaning' ? 'accent' : 'success'
    },
    fans: {
      headline: `${i.activeFansCount} / ${i.totalFansCount} running`,
      subtitle: i.activeFansCount > 0 ? 'Circulating air' : 'All fans idle',
      detail: i.activeFansCount > 0 ? `${i.activeFansCount} fan(s) running right now.` : 'No active fans.',
      badgeText: i.activeFansCount > 0 ? `${i.activeFansCount} on` : 'Idle',
      badgeTone: i.activeFansCount > 0 ? 'accent' : 'default'
    },
    media: {
      headline: i.playingMediaCount > 0 ? i.playingSongTitle || `${i.playingMediaCount} playing` : 'Idle',
      subtitle: i.mediaDetail,
      detail: i.playingMediaCount > 0 ? `${i.playingMediaCount} active speaker or TV player.` : 'All players paused or idle.',
      badgeText: i.playingMediaCount > 0 ? `${i.playingMediaCount} playing` : 'Idle',
      badgeTone: i.playingMediaCount > 0 ? 'accent' : 'default'
    },
    alarm: {
      headline: alarmStateLabel(alarmState),
      subtitle: i.alarmName,
      detail: 'Arm or disarm panel controls.',
      badgeText: alarmStateLabel(alarmState),
      badgeTone: alarmBadgeTone
    },
    cameras: {
      headline: `${i.surveillanceCameras.length} configured`,
      subtitle: i.surveillanceCameras.length > 0 ? 'Configured RTSP streams' : 'No configured RTSP cameras',
      detail:
        i.surveillanceCameras.length > 0
          ? i.surveillanceCameras.map((c) => c.name || c.entity_id).slice(0, 3).join(', ')
          : 'Configure cameras in Settings.',
      badgeText: i.surveillanceCameras.length > 0 ? `${i.surveillanceCameras.length} cams` : 'None',
      badgeTone: i.surveillanceCameras.length > 0 ? 'accent' : 'default'
    },
    power_flow: {
      headline: formatPower(i.energy.homeKW),
      subtitle: `Home load · ${gridLabel}`,
      detail: `Solar ${formatPower(i.energy.solarKW)}${i.energy.batterySoC !== null ? ` · Battery ${Math.round(i.energy.batterySoC)}%` : ''}`,
      badgeText: i.energy.solarKW > 0.05 ? `Solar ${formatPower(i.energy.solarKW)}` : gridLabel,
      badgeTone: i.energy.solarKW > 0.05 ? 'success' : 'default'
    },
    power_flow_chart: {
      headline: formatPower(i.energy.homeKW),
      subtitle: `12h power flow · Solar ${formatPower(i.energy.solarKW)}`,
      detail: `Grid: ${gridLabel}${i.energy.batterySoC !== null ? ` · Battery ${Math.round(i.energy.batterySoC)}%` : ''}`,
      badgeText: '12h',
      badgeTone: 'accent'
    },
    energy_usage: {
      headline: `${i.energy.homeKwh.toFixed(1)} kWh`,
      subtitle: `Today’s use · ${i.energy.solarOffsetPct}% solar offset`,
      detail: `Import ${i.energy.gridImportKwh.toFixed(1)} kWh · Return ${i.energy.gridExportKwh.toFixed(1)} kWh`,
      badgeText: `${i.energy.solarOffsetPct}% offset`,
      badgeTone: i.energy.solarOffsetPct > 0 ? 'success' : 'default'
    },
    energy_usage_chart: {
      headline: `${i.energy.homeKwh.toFixed(1)} kWh`,
      subtitle: `Hourly breakdown · ${i.energy.solarOffsetPct}% solar offset`,
      detail: `Import ${i.energy.gridImportKwh.toFixed(1)} kWh · Return ${i.energy.gridExportKwh.toFixed(1)} kWh`,
      badgeText: 'Today',
      badgeTone: 'accent'
    },
    solar_production: {
      headline: formatPower(i.energy.solarKW),
      subtitle: `${i.energy.solarYieldKwh.toFixed(1)} kWh yielded today`,
      detail: i.energy.solarForecastKwh
        ? `Daily forecast target: ${i.energy.solarForecastKwh.toFixed(1)} kWh`
        : 'Solar PV generation.',
      badgeText: `${i.energy.solarYieldKwh.toFixed(1)} kWh`,
      badgeTone: i.energy.solarKW > 0.05 ? 'success' : 'default'
    },
    solar_production_chart: {
      headline: `${i.energy.solarYieldKwh.toFixed(1)} kWh`,
      subtitle: `Live PV ${formatPower(i.energy.solarKW)}`,
      detail: i.energy.solarForecastKwh
        ? `Forecast target ${i.energy.solarForecastKwh.toFixed(1)} kWh`
        : 'Full-day solar generation curve.',
      badgeText: 'Forecast',
      badgeTone: 'success'
    },
    energy_gauges: {
      headline: `${i.energy.solarOffsetPct}% offset`,
      subtitle: `Net ${(i.energy.gridImportKwh - i.energy.gridExportKwh).toFixed(1)} kWh`,
      detail: `Import ${i.energy.gridImportKwh.toFixed(1)} · Return ${i.energy.gridExportKwh.toFixed(1)} kWh`,
      badgeText: 'Gauges',
      badgeTone: 'accent'
    },
    energy_flow: {
      headline: `${i.energy.homeKwh.toFixed(1)} kWh`,
      subtitle: 'Sources to home devices',
      detail: 'Energy distribution from supply to tracked rooms and appliances.',
      badgeText: 'Flow',
      badgeTone: 'accent'
    },
    doors: {
      headline: i.openDoorsCount > 0 ? `${i.openDoorsCount} open` : 'All closed',
      subtitle: `${i.totalDoorsCount} door sensors`,
      detail: i.openDoorsNames || 'All entry doors closed.',
      badgeText: i.openDoorsCount > 0 ? `${i.openDoorsCount} open` : 'Closed',
      badgeTone: i.openDoorsCount > 0 ? 'warning' : 'success'
    },
    windows: {
      headline: i.openWindowsCount > 0 ? `${i.openWindowsCount} open` : 'All closed',
      subtitle: `${i.totalWindowsCount} window sensors`,
      detail: i.openWindowsNames || 'All windows closed.',
      badgeText: i.openWindowsCount > 0 ? `${i.openWindowsCount} open` : 'Closed',
      badgeTone: i.openWindowsCount > 0 ? 'warning' : 'success'
    },
    motion: {
      headline: i.activeMotionCount > 0 ? `${i.activeMotionCount} active` : 'Clear',
      subtitle: `${i.totalMotionCount} motion zones`,
      detail: i.activeMotionNames || 'No recent motion detected.',
      badgeText: i.activeMotionCount > 0 ? 'Motion' : 'Clear',
      badgeTone: i.activeMotionCount > 0 ? 'warning' : 'success'
    },
    leak: {
      headline: i.activeLeaksCount > 0 ? `${i.activeLeaksCount} detected` : 'Dry',
      subtitle: `${i.totalLeaksCount} leak sensors`,
      detail: i.activeLeaksCount > 0 ? 'Water leak alert active!' : 'All zones dry.',
      badgeText: i.activeLeaksCount > 0 ? 'Hazard' : 'Dry',
      badgeTone: i.activeLeaksCount > 0 ? 'danger' : 'success'
    },
    smoke: {
      headline: i.activeSmokeCount > 0 ? `${i.activeSmokeCount} detected` : 'Clear',
      subtitle: `${i.totalSmokeCount} smoke detectors`,
      detail: i.activeSmokeCount > 0 ? 'Smoke alarm triggered!' : 'All detectors clear.',
      badgeText: i.activeSmokeCount > 0 ? 'Hazard' : 'Safe',
      badgeTone: i.activeSmokeCount > 0 ? 'danger' : 'success'
    }
  };

  for (const cam of i.surveillanceCameras) {
    const name = cam.name || (typeof cam.attributes?.friendly_name === 'string' ? cam.attributes.friendly_name : '') || cam.entity_id;
    summaries[`camera:${cam.entity_id}`] = {
      headline: cam.state || 'Idle',
      subtitle: name,
      detail: 'Live stream and snapshot feed.',
      badgeText: cam.state || 'Live',
      badgeTone: cam.state === 'unavailable' ? 'danger' : 'success'
    };
  }

  return summaries;
}

export function buildProOverviewSummariesFromModels(params: {
  groups: {
    onLights: ResolvedEntity[];
    lightEntities: ResolvedEntity[];
    onSwitches: ResolvedEntity[];
    switchEntities: ResolvedEntity[];
    activeFans: ResolvedEntity[];
    fanEntities: ResolvedEntity[];
    playingMediaEntities: ResolvedEntity[];
    activeMedia?: ResolvedEntity;
    surveillanceCameras: ResolvedEntity[];
    openDoors: ResolvedEntity[];
    doorSensors: ResolvedEntity[];
    openWindows: ResolvedEntity[];
    windowSensors: ResolvedEntity[];
    activeMotion: ResolvedEntity[];
    motionSensors: ResolvedEntity[];
    activeLeaks: ResolvedEntity[];
    leakSensors: ResolvedEntity[];
    activeSmoke: ResolvedEntity[];
    smokeSensors: ResolvedEntity[];
  };
  peoplePool: ResolvedEntity[];
  weather: {
    currentTemp: number;
    tempUnit: string;
    condition: string;
    humidity: number;
    high: number;
    low: number;
    daily: Array<{ dayShort: string; high: number; low: number }>;
    hourly: Array<{ timeLabel: string; temperature: number }>;
  };
  energy: {
    realtime: {
      homeConsumptionKW: number;
      solarPowerKW: number;
      gridImportPowerKW: number;
      gridExportPowerKW: number;
      batterySoC: number | null;
    };
    totals?: {
      homeConsumption?: number;
      solarToHome?: number;
      batteryToHome?: number;
      gridImport?: number;
      gridExport?: number;
      solar?: number;
      solarForecastTotal?: number | null;
    };
  };
  mediaSummary: { playingSongTitle?: string };
  vacuumSummary: {
    isVacuumCleaning?: boolean;
    vacuumBattery?: number | null;
    activeVacuumDevice?: { statusText?: string; currentRoom?: string; areaName?: string; name?: string } | null;
    firstVacuum?: { name?: string } | null;
  };
  alarmEntity?: ResolvedEntity | null;
}): Record<string, ProWidgetLiveSummary> {
  const { groups, peoplePool, weather, energy, mediaSummary, vacuumSummary, alarmEntity } = params;
  const nextDaySummary = weather.daily
    .slice(1, 4)
    .map((d) => `${d.dayShort} ${d.high}°/${d.low}°`)
    .join(' · ');
  const nextHoursSummary = weather.hourly
    .slice(0, 4)
    .map((h) => `${h.timeLabel} ${h.temperature}°`)
    .join(' · ');

  const homeConsumption = energy.totals?.homeConsumption || 0;
  const solarConsumed = energy.totals?.solarToHome || 0;
  const batteryToHome = energy.totals?.batteryToHome || 0;
  const solarOffsetPct =
    homeConsumption > 0
      ? Math.min(100, Math.round(((solarConsumed + batteryToHome) / homeConsumption) * 100))
      : 0;

  return buildProWidgetSummaries({
    weather: {
      currentTemp: weather.currentTemp,
      tempUnit: weather.tempUnit,
      condition: weather.condition,
      humidity: weather.humidity,
      high: weather.high,
      low: weather.low,
      nextDaySummary,
      nextHoursSummary
    },
    peopleHomeCount: peoplePool.filter((u) => u.state === 'home').length,
    peopleTotalCount: peoplePool.length,
    peopleNamesSummary: peoplePool
      .slice(0, 4)
      .map((u) => `${u.name.split(' ')[0]} (${u.state})`)
      .join(' · '),
    onLightsCount: groups.onLights.length,
    totalLightsCount: groups.lightEntities.length,
    activeLightsSummary: groups.onLights.slice(0, 3).map((l) => l.name).join(', '),
    onSwitchesCount: groups.onSwitches.length,
    totalSwitchesCount: groups.switchEntities.length,
    activeSwitchesSummary: groups.onSwitches.slice(0, 3).map((sw) => sw.name).join(', '),
    vacuumStatus:
      vacuumSummary.activeVacuumDevice?.statusText ||
      (vacuumSummary.isVacuumCleaning ? 'Cleaning' : 'Docked'),
    vacuumBattery: typeof vacuumSummary.vacuumBattery === 'number' ? vacuumSummary.vacuumBattery : undefined,
    vacuumRoom: vacuumSummary.activeVacuumDevice?.currentRoom || vacuumSummary.activeVacuumDevice?.areaName,
    vacuumName:
      vacuumSummary.activeVacuumDevice?.name || vacuumSummary.firstVacuum?.name || 'Robot vacuum',
    activeFansCount: groups.activeFans.length,
    totalFansCount: groups.fanEntities.length,
    playingMediaCount: groups.playingMediaEntities.length,
    playingSongTitle: mediaSummary.playingSongTitle,
    mediaDetail: groups.activeMedia?.name || 'No active speaker',
    alarmState: alarmEntity?.state,
    alarmName:
      (
        alarmEntity?.name ||
        (typeof alarmEntity?.attributes?.friendly_name === 'string'
          ? alarmEntity.attributes.friendly_name
          : '') ||
        'Security alarm'
      ).replace(/Homz/gi, 'HAD'),
    surveillanceCameras: groups.surveillanceCameras,
    energy: {
      homeKW: energy.realtime.homeConsumptionKW,
      solarKW: energy.realtime.solarPowerKW,
      gridImportKW: energy.realtime.gridImportPowerKW,
      gridExportKW: energy.realtime.gridExportPowerKW,
      batterySoC: energy.realtime.batterySoC,
      homeKwh: homeConsumption,
      gridImportKwh: energy.totals?.gridImport || 0,
      gridExportKwh: energy.totals?.gridExport || 0,
      solarYieldKwh: energy.totals?.solar || 0,
      solarOffsetPct,
      solarForecastKwh: energy.totals?.solarForecastTotal ?? undefined
    },
    openDoorsCount: groups.openDoors.length,
    totalDoorsCount: groups.doorSensors.length,
    openDoorsNames: groups.openDoors.map((d) => d.name).slice(0, 3).join(', '),
    openWindowsCount: groups.openWindows.length,
    totalWindowsCount: groups.windowSensors.length,
    openWindowsNames: groups.openWindows.map((w) => w.name).slice(0, 3).join(', '),
    activeMotionCount: groups.activeMotion.length,
    totalMotionCount: groups.motionSensors.length,
    activeMotionNames: groups.activeMotion.map((m) => m.name).slice(0, 3).join(', '),
    activeLeaksCount: groups.activeLeaks.length,
    totalLeaksCount: groups.leakSensors.length,
    activeSmokeCount: groups.activeSmoke.length,
    totalSmokeCount: groups.smokeSensors.length
  });
}
