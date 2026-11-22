/**
 * Motion concept C — Innovative ("the last hour"). One lane per room on a 60-minute timeline:
 * a mark where motion last changed, and an amber bar running to "now" while there is movement.
 * You see the order people moved through the house. Small: the three latest rooms, named.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Motion01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

const WINDOW_MIN = 60;

export default function MotionConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Motion" className={surface}>
        <NoSensors icon={Motion01Icon} text="No motion sensors" />
      </WidgetSurface>
    );
  }
  const now = Date.now();
  // Position in the last hour: 0 = an hour ago (or older), 1 = now.
  const pos = (at: number | null) => (at === null ? null : Math.max(0, 1 - (now - at) / (WINDOW_MIN * 60000)));
  const lanes = [...m.items].sort((a, b) => Number(b.isActive) - Number(a.isActive) || (b.lastChangedAt ?? 0) - (a.lastChangedAt ?? 0));
  const max = size === 's' ? 3 : size === 'w' ? 3 : size === 't' ? 6 : 7;
  const active = m.activeCount;

  return (
    <WidgetSurface label="Motion" className={surface}>
      <DetailsButton title="Motion" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <p className="truncate pr-8 text-sm font-semibold">
          {active > 0 ? `${active} room${active === 1 ? '' : 's'} active` : 'All still'}
          {size === 'w' || size === 'l' ? <span className="font-normal text-muted"> · last hour</span> : null}
        </p>
        <ul aria-label="Last hour by room" className="mt-auto flex flex-col gap-1.5">
          {lanes.slice(0, max).map((i) => {
            const p = pos(i.lastChangedAt);
            const old = p === null || p === 0;
            return (
              <li key={i.entityId} className="flex min-w-0 items-center gap-2" aria-label={`${i.roomName}: ${i.isActive ? 'movement now' : `last motion ${i.lastChangedText}`}`}>
                <span className={cn('shrink-0 truncate', size === 's' ? 'w-[42%] text-[10px]' : 'w-[30%] text-[11px]', i.isActive ? 'font-semibold' : 'text-muted')}>{i.roomName}</span>
                <span className="relative h-2 min-w-0 flex-1 rounded-full bg-default/70">
                  {i.isActive && p !== null ? (
                    <span className="absolute inset-y-0 right-0 rounded-full bg-warning shadow-[0_0_8px_hsl(38_92%_55%/0.6)]" style={{ left: `${Math.min(p * 100, 97)}%` }} />
                  ) : null}
                  {!i.isActive && !old && p !== null ? (
                    <span className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/60" style={{ left: `${p * 100}%` }} />
                  ) : null}
                </span>
                <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-muted">{i.isActive ? 'now' : sinceShort(i.lastChangedAt)}</span>
              </li>
            );
          })}
        </ul>
        {size !== 's' ? (
          <div aria-hidden className="flex justify-between pl-[calc(30%+0.5rem)] pr-9 text-[9px] text-muted">
            <span>60m</span>
            <span>30m</span>
            <span>now</span>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
