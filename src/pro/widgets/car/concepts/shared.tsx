/** Pieces the Car concepts share: the car drawing, mode icons and colours, battery bar, actions, map. */
import { lazy, Suspense, useState } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BatteryCharging01Icon, Car01Icon, CarParking01Icon, Download04Icon, Moon02Icon, Navigation03Icon, PlugSocketIcon, SnowflakeIcon, ThermometerWarmIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { CarMode, ProCarModel } from '../../../lib/overviewCar';
import { useServiceCall } from '../../shared/useServiceCall';

const LazyCarMap = lazy(() => import('./CarMap'));

export function modeIcon(m: ProCarModel): IconSvgElement {
  const icons: Record<CarMode, IconSvgElement> = {
    driving: Navigation03Icon,
    charging: BatteryCharging01Icon,
    climate: m.modeLabel === 'Cooling down' ? SnowflakeIcon : ThermometerWarmIcon,
    updating: Download04Icon,
    on: Car01Icon,
    plugged: PlugSocketIcon,
    parked: CarParking01Icon,
    asleep: Moon02Icon
  };
  return icons[m.mode];
}

/** Card colours per state (B): what the car is doing sets the mood. */
export function carGlow(m: ProCarModel): string {
  if (m.alerts.some((a) => a.tone === 'danger')) return 'linear-gradient(155deg, hsl(8 75% 50%), hsl(350 60% 26%))';
  const g: Record<CarMode, string> = {
    driving: 'linear-gradient(155deg, hsl(222 75% 52%), hsl(245 55% 22%))',
    charging: 'linear-gradient(155deg, hsl(152 60% 40%), hsl(178 60% 18%))',
    climate: m.modeLabel === 'Cooling down' ? 'linear-gradient(155deg, hsl(195 80% 50%), hsl(215 60% 26%))' : 'linear-gradient(155deg, hsl(24 90% 56%), hsl(350 60% 34%))',
    updating: 'linear-gradient(155deg, hsl(265 60% 52%), hsl(250 50% 22%))',
    on: 'linear-gradient(155deg, hsl(190 55% 40%), hsl(210 50% 20%))',
    plugged: 'linear-gradient(155deg, hsl(160 30% 40%), hsl(190 30% 20%))',
    parked: 'linear-gradient(155deg, hsl(215 18% 44%), hsl(222 22% 22%))',
    asleep: 'linear-gradient(155deg, hsl(232 32% 28%), hsl(242 38% 12%))'
  };
  return m.ota.state === 'available' && m.mode !== 'driving' && m.mode !== 'charging' ? 'linear-gradient(155deg, hsl(258 55% 50%), hsl(232 45% 22%))' : g[m.mode];
}

export const rangeText = (m: ProCarModel) => (m.range !== null ? `${Math.round(m.range)} ${m.rangeUnit}` : null);

/**
 * A generic EV seen from the side (our own drawing). It reacts to the state: headlights on when
 * on or driving, wheels turning and speed lines while driving, a cable with flowing charge while
 * charging, a heat shimmer while the climate runs, "z" while asleep.
 */
export function CarArt({ m, body = 'white', glass = 'rgba(0,0,0,0.35)', className }: { m: ProCarModel; body?: string; glass?: string; className?: string }) {
  const driving = m.mode === 'driving';
  const lights = driving || m.mode === 'on' || m.mode === 'climate';
  return (
    <svg viewBox="-34 0 234 80" className={cn('overflow-visible', className)} aria-hidden>
      {driving ? (
        <g stroke={body} strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" className="motion-safe:animate-pulse">
          <line x1="-30" y1="30" x2="-6" y2="30" />
          <line x1="-24" y1="40" x2="2" y2="40" />
          <line x1="-30" y1="50" x2="-8" y2="50" />
        </g>
      ) : null}
      {m.pluggedIn ? (
        <g>
          <path d="M18 49 C4 52 -6 60 -12 78" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="4" strokeLinecap="round" />
          {m.mode === 'charging' ? (
            <path
              d="M18 49 C4 52 -6 60 -12 78"
              fill="none"
              stroke="hsl(140 90% 70%)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 6"
              className="motion-safe:animate-[pro-cable_0.8s_linear_infinite]"
            />
          ) : null}
        </g>
      ) : null}
      <path d="M14 58 C14 50 18 46 28 45 L52 42 C62 30 76 22 96 21 L122 21 C136 21 146 26 156 36 L176 42 C186 44 190 48 190 56 L190 60 C190 62 188 64 185 64 L18 64 C15 64 14 62 14 60 Z" fill={body} />
      <path d="M60 42 C68 32 80 26 96 25 L104 25 L104 42 Z M108 25 L120 25 C132 25 140 29 150 40 L150 42 L108 42 Z" fill={glass} />
      <line x1="106" y1="44" x2="106" y2="62" stroke={glass} strokeWidth="1" />
      <rect x="18" y="47" width="5" height="4" rx="1" fill={m.pluggedIn ? 'hsl(140 80% 45%)' : glass} />
      <ellipse cx="185" cy="50" rx="4" ry="2.5" fill={lights ? 'hsl(50 100% 80%)' : glass} />
      {lights ? <path d="M190 48 L214 42 L214 60 L190 53 Z" fill="hsl(50 100% 85%)" opacity="0.35" /> : null}
      <rect x="14.5" y="48" width="3" height="5" rx="1" fill={driving || m.mode === 'on' ? 'hsl(0 90% 55%)' : glass} />
      {[50, 156].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="64" r="12" fill="#1c1f24" />
          <circle cx={cx} cy="64" r="6" fill="#9aa3ad" />
          <g className={driving ? 'motion-safe:animate-spin' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDuration: '0.5s' }}>
            <path d={`M${cx} 58 V70 M${cx - 6} 64 H${cx + 6}`} stroke="#1c1f24" strokeWidth="1.6" />
          </g>
        </g>
      ))}
      {m.mode === 'climate' ? (
        <g fill="none" stroke={body} strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" className="motion-safe:animate-pulse">
          <path d="M84 14 c-3 -4 3 -6 0 -10" />
          <path d="M100 14 c-3 -4 3 -6 0 -10" />
          <path d="M116 14 c-3 -4 3 -6 0 -10" />
        </g>
      ) : null}
      {m.mode === 'asleep' ? (
        <text x="150" y="16" fontSize="12" fontWeight="600" fill={body} fillOpacity="0.7">
          z
          <tspan dx="2" dy="-5" fontSize="9">
            z
          </tspan>
        </text>
      ) : null}
    </svg>
  );
}

