/**
 * Safety concept A — Refined & minimal. "All clear" in quiet type with how many leak and smoke
 * sensors watch; when something is detected, the headline turns red and names the sensor, room
 * and time. Tall/Large add a row per sensor.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, FireIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sensorIcon, sinceShort } from '../../sensors/conceptKit';
import { domainShortLabel, type SensorGroupModel } from '../../sensors/sensorGroup';

export default function SafetyConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const alert = m.activeCount > 0;
  const surface = cn('shadow-[0_1px_2px_rgba(0,0,0,0.06)]', alert ? 'bg-danger/12 ring-1 ring-danger/40' : 'bg-[var(--surface)]');
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Safety" className={surface}>
        <NoSensors icon={FireIcon} text="No leak or smoke sensors" />
      </WidgetSurface>
    );
  }
  const first = m.items[0];
  const offline = m.items.filter((i) => i.isOffline).length;
  const rows = size === 't' ? 4 : size === 'l' ? 6 : 0;

  return (
    <WidgetSurface label="Safety" className={surface}>
      <DetailsButton title="Safety" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <HugeiconsIcon icon={alert ? sensorIcon(first) : CheckmarkCircle02Icon} size={22} className={alert ? 'text-danger motion-safe:animate-pulse' : 'text-success'} />
        {rows > 0 ? (
          <ul aria-label="Sensors" className={cn('min-w-0', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col')}>
            {m.items.slice(0, rows).map((i) => (
              <li key={i.entityId} className="flex min-w-0 items-center gap-2 py-0.5 text-xs">
                <HugeiconsIcon icon={sensorIcon(i)} size={13} className={cn('shrink-0', i.isActive ? 'text-danger' : 'text-muted')} />
                <span className={cn('min-w-0 flex-1 truncate', i.isActive && 'font-semibold text-danger')}>{i.name}</span>
                <span className="shrink-0 text-muted">{i.isOffline ? 'offline' : i.isActive ? sinceShort(i.lastChangedAt) : 'ok'}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto min-w-0">
          <p className={cn('font-light leading-tight tracking-tight', size === 's' ? 'text-2xl' : 'text-3xl', alert && 'font-semibold text-danger')}>
            {alert ? `${m.badgeText} detected` : 'All clear'}
          </p>
          <p className="mt-1 truncate text-xs text-muted">
            {alert
              ? `${first.shortName} · ${first.roomName} · ${sinceShort(first.lastChangedAt)}`
              : `${m.domains.map((d) => `${d.totalCount} ${domainShortLabel(d.domain).toLowerCase()}`).join(' · ')}${offline ? ` · ${offline} offline` : ''}`}
          </p>
        </div>
      </div>
    </WidgetSurface>
  );
}
