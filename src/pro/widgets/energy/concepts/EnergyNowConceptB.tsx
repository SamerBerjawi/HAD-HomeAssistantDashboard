/**
 * Energy now concept B — Expressive & immersive ("power glow"). The card takes the colour of
 * what is feeding the home: sunny amber on solar, teal on the battery, blue on the grid, deep
 * night when idle. A glass bar shows the mix; Large adds a glass tile per source.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';
import { dominantSource, liveRows, SOURCE } from './shared';

const GLOW = {
  solar: 'linear-gradient(150deg, hsl(42 95% 56%), hsl(22 88% 46%))',
  battery: 'linear-gradient(150deg, hsl(172 55% 42%), hsl(195 55% 26%))',
  grid: 'linear-gradient(150deg, hsl(212 75% 52%), hsl(228 55% 28%))',
  idle: 'linear-gradient(150deg, hsl(230 25% 30%), hsl(240 30% 14%))'
};
const LIGHT = { solar: 'hsl(48 100% 80%)', battery: 'hsl(170 80% 78%)', grid: 'hsl(205 100% 82%)' } as const;

export default function EnergyNowConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const dom = dominantSource(m);
  const split = [
    { k: 'solar' as const, pct: m.sourceSplit.solarPct },
    { k: 'battery' as const, pct: m.sourceSplit.batteryPct },
    { k: 'grid' as const, pct: m.sourceSplit.gridPct }
  ].filter((s) => s.pct > 0);
  const rows = liveRows(m);

  return (
    <WidgetSurface label="Energy now" ink="light" style={{ background: GLOW[dom ?? 'idle'] }}>
      {dom === 'solar' ? (
        <HugeiconsIcon
          icon={Sun01Icon}
          aria-hidden
          size={size === 's' ? 90 : 150}
          className="pointer-events-none absolute -right-6 -top-6 -z-10 text-white/15 motion-safe:animate-[spin_40s_linear_infinite]"
        />
      ) : null}
      <DetailsButton title="Energy now" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {empty ? (
          <div className="mt-auto text-white/80">{empty}</div>
        ) : (
          <>
            <div className="min-w-0 pr-8 [text-shadow:0_1px_8px_rgba(0,0,0,0.2)]">
              <p className="text-xs text-white/80">{dom ? `Running on ${SOURCE[dom].label.toLowerCase()}` : 'Home now'}</p>
              <p className={cn('font-semibold leading-none tabular-nums', size === 'l' ? 'text-5xl' : 'text-4xl')}>{m.homeKWText}</p>
              {size !== 's' ? <p className="mt-1 truncate text-xs text-white/85">{m.gridNetText}</p> : null}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              {size === 'l' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {rows.map((r) => (
                    <div key={r.key} className="min-w-0 rounded-xl bg-white/15 px-2.5 py-2 ring-1 ring-white/20 backdrop-blur-md">
                      <p className="flex items-center gap-1 text-[11px] text-white/80">
                        <HugeiconsIcon icon={SOURCE[r.key].icon} size={12} />
                        {SOURCE[r.key].label}
                      </p>
                      <p className="truncate text-base font-semibold tabular-nums">{r.value}</p>
                      <p className="truncate text-[11px] text-white/75">{r.note}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {split.length > 0 ? (
                <div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20" role="img" aria-label={split.map((s) => `${SOURCE[s.k].label} ${s.pct}%`).join(', ')}>
                    {split.map((s) => (
                      <span key={s.k} style={{ width: `${s.pct}%`, background: LIGHT[s.k] }} />
                    ))}
                  </div>
                  {size !== 's' ? (
                    <p className="mt-1 flex gap-3 text-[11px] text-white/85">
                      {split.map((s) => (
                        <span key={s.k} className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full" style={{ background: LIGHT[s.k] }} />
                          {SOURCE[s.k].label} {s.pct}%
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
