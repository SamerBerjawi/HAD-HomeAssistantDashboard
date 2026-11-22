/**
 * Energy now concept A — Refined & minimal. What the home draws now as a light headline, then a
 * quiet row per source (solar, battery, grid) with what it is doing. Large adds the last hours as
 * a frameless area chart. Colour only in the source dots and chart (D1).
 */
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { PowerSourcesAreaChart } from '../../../ui/bklit/PowerSourcesAreaChart';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useBoxHeight } from '../../shared/useBoxHeight';
import { useEnergyEmptyState } from '../EnergyParts';
import { liveRows, SOURCE, SourceDot } from './shared';

export default function EnergyNowConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const { ref, height } = useBoxHeight<HTMLDivElement>(120);
  const rows = liveRows(m);
  return (
    <WidgetSurface label="Energy now" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy now" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto">{empty}</div>
        ) : (
          <>
            <div className={cn('flex min-w-0 gap-4', size === 'w' ? 'h-full' : '')}>
              <div className={cn('min-w-0', size === 'w' ? 'flex flex-col justify-end' : '')}>
                <p className="text-[11px] text-muted">Home now</p>
                <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', size === 's' ? 'text-[30px]' : 'text-[40px]')}>{m.homeKWText}</p>
                <p className="mt-1 truncate text-xs text-muted">{m.gridNetText}</p>
              </div>
              {size === 'w' ? (
                <ul aria-label="Sources now" className="mt-6 flex min-w-0 flex-1 flex-col justify-end divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
                  {rows.map((r) => (
                    <li key={r.key} className="flex items-center gap-2 py-1 text-xs">
                      <SourceDot k={r.key} size={13} />
                      <span className="min-w-0 flex-1 truncate text-muted">{SOURCE[r.key].label}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{r.value}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {size === 'l' ? (
              <>
                <div className="grid grid-cols-3 gap-2 border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2">
                  {rows.map((r) => (
                    <div key={r.key} className="min-w-0">
                      <p className="flex items-center gap-1 text-[11px] text-muted">
                        <SourceDot k={r.key} size={12} />
                        {SOURCE[r.key].label}
                      </p>
                      <p className="truncate text-sm font-semibold tabular-nums">{r.value}</p>
                      <p className="truncate text-[11px] text-muted">{r.note}</p>
                    </div>
                  ))}
                </div>
                <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
                  <PowerSourcesAreaChart data={m.powerSourcesSeries} height={height} showAxes={false} showLegend={false} trimFuture />
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
