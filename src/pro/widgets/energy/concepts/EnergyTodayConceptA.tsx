/**
 * Energy today concept A — Refined & minimal. What the home used today as a light headline with
 * the cost; quiet figures for solar, bought and sold. Large adds the hours as a frameless bar
 * chart (made above the line, bought/sold below).
 */
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { BidirectionalBarChart } from '../../../ui/bklit/BidirectionalBarChart';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useBoxHeight } from '../../shared/useBoxHeight';
import { useEnergyEmptyState } from '../EnergyParts';
import { Figure, SOURCE } from './shared';

export default function EnergyTodayConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const { ref, height } = useBoxHeight<HTMLDivElement>(120);
  const figures = [
    m.hasSolar ? { label: 'Solar', value: m.solarKwhText, color: SOURCE.solar.color } : null,
    m.hasGrid ? { label: 'Bought', value: m.gridImportKwhText, color: SOURCE.grid.color } : null,
    m.hasGrid && m.gridExportKwh > 0 ? { label: 'Sold', value: m.gridExportKwhText, color: SOURCE.export.color } : null,
    { label: 'Cost', value: m.netCostText }
  ].filter((f) => f !== null);
  const headline = (
    <div className="min-w-0">
      <p className="text-[11px] text-muted">{m.periodLabel}</p>
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', size === 's' ? 'text-[30px]' : 'text-[40px]')}>{m.homeKwhText}</p>
      <p className="mt-1 truncate text-xs text-muted">{size === 's' ? m.netCostText : `used · ${m.periodAutarkyPct}% self-powered`}</p>
    </div>
  );
  return (
    <WidgetSurface label="Energy today" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy today" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto">{empty}</div>
        ) : size === 's' ? (
          <div className="mt-auto">{headline}</div>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex min-w-0 flex-col justify-end">{headline}</div>
            <div className="mt-6 grid min-w-0 flex-1 grid-cols-2 content-end gap-x-3 gap-y-1.5">
              {figures.slice(0, 4).map((f) => (
                <Figure key={f.label} label={f.label} value={f.value} color={f.color} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {headline}
            <div className="grid grid-cols-4 gap-2 border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2">
              {figures.map((f) => (
                <Figure key={f.label} label={f.label} value={f.value} color={f.color} />
              ))}
            </div>
            <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
              <BidirectionalBarChart data={m.electricitySeries} height={height} showAxes showLegend={false} />
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
