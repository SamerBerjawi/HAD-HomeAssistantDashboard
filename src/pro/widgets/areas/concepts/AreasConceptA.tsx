/**
 * Areas concept A — Refined & minimal. The area on show as a quiet headline (name, temperature,
 * one status line); favourites as plain quick buttons; "All areas" opens every area by floor.
 * Small: the area + menu. Wide: area | favourites. Tall/Large: favourites on top, the area's
 * figures below (Large adds a lights switch and more figures).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { areaSummaryLine, type ProAreaItem, type ProAreasModel } from '../../../lib/overviewAreas';
import { ToggleSwitch } from '../../controls/ControlParts';
import { WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { AreaMenu, areaIcon, tempText, useAreaActions, useAreaSelection } from './shared';

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] text-muted">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function AreasConceptA({ model: m, size }: DesignedWidgetProps<ProAreasModel>) {
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

  const favButton = (a: ProAreaItem, wide?: boolean) => (
    <Button
      key={a.areaId}
      size="sm"
      variant="ghost"
      onPress={() => select(a.areaId)}
      aria-pressed={a.areaId === area.areaId}
      className={cn(
        'h-8 min-w-0 justify-start gap-1.5 rounded-lg px-2 text-xs',
        wide && 'w-full',
        a.areaId === area.areaId ? 'bg-default font-semibold text-foreground' : 'text-muted hover:text-foreground'
      )}
    >
      <HugeiconsIcon icon={areaIcon(a)} size={14} className="shrink-0" />
      <span className="truncate">{a.name}</span>
    </Button>
  );

  const headline = (big?: boolean) => (
    <div className="min-w-0">
      <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
        <HugeiconsIcon icon={areaIcon(area)} size={16} className="shrink-0 text-muted" />
        <span className="truncate">{area.name}</span>
      </p>
      <p className={cn('mt-1 font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[52px]' : 'text-[40px]')}>{tempText(area.temperature)}</p>
      <p className={cn('mt-1 text-xs leading-tight text-muted', size === 's' ? 'truncate' : 'line-clamp-2')}>{areaSummaryLine(area)}</p>
    </div>
  );
  const menu = <AreaMenu model={m} current={area.areaId} onSelect={select} iconOnly={size === 's'} className="text-muted" />;

  return (
    <WidgetSurface label="Areas" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? (
          <>
            <div className="absolute right-2 top-2">{menu}</div>
            <div className="mt-auto">{headline()}</div>
          </>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex min-w-0 flex-1 flex-col justify-end">{headline()}</div>
            <div className="flex w-[46%] min-w-0 flex-col gap-0.5">
              <div className="-mr-1.5 -mt-1.5 mb-0.5 flex justify-end">{menu}</div>
              {m.favorites.slice(0, 3).map((a) => favButton(a, true))}
            </div>
          </div>
        ) : null}

        {size === 't' || size === 'l' ? (
          <>
            <div className="flex items-start gap-1">
              <div className={cn('grid min-w-0 flex-1 gap-0.5', size === 'l' ? 'grid-cols-2' : 'grid-cols-1')}>{m.favorites.slice(0, 4).map((a) => favButton(a, true))}</div>
              <div className="-mr-1.5 -mt-0.5">
                <AreaMenu model={m} current={area.areaId} onSelect={select} iconOnly className="text-muted" />
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex items-end justify-between gap-2">
                {headline(size === 'l')}
                {area.totalLights > 0 ? (
                  <ToggleSwitch isSelected={area.lightsOn > 0} onChange={(on) => actions.setLights(area, on)} label={`${area.name} lights ${area.lightsOn > 0 ? 'off' : 'on'}`} />
                ) : null}
              </div>
              {size === 'l' ? (
                <div className="grid grid-cols-4 gap-2 border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2">
                  <Figure label="Humidity" value={area.humidity === null ? '–' : `${Math.round(area.humidity)}%`} />
                  <Figure label="Lights" value={area.totalLights > 0 ? `${area.lightsOn}/${area.totalLights}` : '–'} />
                  <Figure label="Power" value={area.powerWatts > 0 ? `${area.powerWatts} W` : '–'} />
                  <Figure label="Floor" value={area.floorName ?? '–'} />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
