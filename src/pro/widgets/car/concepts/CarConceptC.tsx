/**
 * Car concept C — Innovative ("instrument cluster"). The card is the car's dashboard: a dial whose
 * arc is the battery (with the charge target as a tick and charge flowing toward it), the speed
 * and gear in the middle while driving; a row of telltales below that light up like warning lights
 * (unlocked, plugged in, climate, update, tyres, low battery); a trip computer with range, where it
 * is and the cabin; and at Large, the parked spot on a map.
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, BatteryLowIcon, Download04Icon, PlugSocketIcon, SnowflakeIcon, SquareUnlock02Icon, ThermometerWarmIcon, TireIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { carLine, type ProCarModel } from '../../../lib/overviewCar';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoCar, ParkedMap, rangeText } from './shared';

const START = 135;
const SWEEP = 270;
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [60 + r * Math.cos(a), 60 + r * Math.sin(a)] as const;
};
const ARC = (() => {
  const [x1, y1] = pt(START, 48);
  const [x2, y2] = pt(START + SWEEP, 48);
  return `M ${x1} ${y1} A 48 48 0 1 1 ${x2} ${y2}`;
})();

function Dial({ m }: { m: ProCarModel }) {
  const soc = m.socPct ?? 0;
  const low = soc < 15;
  const color = low ? 'hsl(0 85% 62%)' : m.mode === 'charging' ? 'hsl(145 70% 55%)' : 'white';
  const target = m.targetPct;
  const tick = target !== null ? [pt(START + (SWEEP * target) / 100, 41), pt(START + (SWEEP * target) / 100, 55)] : null;
  const driving = m.mode === 'driving';
  return (
    <svg
      viewBox="0 0 120 120"
      className="aspect-square h-full max-h-full w-auto max-w-full"
      role="img"
      aria-label={`${m.modeLabel}. Battery ${soc}%${driving && m.speed !== null ? `, ${Math.round(m.speed)} ${m.speedUnit}` : ''}`}
    >
      {Array.from({ length: 11 }, (_, i) => {
        const [a, b] = [pt(START + (SWEEP * i) / 10, 57), pt(START + (SWEEP * i) / 10, 59.5)];
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="white" strokeOpacity="0.3" strokeWidth="1" />;
      })}
      <path d={ARC} fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="8" strokeLinecap="round" />
      {m.mode === 'charging' && target !== null && target > soc ? (
        <path d={ARC} fill="none" stroke={color} strokeOpacity="0.45" strokeWidth="8" pathLength={100} strokeDasharray={`0 ${soc} ${target - soc} 100`} className="motion-safe:animate-pulse" />
      ) : null}
      <path
        d={ARC}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${Math.max(0.5, soc)} 100`}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
      {tick ? <line x1={tick[0][0]} y1={tick[0][1]} x2={tick[1][0]} y2={tick[1][1]} stroke="white" strokeWidth="1.6" strokeLinecap="round" /> : null}
      {driving ? (
        <>
          <text x="60" y="60" textAnchor="middle" fontSize="28" fontWeight="300" fill="white">
            {m.speed !== null ? Math.round(m.speed) : '–'}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="8" fill="white" fillOpacity="0.6">
            {m.speedUnit}
          </text>
          <text x="60" y="88" textAnchor="middle" fontSize="8" letterSpacing="3" fontWeight="600">
            {['P', 'R', 'N', 'D'].map((g) => (
              <tspan key={g} fill="white" fillOpacity={g === m.gear ? 1 : 0.3}>
                {g}
              </tspan>
            ))}
          </text>
        </>
      ) : (
        <>
          <text x="60" y="62" textAnchor="middle" fontSize="24" fontWeight="300" fill={low ? 'hsl(0 85% 70%)' : 'white'}>
            {m.socPct ?? '–'}%
          </text>
          <text x="60" y="75" textAnchor="middle" fontSize="8" fill="white" fillOpacity="0.65">
            {m.mode === 'charging' && target !== null ? `to ${target}%` : (rangeText(m) ?? '')}
          </text>
        </>
      )}
      <text x="60" y="108" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="white" fillOpacity="0.85" letterSpacing="0.6">
        {m.modeLabel.toUpperCase()}
      </text>
    </svg>
  );
}

interface Telltale {
  id: string;
  icon: IconSvgElement;
  on: boolean;
  color: string;
  label: string;
}

function telltales(m: ProCarModel): Telltale[] {
  const has = (id: string) => m.alerts.some((a) => a.id === id);
  const cooling = m.modeLabel === 'Cooling down';
  return [
    { id: 'lock', icon: SquareUnlock02Icon, on: !m.locked, color: 'hsl(40 100% 60%)', label: m.locked ? 'Locked' : 'Unlocked' },
    { id: 'plug', icon: PlugSocketIcon, on: m.pluggedIn, color: 'hsl(145 70% 55%)', label: m.pluggedIn ? 'Plugged in' : 'Not plugged in' },
    {
      id: 'climate',
      icon: cooling ? SnowflakeIcon : ThermometerWarmIcon,
      on: m.climateOn,
      color: cooling ? 'hsl(195 90% 65%)' : 'hsl(22 100% 62%)',
      label: m.climateOn ? 'Climate on' : 'Climate off'
    },
    {
      id: 'ota',
      icon: Download04Icon,
      on: m.ota.state !== 'none',
      color: 'hsl(265 90% 75%)',
      label: m.ota.state === 'installing' ? 'Installing update' : m.ota.state === 'available' ? 'Update ready' : 'Software up to date'
    },
    { id: 'tyres', icon: TireIcon, on: has('tyres'), color: 'hsl(40 100% 60%)', label: has('tyres') ? 'Check tyre pressure' : 'Tyres OK' },
    { id: 'battery', icon: BatteryLowIcon, on: has('battery'), color: 'hsl(0 90% 65%)', label: has('battery') ? 'Battery low' : 'Battery OK' },
    { id: 'alert', icon: Alert02Icon, on: has('window') || has('unlocked') || has('alarm') || has('service'), color: 'hsl(0 90% 65%)', label: 'Warning' }
  ];
}

function Telltales({ m, className }: { m: ProCarModel; className?: string }) {
  return (
    <ul aria-label="Telltales" className={cn('flex min-w-0 items-center justify-between gap-1', className)}>
      {telltales(m).map((t) => (
        <li key={t.id} title={t.label} aria-label={t.label} className="grid size-6 place-items-center">
          <HugeiconsIcon icon={t.icon} size={15} style={t.on ? { color: t.color, filter: `drop-shadow(0 0 4px ${t.color})` } : undefined} className={t.on ? undefined : 'text-white/18'} />
        </li>
      ))}
    </ul>
  );
}

function Trip({ m, rows }: { m: ProCarModel; rows: number }) {
  const list = [
    m.mode === 'driving' ? null : { k: 'Where', v: m.location.isHome ? 'Home' : m.location.place },
    rangeText(m) ? { k: 'Range', v: rangeText(m) as string } : null,
    m.cabinTemp !== null ? { k: 'Cabin', v: `${Math.round(m.cabinTemp)}${m.tempUnit}${m.outdoorTemp !== null ? ` · out ${Math.round(m.outdoorTemp)}°` : ''}` } : null,
    m.odometer !== null ? { k: 'Odo', v: `${m.odometer.toLocaleString()} ${m.odometerUnit}` } : null
  ].filter((x) => x !== null);
  return (
    <dl className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
      {list.slice(0, rows).map((r) => (
        <div key={r.k} className="contents">
          <dt className="uppercase tracking-wide text-white/45">{r.k}</dt>
          <dd className="truncate text-right font-medium tabular-nums text-white/90">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function CarConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProCarModel>) {
  const message = m.alerts[0]?.text ?? (m.ota.state === 'available' ? 'Update ready' : m.ota.state === 'installing' ? 'Installing update' : null);
  return (
    <WidgetSurface label={m.name} ink="light" style={{ background: 'radial-gradient(120% 90% at 30% 20%, hsl(222 22% 20%), hsl(228 28% 8%))' }}>
      <DetailsButton title={m.name} onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {!m.hasCar ? (
          <NoCar muted="text-white/70" />
        ) : size === 's' ? (
          <div className="grid min-h-0 flex-1 place-items-center">
            <Dial m={m} />
          </div>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 items-center gap-3">
            <div className="h-full shrink-0">
              <Dial m={m} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-5">
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="truncate text-xs text-white/70">{carLine(m, true)}</p>
              {message ? <p className="truncate text-[11px] font-medium text-[hsl(40_100%_70%)]">{message}</p> : null}
              <Telltales m={m} className="mt-1" />
            </div>
          </div>
        ) : size === 't' ? (
          <>
            <div className="grid min-h-0 flex-1 place-items-center">
              <Dial m={m} />
            </div>
            <p className="truncate text-center text-xs text-white/75">{message ?? carLine(m, true)}</p>
            <Telltales m={m} />
            <div className="border-t border-white/10 pt-2">
              <Trip m={m} rows={2} />
            </div>
          </>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 gap-3">
              <div className="h-full shrink-0">
                <Dial m={m} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 pr-4">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="line-clamp-2 text-xs text-white/70">{message ?? carLine(m)}</p>
                <Trip m={m} rows={4} />
              </div>
            </div>
            <Telltales m={m} className="rounded-xl bg-white/5 px-2 py-0.5" />
            {m.mode !== 'driving' && m.location.lat !== null ? (
              <div className="relative h-[34%] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                <ParkedMap m={m} dark className="absolute inset-0" />
                <p className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                  {[m.location.isHome ? 'Home' : m.location.place, m.location.sinceText].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
