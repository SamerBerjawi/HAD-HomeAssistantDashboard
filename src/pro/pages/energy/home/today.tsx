/**
 * Energy round 3: the Today timeline inside C (docs/pro-ui/ENERGY.md §0). Three ways to read today
 * so far and what is next (sun, price, grid carbon). Everything drawn beside the chart sits on its
 * time axis: the chart (bklit PowerSourcesAreaChart) keeps a 28 px left and 14 px right gutter and
 * puts hour i at i / 23 of the plot.
 */
import { useState, type ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryCharging01Icon, Clock01Icon, Leaf01Icon, Sun01Icon, SunriseIcon, SunsetIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { PowerSourcesAreaChart } from '../../../ui/bklit/PowerSourcesAreaChart';
import { axisSpanHours, batteryHoursLeft, bestHours, cheapestWindow, clock, dayAxisFraction, fmtKwh, fmtPrice, type EnergyHome } from '../../../lib/energyHome';
import { COLOR, dayData, PeriodTotals, SOURCE_ICON, type DesignProps } from './parts';

const GUTTER_L = 28;
const GUTTER_R = 14;
const AXIS_TOP = 14;
const AXIS_BOTTOM = 22;
const HIGH = { price: '#e0533a', co2: '#8a6a52' } as const;
const MID = '#e8b33c';

/** Cheap / clean (green) through amber to dear / dirty, for value v in [lo, hi]. */
const tint = (v: number | null, lo: number, hi: number, kind: 'price' | 'co2') => {
  const t = v === null || hi === lo ? 0.5 : (v - lo) / (hi - lo);
  return t < 0.5 ? `color-mix(in oklch, ${MID} ${Math.round(t * 200)}%, ${COLOR.clean})` : `color-mix(in oklch, ${HIGH[kind]} ${Math.round((t - 0.5) * 200)}%, ${MID})`;
};

/** The chart's colours, as a quiet key under the strips (the Now line would cut the chart's own legend). */
function Key({ home }: { home: EnergyHome }) {
  const items = [
    home.live.solar !== null ? { c: COLOR.solar, t: 'Solar' } : null,
    { c: COLOR.grid, t: 'Grid' },
    home.today.some((h) => h.gridOut > 0) ? { c: COLOR.export, t: 'Sent back' } : null,
    home.battery ? { c: COLOR.battery, t: 'Battery' } : null
  ].filter((x) => x !== null);
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((x) => (
        <span key={x.t} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: x.c }} />
          {x.t}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 border-t border-dashed border-[var(--foreground)]" />
        Home
      </span>
    </p>
  );
}
const range = (home: EnergyHome, kind: 'price' | 'co2') => {
  const v = home.today.map((h) => h[kind]).filter((x): x is number => x !== null);
  return v.length ? { lo: Math.min(...v), hi: Math.max(...v) } : null;
};
const nowIndex = (home: EnergyHome) => Math.max(0, home.today.findIndex((h) => h.at <= home.now && h.at + 3600_000 > home.now));
const left = (f: number) => `calc(${GUTTER_L}px + (100% - ${GUTTER_L + GUTTER_R}px) * ${f})`;

