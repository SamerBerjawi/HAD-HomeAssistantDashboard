import { useCallback, useMemo, useState } from 'react';
import { Alert, CloseButton, Skeleton, Toast } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useSecurityData } from '../hooks/useSecurityData';
import { useSecurityActivity } from '../hooks/useSecurityActivity';
import { AlarmHero } from '../components/security/AlarmHero';
import { AttentionCard } from '../components/security/AttentionCard';
import { DeviceGroups } from '../components/security/DeviceGroups';
import { SecurityCameras } from '../components/security/SecurityCameras';
import { RecentActivity } from '../components/security/RecentActivity';
import { SecurityDeviceSheet } from '../components/security/SecurityDeviceSheet';
import { deviceItem, type DeviceItem, type SecurityEntities } from '../lib/securityLogic';

const { toast } = Toast;

/**
 * Pro Security page (docs/pro-ui/DESIGN.md 7.5): alarm hero + needs attention, cameras + recent
 * activity, device groups in a bento grid, and device detail ProSheet.
 */
export default function ProSecurity() {
  const data = useSecurityData();
  const [error, setError] = useState<string | null>(null);
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);
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

  const handleFocusCamera = useCallback((cameraId: string) => {
    setFocusedCameraId(cameraId);
    const el = document.getElementById('pro-security-cameras');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

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
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl lg:col-span-3" />
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
  const hasCameras = data.cameras.length > 0;

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

      <div className="grid gap-4 lg:grid-cols-3">
        {alarm && (
          <div className="min-w-0 lg:col-span-2">
            <AlarmHero
              alarm={alarm}
              alarms={data.alarms}
              openings={openings}
              openGarages={data.openGarages}
              unlockedLocks={data.unlockedLocks}
              activeSirens={data.activeSirens}
              hazards={data.activeHazards}
              people={data.people}
              cameras={data.cameras}
              events={activity.events}
              serverUrl={data.serverUrl}
              onFocusCamera={hasCameras ? handleFocusCamera : undefined}
              onError={handleError}
            />
          </div>
        )}
        <div className={cn('grid min-w-0', !alarm && 'lg:col-span-3')}>
          <AttentionCard
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
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {hasCameras && (
          <div className="min-w-0 lg:col-span-2">
            <SecurityCameras
              cameras={data.cameras}
              focusedCameraId={focusedCameraId}
              onError={handleError}
            />
          </div>
        )}
        <div className={cn('min-w-0', !hasCameras && 'lg:col-span-3')}>
          <RecentActivity events={activity.events} loading={activity.loading} />
        </div>
      </div>

      <DeviceGroups
        entities={entities}
        deviceBatteryByEntityId={data.deviceBatteryByEntityId}
        onError={handleError}
        onSelectDevice={handleSelectDevice}
      />

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
