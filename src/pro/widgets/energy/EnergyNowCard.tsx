/**
 * Energy now — the owner's Phase 4 choice: concept A's layout (headline, a row per source, the
 * last hours at Large) on concept B's colours (the card takes the colour of what feeds the home:
 * amber on solar, teal on the battery, blue on the grid, deep night when idle). The battery is
 * prominent: a pill at Small/Wide, a big charge beside the headline at Large.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import { PowerSourcesAreaChart } from '../../ui/bklit/PowerSourcesAreaChart';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { useBoxHeight } from '../shared/useBoxHeight';
import { dominantSource, liveRows, SOURCE } from './concepts/shared';
import { BatteryPill, BatteryStat } from './EnergyBattery';
import { useEnergyEmptyState } from './EnergyParts';

const GLOW = {
  solar: 'linear-gradient(150deg, hsl(42 95% 56%), hsl(22 88% 46%))',
  battery: 'linear-gradient(150deg, hsl(172 55% 42%), hsl(195 55% 26%))',
  grid: 'linear-gradient(150deg, hsl(212 75% 52%), hsl(228 55% 28%))',
  idle: 'linear-gradient(150deg, hsl(230 25% 30%), hsl(240 30% 14%))'
};

/**
 * The chart sits on its own panel, white in light mode and near-black in dark like a Home
 * Assistant card (owner, 2026-11-21), so it shows HA's energy colours as HA does instead of
 * pale tints on the coloured card.
 */
const CHART_PANEL = 'min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/95 p-2 text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#1c1c1c]/95';

const RULE = 'border-t border-white/20';

export default function EnergyNowCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const { ref, height } = useBoxHeight<HTMLDivElement>(110);
  const dom = dominantSource(m);
  // The battery has its own pill/bar, so the rows are solar and grid.
  const rows = liveRows(m).filter((r) => r.key !== 'battery');
  const headline = (
    <div className="min-w-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.18)]">
      <p className="text-[11px] text-white/80">{dom ? `Home now · on ${SOURCE[dom].label.toLowerCase()}` : 'Home now'}</p>
      <p className={cn('font-extralight tracking-tighter tabular-nums', size === 's' ? 'text-[30px]' : 'text-[40px]', 'leading-none')}>{m.homeKWText}</p>
      <p className="mt-1 truncate text-xs text-white/80">{m.gridNetText}</p>
    </div>
  );

  return (
    <WidgetSurface label="Energy now" ink="light" style={{ background: GLOW[dom ?? 'idle'] }}>
      <DetailsButton title="Energy now" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto text-white/80">{empty}</div>
        ) : size === 's' ? (
          <>
            <BatteryPill m={m} ink="light" bare className="mr-8" />
            <div className="mt-auto">{headline}</div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex min-w-0 flex-col justify-between gap-2">
              <BatteryPill m={m} ink="light" />
              <div className="mt-auto">{headline}</div>
            </div>
            <ul aria-label="Sources now" className="mt-8 flex min-w-0 flex-1 flex-col justify-end divide-y divide-white/20">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-2 py-1 text-xs">
                  <HugeiconsIcon icon={SOURCE[r.key].icon} size={13} className="shrink-0 text-white/85" />
                  <span className="min-w-0 flex-1 truncate text-white/80">{SOURCE[r.key].label}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 items-end justify-between gap-3">
              {headline}
              <BatteryStat m={m} ink="light" className="shrink-0" />
            </div>
            {rows.length > 0 ? (
              <div className={cn('grid gap-2 pt-2', RULE)} style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
                {rows.map((r) => (
                  <div key={r.key} className="min-w-0">
                    <p className="flex items-center gap-1 text-[11px] text-white/80">
                      <HugeiconsIcon icon={SOURCE[r.key].icon} size={12} className="shrink-0" />
                      {SOURCE[r.key].label}
                    </p>
                    <p className="truncate text-sm font-semibold tabular-nums">{r.value}</p>
                    <p className="truncate text-[11px] text-white/75">{r.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className={CHART_PANEL}>
              <div ref={ref} className="h-full min-h-0">
                <PowerSourcesAreaChart data={m.powerSourcesSeries} height={height} showAxes={false} showLegend={false} trimFuture />
              </div>
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