function Header({ home, children }: { home: EnergyHome; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-light">Today</h3>
      {children ?? <p className="text-sm text-muted">{new Date(home.now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
    </div>
  );
}

function Totals({ home, width }: DesignProps) {
  return <PeriodTotals home={home} period="day" width={width} className="border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-4" />;
}

/** A thin line at now through the chart and anything under it. */
function NowLine({ home, label }: { home: EnergyHome; label?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute bottom-0 w-px bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)]" style={{ left: left(dayAxisFraction(home, home.now)), top: AXIS_TOP - 4 }}>
      {label ? <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-1.5 text-[10px] font-medium leading-4 text-[var(--background)]">Now</span> : null}
    </div>
  );
}

const hourCellsBox = (home: EnergyHome) => {
  const span = axisSpanHours(home);
  return home.power?.length ? { width: `calc(100% * 24 / ${span})` } : { marginLeft: `calc(-100% / ${2 * span})`, width: `calc(100% * 24 / ${span})` };
};

/** 24 hour cells on the chart's axis (hour i centred where the chart draws it; the half hours at the ends are clipped). */
function HourCells({ home, kind, height = 10 }: { home: EnergyHome; kind: 'price' | 'co2'; height?: number }) {
  const r = range(home, kind);
  if (!r) return null;
  const now = nowIndex(home);
  return (
    <div className="overflow-hidden rounded-full" style={{ height }}>
      {/* Hour i spans hour i on the chart's axis: centred on its point when the chart is hourly; from i:00 to i+1:00 when it runs in 5-minute steps. */}
      <div className="flex h-full gap-px" style={hourCellsBox(home)}>
        {home.today.map((h, i) => (
          <span key={h.at} title={`${clock(h.at)} · ${kind === 'price' ? fmtPrice(h.price ?? 0, home.currency) : `${h.co2} g/kWh`}`} className="flex-1" style={{ background: tint(h[kind], r.lo, r.hi, kind), opacity: i < now ? 0.4 : 1 }} />
        ))}
      </div>
    </div>
  );
}

/** A lane under the chart: its icon in the chart's left gutter, its strip on the plot. */
function Lane({ icon, color, label, children }: { icon: typeof Sun01Icon; color: string; label: string; children: ReactNode }) {
  return (
    <div className="relative" style={{ paddingLeft: GUTTER_L, paddingRight: GUTTER_R }} aria-label={label}>
      <HugeiconsIcon icon={icon} size={13} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color }} />
      {children}
    </div>
  );
}

function SunBar({ home }: { home: EnergyHome }) {
  if (!home.sun) return null;
  const rise = dayAxisFraction(home, home.sun.rising - (home.sun.rising > home.sun.setting ? 86400_000 : 0));
  const set = dayAxisFraction(home, home.sun.setting);
  return (
    <div className="relative h-2.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]">
      <span className="absolute inset-y-0 rounded-full" style={{ left: `${rise * 100}%`, width: `${(set - rise) * 100}%`, background: `linear-gradient(90deg, color-mix(in oklab, ${COLOR.solar} 30%, transparent), ${COLOR.solar} 50%, color-mix(in oklab, ${COLOR.solar} 30%, transparent))` }} />
    </div>
  );
}

/** "Next" hints as small icon facts. */
function NextFacts({ home }: { home: EnergyHome }) {
  const win = cheapestWindow(home, 2);
  const { cleanest } = bestHours(home);
  const facts = [
    home.forecast && home.forecast.remaining >= 0.1 ? { icon: Sun01Icon, color: COLOR.solar, text: `${fmtKwh(home.forecast.remaining)} more sun until ${clock(home.sun?.setting ?? home.now)}` } : null,
    win ? { icon: Clock01Icon, color: COLOR.clean, text: `Cheapest ${win.from <= home.now ? 'now' : `${clock(win.from)}–${clock(win.to)}`}, ${fmtPrice(win.price, home.currency)}` } : null,
    cleanest && cleanest.co2 !== null ? { icon: Leaf01Icon, color: COLOR.clean, text: `Cleanest ${cleanest.at <= home.now ? 'now' : `at ${clock(cleanest.at)}`}, ${cleanest.co2} g` } : null
  ].filter((x) => x !== null);
  if (!facts.length) return null;
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {facts.map((f) => (
        <span key={f.text} className="inline-flex items-center gap-1.5 text-foreground">
          <HugeiconsIcon icon={f.icon} size={15} style={{ color: f.color }} />
          {f.text}
        </span>
      ))}
    </p>
  );
}

