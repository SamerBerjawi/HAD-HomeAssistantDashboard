import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  DoorIcon,
  FireIcon,
  Camera01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import CameraFeedSection from '@/components/views/security/CameraFeedSection';
import { errorMessageField } from '@/lib/errors';
import { entityName, useSecurityData } from '../hooks/useSecurityData';

const ALARM_MODES = [
  { state: 'armed_home', service: 'alarm_arm_home', label: 'Home' },
  { state: 'armed_away', service: 'alarm_arm_away', label: 'Away' },
  { state: 'armed_night', service: 'alarm_arm_night', label: 'Night' }
] as const;

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="pro-surface p-5 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="pro-surface p-4 flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  );
}

export default function ProSecurity() {
  const data = useSecurityData();
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, domain: string, service: string, entityId: string) => {
    setBusy(key);
    setError(null);
    try {
      await callHAService(domain, service, {}, { entity_id: entityId });
    } catch (e) {
      setError(errorMessageField(e) || 'Home Assistant rejected the command');
    } finally {
      setBusy(null);
    }
  };

  if (data.isLoading) {
    return <p className="text-muted">Loading security devices…</p>;
  }
  if (data.total === 0) {
    return (
      <div className="pro-surface p-8 text-center flex flex-col items-center gap-3">
        <HugeiconsIcon icon={Shield01Icon} size={32} className="text-muted" />
        <h2 className="text-lg font-semibold">No security devices yet</h2>
        <p className="text-muted max-w-md">
          Add alarm panels, locks, cameras or door, window, motion and leak sensors in Home Assistant and they appear here.
        </p>
      </div>
    );
  }

  const alarm = data.activeAlarm;
  const alarmState = alarm?.state || 'disarmed';
  const armed = alarmState.startsWith('armed');
  const triggered = alarmState === 'triggered';
  const alarmLabel = alarmState.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

  return (
    <>
      {error && (
        <div role="alert" className="rounded-2xl bg-danger/10 text-danger px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {alarm && (
        <Card
          title="Alarm"
          aside={
            <Chip color={triggered ? 'danger' : armed ? 'success' : 'default'} variant="soft">
              {alarmLabel}
            </Chip>
          }
        >
          <p className="text-sm text-muted">{entityName(alarm)}</p>
          <div className="flex flex-wrap gap-2">
            {ALARM_MODES.map((m) => (
              <Button
                key={m.state}
                variant={alarmState === m.state ? 'primary' : 'secondary'}
                isPending={busy === m.state}
                onPress={() => run(m.state, 'alarm_control_panel', m.service, alarm.entity_id)}
              >
                {m.label}
              </Button>
            ))}
            <Button
              variant="outline"
              isDisabled={!armed && !triggered}
              isPending={busy === 'disarm'}
              onPress={() => run('disarm', 'alarm_control_panel', 'alarm_disarm', alarm.entity_id)}
            >
              Disarm
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Doors" value={`${data.doorSensors.length - data.openDoors.length}/${data.doorSensors.length}`} hint="closed" />
        <Metric label="Windows" value={`${data.windowSensors.length - data.openWindows.length}/${data.windowSensors.length}`} hint="closed" />
        <Metric label="Locks" value={`${data.locks.length - data.unlockedLocks.length}/${data.locks.length}`} hint="locked" />
        <Metric label="Motion" value={String(data.activeMotion.length)} hint="active now" />
      </div>

      <Card
        title="Needs attention"
        aside={<HugeiconsIcon icon={data.attentionCount === 0 ? CheckmarkCircle02Icon : Alert02Icon} size={20} className={data.attentionCount === 0 ? 'text-success' : 'text-warning'} />}
      >
        {data.attentionCount === 0 ? (
          <p className="text-muted">Doors and windows are closed, locks are secured and no hazards are detected.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-separator">
            {data.activeHazards.map((e) => (
              <li key={e.entity_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <HugeiconsIcon icon={FireIcon} size={18} className="text-danger" />
                <span className="flex-1 font-medium">{entityName(e)}</span>
                <Chip color="danger" variant="soft">Detected</Chip>
              </li>
            ))}
            {[...data.openDoors, ...data.openWindows].map((e) => (
              <li key={e.entity_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <HugeiconsIcon icon={DoorIcon} size={18} className="text-warning" />
                <span className="flex-1 font-medium">{entityName(e)}</span>
                <Chip color="warning" variant="soft">Open</Chip>
              </li>
            ))}
            {data.unlockedLocks.map((e) => (
              <li key={e.entity_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <HugeiconsIcon icon={SquareUnlock02Icon} size={18} className="text-warning" />
                <span className="flex-1 font-medium">{entityName(e)}</span>
                <Button size="sm" variant="secondary" isPending={busy === e.entity_id} onPress={() => run(e.entity_id, 'lock', 'lock', e.entity_id)}>
                  Lock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.locks.length > 0 && (
        <Card title="Locks">
          <ul className="flex flex-col divide-y divide-separator">
            {data.locks.map((e) => {
              const open = e.state === 'unlocked' || e.state === 'open';
              return (
                <li key={e.entity_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <HugeiconsIcon icon={open ? SquareUnlock02Icon : SquareLock02Icon} size={18} className={open ? 'text-warning' : 'text-success'} />
                  <span className="flex-1 font-medium">{entityName(e)}</span>
                  <Button
                    size="sm"
                    variant={open ? 'primary' : 'secondary'}
                    isPending={busy === `lock-${e.entity_id}`}
                    onPress={() => run(`lock-${e.entity_id}`, 'lock', open ? 'lock' : 'unlock', e.entity_id)}
                  >
                    {open ? 'Lock' : 'Unlock'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {data.cameras.length > 0 && (
        <Card title="Cameras" aside={<HugeiconsIcon icon={Camera01Icon} size={20} className="text-muted" />}>
          <CameraFeedSection darkMode={false} cameraEntities={data.cameras} columns={2} />
        </Card>
      )}
    </>
  );
}
