/**
 * The home battery, shown prominently on the Energy now card (owner, Phase 4): a battery glyph that
 * fills to its charge, the charge in bold and what it is doing. `BatteryPill` is the compact form
 * (Small and Wide), `BatteryStat` the big one beside a headline (Large). Nothing renders without a battery.
 */
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import type { SurfaceInk } from '../shared/WidgetSurface';
import { kw } from './concepts/shared';

export type BatteryMode = 'charging' | 'giving' | 'idle';

export interface BatteryState {
  pct: number | null;
  mode: BatteryMode;
  /** Short line: "Charging 1.2 kW", "Powering home 0.8 kW", "Resting". */
  note: string;
  low: boolean;
}

export function batteryState(m: ProOverviewEnergyModel): BatteryState | null {
  if (!m.hasBattery) return null;
  const mode: BatteryMode = m.batteryChargeKW > 0.02 ? 'charging' : m.batteryDischargeKW > 0.02 ? 'giving' : 'idle';
  const note = mode === 'charging' ? `Charging ${kw(m.batteryChargeKW)}` : mode === 'giving' ? `Powering home ${kw(m.batteryDischargeKW)}` : 'Resting';
  return { pct: m.batterySoC, mode, note, low: m.batterySoC !== null && m.batterySoC < 20 };
}

const fillColor = (b: BatteryState, ink: SurfaceInk) => (b.low ? 'var(--danger)' : ink === 'light' ? 'white' : 'var(--energy-battery)');

/** Battery outline that fills to the charge; a bolt while charging. */
export function BatteryGlyph({ b, ink = 'auto', width = 26 }: { b: BatteryState; ink?: SurfaceInk; width?: number }) {
  const pct = b.pct ?? (b.mode === 'idle' ? 0 : 50);
  return (
    <svg viewBox="0 0 30 16" width={width} height={(width * 16) / 30} aria-hidden className="shrink-0">
      <rect x="0.75" y="0.75" width="25.5" height="14.5" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <rect x="27.5" y="5" width="2" height="6" rx="1" fill="currentColor" fillOpacity="0.55" />
      <rect x="3" y="3" width={Math.max(pct > 0 ? 2 : 0, (pct / 100) * 21)} height="10" rx="2.25" fill={fillColor(b, ink)} />
      {b.mode === 'charging' ? <path d="M14.5 2.5 9.5 9h4l-1 4.5 5-6.5h-4z" fill={ink === 'light' ? 'hsl(170 60% 30%)' : 'var(--surface, white)'} stroke="none" /> : null}
    </svg>
  );
}

const pillTone = (ink: SurfaceInk): { className: string; style?: CSSProperties } =>
  ink === 'light'
    ? { className: 'bg-white/18 ring-1 ring-white/25 backdrop-blur-md text-white' }
    : {
        className: 'text-foreground',
        style: { background: 'color-mix(in oklab, var(--energy-battery) 14%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--energy-battery) 30%, transparent)' }
      };

/** Compact battery: glyph, charge and (unless `bare`) what it is doing. */
export function BatteryPill({ m, ink = 'auto', bare = false, className }: { m: ProOverviewEnergyModel; ink?: SurfaceInk; bare?: boolean; className?: string }) {
  const b = batteryState(m);
  if (!b) return null;
  const tone = pillTone(ink);
  return (
    <p
      className={cn('inline-flex min-w-0 max-w-full items-center gap-1.5 self-start rounded-full py-1 pl-2 pr-2.5 text-xs', tone.className, className)}
      style={tone.style}
      aria-label={`Battery ${b.pct !== null ? `${b.pct}%, ` : ''}${b.note}`}
    >
      <BatteryGlyph b={b} ink={ink} width={22} />
      {b.pct !== null ? <span className="shrink-0 font-semibold tabular-nums">{b.pct}%</span> : null}
      {bare && b.pct !== null ? null : <span className={cn('min-w-0 truncate', ink === 'light' ? 'text-white/85' : 'text-muted')}>{b.note}</span>}
    </p>
  );
}

/** Battery beside a headline (Large): glyph and a big charge, what it is doing, a short fill bar. */
export function BatteryStat({ m, ink = 'auto', className }: { m: ProOverviewEnergyModel; ink?: SurfaceInk; className?: string }) {
  const b = batteryState(m);
  if (!b) return null;
  const muted = ink === 'light' ? 'text-white/80' : 'text-muted';
  return (
    <div className={cn('flex min-w-0 flex-col items-end text-right', className)} role="group" aria-label={`Battery ${b.pct !== null ? `${b.pct}%, ` : ''}${b.note}`}>
      <p className="flex items-center gap-1.5">
        <BatteryGlyph b={b} ink={ink} width={26} />
        <span className="text-2xl font-semibold leading-none tabular-nums">{b.pct !== null ? `${b.pct}%` : kw(m.batteryKW)}</span>
      </p>
      {b.pct !== null ? (
        <span className={cn('mt-1.5 block h-1.5 w-full min-w-20 overflow-hidden rounded-full', ink === 'light' ? 'bg-white/18' : 'bg-default')}>
          <span className="block h-full rounded-full" style={{ width: `${b.pct}%`, background: fillColor(b, ink) }} />
        </span>
      ) : null}
      <p className={cn('mt-1 max-w-full truncate text-[11px]', muted)}>{b.note}</p>
    </div>
  );
}
