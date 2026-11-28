/**
 * Safety concept B — Expressive & immersive ("calm / alarm"). All clear is a soft, cool card
 * with a water drop and a flame resting behind; a leak turns it deep red-blue, smoke turns it red,
 * pulsing, with the sensor, room and time large. Tall/Large list every sensor on glass.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { AlarmSmokeIcon, CheckmarkCircle02Icon, DropletIcon, FireIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sensorIcon, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

export default function SafetyConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const active = m.items.filter((i) => i.isActive);
  const smoke = active.some((i) => i.domain === 'smoke');
  const alert = active.length > 0;
  const bg = !alert
    ? 'linear-gradient(150deg, hsl(185 40% 42%), hsl(205 40% 26%))'
    : smoke
      ? 'linear-gradient(150deg, hsl(8 85% 52%), hsl(350 75% 28%))'
      : 'linear-gradient(150deg, hsl(355 75% 50%), hsl(225 60% 28%))';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Safety" ink="light" style={{ background: 'linear-gradient(150deg, hsl(215 12% 42%), hsl(220 14% 22%))' }}>
        <NoSensors icon={FireIcon} text="No leak or smoke sensors" className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75" />
      </WidgetSurface>
    );
  }
  const first = active[0];
  const offline = m.items.filter((i) => i.isOffline).length;

  return (
    <WidgetSurface label="Safety" ink="light" style={{ background: bg }}>
      {alert ? <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-white motion-safe:animate-pulse" style={{ opacity: 0.12 }} /> : null}
      <div aria-hidden className="pointer-events-none absolute -bottom-4 -right-3 -z-10 flex text-white/12">
        {alert ? (
          <HugeiconsIcon icon={sensorIcon(first)} size={size === 's' ? 96 : 140} />
        ) : (
          <>
            <HugeiconsIcon icon={DropletIcon} size={size === 's' ? 64 : 96} />
            <HugeiconsIcon icon={AlarmSmokeIcon} size={size === 's' ? 64 : 96} />
          </>
        )}
      </div>
      <DetailsButton title="Safety" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          {!alert ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="mb-1 text-white/85" /> : null}
          <p className={cn('font-semibold leading-tight', alert ? (size === 's' ? 'text-xl' : 'text-[26px]') : 'text-xl')}>{alert ? `${m.badgeText}!` : 'All clear'}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/85">
            {alert ? `${first.shortName}, ${first.roomName} · ${sinceShort(first.lastChangedAt)}` : `${m.totalCount} sensors watching${offline ? ` · ${offline} offline` : ''}`}
          </p>
        </div>
        {size === 't' || size === 'l' ? (
          <ul aria-label="Sensors" className={cn('mt-auto gap-1', size === 'l' ? 'grid grid-cols-2' : 'flex flex-col')}>
            {m.items.slice(0, size === 'l' ? 6 : 4).map((i) => (
              <li
                key={i.entityId}
                className={cn('flex min-w-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs ring-1', i.isActive ? 'bg-white text-[hsl(355_70%_38%)] ring-white' : 'bg-white/12 ring-white/20')}
              >
                <HugeiconsIcon icon={sensorIcon(i)} size={13} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                <span className="shrink-0 opacity-75">{i.isOffline ? 'offline' : i.isActive ? 'now' : 'ok'}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
