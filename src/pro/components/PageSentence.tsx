import { Fragment, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useRoomsData } from '@/hooks/useRoomsData';
import { haWebSocketService } from '@/services/haWebSocket';
import { fetchHAEnergyPreferences, isEnergyConfigured } from '@/services/haEnergyPreferences';
import type { EnergyPreferences } from '@/services/haEnergyPreferences';
import { computeInstantaneousPower } from '@/utils/energyMath';
import { buildMobilityHome } from '../lib/mobility/adapters';
import { studioMobilityHome } from '../lib/mobility/sampleVehicles';
import { findEntity } from '@/services/mobility/entityLookup';
import { resolveHealthSensorsForDevice } from '@/services/healthDiscovery';
import { discoverVacuumDevices } from '@/services/vacuumDiscovery';
import type { ResolvedEntity } from '@/types';
import { useSecurityData } from '../hooks/useSecurityData';
import { PRO_NAV_GROUPS, useVisibleNavGroups } from './proNav';
import {
  automationsSentence,
  energySentence,
  healthSentence,
  integrationsSentence,
  mediaSentence,
  vehiclesSentence,
  networkSentence,
  overviewSentence,
  roomsSentence,
  securitySentence,
  sentenceText,
  settingsSentence,
  systemSentence,
  vacuumsSentence,
  type SentencePart
} from '../lib/pageSentences';

type AnyState = { state?: string; attributes?: Record<string, unknown>; last_changed?: string } | undefined;

/** Number from an entity state, or undefined when missing/unavailable. */
function num(s: AnyState): number | undefined {
  if (!s || s.state === undefined || s.state === 'unavailable' || s.state === 'unknown' || s.state === '') return undefined;
  const n = parseFloat(s.state);
  return Number.isFinite(n) ? n : undefined;
}

/** Renders sentence parts: plain text with inline HeroUI soft chips (icon + value). */
export function RichSubtitle({ parts, compact = false }: { parts: SentencePart[]; compact?: boolean }) {
  return (
    <div
      className={compact ? 'text-xs leading-6 text-muted' : 'text-sm leading-8 text-muted'}
      aria-label={sentenceText(parts)}
    >
      <span aria-hidden="true">
        {parts.map((p, i) =>
          typeof p === 'string' ? (
            <Fragment key={i}>{p}</Fragment>
          ) : (
            <Chip
              key={i}
              size="sm"
              variant="soft"
              color={p.tone}
              className={compact ? 'mx-0.5 inline-flex h-5 gap-1 px-1.5 text-[11px] align-middle' : 'mx-0.5 inline-flex gap-1 align-middle'}
            >
              <HugeiconsIcon icon={p.icon} size={compact ? 12 : 14} />
              {p.label}
            </Chip>
          )
        )}
      </span>
    </div>
  );
}

// --------------------------------------------------------------------------------------------
// One small component per page, so each only subscribes to the data it needs.

function OverviewSentence() {
  const { domainGroups, resolvedEntities, selectedWeatherEntityId } = useAutoLayoutStore(
    useShallow((s) => ({ domainGroups: s.domainGroups, resolvedEntities: s.resolvedEntities, selectedWeatherEntityId: s.selectedWeatherEntityId }))
  );
  const parts = useMemo(() => {
    const weathers: ResolvedEntity[] =
      (domainGroups['weather'] || []).length > 0
        ? domainGroups['weather']
        : Object.values(resolvedEntities).filter((e) => e.entity_id.startsWith('weather.'));
    const w = (selectedWeatherEntityId && weathers.find((e) => e.entity_id === selectedWeatherEntityId)) || weathers[0];
    const a = (w?.attributes ?? {}) as Record<string, unknown>;
    const temperature = typeof a.temperature === 'number' ? a.temperature : undefined;
    const weather =
      w && temperature !== undefined
        ? {
            temperature,
            unit: (a.temperature_unit as string) || '°C',
            condition: w.state,
            humidity: typeof a.humidity === 'number' ? a.humidity : undefined,
            windSpeed: typeof a.wind_speed === 'number' ? a.wind_speed : undefined,
            windUnit: (a.wind_speed_unit as string) || 'km/h'
          }
        : haWebSocketService.isDemo()
          ? { temperature: 22, unit: '°C', condition: 'partlycloudy', humidity: 55, windSpeed: 12, windUnit: 'km/h' }
          : undefined;
    const people = domainGroups['person'] || [];
    return overviewSentence({ weather, peopleHome: people.filter((p) => p.state === 'home').length, peopleTotal: people.length });
  }, [domainGroups, resolvedEntities, selectedWeatherEntityId]);
  return <RichSubtitle parts={parts} />;
}

function RoomsSentence() {
  const { houseSummary } = useRoomsData();
  return (
    <RichSubtitle
      parts={roomsSentence({
        lightsOn: houseSummary.totalLightsOn,
        doorsOpen: houseSummary.totalDoorsOpen,
        windowsOpen: houseSummary.totalWindowsOpen,
        motionRooms: houseSummary.activeMotionAreasCount,
        mediaPlaying: houseSummary.activeMediaCount
      })}
    />
  );
}

