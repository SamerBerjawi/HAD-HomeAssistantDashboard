/**
 * Doors & windows concept A — Refined & minimal. "All closed" or "2 open" as a light headline;
 * what is open, as quiet rows with how long. Colour only on open items (D1).
 * Small: headline. Wide: headline | open list. Tall/Large: rows (Large: two columns).
 * A single door or window (the room page's one widget per sensor) is named, with "Open" or
 * "Closed" as the headline and how long (`OneOpening`).
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { DoorIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sensorIcon, sinceShort } from '../../sensors/conceptKit';
import type { ProOverviewSensorItem } from '../../../lib/overviewSecurity';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

/** "for 12m" / "since 3h", from the short form. */
const since = (at: number | null, open: boolean) => {
  const t = sinceShort(at);
  if (!t) return '';
  return t === 'now' ? 'Just now' : open ? `for ${t}` : `${t} ago`;
};

function OneOpening({ i, onOpenDetails }: { i: ProOverviewSensorItem; onOpenDetails?: () => void }) {
  const open = i.isActive;
  const state = i.isOffline ? 'Offline' : open ? 'Open' : 'Closed';
  return (
    <>
      <DetailsButton title={i.name} onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <HugeiconsIcon icon={sensorIcon(i)} size={22} className={cn(i.isOffline ? 'text-muted' : open ? 'text-warning' : 'text-muted')} />
        <div className="mt-auto min-w-0">
          <p className={cn('text-[30px] font-extralight leading-none tracking-tighter', open && 'text-[hsl(30_80%_35%)] dark:text-[hsl(42_100%_70%)]')}>{state}</p>
          <p className="mt-1 truncate text-xs">
            <span className="font-semibold">{i.name}</span>
            {!i.isOffline && i.lastChangedAt ? <span className="text-muted"> · {since(i.lastChangedAt, open)}</span> : null}
          </p>
        </div>
      </div>
    </>
  );
}

export default function OpeningsConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Doors & windows" className={surface}>
        <NoSensors icon={DoorIcon} text="No door or window sensors" />
      </WidgetSurface>
    );
  }
  if (m.totalCount === 1 && m.items[0]) {
    return (
      <WidgetSurface label={m.items[0].name} className={surface}>
        <OneOpening i={m.items[0]} onOpenDetails={onOpenDetails} />
      </WidgetSurface>
    );
  }
  const open = m.items.filter((i) => i.isActive || i.isOffline);
  const rows = size === 'w' ? 3 : size === 't' ? 5 : size === 'l' ? 8 : 0;
  const headline = (
    <div className="min-w-0">
      <p className={cn('font-extralight leading-none tracking-tighter', m.activeCount > 0 ? 'text-[46px] tabular-nums' : 'text-[30px]')}>
        {m.activeCount > 0 ? m.activeCount : 'All closed'}
        {m.activeCount > 0 ? <span className="ml-1 text-base font-normal tracking-normal text-muted">open</span> : null}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{m.activeCount > 0 ? m.detailText : `${m.totalCount} doors and windows`}</p>
    </div>
  );
  const list = (
    <ul aria-label="Open" className={cn('min-w-0', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col', 'divide-[var(--separator,rgba(127,127,127,0.18))]', size !== 'l' && 'divide-y')}>
      {open.slice(0, rows).map((i) => (
        <li key={i.entityId} className="flex min-w-0 items-center gap-2 py-1 text-xs">
          <HugeiconsIcon icon={sensorIcon(i)} size={14} className={cn('shrink-0', i.isOffline ? 'text-muted' : 'text-warning')} />
          <span className="min-w-0 flex-1 truncate">{i.name}</span>
          <span className="shrink-0 tabular-nums text-muted">{i.isOffline ? 'offline' : sinceShort(i.lastChangedAt)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <WidgetSurface label="Doors & windows" className={surface}>
      <DetailsButton title="Doors & windows" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? <div className="mt-auto">{headline}</div> : null}
        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex flex-col justify-end">{headline}</div>
            {open.length > 0 ? <div className="mt-7 flex min-w-0 flex-1 flex-col justify-end">{list}</div> : null}
          </div>
        ) : null}
        {size === 't' || size === 'l' ? (
          <>
            {headline}
            <div className="mt-auto">{open.length > 0 ? list : <p className="text-xs text-muted">{m.detailText}</p>}</div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
