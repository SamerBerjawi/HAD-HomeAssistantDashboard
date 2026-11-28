/**
 * Areas concept C — Innovative ("the house"). The home drawn as a cross-section: floors stacked
 * (top floor on top), each area a room-block that glows warm while its lights are on and shows
 * its temperature. Tap a room to look at it; favourites carry a dot. Small: the favourites as a
 * 2 × 2 block. Wide/Tall: the favourites on their floors. Large: every area. A footer line
 * describes the room on show, with its lights switch.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { areaSummaryLine, type ProAreaItem, type ProAreasModel } from '../../../lib/overviewAreas';
import { ToggleSwitch } from '../../controls/ControlParts';
import { WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { AreaMenu, areaIcon, tempText, useAreaActions, useAreaSelection } from './shared';

const WARM = 'hsl(40 95% 62%)';

function Room({ a, shown, onPress, compact }: { a: ProAreaItem; shown: boolean; onPress: () => void; compact?: boolean }) {
  const lit = a.lightsOn > 0;
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      aria-pressed={shown}
      aria-label={`${a.name}: ${areaSummaryLine(a)}`}
      className={cn(
        'relative h-full min-h-0 min-w-0 flex-1 flex-col items-start justify-between gap-0 rounded-lg p-1.5 text-left ring-1 transition-colors',
        lit ? 'text-black ring-[hsl(40_95%_70%)]' : 'bg-default/60 text-foreground ring-transparent',
        shown && 'ring-2 ring-foreground'
      )}
      style={lit ? { background: `linear-gradient(160deg, ${WARM}, hsl(28 90% 58%))`, boxShadow: '0 0 14px hsl(40 95% 60% / 0.45)' } : undefined}
    >
      {a.isFavorite ? <span aria-hidden className={cn('absolute right-1.5 top-1.5 size-1.5 rounded-full', lit ? 'bg-black/50' : 'bg-foreground/50')} /> : null}
      <span className="flex w-full items-center gap-1 pr-2">
        <HugeiconsIcon icon={areaIcon(a)} size={compact ? 13 : 14} className={cn('shrink-0', lit ? 'opacity-80' : 'text-muted')} />
        {a.temperature !== null ? <span className={cn('truncate text-[10px] tabular-nums', lit ? 'opacity-75' : 'text-muted')}>{tempText(a.temperature)}</span> : null}
      </span>
      <span className={cn('block w-full truncate font-semibold leading-tight', compact ? 'text-[10px]' : 'text-[11px]')}>{a.name}</span>
    </Button>
  );
}

export default function AreasConceptC({ model: m, size }: DesignedWidgetProps<ProAreasModel>) {
  const { area, select } = useAreaSelection(m);
  const actions = useAreaActions();

  if (!area) {
    return (
      <WidgetSurface label="Areas" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
          <HugeiconsIcon icon={Home01Icon} size={22} />
          <p className="text-sm font-medium">No areas yet</p>
        </div>
      </WidgetSurface>
    );
  }

  const favIds = new Set(m.favorites.map((a) => a.areaId));
  // Top floor first, like a cross-section of the house; Large shows every area.
  const floors = [...m.floors]
    .map((f) => ({ ...f, areas: size === 'l' ? f.areas : f.areas.filter((a) => favIds.has(a.areaId)) }))
    .filter((f) => f.areas.length > 0)
    .sort((a, b) => b.level - a.level)
    // Keep the floors with the room on show, up to what fits.
    .filter((f, _, all) => all.length <= (size === 'w' ? 2 : 3) || f.areas.some((a) => a.areaId === area.areaId) || all.indexOf(f) < (size === 'w' ? 1 : 2))
    .slice(0, size === 'w' ? 2 : 3);
  const perRow = size === 'l' ? 4 : size === 'w' ? 3 : 2;

  return (
    <WidgetSurface label="Areas" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {size !== 's' ? (
          <div className="flex items-center justify-between gap-2">
            <p className="truncate pl-0.5 text-sm font-semibold">Home</p>
            <AreaMenu model={m} current={area.areaId} onSelect={select} className="-mr-1 text-muted" />
          </div>
        ) : null}

        {size === 's' ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1">
            {m.favorites.slice(0, 4).map((a) => (
              <Room key={a.areaId} a={a} shown={a.areaId === area.areaId} onPress={() => actions.setLights(a, a.lightsOn === 0)} compact />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            {floors.map((f) => (
              <div key={f.floorId ?? 'none'} className="flex min-h-0 flex-1 flex-col gap-0.5">
                {size !== 'w' ? <p className="truncate px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">{f.name}</p> : null}
                <div className="flex min-h-0 flex-1 gap-1 border-b-2 border-[var(--separator,rgba(127,127,127,0.25))] pb-1">
                  {f.areas.slice(0, perRow).map((a) => (
                    <Room key={a.areaId} a={a} shown={a.areaId === area.areaId} onPress={() => select(a.areaId)} compact={size === 'w' || size === 't'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {size !== 's' ? (
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted">
              <span className="font-semibold text-foreground">{area.name}</span> · {areaSummaryLine(area)}
            </p>
            {area.totalLights > 0 ? (
              <ToggleSwitch isSelected={area.lightsOn > 0} onChange={(on) => actions.setLights(area, on)} label={`${area.name} lights ${area.lightsOn > 0 ? 'off' : 'on'}`} />
            ) : null}
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