/** Night shaded on the chart's plot (before sunrise, after sunset), with sunrise and sunset marked on it. */
function NightShade({ home, height }: { home: EnergyHome; height: number }) {
  if (!home.sun) return null;
  const rise = dayAxisFraction(home, home.sun.rising - (home.sun.rising > home.sun.setting ? 86400_000 : 0));
  const set = dayAxisFraction(home, home.sun.setting);
  const night = 'color-mix(in oklab, var(--foreground) 5%, transparent)';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ top: AXIS_TOP, height: height - AXIS_TOP - AXIS_BOTTOM }}>
      <span className="absolute inset-y-0" style={{ left: left(0), width: `calc((100% - ${GUTTER_L + GUTTER_R}px) * ${rise})`, background: night }} />
      <span className="absolute inset-y-0" style={{ left: left(set), right: GUTTER_R, background: night }} />
      {[
        { f: rise, icon: SunriseIcon, t: home.sun.rising },
        { f: set, icon: SunsetIcon, t: home.sun.setting }
      ].map((x) => (
        <span key={String(x.t)} className={cn('absolute -top-1 flex items-center gap-1 whitespace-nowrap text-[10px] text-muted', x.f > 0.85 ? '-translate-x-full' : x.f < 0.15 ? '' : '-translate-x-1/2')} style={{ left: left(x.f) }}>
          <HugeiconsIcon icon={x.icon} size={13} style={{ color: COLOR.solar }} />
          {clock(x.t)}
        </span>
      ))}
    </div>
  );
}

/**
 * 1 · Chart + lanes (owner pick, round 3, with B's night shading added): round 1's strips on the
 * chart's hour grid, night shaded on the chart with sunrise and sunset, a Now line through
 * everything.
 */
export function TodayLanes({ home, width }: DesignProps) {
  const h = width >= 900 ? 280 : 200;
  return (
    <section aria-label="Today" className="pro-surface flex flex-col gap-4 rounded-[26px] p-5">
      <Header home={home} />
      <div className="relative flex flex-col gap-2 pb-1">
        <NightShade home={home} height={h} />
        <PowerSourcesAreaChart data={dayData(home)} height={h} showLegend={false} ariaLabel="Today's power by source" />
        {home.sun ? (
          <Lane icon={Sun01Icon} color={COLOR.solar} label="Sun">
            <SunBar home={home} />
          </Lane>
        ) : null}
        {home.today.some((x) => x.price !== null) ? (
          <Lane icon={SOURCE_ICON.grid} color={COLOR.grid} label="Price">
            <HourCells home={home} kind="price" />
          </Lane>
        ) : null}
        {home.today.some((x) => x.co2 !== null) ? (
          <Lane icon={Leaf01Icon} color={COLOR.clean} label="Grid carbon">
            <HourCells home={home} kind="co2" />
          </Lane>
        ) : null}
        <NowLine home={home} label />
      </div>
      <Key home={home} />
      <NextFacts home={home} />
      <Totals home={home} width={width} />
    </section>
  );
}

