/**
 * Motion concept A — Refined & minimal. Where there is movement now (or "Still" and since when)
 * as a light headline; zones as quiet rows with their last motion. Amber dot only on active
 * zones (D1).
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Motion01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

export default function MotionConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Motion" className={surface}>
        <NoSensors icon={Motion01Icon} text="No motion sensors" />
      </WidgetSurface>
    );
  }
  const latest = Math.max(...m.items.map((i) => i.lastChangedAt ?? 0));
  const byRecent = [...m.items].sort((a, b) => Number(b.isActive) - Number(a.isActive) || (b.lastChangedAt ?? 0) - (a.lastChangedAt ?? 0));
  const active = byRecent.filter((i) => i.isActive);
  const rows = size === 'w' ? 3 : size === 't' ? 5 : size === 'l' ? 8 : 0;
  const headline = (
    <div className="min-w-0">
      <p className={cn('truncate font-light leading-tight tracking-tight', size === 's' ? 'text-2xl' : 'text-3xl')}>{active.length > 0 ? active[0].roomName : 'Still'}</p>
      <p className="mt-1 truncate text-xs text-muted">{active.length > 1 ? `+${active.length - 1} more rooms` : active.length === 1 ? 'Movement now' : `for ${sinceShort(latest || null)}`}</p>
    </div>
  );
  const list = (
    <ul aria-label="Zones" className={cn('min-w-0', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col')}>
      {byRecent.slice(0, rows).map((i) => (
        <li key={i.entityId} className="flex min-w-0 items-center gap-2 py-0.5 text-xs">
          <span className={cn('size-1.5 shrink-0 rounded-full', i.isActive ? 'bg-warning' : 'bg-[var(--separator,rgba(127,127,127,0.35))]')} />
          <span className={cn('min-w-0 flex-1 truncate', i.isActive && 'font-semibold')}>{i.roomName}</span>
          <span className="shrink-0 tabular-nums text-muted">{i.isOffline ? 'offline' : i.isActive ? 'now' : sinceShort(i.lastChangedAt)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <WidgetSurface label="Motion" className={surface}>
      <DetailsButton title="Motion" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <HugeiconsIcon icon={Motion01Icon} size={22} className={active.length > 0 ? 'text-warning' : 'text-muted'} />
        {size === 's' ? <div className="mt-auto">{headline}</div> : null}
        {size === 'w' ? (
          <div className="-mt-7 flex h-full min-w-0 gap-4">
            <div className="flex w-[42%] min-w-0 flex-col justify-end">{headline}</div>
            <div className="mt-7 flex min-w-0 flex-1 flex-col justify-end">{list}</div>
          </div>
        ) : null}
        {size === 't' || size === 'l' ? (
          <>
            {headline}
            <div className="mt-auto">{list}</div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
