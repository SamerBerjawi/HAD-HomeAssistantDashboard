/**
 * Motion concept B — Expressive & immersive ("ripples"). A dusk-blue card where every room with
 * movement sends out soft amber ripples; when the house is still, the card is calm and says for
 * how long. Small: the busiest room. Wide/Tall/Large: a ripple per active room, quiet rooms
 * below.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Motion01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewSensorItem } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoSensors, sinceShort } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

function Ripple({ i, big }: { i: ProOverviewSensorItem; big?: boolean }) {
  const d = big ? 54 : 40;
  return (
    <li className="flex min-w-0 flex-col items-center gap-1">
      <span className="relative grid place-items-center" style={{ width: d, height: d }}>
        <span aria-hidden className="pro-ripple absolute inset-0 rounded-full border-2 border-[hsl(40_95%_65%)]" />
        <span aria-hidden className="pro-ripple absolute inset-0 rounded-full border-2 border-[hsl(40_95%_65%)]" style={{ animationDelay: '0.9s' }} />
        <span className="grid size-[60%] place-items-center rounded-full bg-[hsl(40_95%_62%)] text-black shadow-[0_0_18px_hsl(40_95%_60%/0.6)]">
          <HugeiconsIcon icon={Motion01Icon} size={big ? 16 : 13} />
        </span>
      </span>
      <span className="w-full truncate text-center text-[11px] font-semibold">{i.roomName}</span>
    </li>
  );
}

export default function MotionConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<SensorGroupModel>) {
  const bg = 'linear-gradient(160deg, hsl(228 35% 30%), hsl(240 35% 14%))';
  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Motion" ink="light" style={{ background: bg }}>
        <NoSensors icon={Motion01Icon} text="No motion sensors" className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75" />
      </WidgetSurface>
    );
  }
  const active = m.items.filter((i) => i.isActive);
  const quiet = [...m.items.filter((i) => !i.isActive)].sort((a, b) => (b.lastChangedAt ?? 0) - (a.lastChangedAt ?? 0));
  const latest = Math.max(...m.items.map((i) => i.lastChangedAt ?? 0));
  const maxRipples = size === 's' ? 1 : size === 'w' ? 3 : size === 't' ? 4 : 6;

  return (
    <WidgetSurface label="Motion" ink="light" style={{ background: bg }}>
      <DetailsButton title="Motion" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          <p className="truncate text-sm font-semibold">{active.length > 0 ? `Movement in ${active.length} room${active.length === 1 ? '' : 's'}` : 'All still'}</p>
          <p className="truncate text-xs text-white/70">{active.length > 0 ? 'Now' : `Last motion ${sinceShort(latest || null)} ago`}</p>
        </div>
        {active.length > 0 ? (
          <ul aria-label="Movement now" className={cn('grid flex-1 content-center gap-2', size === 's' ? 'grid-cols-1' : size === 't' ? 'grid-cols-2' : 'grid-cols-3')}>
            {active.slice(0, maxRipples).map((i) => (
              <Ripple key={i.entityId} i={i} big={size === 's' || size === 'l'} />
            ))}
          </ul>
        ) : (
          <div aria-hidden className="grid flex-1 place-items-center">
            <span className="size-10 rounded-full border-2 border-white/15" />
          </div>
        )}
        {(size === 't' || size === 'l' || (size === 'w' && active.length === 0)) && quiet.length > 0 ? (
          <p className="truncate text-[11px] text-white/65">
            {quiet
              .slice(0, size === 'w' ? 2 : 4)
              .map((i) => `${i.roomName} ${sinceShort(i.lastChangedAt)}`)
              .join(' · ')}
          </p>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
