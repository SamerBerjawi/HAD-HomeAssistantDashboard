/**
 * Safety concept C — Innovative ("sentinels"). Every leak and smoke sensor as a ring with its
 * icon, like a row of guards: a green ring is watching, a red filled pulsing ring has detected
 * something, a dashed grey ring is offline. Small: the rings and the verdict. Wide: rings with
 * rooms. Tall/Large: rings in a grid with names.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { FireIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewSensorItem } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sensorIcon } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

function Ring({ i, size, label }: { i: ProOverviewSensorItem; size: number; label?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-1">
      <span
        role="img"
        aria-label={`${i.name}: ${i.stateLabel}`}
        className={cn(
          'grid shrink-0 place-items-center rounded-full',
          i.isOffline
            ? 'border-2 border-dashed border-[var(--muted)] text-muted'
            : i.isActive
              ? 'bg-danger text-white shadow-[0_0_16px_var(--danger)] motion-safe:animate-pulse'
              : 'border-2 border-success/70 text-success'
        )}
        style={{ width: size, height: size }}
      >
        <HugeiconsIcon icon={sensorIcon(i)} size={Math.round(size * 0.45)} />
      </span>
      {label ? <span className={cn('w-full truncate text-center text-[10px] leading-tight', i.isActive ? 'font-semibold text-danger' : 'text-muted')}>{i.roomName}</span> : null}
    </span>
  );
}

export default function SafetyConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const alert = m.activeCount > 0;
  const surface = cn('shadow-[0_1px_2px_rgba(0,0,0,0.06)]', alert ? 'bg-danger/10 ring-1 ring-danger/40' : 'bg-[var(--surface)]');
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Safety" className={surface}>
        <NoSensors icon={FireIcon} text="No leak or smoke sensors" />
      </WidgetSurface>
    );
  }
  const cols = size === 's' ? 3 : size === 'w' ? 5 : size === 't' ? 3 : 4;
  const max = size === 's' ? 6 : size === 'w' ? 5 : size === 't' ? 9 : 12;
  const ring = size === 's' ? 26 : size === 'w' ? 34 : 40;

  return (
    <WidgetSurface label="Safety" className={surface}>
      <DetailsButton title="Safety" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          <p className={cn('line-clamp-2 text-base font-semibold leading-tight', alert && 'text-danger')}>{alert ? `${m.badgeText} detected` : 'All clear'}</p>
          {size !== 's' ? <p className="truncate text-xs text-muted">{alert ? m.detailText : `${m.totalCount} sensors watching`}</p> : null}
        </div>
        <div className="mt-auto grid justify-items-center gap-x-1.5 gap-y-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {m.items.slice(0, max).map((i) => (
            <Ring key={i.entityId} i={i} size={ring} label={size !== 's'} />
          ))}
        </div>
      </div>
    </WidgetSurface>
  );
}