/** Battery bar with the charge target as a tick; stripes flow while charging. */
export function CarBattery({ m, ink = 'auto', thick = false }: { m: ProCarModel; ink?: 'auto' | 'light'; thick?: boolean }) {
  if (m.socPct === null) return null;
  const low = m.socPct < 15;
  const fill = low ? 'var(--danger)' : ink === 'light' ? 'white' : m.mode === 'charging' ? 'var(--success)' : 'var(--foreground)';
  return (
    <div
      className={cn('relative w-full rounded-full', thick ? 'h-3' : 'h-1.5', ink === 'light' ? 'bg-white/20' : 'bg-default')}
      role="img"
      aria-label={`Battery ${m.socPct}%${m.targetPct !== null ? `, charging to ${m.targetPct}%` : ''}`}
    >
      <span
        className={cn('absolute inset-y-0 left-0 rounded-full', m.mode === 'charging' && 'pro-charge-stripes')}
        style={{ width: `${m.socPct}%`, background: fill, opacity: ink === 'light' && !low ? 0.95 : 1 }}
      />
      {m.targetPct !== null && m.targetPct < 100 ? (
        <span className={cn('absolute -inset-y-0.5 w-0.5 rounded-full', ink === 'light' ? 'bg-white/70' : 'bg-foreground/50')} style={{ left: `${m.targetPct}%` }} />
      ) : null}
    </div>
  );
}

/** Lock or unlock the car, start or stop the climate (no-ops when the car has no such entity). */
export function useCarActions(m: ProCarModel) {
  const { call } = useServiceCall();
  const [busy, setBusy] = useState<'lock' | 'climate' | null>(null);
  const wrap = async (what: 'lock' | 'climate', fn: () => Promise<void>) => {
    setBusy(what);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  return {
    busy,
    setLocked: (lock: boolean) =>
      wrap('lock', async () => {
        const id = m.controls.lockId;
        if (!id) return;
        if (id.startsWith('button.')) await call('button', 'press', {}, id);
        else await call('lock', lock ? 'lock' : 'unlock', {}, id);
      }),
    toggleClimate: () =>
      wrap('climate', async () => {
        const id = m.controls.climateId;
        if (!id) return;
        await call(id.split('.')[0], m.climateOn ? 'turn_off' : 'turn_on', {}, id);
      })
  };
}

/** The parked car on a small map (only when parked with a position). */
/** The car on a map: parked only on the widget; `always` (the sheet) shows it while driving too. */
export function ParkedMap({ m, dark, className, always = false }: { m: ProCarModel; dark: boolean; className?: string; always?: boolean }) {
  if ((m.mode === 'driving' && !always) || m.location.lat === null || m.location.lon === null) return null;
  return (
    <Suspense fallback={<div className={cn('bg-default/50', className)} />}>
      <LazyCarMap lat={m.location.lat} lon={m.location.lon} dark={dark} label={`${m.name} at ${m.location.place}`} className={className} />
    </Suspense>
  );
}

export function NoCar({ muted = 'text-muted' }: { muted?: string }) {
  return (
    <div className={cn('mt-auto flex flex-col gap-1', muted)}>
      <HugeiconsIcon icon={Car01Icon} size={22} />
      <p className="text-sm font-medium">No car</p>
      <p className="text-xs">Add your car on the Mobility page</p>
    </div>
  );
}