/** 2 · Shaded day: night is shaded on the chart, sunrise and sunset sit on it, one strip switches between price and carbon. */
export function TodayShaded({ home, width }: DesignProps) {
  const wide = width >= 900;
  const kinds = (['price', 'co2'] as const).filter((k) => home.grid[k] !== null);
  const [kind, setKind] = useState<'price' | 'co2'>(kinds[0] ?? 'price');
  const h = wide ? 280 : 200;
  return (
    <section aria-label="Today" className="pro-surface flex flex-col gap-4 rounded-[26px] p-5">
      <Header home={home}>
        {kinds.length > 1 ? (
          <ToggleButtonGroup aria-label="Strip" size="sm" selectionMode="single" disallowEmptySelection selectedKeys={new Set([kind])} onSelectionChange={(k) => setKind([...k][0] as 'price' | 'co2')}>
            <ToggleButton id="price" className="px-3">Price</ToggleButton>
            <ToggleButton id="co2" className="px-3">Carbon</ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </Header>
      <div className="relative">
        <NightShade home={home} height={h} />
        <PowerSourcesAreaChart data={dayData(home)} height={h} showLegend={false} ariaLabel="Today's power by source" />
        {kinds.length ? (
          <div className="mt-2" style={{ paddingLeft: GUTTER_L, paddingRight: GUTTER_R }}>
            <HourCells home={home} kind={kind} height={8} />
          </div>
        ) : null}
        <NowLine home={home} />
      </div>
      <Key home={home} />
      <NextFacts home={home} />
      <Totals home={home} width={width} />
    </section>
  );
}

/** 3 · What's next: the chart up to now, and beside it (under it on phones) the rest of today in words and cells. */
export function TodayNext({ home, width }: DesignProps) {
  const wide = width >= 900;
  const win = cheapestWindow(home, 2);
  const { cleanest } = bestHours(home);
  const ahead = home.today.filter((h) => h.at + 3600_000 > home.now);
  const r = range(home, 'price');
  const left_ = batteryHoursLeft(home);
  const b = home.live.battery ?? 0;
  const rows = [
    home.forecast && home.sun?.up && home.forecast.remaining >= 0.1
      ? { icon: Sun01Icon, color: COLOR.solar, title: `${fmtKwh(home.forecast.remaining)} more sun`, sub: `until sunset at ${clock(home.sun.setting)}` }
      : home.sun
        ? { icon: SunriseIcon, color: COLOR.solar, title: `Sun rises ${clock(home.sun.rising)}`, sub: home.forecast && home.forecast.tomorrow !== null ? `${fmtKwh(home.forecast.tomorrow)} expected tomorrow` : '' }
        : null,
    win
      ? win.from <= home.now
        ? { icon: Clock01Icon, color: COLOR.clean, title: 'Cheapest right now', sub: `until ${clock(win.to)}, ${fmtPrice(win.price, home.currency)} on average` }
        : { icon: Clock01Icon, color: COLOR.clean, title: `Cheapest ${clock(win.from)}–${clock(win.to)}`, sub: `${fmtPrice(win.price, home.currency)} on average${home.grid.price !== null ? `, ${fmtPrice(home.grid.price, home.currency)} now` : ''}` }
      : null,
    cleanest && cleanest.co2 !== null
      ? cleanest.at <= home.now
        ? { icon: Leaf01Icon, color: COLOR.clean, title: 'Cleanest right now', sub: `${cleanest.co2} g CO₂/kWh` }
        : { icon: Leaf01Icon, color: COLOR.clean, title: `Cleanest at ${clock(cleanest.at)}`, sub: `${cleanest.co2} g/kWh${home.grid.co2 !== null ? `, ${home.grid.co2} g now` : ''}` }
      : null,
    home.battery && home.live.soc !== null
      ? { icon: BatteryCharging01Icon, color: COLOR.battery, title: b > 0.03 ? `Charging, ${home.live.soc}%` : left_ !== null ? `Battery lasts about ${left_ < 1 ? `${Math.round(left_ * 60)} min` : `${left_.toFixed(1)} h`}` : `Battery ${home.live.soc}%, idle`, sub: b > 0.03 ? `full in about ${(((100 - home.live.soc) / 100) * home.battery.capacity / b).toFixed(1)} h` : left_ !== null ? 'at this rate' : '' }
      : null
  ].filter((x) => x !== null);
  return (
    <section aria-label="Today" className="pro-surface flex flex-col gap-4 rounded-[26px] p-5">
      <Header home={home} />
      <div className={cn('grid gap-6', wide && 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')}>
        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted">So far</p>
          <PowerSourcesAreaChart data={dayData(home)} height={wide ? 260 : 190} trimFuture ariaLabel="Today's power so far" />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-xs text-muted">Rest of today</p>
          <ul className="flex flex-col gap-3">
            {rows.map((x) => (
              <li key={x.title} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ color: x.color, background: `color-mix(in oklab, ${x.color} 14%, var(--surface))` }}>
                  <HugeiconsIcon icon={x.icon} size={16} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm leading-5">{x.title}</p>
                  {x.sub ? <p className="text-xs text-muted">{x.sub}</p> : null}
                </div>
              </li>
            ))}
          </ul>
          {r && ahead.length > 1 ? (
            <div className="flex flex-col gap-1">
              <div className="flex h-7 gap-0.5">
                {ahead.map((h) => (
                  <span key={h.at} title={`${clock(h.at)} · ${fmtPrice(h.price ?? 0, home.currency)}`} className="flex-1 rounded-md" style={{ background: tint(h.price, r.lo, r.hi, 'price') }} />
                ))}
              </div>
              <div className="flex text-[10px] text-muted tabular-nums">
                {ahead.map((h, i) => (
                  <span key={h.at} className="flex-1">
                    {i % 3 === 0 ? new Date(h.at).toLocaleTimeString([], { hour: '2-digit' }) : ''}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted">Price by hour, cheap to dear</p>
            </div>
          ) : null}
        </div>
      </div>
      <Totals home={home} width={width} />
    </section>
  );
}
