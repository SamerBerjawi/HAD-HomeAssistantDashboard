/**
 * Energy round 2: "Right now" inside C · Day timeline (docs/pro-ui/ENERGY.md §0). Round 1's four
 * plain numbers had no answer; each concept here adds the one clear answer (`energyVerdict`) and
 * shows live power its own way.
 */
import { area as d3Area, curveMonotoneX, line as d3Line } from 'd3-shape';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { energyVerdict, fmtPower, homeMix, liveFlows, type EnergyHome, type HourSlot } from '../../../lib/energyHome';
import { COLOR, SOURCE_COLOR, SOURCE_ICON, type DesignProps } from './parts';

interface LiveItem {
  id: 'solar' | 'home' | 'grid' | 'battery';
  label: string;
  value: string;
  /** What it is doing: "making", "buying", "charging"... */
  doing: string;
  color: string;
  icon: typeof SOURCE_ICON.home;
  /** Today's curve for this source, kW per hour, up to now. */
  curve: number[];
}

const past = (home: EnergyHome) => home.today.filter((h) => !h.future);

function liveItems(home: EnergyHome): LiveItem[] {
  const { live } = home;
  const g = live.grid ?? 0;
  const b = live.battery ?? 0;
  const curve = (f: (h: HourSlot) => number) => past(home).map(f);
  const out: (LiveItem | null)[] = [
    live.solar !== null ? { id: 'solar', label: 'Solar', value: fmtPower(live.solar), doing: live.solar > 0.03 ? 'making' : home.sun?.up ? 'barely making' : 'sun down', color: COLOR.solar, icon: SOURCE_ICON.solar, curve: curve((h) => h.solar) } : null,
    { id: 'home', label: 'Home', value: fmtPower(live.home), doing: 'using', color: 'var(--foreground)', icon: SOURCE_ICON.home, curve: curve((h) => h.home) },
    { id: 'grid', label: 'Grid', value: fmtPower(g), doing: g > 0.03 ? 'buying' : g < -0.03 ? 'selling' : 'balanced', color: g < -0.03 ? COLOR.export : COLOR.grid, icon: SOURCE_ICON.grid, curve: curve((h) => h.gridIn - h.gridOut) },
    live.battery !== null ? { id: 'battery', label: 'Battery', value: live.soc !== null ? `${live.soc}%` : fmtPower(live.battery), doing: b > 0.03 ? `charging ${fmtPower(b)}` : b < -0.03 ? `giving ${fmtPower(b)}` : 'idle', color: COLOR.battery, icon: SOURCE_ICON.battery, curve: past(home).map((h) => h.soc ?? 0) } : null
  ];
  return out.filter((x): x is LiveItem => x !== null);
}

/** The answer, the same in every concept: a dot in the main source's colour, the words, one line. */
function Answer({ home, width, className }: DesignProps & { className?: string }) {
  const v = energyVerdict(home);
  const phone = width < 500;
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="size-2 rounded-full" style={{ background: SOURCE_COLOR[v.source] }} />
        Right now
      </p>
      <h2 className={cn('mt-0.5 font-light tracking-tight', phone ? 'text-[24px] leading-8' : 'text-[34px] leading-10')}>{v.title}</h2>
      <p className={cn('text-muted', phone ? 'text-[13px]' : 'text-sm')}>{v.detail}</p>
    </div>
  );
}

/**
 * 1 · Answer + numbers (owner pick, round 2): round 1's numbers, smaller, under the answer, each
 * with what it is doing and a small line of today so far beside the value.
 */
