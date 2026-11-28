/**
 * Energy round 1 · C · Day timeline (docs/pro-ui/ENERGY.md §0). The page is organised around
 * today. Live power is four plain numbers in one row, not a card. Under them one large chart of
 * the whole day, with the sun's hours, the price and the grid's carbon as strips on the same time
 * axis, so "now" and "what's next" (the forecast, cheaper or cleaner hours) read together. The
 * rest is a bento grid; the week, month and year sit in their own History card.
 */
import { type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Leaf01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { bestHours, clock, fmtPower, fmtPrice, type EnergyHome } from '../../../../lib/energyHome';
import { History, BLOCKS, COLOR, HourStrip, PeriodTotals, SOURCE_ICON, UsageChart, type DesignProps } from './parts';

export function LiveNumbers({ home, width }: DesignProps) {
  const { live } = home;
  const g = live.grid ?? 0;
  const items = [
    live.solar !== null ? { id: 'solar', label: 'Solar', value: fmtPower(live.solar), color: COLOR.solar, icon: SOURCE_ICON.solar } : null,
    { id: 'home', label: 'Home', value: fmtPower(live.home), color: 'var(--foreground)', icon: SOURCE_ICON.home },
    { id: 'grid', label: g < -0.03 ? 'To grid' : 'Grid', value: fmtPower(g), color: g < -0.03 ? COLOR.export : COLOR.grid, icon: SOURCE_ICON.grid },
    live.battery !== null ? { id: 'battery', label: live.battery > 0.03 ? 'Charging' : live.battery < -0.03 ? 'Battery out' : 'Battery', value: live.soc !== null ? `${live.soc}%` : fmtPower(live.battery), sub: Math.abs(live.battery) > 0.03 ? fmtPower(live.battery) : 'idle', color: COLOR.battery, icon: SOURCE_ICON.battery } : null
  ].filter((x) => x !== null);
  const phone = width < 500;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${phone ? 2 : items.length}, minmax(0, 1fr))` }}>
      {items.map((x) => (
        <div key={x.id} className="flex min-w-0 flex-col gap-1 px-1">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <HugeiconsIcon icon={x.icon} size={16} style={{ color: x.color }} />
            {x.label}
          </span>
          <span className={cn('font-light tabular-nums tracking-tight', phone ? 'text-3xl' : 'text-5xl')} style={{ color: x.id === 'home' ? undefined : x.color }}>
            {x.value}
          </span>
          {'sub' in x && x.sub ? <span className="text-xs text-muted">{x.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}

/** A strip under the chart, aligned with its plot (28 px axis on the left, 14 on the right). */
function Lane({ icon, color, label, children }: { icon: typeof Sun01Icon; color: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-[22px] shrink-0 justify-end" title={label} aria-label={label}>
        <HugeiconsIcon icon={icon} size={14} style={{ color }} />
      </span>
      <div className="mr-[14px] ml-[4px] min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SunStrip({ home }: { home: EnergyHome }) {
  if (!home.sun) return null;
  const day = new Date(home.now);
  day.setHours(0, 0, 0, 0);
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - day.getTime()) / 86400_000) * 100));
  const rise = pct(home.sun.rising - (home.sun.rising > home.sun.setting ? 86400_000 : 0));
  const set = pct(home.sun.setting);
  return (
    <div className="relative h-3 rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]" role="img" aria-label={`Sun up ${clock(home.sun.rising)} to ${clock(home.sun.setting)}`}>
      <span className="absolute inset-y-0 rounded-full" style={{ left: `${rise}%`, width: `${set - rise}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${COLOR.solar} 35%, transparent), ${COLOR.solar}, color-mix(in oklab, ${COLOR.solar} 35%, transparent))` }} />
    </div>
  );
}

export function DayTimeline({ home, width }: DesignProps) {
  const { cheapest, cleanest } = bestHours(home);
  const wide = width >= 900;
  return (
    <section aria-label="Today" className="pro-surface flex flex-col gap-3 rounded-[26px] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-light">Today</h3>
        <p className="text-sm text-muted">{new Date(home.now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <UsageChart home={home} period="day" height={wide ? 280 : 200} />
      <div className="flex flex-col gap-2">
        <Lane icon={Sun01Icon} color={COLOR.solar} label="Sun">
          <SunStrip home={home} />
        </Lane>
        {home.grid.price !== null ? (
          <Lane icon={SOURCE_ICON.grid} color={COLOR.grid} label="Price">
            <HourStrip home={home} kind="price" />
          </Lane>
        ) : null}
        {home.grid.co2 !== null ? (
          <Lane icon={Leaf01Icon} color={COLOR.clean} label="Grid carbon">
            <HourStrip home={home} kind="co2" />
          </Lane>
        ) : null}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {home.forecast && home.forecast.remaining >= 0.1 ? <span>{home.forecast.remaining.toFixed(1)} kWh more sun expected today</span> : null}
        {cheapest && home.grid.price !== null ? <span>Cheapest {cheapest.at <= home.now ? 'now' : `at ${clock(cheapest.at)}`} ({fmtPrice(cheapest.price ?? 0, home.currency)})</span> : null}
        {cleanest && home.grid.co2 !== null ? <span>Cleanest {cleanest.at <= home.now ? 'now' : `at ${clock(cleanest.at)}`} ({cleanest.co2} g)</span> : null}
      </p>
      <PeriodTotals home={home} period="day" width={width} className="mt-1 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-4" />
    </section>
  );
}

/** Round 1's cards: an even grid, Devices tall, History across the bottom. */
export function CardsGrid({ home, width }: DesignProps) {
  const cols = width < 1000 ? 2 : 3;
  const blocks = BLOCKS.filter((b) => b.has(home) && b.id !== 'grid');
  return (
    <div className="grid items-start gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {blocks.map(({ id, Block }) => (
        <div key={id} className={cn(id === 'devices' && cols === 3 && 'row-span-2')}>
          <Block home={home} />
        </div>
      ))}
      <div className="col-span-full">
        <History home={home} width={width} />
      </div>
    </div>
  );
}

/** The C page: the production Energy page, with the studio's swaps. */
export { default } from '../../home/EnergyPage';
