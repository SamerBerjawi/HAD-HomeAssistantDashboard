/**
 * Lighting B ("glow") for a single light, as the room page draws one widget per light: the light's
 * name and level instead of "1 of 1", an on/off button, and from Wide up a brightness slider that
 * sends on release. Same dusk surface and warm glow as the home-wide card.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, SunriseIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { WidgetSize } from '../../../lib/overviewLayout';
import type { ProControlItem } from '../../../lib/overviewControls';
import type { useControlActions } from '../../controls/useControlActions';
import { SheetSlider } from '../../shared/sheet/SheetKit';

export function OneLight({ item, size, actions }: { item: ProControlItem; size: WidgetSize; actions: ReturnType<typeof useControlActions> }) {
  const on = item.isOn;
  const level = on ? `${item.brightnessPct ?? 100}%` : 'Off';
  const slider = size !== 's' && item.supportsBrightness;
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
      <div className="flex items-start justify-between gap-2 pr-7">
        <HugeiconsIcon icon={BulbIcon} size={26} className={on ? 'text-[hsl(42_100%_78%)] drop-shadow-[0_0_10px_hsl(40_100%_60%)]' : 'text-white/50'} />
      </div>
      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-end justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('line-clamp-2 break-words font-semibold leading-tight drop-shadow-sm', size === 's' ? 'text-sm' : 'text-base')}>{item.name}</p>
            <p className={cn('mt-0.5 text-2xl font-semibold leading-none tabular-nums', !on && 'text-white/60')}>{level}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => actions.toggleItem(item)}
            aria-label={`${item.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
            className={cn('h-8 shrink-0 rounded-full px-3 text-xs font-semibold ring-1', on ? 'bg-[hsl(42_100%_78%)] text-black ring-white/40' : 'bg-white/15 text-white ring-white/20 hover:bg-white/25')}
          >
            {on ? 'Off' : 'On'}
          </Button>
        </div>
        {slider ? (
          <div className="text-white [&_.text-muted]:text-white/70">
            <SheetSlider value={item.brightnessPct ?? (on ? 100 : 1)} min={1} label={`${item.name} brightness`} icon={SunriseIcon} warm onCommit={(v) => actions.setBrightness(item.entityId, v)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