export function NowNumbers({ home, width }: DesignProps) {
  const items = liveItems(home);
  const phone = width < 500;
  // Two columns until each number has room for its sparkline beside it.
  const two = width < 720;
  return (
    <section aria-label="Right now" className="flex flex-col gap-5 px-1">
      <Answer home={home} width={width} />
      <div className="grid gap-y-4" style={{ gridTemplateColumns: `repeat(${two ? 2 : items.length}, minmax(0, 1fr))` }}>
        {items.map((x, i) => (
          <div key={x.id} className={cn('flex min-w-0 flex-col gap-0.5', (two ? i % 2 : i) > 0 && 'border-l border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pl-4', two ? i % 2 === 0 && 'pr-4' : 'pr-4')}>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <HugeiconsIcon icon={x.icon} size={15} style={{ color: x.color }} />
              {x.label}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <span className={cn('shrink-0 font-light tabular-nums tracking-tight', phone ? 'text-[26px] leading-8' : 'text-[32px] leading-10')} style={{ color: x.id === 'home' ? undefined : x.color }}>
                {x.value}
              </span>
              <span className={cn('min-w-0 flex-1', phone ? 'max-w-12' : 'max-w-24')}>
                <Spark values={x.curve} color={x.id === 'home' ? 'var(--foreground)' : x.color} inline />
              </span>
            </div>
            <span className="truncate text-xs text-muted">{x.doing}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** A ring split by where the home's power comes from. */
function MixRing({ home, size }: { home: EnergyHome; size: number }) {
  const mix = homeMix(home.live);
  const stroke = Math.round(size * 0.1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const parts = (['solar', 'battery', 'grid'] as const).filter((k) => mix[k] > 0);
  let at = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="color-mix(in oklab, var(--foreground) 8%, transparent)" />
        {parts.map((k) => {
          const len = (mix[k] / 100) * c;
          const gap = parts.length > 1 ? Math.min(6, len / 3) : 0;
          const el = <circle key={k} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke={SOURCE_COLOR[k]} strokeDasharray={`${Math.max(0.1, len - gap - stroke)} ${c}`} strokeDashoffset={-(at + stroke / 2)} />;
          at += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <HugeiconsIcon icon={SOURCE_ICON.home} size={size > 130 ? 20 : 16} className="mx-auto text-muted" />
          <p className={cn('font-light tabular-nums leading-tight', size > 130 ? 'text-2xl' : 'text-lg')}>{fmtPower(home.live.home)}</p>
        </div>
      </div>
    </div>
  );
}

/** 2 · Mix ring: the home in a ring split by source; beside it, what comes in and what goes out. */
export function NowRing({ home, width }: DesignProps) {
  const phone = width < 500;
  const wide = width >= 900;
  const f = liveFlows(home.live);
  const mix = homeMix(home.live);
  const rows = [
    { id: 'solar', label: 'Sun', kw: f.solarToHome, pct: mix.solar, color: COLOR.solar, dir: 'in' },
    { id: 'battery', label: 'Battery', kw: f.batteryToHome, pct: mix.battery, color: COLOR.battery, dir: 'in' },
    { id: 'grid', label: 'Grid', kw: f.gridToHome, pct: mix.grid, color: COLOR.grid, dir: 'in' },
    { id: 'charge', label: 'Into the battery', kw: f.solarToBattery + f.gridToBattery, pct: null, color: COLOR.battery, dir: 'out' },
    { id: 'export', label: 'Sent to the grid', kw: f.solarToGrid + f.batteryToGrid, pct: null, color: COLOR.export, dir: 'out' }
  ].filter((x) => x.kw > 0.02);
  const into = rows.filter((x) => x.dir === 'in');
  const out = rows.filter((x) => x.dir === 'out');
  const Row = ({ x }: { x: (typeof rows)[number] }) => (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: x.color, opacity: x.dir === 'out' ? 0.6 : 1 }} />
      <span className="min-w-0 flex-1 truncate">{x.label}</span>
      {phone && x.pct !== null ? null : <span className="tabular-nums text-muted">{fmtPower(x.kw)}</span>}
      {x.pct !== null ? <span className="w-10 text-right font-medium tabular-nums">{x.pct}%</span> : phone ? null : <span className="w-10" />}
    </li>
  );
  return (
    <section aria-label="Right now" className={cn('pro-surface grid gap-5 rounded-[28px] p-5 sm:p-6', wide && 'grid-cols-[minmax(0,1fr)_auto_minmax(0,320px)] items-center gap-8')}>
      <Answer home={home} width={width} />
      <div className={cn('flex items-center', phone ? 'gap-4' : 'gap-5', wide && 'contents')}>
        <MixRing home={home} size={phone ? 104 : 148} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="mb-1.5 text-xs text-muted">Powering the home</p>
            <ul className="flex flex-col gap-1.5">{into.map((x) => <Row key={x.id} x={x} />)}</ul>
          </div>
          {out.length ? (
            <div>
              <p className="mb-1.5 text-xs text-muted">Going out</p>
              <ul className="flex flex-col gap-1.5">{out.map((x) => <Row key={x.id} x={x} />)}</ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Today so far as a small line. `inline`: a bare line beside a number (no fill, no dot). */
function Spark({ values, color, inline }: { values: number[]; color: string; inline?: boolean }) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const lo = Math.min(0, ...values);
  const hi = Math.max(...values, lo + 0.1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - lo) / (hi - lo)) * h] as const);
  // Smooth, never overshooting the data (the same curve as the bklit charts).
  const line = d3Line<readonly [number, number]>().curve(curveMonotoneX)(pts) ?? '';
  const fill = d3Area<readonly [number, number]>().curve(curveMonotoneX).y0(h)(pts) ?? '';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('w-full overflow-visible', inline ? 'h-6' : 'h-7')} aria-hidden>
      {inline ? null : <path d={fill} fill={color} opacity={0.14} />}
      <path d={line} fill="none" stroke={color} strokeWidth={inline ? 1.8 : 1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {inline ? null : <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.4} fill={color} />}
    </svg>
  );
}

/** 3 · Live tiles: the answer as a line, then one small tile per source with today's curve so far. */
export function NowTiles({ home, width }: DesignProps) {
  const items = liveItems(home);
  const phone = width < 500;
  return (
    <section aria-label="Right now" className="flex flex-col gap-4">
      <Answer home={home} width={width} className="px-1" />
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${phone ? 2 : items.length}, minmax(0, 1fr))` }}>
        {items.map((x) => (
          <div key={x.id} className="pro-surface flex min-w-0 flex-col gap-2 rounded-[22px] p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ color: x.color, background: `color-mix(in oklab, ${x.color} 14%, var(--surface))` }}>
                <HugeiconsIcon icon={x.icon} size={16} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm">{x.label}</p>
                <p className="truncate text-xs text-muted">{x.doing}</p>
              </div>
            </div>
            <p className={cn('font-light tabular-nums tracking-tight', phone ? 'text-2xl' : 'text-3xl')}>{x.value}</p>
            <Spark values={x.curve} color={x.id === 'home' ? 'var(--foreground)' : x.color} />
          </div>
        ))}
      </div>
    </section>
  );
}
