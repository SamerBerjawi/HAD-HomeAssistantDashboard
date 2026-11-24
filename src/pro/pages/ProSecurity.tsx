import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CloseButton, Skeleton, Toast } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Activity01Icon,
  Alert02Icon,
  Camera01Icon,
  Layers01Icon,
  Shield01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSecurityData } from '../hooks/useSecurityData';
import { useSecurityActivity } from '../hooks/useSecurityActivity';
import { AlarmHero } from '../components/security/AlarmHero';
import { AttentionCard } from '../components/security/AttentionCard';
import { DeviceGroups } from '../components/security/DeviceGroups';
import { SecurityCameras } from '../components/security/SecurityCameras';
import { RecentActivity } from '../components/security/RecentActivity';
import { SecurityDeviceSheet } from '../components/security/SecurityDeviceSheet';
import { deviceItem, type DeviceItem, type SecurityEntities } from '../lib/securityLogic';
import type { PillTone } from '../lib/overviewPills';
import { SmoothTab } from '../ui/kokonutui/SmoothTab';

const { toast } = Toast;

type SecurityPhoneTabId = 'attention' | 'cameras' | 'activity' | 'devices';

interface SecurityPhoneTab {
  id: SecurityPhoneTabId;
  title: string;
  icon: IconSvgElement;
  badge?: string;
  badgeTone?: PillTone;
}

/**
 * Pro Security page (docs/pro-ui/DESIGN.md 7.5, docs/pro-ui/SECURITY.md):
 * - Alarm hero (Shield Halo Console) + Needs attention (Perimeter Radar Matrix)
 * - Cameras (Theater Stage + Filmstrip) + Recent activity (Compact Audit Ledger)
 * - Device groups (Interactive Tile Deck) + device detail ProSheet
 * Responsive layout: scrolling page on desktop & tablet (>= 768 px); Alarm hero pinned above
 * Kokonut SmoothTab tabs on phone (< 768 px).
 */
