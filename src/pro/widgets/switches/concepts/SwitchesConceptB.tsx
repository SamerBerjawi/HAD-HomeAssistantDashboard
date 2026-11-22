/**
 * Switches concept B — Expressive & immersive ("plug board"). A dark panel of physical rocker
 * tiles: an on tile lights up with a blue glow (inside the tile, so neighbours stay apart) and
 * shows what it draws. The total power glows at
 * the top. Small: total + all. Wide: 3 × 2 rockers. Tall: 2 × 3. Large: total + 3 × 3.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FlashIcon, PlugSocketIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProControlDomainModel, ProControlItem } from '../../../lib/overviewControls';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { watts } from './shared';

const GLOW = 'hsl(205 100% 62%)';

function Rocker({ i, onPress }: { i: ProControlItem; onPress: () => void }) {
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      aria-label={`${i.name}, ${i.isOn ? 'on' : 'off'}. Switch ${i.isOn ? 'off' : 'on'}`}
      className={cn(
        'relative h-full min-h-0 w-full min-w-0 flex-col items-start justify-end gap-0 whitespace-normal rounded-xl p-2 text-left ring-1',
        i.isOn ? 'bg-[hsl(210_40%_22%)] text-white ring-[hsl(205_100%_62%/0.35)]' : 'bg-white/5 text-white/60 ring-white/10'
      )}
      // The glow stays inside the tile (owner, 2026-11-20: lit tiles ran into each other).
      style={i.isOn ? { boxShadow: `inset 0 -3px 0 ${GLOW}, inset 0 -14px 18px -10px hsl(205 100% 62% / 0.35)` } : { boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.08)' }}
    >
      <span className={cn('absolute right-2 top-2 size-1.5 rounded-full', i.isOn ? 'bg-[hsl(205_100%_70%)] shadow-[0_0_6px_hsl(205_100%_62%)]' : 'bg-white/25')} />
      <span className="w-full">
        <span className="line-clamp-2 pr-2 text-xs font-semibold leading-tight [overflow-wrap:anywhere]">{i.shortName}</span>
        <span className="block truncate text-[10px] font-normal opacity-75">{i.isOn ? (i.powerWatts ? watts(i.powerWatts) : 'On') : 'Off'}</span>
      </span>
    </Button>
  );
}

export default function SwitchesConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const anyOn = m.onCount > 0;
  const total = (
    <p className="flex items-center gap-1.5 truncate">
      <HugeiconsIcon icon={FlashIcon} size={16} className={anyOn ? 'text-[hsl(205_100%_70%)]' : 'text-white/40'} />
      <span className="text-2xl font-semibold tabular-nums" style={{ textShadow: anyOn ? `0 0 12px ${GLOW}` : undefined }}>
        {m.totalPowerWatts > 0 ? watts(m.totalPowerWatts) : `${m.onCount} on`}
      </span>
      <span className="text-xs text-white/60">{m.totalPowerWatts > 0 ? `${m.onCount} of ${m.totalCount} on` : `of ${m.totalCount}`}</span>
    </p>
  );
  const allButton = (
    <Button
      size="sm"
      variant="ghost"
      onPress={() => void actions.toggleAll(!anyOn)}
      className="h-8 shrink-0 rounded-full bg-white/10 px-3 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/20"
    >
      {anyOn ? 'All off' : 'All on'}
    </Button>
  );
  const count = size === 'w' ? 6 : size === 't' ? 6 : 9;

  return (
    <WidgetSurface label="Switches" ink="light" className="bg-[linear-gradient(160deg,#23262d,#14161a)]">
      <DetailsButton title="Switches" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {m.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-white/60">
            <HugeiconsIcon icon={PlugSocketIcon} size={22} />
            <p className="text-sm font-medium">No switches</p>
          </div>
        ) : null}
        {m.totalCount > 0 && size === 's' ? (
          <>
            <HugeiconsIcon icon={PlugSocketIcon} size={22} className={anyOn ? 'text-[hsl(205_100%_70%)]' : 'text-white/40'} />
            <div className="mt-auto">{total}</div>
            {allButton}
          </>
        ) : null}
        {m.totalCount > 0 && size !== 's' ? (
          <>
            {size !== 'w' ? <div className="flex items-center justify-between gap-2 pr-8">{total}</div> : null}
            <ul
              aria-label="Switches"
              className={cn('grid min-h-0 flex-1 gap-2.5', size === 't' ? 'grid-cols-2 grid-rows-3' : 'grid-cols-3', size === 'w' ? 'grid-rows-2 pr-9' : size === 'l' ? 'grid-rows-3' : '')}
            >
              {m.items.slice(0, count).map((i) => (
                <li key={i.entityId} className="min-h-0 min-w-0">
                  <Rocker i={i} onPress={() => actions.toggleItem(i)} />
                </li>
              ))}
            </ul>
            {size !== 'w' ? <div className="flex justify-end">{allButton}</div> : null}
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
