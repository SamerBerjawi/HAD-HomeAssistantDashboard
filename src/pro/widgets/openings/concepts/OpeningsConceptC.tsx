/**
 * Doors & windows concept C — Innovative ("the board"). Every door and window as a small panel,
 * grouped by room: doors are tall, windows square; an open one swings amber with how long, a
 * closed one is a quiet outline, an offline one is dashed. The whole house at a glance.
 * Small: the board only. Wide/Tall/Large: board with room names and a headline.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { DoorIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewSensorItem } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

function Panel({ i, tiny }: { i: ProOverviewSensorItem; tiny?: boolean }) {
  const door = i.domain === 'doors';
  return (
    <span
      role="img"
      aria-label={`${i.name}: ${i.stateLabel}`}
      title={`${i.name}: ${i.stateLabel}`}
      className={cn(
        'flex shrink-0 items-end justify-center rounded-[5px] pb-0.5 text-[9px] font-semibold tabular-nums',
        door ? (tiny ? 'h-7 w-4' : 'h-9 w-5') : tiny ? 'size-5' : 'size-6',
        i.isOffline
          ? 'border border-dashed border-[var(--muted)] opacity-60'
          : i.isActive
            ? 'bg-warning text-black shadow-[0_0_10px_hsl(38_92%_55%/0.5)]'
            : 'border-[1.5px] border-[var(--separator,rgba(127,127,127,0.35))]'
      )}
      style={i.isActive && !i.isOffline ? { transform: 'perspective(40px) rotateY(-14deg)' } : undefined}
    >
      {!tiny && i.isActive ? sinceShort(i.lastChangedAt) : null}
    </span>
  );
}

export default function OpeningsConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Doors & windows" className={surface}>
        <NoSensors icon={DoorIcon} text="No door or window sensors" />
      </WidgetSurface>
    );
  }
  // Rooms with something open first, then by name.
  const rooms = new Map<string, ProOverviewSensorItem[]>();
  for (const i of m.items) rooms.set(i.roomName, [...(rooms.get(i.roomName) ?? []), i]);
  const ordered = [...rooms.entries()].sort((a, b) => Number(b[1].some((i) => i.isActive)) - Number(a[1].some((i) => i.isActive)) || a[0].localeCompare(b[0]));
  const tiny = size === 's';
  const maxRooms = size === 's' ? 6 : size === 'w' ? 4 : size === 't' ? 6 : 9;

  return (
    <WidgetSurface label="Doors & windows" className={surface}>
      <DetailsButton title="Doors & windows" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <p className="truncate pr-8 text-sm font-semibold">
          {m.headlineText}
          {size !== 's' ? <span className="font-normal text-muted"> · {m.totalCount} total</span> : null}
        </p>
        <div className={cn('mt-auto gap-x-3 gap-y-2', tiny ? 'flex flex-wrap items-end gap-1.5' : size === 'w' || size === 'l' ? 'grid grid-cols-2' : 'flex flex-col')}>
          {ordered.slice(0, maxRooms).map(([room, items]) => (
            <div key={room} className={cn('flex min-w-0 items-end', tiny ? 'gap-0.5' : 'gap-1.5')}>
              {items.slice(0, 4).map((i) => (
                <Panel key={i.entityId} i={i} tiny={tiny} />
              ))}
              {!tiny ? <span className={cn('min-w-0 truncate pb-0.5 text-[11px]', items.some((i) => i.isActive) ? 'font-semibold' : 'text-muted')}>{room}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </WidgetSurface>
  );
}
