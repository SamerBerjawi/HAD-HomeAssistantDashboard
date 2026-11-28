/**
 * Energy today concept B — Expressive & immersive ("the day"). The card is the day's sky: warmer
 * and brighter the more of the home ran on its own power. The headline is how self-powered the
 * home was; Large draws the day: the sun's production as a soft glow, the home's use as a
 * line over it.
 */
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';

const OVERCAST = 'linear-gradient(160deg, hsl(212 22% 52%), hsl(222 28% 28%))';
const SUNNY = 'linear-gradient(160deg, hsl(42 95% 58%), hsl(18 85% 46%))';

function DayDrawing({ m }: { m: ProOverviewEnergyModel }) {
  // So far today: the series runs to midnight, the slots still to come are left out.
  const data = m.powerSourcesSeries.filter((d) => !d.future);
  if (data.length < 2) return null;
  const max = Math.max(0.1, ...data.map((d) => Math.max(d.solar, d.home)));
  const x = (i: number) => (i / (data.length - 1)) * 100;
  const y = (v: number) => 40 - (v / max) * 36;
  const made = data.map((d, i) => `${x(i)},${y(d.solar)}`).join(' ');
  const used = data.map((d, i) => `${x(i)},${y(d.home)}`).join(' ');
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="size-full" role="img" aria-label="Today: solar made (glow) and home use (line)">
      <defs>
        <linearGradient id="pro-day-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${made} 100,40`} fill="url(#pro-day-sun)" />
      <polyline points={used} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function EnergyTodayConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const pct = m.periodAutarkyPct;
  return (
    <WidgetSurface label="Energy today" ink="light" style={{ background: OVERCAST }}>
      {/* Sunnier the more self-powered: the warm sky fades in over the overcast one. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: SUNNY, opacity: Math.min(1, Math.max(0, pct / 80)) ** 0.6 }} />
      <DetailsButton title="Energy today" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto text-white/80">{empty}</div>
        ) : (
          <>
            <div className="min-w-0 pr-8 [text-shadow:0_1px_8px_rgba(0,0,0,0.2)]">
              <p className="text-xs text-white/85">{m.periodLabel}</p>
              <p className={cn('font-semibold leading-none tabular-nums', size === 'l' ? 'text-5xl' : 'text-4xl')}>{pct}%</p>
              <p className="mt-1 truncate text-xs text-white/90">self-powered · {m.homeKwhText} used</p>
            </div>
            {size === 'l' ? (
              <div className="relative -mx-3.5 min-h-0 flex-1">
                <DayDrawing m={m} />
              </div>
            ) : null}
            <div className={cn('flex min-w-0 flex-wrap gap-1.5', size === 's' && 'mt-auto')}>
              {(size === 's'
                ? [m.netCostText]
                : [m.hasSolar ? `☀ ${m.solarKwhText}` : null, `Bought ${m.gridImportKwhText}`, m.gridExportKwh > 0 ? `Sold ${m.gridExportKwhText}` : null, m.netCostText]
              )
                .filter(Boolean)
                .slice(0, size === 'w' ? 3 : 4)
                .map((t) => (
                  <span key={t} className="truncate rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/25 backdrop-blur-md">
                    {t}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