function MediaSentence() {
  const { areasDataList } = useRoomsData();
  const playing = useMemo(
    () =>
      areasDataList.flatMap((area) =>
        (area.entities.mediaPlayers || [])
          .filter((m) => m.state === 'playing')
          .map((m) => ({
            title: (m.attributes?.media_title as string) || (m.attributes?.app_name as string) || m.name || 'Media',
            area: area.name,
            isTv: m.attributes?.device_class === 'tv' || m.entity_id.includes('tv')
          }))
      ),
    [areasDataList]
  );
  return <RichSubtitle parts={mediaSentence({ playing })} />;
}

function EnergySentence() {
  const states = useAutoLayoutStore((s) => s.states);
  const [prefs, setPrefs] = useState<EnergyPreferences | null>(null);
  useEffect(() => {
    let cancelled = false;
    // Cached by the service, so this does not refetch when the Energy page loads it too.
    fetchHAEnergyPreferences()
      .then((p) => !cancelled && setPrefs(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const parts = useMemo(() => {
    const r = computeInstantaneousPower(states, prefs);
    return energySentence({
      configured: isEnergyConfigured(prefs),
      homeKW: r.homeConsumptionKW,
      solarKW: r.solarPowerKW,
      gridKW: r.gridPowerKW,
      batterySoC: r.batterySoC
    });
  }, [states, prefs]);
  return <RichSubtitle parts={parts} />;
}

function SecuritySentence() {
  const d = useSecurityData();
  const alarmState = d.activeAlarm?.state;
  return (
    <RichSubtitle
      parts={securitySentence({
        alarmState: alarmState && alarmState !== 'unavailable' ? alarmState : undefined,
        locks: d.locks.length,
        unlocked: d.unlockedLocks.length,
        contactSensors: d.doorSensors.length + d.windowSensors.length,
        doorsOpen: d.openDoors.length,
        windowsOpen: d.openWindows.length,
        hazards: d.activeHazards.length,
        motion: d.activeMotion.length
      })}
    />
  );
}

function MobilitySentence() {
  const { states, registry, devices, zones } = useAutoLayoutStore(useShallow((s) => ({ states: s.states, registry: s.rawEntityRegistry, devices: s.rawDevices, zones: s.resolvedZones })));
  const parts = useMemo(() => {
    const vehicles = buildMobilityHome({ states, registry, devices, zones, now: Date.now() }).home.vehicles;
    // Demo mode shows the sample vehicles on the page (useMobilityHome), so the header does too.
    return vehiclesSentence(vehicles.length || !haWebSocketService.isDemo() ? vehicles : studioMobilityHome('fleet').vehicles);
  }, [states, registry, devices, zones]);
  return <RichSubtitle parts={parts} />;
}

function HealthSentence() {
  const { rawStates, states } = useAutoLayoutStore(useShallow((s) => ({ rawStates: s.rawStates, states: s.states })));
  const parts = useMemo(() => {
    const current = Object.keys(rawStates || {}).length > 0 ? rawStates : states || {};
    let selected = '';
    try {
      selected = localStorage.getItem('ha_health_selected_device') || '';
    } catch {
      // storage blocked: use the first device
    }
    const { activeDevice, metricsMap } = resolveHealthSensorsForDevice(current, selected || undefined);
    return healthSentence({
      deviceName: activeDevice?.deviceName,
      steps: num(metricsMap.healthSteps),
      activeKcal: num(metricsMap.activeEnergy),
      heartRate: num(metricsMap.heartRate)
    });
  }, [rawStates, states]);
  return <RichSubtitle parts={parts} />;
}

function VacuumsSentence() {
  const { domainGroups, resolvedEntities, states, entityRegistry, devices } = useAutoLayoutStore(
    useShallow((s) => ({ domainGroups: s.domainGroups, resolvedEntities: s.resolvedEntities, states: s.states, entityRegistry: s.entityRegistry, devices: s.devices }))
  );
  const parts = useMemo(() => {
    const fromGroup = (domainGroups['vacuum'] || []).filter((v) => !v.disabled_by);
    const entities = fromGroup.length
      ? fromGroup
      : Object.values(resolvedEntities).filter((e) => e.entity_id.startsWith('vacuum.') && !e.disabled_by);
    const { vacuums } = discoverVacuumDevices(entities, resolvedEntities, states, entityRegistry || [], devices || []);
    return vacuumsSentence({ vacuums: vacuums.map((v) => ({ name: v.name, state: v.state, battery: v.batteryLevel, room: v.currentRoom })) });
  }, [domainGroups, resolvedEntities, states, entityRegistry, devices]);
  return <RichSubtitle parts={parts} />;
}

/** Same System Monitor entity ids (and fallbacks) as src/hooks/useSystemMetrics.ts, without its demo defaults. */
function SystemSentence() {
  const rawStates = useAutoLayoutStore((s) => s.rawStates);
  const parts = useMemo(() => {
    const get = (id: string, fallback: string) => (rawStates[id] || rawStates[fallback]) as AnyState;
    const temp = get('sensor.system_monitor_processor_temperature', 'sensor.processor_temperature');
    return systemSentence({
      cpu: num(get('sensor.system_monitor_processor_use', 'sensor.processor_use')),
      memory: num(get('sensor.system_monitor_memory_usage', 'sensor.memory_usage')),
      disk: num(get('sensor.system_monitor_disk_usage', 'sensor.system_monitor_disk_usage_')),
      cpuTemp: num(temp),
      tempUnit: (temp?.attributes?.unit_of_measurement as string) || '°C'
    });
  }, [rawStates]);
  return <RichSubtitle parts={parts} />;
}

/** Speedtest, AdGuard and TP-Link client sensors, matched like the classic network hooks. */
function NetworkSentence() {
  const rawStates = useAutoLayoutStore((s) => s.rawStates);
  const parts = useMemo(() => {
    const down = rawStates['sensor.ookla_speedtest_download'] || findEntity(rawStates, 'sensor', ['ookla_speedtest_download', 'speedtest_download']);
    const up = rawStates['sensor.ookla_speedtest_upload'] || findEntity(rawStates, 'sensor', ['ookla_speedtest_upload', 'speedtest_upload']);
    const blocked =
      rawStates['sensor.adguard_home_dns_queries_blocked_ratio'] || findEntity(rawStates, 'sensor', ['adguard_home_dns_queries_blocked_ratio', 'dns_queries_blocked_ratio']);
    const wifi = num(findEntity(rawStates, 'sensor', ['total_main_wifi_clients', 'main_wifi_clients']));
    const wired = num(findEntity(rawStates, 'sensor', ['total_wired_clients', 'wired_clients']));
    return networkSentence({
      downloadMbps: num(down),
      uploadMbps: num(up),
      blockedPercent: num(blocked),
      clients: wifi !== undefined || wired !== undefined ? (wifi ?? 0) + (wired ?? 0) : undefined
    });
  }, [rawStates]);
  return <RichSubtitle parts={parts} />;
}

function AutomationsSentence() {
  const states = useAutoLayoutStore((s) => s.states);
  const parts = useMemo(() => {
    const ids = Object.keys(states);
    const automations = ids.filter((id) => id.startsWith('automation.'));
    let last: { name: string; minutesAgo: number } | undefined;
    for (const id of automations) {
      const s = states[id] as AnyState;
      const t = s?.attributes?.last_triggered as string | undefined;
      if (!t) continue;
      const minutesAgo = (Date.now() - new Date(t).getTime()) / 60000;
      if (Number.isFinite(minutesAgo) && (!last || minutesAgo < last.minutesAgo))
        last = { name: (s?.attributes?.friendly_name as string) || id, minutesAgo: Math.max(0, minutesAgo) };
    }
    return automationsSentence({
      automationsOn: automations.filter((id) => (states[id] as AnyState)?.state === 'on').length,
      automationsTotal: automations.length,
      scenes: ids.filter((id) => id.startsWith('scene.')).length,
      scriptsRunning: ids.filter((id) => id.startsWith('script.') && (states[id] as AnyState)?.state === 'on').length,
      last
    });
  }, [states]);
  return <RichSubtitle parts={parts} />;
}

function IntegrationsSentence() {
  const { states, devices } = useAutoLayoutStore(useShallow((s) => ({ states: s.states, devices: s.devices })));
  const parts = useMemo(() => {
    const ids = Object.keys(states);
    return integrationsSentence({
      devices: (devices || []).length,
      entities: ids.length,
      updates: ids.filter((id) => id.startsWith('update.') && (states[id] as AnyState)?.state === 'on').length
    });
  }, [states, devices]);
  return <RichSubtitle parts={parts} />;
}

const TOTAL_PAGES = PRO_NAV_GROUPS.reduce((n, g) => n + g.items.length, 0) + 1;

function SettingsSentence() {
  const { authState } = useAuth();
  const version = useAutoLayoutStore((s) => s.haCoreVersion);
  const visible = useVisibleNavGroups().reduce((n, g) => n + g.items.length, 0) + 1; // + Settings, which can't be hidden
  return (
    <RichSubtitle
      parts={settingsSentence({ isDemo: authState.isDemo, version, userName: authState.user?.name, visiblePages: visible, totalPages: TOTAL_PAGES })}
    />
  );
}

const SENTENCES: Record<string, () => React.JSX.Element> = {
  overview: OverviewSentence,
  rooms: RoomsSentence,
  energy: EnergySentence,
  security: SecuritySentence,
  media: MediaSentence,
  mobility: MobilitySentence,
  health: HealthSentence,
  vacuums: VacuumsSentence,
  system: SystemSentence,
  network: NetworkSentence,
  automations: AutomationsSentence,
  integrations: IntegrationsSentence,
  settings: SettingsSentence
};

/** The rich subtitle for the current page (docs/pro-ui/DESIGN.md 7.4). */
export default function PageSentence({ page }: { page: string }) {
  const Sentence = SENTENCES[page];
  return Sentence ? <Sentence /> : null;
}