export default function ProSecurity() {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const data = useSecurityData();
  const [error, setError] = useState<string | null>(null);
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);
  const [phoneTab, setPhoneTab] = useState<SecurityPhoneTabId>('attention');
  const [selectedDeviceKey, setSelectedDeviceKey] = useState<{
    entityId: string;
    kind: DeviceItem['kind'];
  } | null>(null);

  const handleError = useCallback((message: string | null) => {
    setError(message);
    if (message) {
      toast.danger(message);
    }
  }, []);

  const handleFocusCamera = useCallback(
    (cameraId: string) => {
      setFocusedCameraId(cameraId);
      if (isPhone) {
        setPhoneTab('cameras');
        return;
      }
      const el = document.getElementById('pro-security-cameras');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [isPhone]
  );

  const entities: SecurityEntities = useMemo(
    () => ({
      locks: data.locks,
      garages: data.garages,
      sirens: data.sirens,
      doorSensors: data.doorSensors,
      windowSensors: data.windowSensors,
      motionSensors: data.motionSensors,
      leakSensors: data.leakSensors,
      smokeSensors: data.smokeSensors
    }),
    [
      data.locks,
      data.garages,
      data.sirens,
      data.doorSensors,
      data.windowSensors,
      data.motionSensors,
      data.leakSensors,
      data.smokeSensors
    ]
  );
  const activity = useSecurityActivity(entities, data.alarms, data.people);

  const hasCameras = data.cameras.length > 0;
  const deviceCount =
    data.locks.length +
    data.garages.length +
    data.sirens.length +
    data.doorSensors.length +
    data.windowSensors.length +
    data.motionSensors.length +
    data.leakSensors.length +
    data.smokeSensors.length;

  const attentionIssueCount =
    data.activeHazards.length +
    data.activeSirens.length +
    data.jammedLocks.length +
    data.unlockedLocks.length +
    data.openGarages.length +
    data.openDoors.length +
    data.openWindows.length +
    data.offlineDevices.length +
    data.lowBatteryDevices.length;

  const attentionHasCritical =
    data.activeHazards.length > 0 || data.activeSirens.length > 0 || data.jammedLocks.length > 0;

  const phoneTabs = useMemo<SecurityPhoneTab[]>(() => {
    const tabs: SecurityPhoneTab[] = [
      {
        id: 'attention',
        title: 'Alerts',
        icon: Alert02Icon,
        badge: attentionIssueCount > 0 ? String(attentionIssueCount) : undefined,
        badgeTone: attentionIssueCount > 0 ? (attentionHasCritical ? 'danger' : 'warning') : undefined
      }
    ];
    if (hasCameras) {
      tabs.push({ id: 'cameras', title: 'Cams', icon: Camera01Icon });
    }
    tabs.push({ id: 'activity', title: 'Log', icon: Activity01Icon });
    if (deviceCount > 0) {
      tabs.push({ id: 'devices', title: 'Devices', icon: Layers01Icon });
    }
    return tabs;
  }, [attentionHasCritical, attentionIssueCount, deviceCount, hasCameras]);

  useEffect(() => {
    if (phoneTabs.length > 0 && !phoneTabs.some((t) => t.id === phoneTab)) {
      setPhoneTab(phoneTabs[0].id);
    }
  }, [phoneTab, phoneTabs]);

  const selectedItem = useMemo<DeviceItem | null>(() => {
    if (!selectedDeviceKey) return null;
    const all = [
      ...data.locks,
      ...data.garages,
      ...data.sirens,
      ...data.doorSensors,
      ...data.windowSensors,
      ...data.motionSensors,
      ...data.leakSensors,
      ...data.smokeSensors
    ];
    const found = all.find((e) => e.entity_id === selectedDeviceKey.entityId);
    return found ? deviceItem(found, selectedDeviceKey.kind) : null;
  }, [selectedDeviceKey, data]);

  const handleSelectDevice = useCallback((item: DeviceItem) => {
    setSelectedDeviceKey({ entityId: item.entity.entity_id, kind: item.kind });
  }, []);

  if (data.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-52 rounded-2xl lg:col-span-8" />
        <Skeleton className="h-52 rounded-2xl lg:col-span-4" />
        <Skeleton className="h-64 rounded-2xl lg:col-span-12" />
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="pro-surface flex flex-col items-center gap-3 p-8 text-center">
        <span className="pro-soft grid size-12 place-items-center rounded-2xl">
          <HugeiconsIcon icon={Shield01Icon} size={24} />
        </span>
        <h2 className="text-lg font-semibold">No security devices yet</h2>
        <p className="max-w-md text-muted">
          Add alarm panels, locks, cameras or door, window, motion and leak sensors in Home Assistant and they appear here.
        </p>
      </div>
    );
  }

  const alarm = data.activeAlarm;
  const openings = [...data.openDoors, ...data.openWindows];

  const alarmNode = alarm ? (
    <AlarmHero
      alarm={alarm}
      alarms={data.alarms}
      openings={openings}
      openGarages={data.openGarages}
      unlockedLocks={data.unlockedLocks}
      jammedLocks={data.jammedLocks}
      activeSirens={data.activeSirens}
      hazards={data.activeHazards}
      people={data.people}
      cameras={data.cameras}
      events={activity.events}
      serverUrl={data.serverUrl}
      onFocusCamera={hasCameras ? handleFocusCamera : undefined}
      onError={handleError}
    />
  ) : null;

  const attentionNode = (
    <AttentionCard
      totalLocks={data.locks.length}
      hazards={data.activeHazards}
      activeSirens={data.activeSirens}
      jammedLocks={data.jammedLocks}
      openDoors={data.openDoors}
      openWindows={data.openWindows}
      openGarages={data.openGarages}
      unlockedLocks={data.unlockedLocks}
      deviceBatteryByEntityId={data.deviceBatteryByEntityId}
      lowBatteryDevices={data.lowBatteryDevices}
      offlineDevices={data.offlineDevices}
      onError={handleError}
      onSelectDevice={handleSelectDevice}
    />
  );

  const camerasNode = hasCameras ? (
    <SecurityCameras
      cameras={data.cameras}
      focusedCameraId={focusedCameraId}
      onError={handleError}
    />
  ) : null;

  const activityNode = <RecentActivity events={activity.events} loading={activity.loading} />;

  const devicesNode = (
    <DeviceGroups
      entities={entities}
      deviceBatteryByEntityId={data.deviceBatteryByEntityId}
      onError={handleError}
      onSelectDevice={handleSelectDevice}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert status="danger">
          <Alert.Indicator>
            <HugeiconsIcon icon={Alert02Icon} size={18} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
          <CloseButton aria-label="Dismiss" onPress={() => setError(null)} />
        </Alert>
      )}

      {isPhone ? (
        <>
          {alarmNode}
          {phoneTabs.length > 0 ? (
            <SmoothTab
              items={phoneTabs.map((t) => ({
                id: t.id,
                title: t.title,
                ariaLabel: t.title,
                icon: t.icon,
                badge: t.badge,
                badgeTone: t.badgeTone
              }))}
              value={phoneTab}
              onChange={(id) => setPhoneTab(id as SecurityPhoneTabId)}
              label="Security sections"
              mobileIconOnlyInactive
              badges="always"
            />
          ) : null}
          {phoneTab === 'attention' ? attentionNode : null}
          {phoneTab === 'cameras' ? camerasNode : null}
          {phoneTab === 'activity' ? activityNode : null}
          {phoneTab === 'devices' ? devicesNode : null}
        </>
      ) : (
        <>
          <div className="grid items-stretch gap-4 lg:grid-cols-12">
            {alarmNode ? <div className="min-w-0 lg:col-span-8">{alarmNode}</div> : null}
            <div className={cn('grid min-w-0', alarmNode ? 'lg:col-span-4' : 'lg:col-span-12')}>
              {attentionNode}
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-12">
            {camerasNode ? <div className="min-w-0 lg:col-span-8">{camerasNode}</div> : null}
            <div className={cn('min-w-0', camerasNode ? 'lg:col-span-4' : 'lg:col-span-12')}>
              {activityNode}
            </div>
          </div>

          {devicesNode}
        </>
      )}

      <SecurityDeviceSheet
        item={selectedItem}
        batteryPct={
          selectedItem ? data.deviceBatteryByEntityId[selectedItem.entity.entity_id] : undefined
        }
        events={activity.events}
        onClose={() => setSelectedDeviceKey(null)}
        onError={handleError}
      />
    </div>
  );
}
