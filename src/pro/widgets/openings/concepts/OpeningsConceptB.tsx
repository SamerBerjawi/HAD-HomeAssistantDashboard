/**
 * Doors & windows concept B — Expressive & immersive ("draught"). Shut tight, the card is a calm
 * deep green with a closed door behind; when something opens it turns warm amber and the open
 * doors and windows become glass chips with how long. Small: the count. Wide: + chips. Tall/
 * Large: chips as rows.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, DoorIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sensorIcon, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

export default function OpeningsConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const anyOpen = m.activeCount > 0;
  const bg = anyOpen ? 'linear-gradient(150deg, hsl(36 92% 54%), hsl(18 78% 40%))' : 'linear-gradient(150deg, hsl(165 30% 34%), hsl(190 30% 18%))';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Doors & windows" ink="light" style={{ background: 'linear-gradient(150deg, hsl(215 12% 42%), hsl(220 14% 22%))' }}>
        <NoSensors icon={DoorIcon} text="No door or window sensors" className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75" />
      </WidgetSurface>
    );
  }
  const open = m.items.filter((i) => i.isActive);
  const offline = m.items.filter((i) => i.isOffline).length;
  const rows = size === 'w' ? 2 : size === 't' ? 4 : 6;

  return (
    <WidgetSurface label="Doors & windows" ink="light" style={{ background: bg }}>
      <HugeiconsIcon icon={DoorIcon} aria-hidden size={size === 's' ? 90 : 140} className="pointer-events-none absolute -bottom-5 -right-4 -z-10 text-white/10" />
      <DetailsButton title="Doors & windows" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          {anyOpen ? null : <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="mb-1 text-white/85" />}
          <p className={cn('font-semibold leading-none', anyOpen ? 'text-4xl tabular-nums' : 'text-xl')}>{anyOpen ? `${m.activeCount} open` : 'All closed'}</p>
          <p className="mt-1 truncate text-xs text-white/80">{anyOpen ? m.detailText : `${m.totalCount} doors and windows${offline ? ` · ${offline} offline` : ''}`}</p>
        </div>
        {size !== 's' && open.length > 0 ? (
          <ul aria-label="Open" className={cn('mt-auto gap-1.5', size === 'w' ? 'flex min-w-0 flex-wrap' : size === 'l' ? 'grid grid-cols-2' : 'flex flex-col')}>
            {open.slice(0, rows).map((i) => (
              <li
                key={i.entityId}
                className={cn('flex min-w-0 items-center gap-1.5 bg-white/18 text-xs ring-1 ring-white/25 backdrop-blur-md', size === 'w' ? 'rounded-full px-2.5 py-1' : 'rounded-xl px-2.5 py-1.5')}
              >
                <HugeiconsIcon icon={sensorIcon(i)} size={13} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                <span className="shrink-0 tabular-nums text-white/75">{sinceShort(i.lastChangedAt)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
