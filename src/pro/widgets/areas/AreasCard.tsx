/**
 * Areas card (owner's choice, WIDGET_DESIGN.md Phase 3): concept A's calm layout with concept B's
 * buttons: favourites as pills, "All areas" as a pill menu, and B's lights button at every size.
 * Small: area, temperature, lights. Wide: area + lights | menu + favourites. Tall/Large:
 * favourites on top, then the area with its figures (Large) and lights.
 * Revised (owner, 2026-11-20): the room name opens the area's Rooms page, and the menu ends with
 * "Open {area}" and "Choose favourites…" (a sheet of every room by floor).
 * Details (owner review 2026-11-20): the corner button too, with the menu moved left of it.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, BulbIcon, Home01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { areaSummaryLine, type ProAreaItem, type ProAreasModel } from '../../lib/overviewAreas';
import { useOpenSheet } from '../../hooks/useSheetParam';
import { openArea } from '../shared/navigate';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { FavoriteAreasSheet } from './FavoriteAreasSheet';
import { AreaMenu, areaIcon, tempText, useAreaActions, useAreaSelection } from './concepts/shared';

const PILL = 'bg-default/70 text-foreground ring-1 ring-[var(--separator,rgba(127,127,127,0.18))] hover:bg-default';
const PILL_ON = 'bg-foreground text-background ring-foreground';

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] text-muted">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function AreasCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProAreasModel>) {
  const { area, select } = useAreaSelection(m);
  const actions = useAreaActions();
  const [choosing, setChoosing] = useState(false);
  const openSheet = useOpenSheet();
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';

  if (!area) {
    return (
      <WidgetSurface label="Areas" className={surface}>
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
          <HugeiconsIcon icon={Home01Icon} size={22} />
          <p className="text-sm font-medium">No areas yet</p>
        </div>
      </WidgetSurface>
    );
  }

  const pill = (a: ProAreaItem) => (
    <Button
      key={a.areaId}
      size="sm"
      variant="ghost"
      onPress={() => select(a.areaId)}
      aria-pressed={a.areaId === area.areaId}
      className={cn('h-8 w-full min-w-0 max-w-full justify-start gap-1.5 rounded-full px-2.5 text-xs font-semibold', a.areaId === area.areaId ? PILL_ON : PILL)}
    >
      <HugeiconsIcon icon={areaIcon(a)} size={14} className="shrink-0" />
      <span className="truncate">{a.name}</span>
    </Button>
  );

  // Details open on the room shown (`?sheet=areas&id=`), from the corner button and the menu
  // (owner review 2026-11-20: corner button too; the menu moved left of it).
  const details = onOpenDetails ? () => openSheet('areas', area.areaId) : undefined;
  const menu = {
    model: m,
    current: area.areaId,
    onSelect: select,
    onOpen: openArea,
    onChooseFavorites: () => setChoosing(true),
    onDetails: details
  };
  const lightsOn = area.lightsOn > 0;
  const lights =
    area.totalLights > 0 ? (
      <Button
        size="sm"
        variant="ghost"
        onPress={() => actions.setLights(area, !lightsOn)}
        aria-label={`${area.name}: ${lightsOn ? `${area.lightsOn} of ${area.totalLights} lights on. Turn off` : 'lights off. Turn on'}`}
        className={cn(
          'w-full min-w-0 justify-start gap-2 rounded-xl px-3 text-xs font-semibold ring-1',
          size === 's' ? 'h-8' : 'h-9',
          lightsOn ? 'bg-[hsl(42_95%_62%)] text-black ring-[hsl(42_95%_70%)] hover:bg-[hsl(42_95%_66%)]' : PILL
        )}
      >
        <HugeiconsIcon icon={BulbIcon} size={15} className="shrink-0" />
        <span className="truncate">{lightsOn ? (size === 's' ? `${area.lightsOn}/${area.totalLights} on` : `${area.lightsOn} of ${area.totalLights} lights on`) : 'Lights off'}</span>
      </Button>
    ) : null;

  const headline = (summary = true) => (
    <div className="min-w-0">
      <Button
        size="sm"
        variant="ghost"
        onPress={() => openArea(area.areaId)}
        aria-label={`Open ${area.name}`}
        className="-ml-2 h-7 min-w-0 max-w-full justify-start gap-1.5 rounded-full px-2 text-sm font-semibold"
      >
        <HugeiconsIcon icon={areaIcon(area)} size={16} className="shrink-0 text-muted" />
        <span className="truncate">{area.name}</span>
        <HugeiconsIcon icon={ArrowRight01Icon} size={13} className="shrink-0 text-muted" />
      </Button>
      <p className="mt-1 text-[40px] font-extralight leading-none tracking-tighter tabular-nums">{tempText(area.temperature)}</p>
      {summary ? <p className="mt-1 truncate text-xs leading-tight text-muted">{areaSummaryLine(area)}</p> : null}
    </div>
  );

  return (
    <WidgetSurface label="Areas" className={surface}>
      <DetailsButton title={area.name} onPress={details} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? (
          <>
            <div className={cn('absolute top-2', details ? 'right-11' : 'right-2')}>
              <AreaMenu {...menu} iconOnly className={PILL} />
            </div>
            <div className={details ? 'pr-20' : 'pr-8'}>{headline(false)}</div>
            <div className="mt-auto">{lights}</div>
          </>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              {headline(!lights)}
              {lights}
            </div>
            <div className={cn('flex w-[44%] min-w-0 flex-col gap-1', details && 'pr-9')}>
              <AreaMenu {...menu} className={cn('w-full justify-between', PILL)} />
              {m.favorites.slice(0, 2).map(pill)}
            </div>
          </div>
        ) : null}

        {size === 't' || size === 'l' ? (
          <>
            <div className={cn('flex items-start gap-1.5', details && 'pr-9')}>
              <div className={cn('grid min-w-0 flex-1 gap-1', size === 'l' ? 'grid-cols-2' : 'grid-cols-1')}>{m.favorites.slice(0, size === 'l' ? 4 : 3).map(pill)}</div>
              <AreaMenu {...menu} iconOnly className={PILL} />
            </div>
            <div className="mt-auto flex flex-col gap-2">
              {headline()}
              {size === 'l' ? (
                <div className="grid grid-cols-4 gap-2 border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2">
                  <Figure label="Humidity" value={area.humidity === null ? '–' : `${Math.round(area.humidity)}%`} />
                  <Figure label="Lights" value={area.totalLights > 0 ? `${area.lightsOn}/${area.totalLights}` : '–'} />
                  <Figure label="Power" value={area.powerWatts > 0 ? `${area.powerWatts} W` : '–'} />
                  <Figure label="Floor" value={area.floorName ?? '–'} />
                </div>
              ) : null}
              {lights}
            </div>
          </>
        ) : null}
      </div>
      <FavoriteAreasSheet model={m} isOpen={choosing} onOpenChange={setChoosing} />
    </WidgetSurface>
  );
}
