/**
 * Shared blocks for the Mobility Studio's round 1 (docs/pro-ui/MOBILITY.md §0). Every block reads
 * the brand-neutral `Vehicle` and draws only what the vehicle has, so a car from another make with
 * fewer parts simply shows fewer blocks. The three page directions arrange these differently.
 */
import { createContext, lazy, Suspense, useContext, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { useHaPicture } from '../../../widgets/shared/useHaPicture';
import { isSignedHaPicture, vehiclePictures } from '../../../lib/mobility/pictures';
import { resolveHAImageUrl } from '@/services/haImageService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { glowStyle, HUE } from '../../../areas/tiles/ambient/ambientKit';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  Bicycle01Icon,
  CarFrontIcon,
  CheckmarkCircle02Icon,
  DashboardSpeed01Icon,
  ElectricPlugsIcon,
  EngineIcon,
  EngineSlashIcon,
  FlashIcon,
  Location01Icon,
  Megaphone01Icon,
  Refresh01Icon,
  Route01Icon,
  SnowIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TemperatureIcon,
  TireIcon,
  Wrench01Icon
} from '@hugeicons/core-free-icons';
import { area as d3Area, curveMonotoneX, line as d3Line } from 'd3-shape';
import { cn } from '@/lib/utils';
import { ago, clock, fmtDistance, has, lowTyres, readiness, softwareLine, type MobilityAction, type MobilityHome, type Readiness, type Tone, type Vehicle } from '../../../lib/mobilityHome';

const CarMap = lazy(() => import('../../../widgets/car/concepts/CarMap'));

export type { MobilityAction } from '../../../lib/mobilityHome';

export interface DesignProps {
  home: MobilityHome;
  width: number;
  dark: boolean;
  act: (vehicleId: string, a: MobilityAction) => void;
}

export interface VehicleProps {
  v: Vehicle;
  home: MobilityHome;
  width: number;
  dark: boolean;
  act: DesignProps['act'];
  /** The page already shows the charge ring (B's hero): leave it out of the cards. */
  noRing?: boolean;
}

export const TONE: Record<Tone, string> = { good: 'hsl(152 55% 42%)', info: 'hsl(212 80% 54%)', warn: 'hsl(36 95% 50%)', bad: 'hsl(4 82% 54%)' };
export const toneIcon = (t: Tone): IconSvgElement => (t === 'good' ? CheckmarkCircle02Icon : t === 'info' ? FlashIcon : Alert02Icon);
export const vehicleIcon = (v: Vehicle): IconSvgElement => (v.kind === 'bike' ? Bicycle01Icon : CarFrontIcon);
/** Make and model, without repeating the make ("Cowboy 4", not "Cowboy Cowboy 4"). */
export const subtitle = (v: Vehicle) => (v.model && v.make && v.model.toLowerCase().startsWith(v.make.toLowerCase()) ? v.model : [v.make, v.model].filter(Boolean).join(' '));
export const soft = (pct: number) => `color-mix(in oklab, var(--foreground) ${pct}%, transparent)`;

/**
 * Round 6, "life" (docs/pro-ui/MOBILITY.md §0): how much colour and motion the page carries, as in
 * the room pages' ambient tiles. `plain` is the reviewed page; `ambient` gives each card its own hue
 * with a glow and a wave that rises with its level; `motion` adds moving graphics for what is
 * happening (charge flowing, air blowing, the road passing); `scene` also draws the vehicle in a
 * little scene at the top of the hero.
 */
export type Life = 'plain' | 'ambient' | 'motion' | 'scene';
export const LifeContext = createContext<Life>('plain');
export const useLife = () => useContext(LifeContext);

export { HUE };
/** Sets the hue the controls inside take (with the `pro-mob-hued` class, pro.css). */
export const hueVar = (hue: string) => ({ '--hue': hue }) as CSSProperties;
/** The class and style that colour a control, or a group of them, in a hue when the page has life. */
export const hued = (life: Life, hue: string) => (life === 'plain' ? { className: '', style: undefined } : { className: 'pro-mob-hued', style: hueVar(hue) });
export type Fx = 'flow-in' | 'flow-out' | 'air' | 'road' | 'pulse' | null;
/** A card's colour and activity: its hue, how "on" it is (0–1) and what moves in it. */
export interface Mood {
  hue: string;
  level: number;
  fx?: Fx;
}

// One hue per kind of thing, as on the room pages: charge in the power green, the cabin warm or cool, the road in blue, condition teal or amber.
export const chargeMood = (v: Vehicle): Mood => ({ hue: HUE.power, level: (v.level ?? 0) / 100, fx: batteryFlow(v).flow === 'in' ? 'flow-in' : batteryFlow(v).flow === 'out' ? 'flow-out' : null });
export function climateMood(v: Vehicle): Mood {
  const k = v.climate;
  const warm = !!k && (k.target ?? 21) >= (k.cabin ?? k.outside ?? 15);
  return { hue: warm ? HUE.heat : HUE.cool, level: k?.running ? 0.85 : 0.15, fx: k?.running ? 'air' : null };
}
export const placeMood = (v: Vehicle): Mood => ({ hue: HUE.cool, level: v.motion?.moving ? 0.6 : 0.25, fx: v.motion?.moving ? 'road' : null });
export const conditionMood = (problems: number): Mood => (problems ? { hue: HUE.light, level: 0.55, fx: 'pulse' } : { hue: HUE.air, level: 0.2 });

/** Moving graphics behind a card's content, in its hue. Still under reduced motion. */
export function FxLayer({ fx, hue }: { fx: Fx; hue: string }) {
  if (!fx || fx === 'pulse') return null;
  if (fx === 'road')
    return (
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-3 -z-10 h-[3px] opacity-50" style={{ color: hue }}>
        <div className="pro-mob-road h-full w-full rounded-full" />
      </div>
    );
  return (
    <div aria-hidden className={cn('pro-mob-flow pointer-events-none absolute inset-0 -z-10', fx === 'flow-out' && 'is-out', fx === 'air' && 'is-air')} style={{ color: hue }}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

/** A card on the page. With `mood` and some life, it takes its hue: a corner glow, a tinted icon, controls in the hue, and (motion, scene) moving graphics. No wave: the owner chose Ambient colour without the curved backgrounds (2026-11-27). */
export function Block({ title, icon, aside, children, className, mood }: { title: string; icon: IconSvgElement; aside?: ReactNode; children: ReactNode; className?: string; mood?: Mood }) {
  const life = useLife();
  const lit = life !== 'plain' && mood;
  return (
    <section
      aria-label={title}
      className={cn('@container pro-surface relative isolate flex min-w-0 flex-col gap-4 overflow-hidden rounded-[26px] p-5', lit && 'pro-mob-hued', className)}
      style={lit ? { ...glowStyle(mood.hue, Math.max(0.12, mood.level), '100% 0%'), ...hueVar(mood.hue) } : undefined}
    >
      {lit && life !== 'ambient' ? <FxLayer fx={mood.fx ?? null} hue={mood.hue} /> : null}
      <header className="flex items-center gap-2.5">
        {lit ? (
          <span className="relative grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${mood.hue} 22%, transparent)`, color: mood.hue }}>
            {life !== 'ambient' && mood.fx === 'pulse' ? <span aria-hidden className="pro-ripple absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${mood.hue}` }} /> : null}
            <HugeiconsIcon icon={icon} size={16} />
          </span>
        ) : (
          <HugeiconsIcon icon={icon} size={18} className="shrink-0 text-muted" />
        )}
        <h3 className="min-w-0 flex-1 truncate text-lg font-light">{title}</h3>
        {aside ? <span className="shrink-0 text-sm text-muted">{aside}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="truncate text-[17px] font-light tabular-nums tracking-tight" style={tone ? { color: TONE[tone] } : undefined}>
        {value}
      </p>
    </div>
  );
}

/** The owner's picture of the vehicle, or a silhouette on a soft plate. */
/** The vehicle's picture (the owner's, else its integration's, loaded with the HA session), else a silhouette. */
export function VehicleArt({ v, size = 96, className, stage }: { v: Vehicle; size?: number; className?: string; /** The cockpit's stage: wide, and a drawn side view in place of the icon. */ stage?: boolean }) {
  // The owner's picture, then the integration's; a picture that fails to load gives way to the next.
  const all = vehiclePictures(v);
  const [failed, setFailed] = useState<string[]>([]);
  const raw = all.find((x) => !failed.includes(x)) ?? null;
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const signed = raw && isSignedHaPicture(raw) ? resolveHAImageUrl(raw, serverUrl) : null;
  const loaded = useHaPicture(signed ? null : raw);
  const src = signed || loaded;
  const w = size * (stage ? 2.3 : 1.6);
  if (raw && src) return <img src={src} alt="" onError={() => setFailed((f) => [...f, raw])} className={cn('object-contain', className)} style={{ width: w, height: size }} />;
  if (stage) return <VehicleSilhouette kind={v.kind} className={className} style={{ width: w, height: size }} />;
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-[30%] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--accent)]', className)} style={{ width: size, height: size }}>
      <HugeiconsIcon icon={vehicleIcon(v)} size={Math.round(size * 0.5)} strokeWidth={1.4} />
    </span>
  );
}

/** A drawn side view for the stage when there is no picture: a modern EV crossover, or an e-bike. */
export function VehicleSilhouette({ kind, className, style }: { kind: Vehicle['kind']; className?: string; style?: CSSProperties }) {
  // A fine technical line drawing (as in the makers' configurators), not a filled cartoon.
  const id = useId().replace(/:/g, '');
  const line = 'color-mix(in oklab, var(--foreground) 62%, transparent)';
  const faint = 'color-mix(in oklab, var(--foreground) 26%, transparent)';
  if (kind === 'bike')
    return (
      <svg aria-hidden viewBox="0 0 400 160" className={className} style={style} preserveAspectRatio="xMidYMax meet" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[110, 290].map((x) => (
          <g key={x}>
            <circle cx={x} cy={110} r={44} stroke={line} strokeWidth={1.6} />
            <circle cx={x} cy={110} r={37} stroke={faint} strokeWidth={1} />
            <circle cx={x} cy={110} r={4} stroke={line} strokeWidth={1.2} />
          </g>
        ))}
        <path d="M110 110 L176 46 L262 46 L290 110 M176 46 L196 110 L262 46 M196 110 L110 110" stroke={line} strokeWidth={2.2} />
        <path d="M164 32 L192 32 M262 46 L252 18 L282 14" stroke={line} strokeWidth={2} />
        <rect x={184} y={52} width={56} height={11} rx={5.5} stroke={faint} strokeWidth={1.2} />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 400 140" className={className} style={style} preserveAspectRatio="xMidYMax meet" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--foreground)" stopOpacity={0.07} />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {/* Body: a fastback crossover, facing right. */}
      <path
        d="M30 104 C26 96 26 86 31 80 L40 68 C74 56 112 36 160 30 C200 26 236 27 262 34 C284 41 300 51 314 60 C342 63 366 67 378 75 C386 81 388 92 384 102 L376 106 L346 106 A36 36 0 0 0 274 106 L128 106 A36 36 0 0 0 56 106 Z"
        fill={`url(#b${id})`}
        stroke={line}
        strokeWidth={1.5}
      />
      {/* Glass, pillar, shoulder, door and lamps. */}
      <path d="M78 65 C110 48 140 40 170 37 C210 34 240 36 258 40 C272 44 284 51 294 60 Z" fill="var(--foreground)" fillOpacity={0.06} stroke={line} strokeWidth={1.2} />
      <path d="M198 36 L195 62" stroke={line} strokeWidth={1.2} />
      <path d="M38 82 C150 74 260 70 372 79" stroke={faint} strokeWidth={1} />
      <path d="M194 66 L192 104 M118 70 L118 104" stroke={faint} strokeWidth={1} />
      <path d="M222 76 L238 76 M146 78 L160 78" stroke={line} strokeWidth={1.4} />
      <path d="M356 70 C366 72 374 74 380 78" stroke={line} strokeWidth={2.4} />
      <path d="M33 77 L48 69" stroke={line} strokeWidth={2.4} />
      {[92, 310].map((x) => (
        <g key={x}>
          <circle cx={x} cy={106} r={30} stroke={line} strokeWidth={1.5} />
          <circle cx={x} cy={106} r={21} stroke={faint} strokeWidth={1} />
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d={`M${x} ${106} L${x + 20 * Math.cos((a * Math.PI) / 180)} ${106 + 20 * Math.sin((a * Math.PI) / 180)}`} stroke={faint} strokeWidth={1} />
          ))}
          <circle cx={x} cy={106} r={4.5} stroke={line} strokeWidth={1.2} />
        </g>
      ))}
    </svg>
  );
}

/** Charge (or fuel) as a ring with the range inside. */
export function ChargeRing({ v, size = 132, stroke = 10 }: { v: Vehicle; size?: number; stroke?: number }) {
  const pct = Math.max(0, Math.min(100, v.level ?? 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = v.charging?.target ?? null;
  const charging = v.charging?.state === 'charging';
  const color = pct < 20 ? TONE.warn : 'var(--accent)';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${v.level ?? '—'}% charge${v.range !== null ? `, ${fmtDistance(v.range, v.unit)} range` : ''}`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={soft(10)} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} className={cn(charging && 'motion-safe:animate-pulse')} />
        {target !== null && v.kind === 'car' ? (
          <line x1={size / 2 + r - stroke} x2={size / 2 + r + stroke} y1={size / 2} y2={size / 2} stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" transform={`rotate(${(target / 100) * 360} ${size / 2} ${size / 2})`} />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-light tabular-nums tracking-tight" style={{ fontSize: size * 0.22, lineHeight: 1 }}>
          {v.level === null ? '—' : `${v.level}%`}
        </span>
        {v.range !== null ? <span className="mt-1 text-muted tabular-nums" style={{ fontSize: Math.max(11, size * 0.1) }}>{fmtDistance(v.range, v.unit)}</span> : null}
      </div>
    </div>
  );
}

/** The one clear answer: a dot in its tone, the words, one line. */
export function Answer({ r, width, className }: { r: Readiness; width: number; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-2 text-sm text-muted">
        <span aria-hidden className="size-2 rounded-full" style={{ background: TONE[r.tone] }} />
        Ready to go?
      </p>
      <h2 className={cn('mt-1 font-light tracking-tight', width < 500 ? 'text-[26px] leading-8' : 'text-[34px] leading-10')}>{r.title}</h2>
      <p className={cn('mt-0.5 text-muted', width < 500 ? 'text-[13px]' : 'text-sm')}>{r.detail}</p>
    </div>
  );
}

/** The checks behind the answer, as quiet pills. */
export function Checks({ r, limit = 6 }: { r: Readiness; limit?: number }) {
  if (!r.checks.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Checks">
      {r.checks.slice(0, limit).map((c) => (
        <li key={c.id} className="inline-flex min-h-8 items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 text-[13px]" style={{ background: `color-mix(in oklab, ${TONE[c.tone]} 13%, transparent)` }}>
          <HugeiconsIcon icon={toneIcon(c.tone)} size={14} style={{ color: TONE[c.tone] }} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

/** What the vehicle can do from here: only the actions its integration offers. */
export function ActionDock({ v, act, compact, round, skip = [] }: { v: Vehicle; act: DesignProps['act']; compact?: boolean; /** Car-app quick actions: round icon buttons with the label under them. */ round?: boolean; /** Controls another card on the page already has. */ skip?: string[] }) {
  const locked = v.security.locked === true;
  const life = useLife();
  // Each control in its own hue, as on the room pages: unlocked in amber (it needs doing), the cabin warm or cool, charge green, the rest quiet.
  const items: { id: string; icon: IconSvgElement; label: string; on?: boolean; hue: string; run: () => void }[] = [];
  if (has(v, 'lock') || has(v, 'unlock')) items.push({ id: 'lock', icon: locked ? SquareLock02Icon : SquareUnlock02Icon, label: locked ? 'Unlock' : 'Lock', on: !locked, hue: HUE.light, run: () => act(v.id, { type: locked ? 'unlock' : 'lock' }) });
  if (has(v, 'climate') && v.climate) items.push({ id: 'climate', icon: v.climate.running ? (v.climate.remoteStart ? EngineSlashIcon : SnowIcon) : v.climate.remoteStart ? EngineIcon : TemperatureIcon, label: v.climate.remoteStart ? (v.climate.running ? 'Stop remote start' : 'Remote start') : v.climate.running ? 'Climate off' : 'Climate', on: v.climate.running, hue: climateMood(v).hue, run: () => act(v.id, { type: 'climate', on: !v.climate!.running }) });
  if (v.charging?.plugged && (has(v, 'charge-start') || has(v, 'charge-pause')) && v.charging.state !== 'complete')
    items.push({ id: 'charge', icon: ElectricPlugsIcon, label: v.charging.state === 'charging' ? 'Pause' : 'Charge', on: v.charging.state === 'charging', hue: HUE.power, run: () => act(v.id, { type: 'charge', on: v.charging!.state !== 'charging' }) });
  if (has(v, 'honk')) items.push({ id: 'honk', icon: Megaphone01Icon, label: 'Flash', hue: HUE.light, run: () => act(v.id, { type: 'honk' }) });
  if (has(v, 'refresh')) items.push({ id: 'refresh', icon: Refresh01Icon, label: 'Refresh', hue: HUE.water, run: () => act(v.id, { type: 'refresh' }) });
  const shown = items.filter((i) => !skip.includes(i.id));
  if (!shown.length) return null;
  if (round)
    return (
      <div role="group" aria-label={`${v.name} controls`} className="grid auto-cols-[minmax(0,76px)] grid-flow-col justify-center gap-2">
        {shown.map((i) => {
          const h = hued(life, i.hue);
          return (
            <span key={i.id} className={cn('flex min-w-0 flex-col items-center', compact ? 'gap-1' : 'gap-1.5', h.className)} style={h.style}>
              <Button isIconOnly variant={i.on ? 'primary' : 'secondary'} aria-pressed={i.on} aria-label={i.label} onPress={i.run} className={cn('min-w-0 rounded-full', compact ? 'size-11' : 'size-[52px]')}>
                <HugeiconsIcon icon={i.icon} size={compact ? 18 : 20} style={life !== 'plain' && !i.on ? { color: i.hue } : undefined} />
              </Button>
              <span aria-hidden className="w-full text-center text-[11px] leading-tight text-muted">{i.label}</span>
            </span>
          );
        })}
      </div>
    );
  return (
    <div role="group" aria-label={`${v.name} controls`} className={cn('flex flex-wrap gap-2', compact && 'gap-1.5')}>
      {shown.map((i) => {
        const h = hued(life, i.hue);
        return (
          <span key={i.id} className={cn('contents', h.className)} style={h.style}>
            <Button variant={i.on ? 'primary' : 'secondary'} aria-pressed={i.on} onPress={i.run} className={cn('gap-1.5 rounded-full', compact ? 'h-9 px-3 text-[13px]' : 'h-10 px-4')}>
              <HugeiconsIcon icon={i.icon} size={16} style={life !== 'plain' && !i.on ? { color: i.hue } : undefined} />
              {i.label}
            </Button>
          </span>
        );
      })}
    </div>
  );
}

/** A smooth line (and fill) of values, the same curve as the bklit charts. */
export function Trace({ values, height = 56, color = 'var(--accent)', label }: { values: number[]; height?: number; color?: string; label: string }) {
  if (values.length < 2) return null;
  const w = 300;
  const hi = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - (v / hi) * (height - 4)] as const);
  const line = d3Line<readonly [number, number]>().curve(curveMonotoneX)(pts) ?? '';
  const fill = d3Area<readonly [number, number]>().curve(curveMonotoneX).y0(height)(pts) ?? '';
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full overflow-visible" style={{ height }} role="img" aria-label={label}>
      <path d={fill} fill={color} opacity={0.14} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------------------------

export function ChargingBlock({ v, act, className, noRing }: VehicleProps & { className?: string }) {
  const c = v.charging;
  if (!c) return null;
  const sentence =
    c.state === 'charging'
      ? `Charging at ${c.power?.toFixed(1) ?? '—'} kW${c.readyAt ? `, ${c.target ?? 100}% by ${clock(c.readyAt)}` : ''}.`
      : c.state === 'complete'
      ? `Charged to ${v.level}%, still plugged in.`
      : c.plugged
      ? c.state === 'waiting'
        ? 'Plugged in, waiting for its charging time.'
        : 'Plugged in, not charging.'
      : 'Not plugged in.';
  return (
    <Block title="Charging" icon={ElectricPlugsIcon} aside={c.plugged ? 'Plugged in' : 'Unplugged'} className={className}>
      <div className="flex items-center gap-5">
        {noRing ? null : <ChargeRing v={v} size={112} />}
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-[15px]">{sentence}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {c.target !== null ? <Stat label="Stops at" value={`${c.target}%`} /> : null}
            {c.lastSessionKwh !== null ? <Stat label="Last session" value={`${c.lastSessionKwh.toFixed(1)} kWh`} /> : null}
          </div>
        </div>
      </div>
      {c.targets.length && has(v, 'target') ? (
        <div role="group" aria-label="Charge limit" className="flex flex-wrap gap-1.5">
          {c.targets.filter((t) => t >= 70).map((t) => (
            <Button key={t} size="sm" variant={t === c.target ? 'primary' : 'ghost'} aria-pressed={t === c.target} onPress={() => act(v.id, { type: 'target', pct: t })} className="h-8 min-w-12 rounded-full px-2.5 tabular-nums">
              {t}%
            </Button>
          ))}
        </div>
      ) : null}
    </Block>
  );
}

export function ClimateBlock({ v, act, className }: VehicleProps & { className?: string }) {
  const k = v.climate;
  if (!k) return null;
  return (
    <Block title="Climate" icon={TemperatureIcon} aside={k.running ? (k.minutesLeft !== null ? `${k.minutesLeft} min left` : 'On') : 'Off'} className={className}>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Inside" value={k.cabin !== null ? `${k.cabin}°` : '—'} />
        <Stat label="Outside" value={k.outside !== null ? `${k.outside}°` : '—'} />
        <Stat label="Set to" value={k.target !== null ? `${k.target}°` : '—'} />
      </div>
      {k.extras.length ? (
        <div role="group" aria-label="Climate extras" className="flex flex-wrap gap-1.5">
          {k.extras.map((e) => (
            <Button key={e.id} size="sm" variant={e.on ? 'primary' : 'ghost'} aria-pressed={e.on} onPress={() => act(v.id, { type: 'extra', id: e.id, on: !e.on })} className="h-8 rounded-full px-3">
              {e.label}
            </Button>
          ))}
        </div>
      ) : null}
      {has(v, 'climate') ? (
        <Button variant={k.running ? 'primary' : 'secondary'} onPress={() => act(v.id, { type: 'climate', on: !k.running })} className="h-10 gap-1.5 self-start rounded-full">
          <HugeiconsIcon icon={k.running ? SnowIcon : TemperatureIcon} size={16} />
          {k.running ? 'Turn climate off' : `Warm up to ${k.target ?? 21}°`}
        </Button>
      ) : null}
    </Block>
  );
}

export function WhereBlock({ v, home, dark, className, mapHeight = 170 }: VehicleProps & { className?: string; mapHeight?: number }) {
  const p = v.place;
  if (!p) return null;
  const where = v.motion?.moving ? 'On the move' : p.zone ? `At ${p.zone}` : 'Away';
  return (
    <Block title="Where" icon={Location01Icon} aside={p.at ? ago(p.at, home.now) : undefined} className={className}>
      <div className="overflow-hidden rounded-2xl bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]" style={{ height: mapHeight }}>
        <Suspense fallback={null}>
          <CarMap lat={p.lat} lon={p.lon} dark={dark} label={`${v.name}: ${where}`} className="h-full w-full" />
        </Suspense>
      </div>
      <div className="-mt-1 flex items-baseline justify-between gap-3">
        <p className="truncate text-[15px]">{where}</p>
        {p.address ? <p className="truncate text-sm text-muted">{p.address}</p> : null}
      </div>
      {v.motion?.speeds.some((s) => s > 0) ? (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <HugeiconsIcon icon={DashboardSpeed01Icon} size={13} />
            Speed, last 24 h
          </p>
          <Trace values={v.motion.speeds} height={44} label="Speed over the last 24 hours" />
        </div>
      ) : null}
    </Block>
  );
}

export function TripsBlock({ v, home, className }: VehicleProps & { className?: string }) {
  const t = v.lastTrip;
  if (!t && v.today === null && !v.lifetime) return null;
  return (
    <Block title={v.kind === 'bike' ? 'Rides' : 'Trips'} icon={Route01Icon} aside={t ? `last ${ago(t.endedAt, home.now)}` : undefined} className={className}>
      {t ? (
        <div className="flex flex-col gap-1">
          <p className="text-[15px]">{t.title ?? 'Last trip'}</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Distance" value={fmtDistance(t.distance, v.unit).replace(/^(\d+) /, `${t.distance.toFixed(1)} `)} />
            <Stat label="Time" value={`${t.minutes} min`} />
            {t.energyKwh !== null ? <Stat label="Energy" value={`${t.energyKwh.toFixed(1)} kWh`} /> : t.calories !== null ? <Stat label="Burned" value={`${t.calories} kcal`} /> : null}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-3 border-t border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pt-3">
        {v.today !== null ? <Stat label="Today" value={`${v.today.toFixed(1)} ${v.unit}`} /> : null}
        {v.odometer !== null ? <Stat label={v.kind === 'bike' ? 'Ridden' : 'Odometer'} value={fmtDistance(v.odometer, v.unit)} /> : null}
        {v.lifetime?.co2SavedKg != null ? <Stat label="CO₂ saved" value={`${v.lifetime.co2SavedKg} kg`} tone="good" /> : null}
      </div>
    </Block>
  );
}

export function ConditionBlock({ v, className }: VehicleProps & { className?: string }) {
  const c = v.condition;
  const low = lowTyres(c.tyres);
  const any = c.tyres || c.battery12v !== null || c.oil !== null || c.batteryHealth !== null || c.warnings.length || c.software;
  if (!any) return null;
  const tyre = (val: number | null, name: string) => (
    <div className="flex flex-col items-center rounded-xl px-2 py-1.5" style={{ background: low.includes(name) ? `color-mix(in oklab, ${TONE.warn} 16%, transparent)` : soft(5) }}>
      <span className="text-[15px] font-light tabular-nums" style={low.includes(name) ? { color: TONE.warn } : undefined}>
        {val ?? '—'}
      </span>
      <span className="text-[10px] text-muted">{name}</span>
    </div>
  );
  return (
    <Block title="Condition" icon={Wrench01Icon} aside={c.warnings.length || low.length ? `${c.warnings.length + (low.length ? 1 : 0)} to check` : 'All fine'} className={className}>
      {c.tyres ? (
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={TireIcon} size={18} className="shrink-0 text-muted" />
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {tyre(c.tyres.fl, 'front left')}
            {tyre(c.tyres.fr, 'front right')}
            {tyre(c.tyres.rl, 'rear left')}
            {tyre(c.tyres.rr, 'rear right')}
          </div>
          <span className="text-xs text-muted">{c.tyres.unit}</span>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {c.battery12v !== null ? <Stat label="12 V battery" value={`${c.battery12v.toFixed(1)} V`} tone={c.battery12v < 12.2 ? 'warn' : undefined} /> : null}
        {c.batteryHealth !== null ? <Stat label="Battery health" value={`${c.batteryHealth}%`} /> : null}
        {c.oil !== null ? <Stat label="Oil life" value={`${c.oil}%`} /> : null}
        {c.software ? <Stat label="Software" value={softwareLine(c.software, v.kind, Date.now()).value} tone={softwareLine(c.software, v.kind, Date.now()).tone === 'good' ? undefined : softwareLine(c.software, v.kind, Date.now()).tone} /> : null}
      </div>
      {c.warnings.map((w) => (
        <p key={w} className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={Alert02Icon} size={15} style={{ color: TONE.warn }} />
          {w}
        </p>
      ))}
    </Block>
  );
}

export function BikeBlock({ v, className, noRing }: VehicleProps & { className?: string }) {
  if (v.kind !== 'bike') return null;
  return (
    <Block title="Battery" icon={FlashIcon} aside={v.condition.batteryInserted === false ? 'Not in the bike' : v.mode ?? undefined} className={className}>
      <div className="flex items-center gap-5">
        {noRing ? null : <ChargeRing v={v} size={112} />}
        <div className="grid flex-1 grid-cols-2 gap-3">
          {v.condition.batteryHealth !== null ? <Stat label="Health" value={`${v.condition.batteryHealth}%`} /> : null}
          {v.lifetime?.hours != null ? <Stat label="Ridden" value={`${v.lifetime.hours} h`} /> : null}
          {v.mode ? <Stat label="Mode" value={v.mode} /> : null}
          {v.lastTrip?.co2SavedKg != null ? <Stat label="Last ride saved" value={`${v.lastTrip.co2SavedKg} kg CO₂`} tone="good" /> : null}
        </div>
      </div>
    </Block>
  );
}

/** The sections a vehicle has, in the page's order. */
export function sectionsFor(v: Vehicle) {
  return [
    { id: 'charging', title: 'Charging', icon: ElectricPlugsIcon, show: v.kind === 'car' && !!v.charging, Block: ChargingBlock },
    { id: 'battery', title: 'Battery', icon: FlashIcon, show: v.kind === 'bike', Block: BikeBlock },
    { id: 'climate', title: 'Climate', icon: TemperatureIcon, show: !!v.climate, Block: ClimateBlock },
    { id: 'where', title: 'Where', icon: Location01Icon, show: !!v.place, Block: WhereBlock },
    { id: 'trips', title: v.kind === 'bike' ? 'Rides' : 'Trips', icon: Route01Icon, show: !!(v.lastTrip || v.today !== null || v.lifetime), Block: TripsBlock },
    { id: 'condition', title: 'Condition', icon: Wrench01Icon, show: true, Block: ConditionBlock }
  ].filter((s) => s.show);
}

/** The vehicle switcher as pills: name, a dot in its readiness tone. */
export function VehiclePills({ home, current, onPick }: { home: MobilityHome; current: string; onPick: (id: string) => void }) {
  const life = useLife();
  if (home.vehicles.length < 2) return null;
  return (
    <div role="group" aria-label="Vehicles" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {home.vehicles.map((v) => {
        const r = readiness(v, home.now);
        const on = v.id === current;
        const h = hued(life, TONE[r.tone]);
        return (
          <span key={v.id} className={cn('contents', h.className)} style={h.style}>
            <Button variant={on ? 'primary' : 'secondary'} aria-pressed={on} onPress={() => onPick(v.id)} className="h-10 shrink-0 gap-2 rounded-full px-4">
              <HugeiconsIcon icon={vehicleIcon(v)} size={17} />
              {v.name}
              <span aria-hidden className={cn('size-2 rounded-full', on && life !== 'plain' && 'ring-2 ring-white/70')} style={{ background: TONE[r.tone] }} />
            </Button>
          </span>
        );
      })}
    </div>
  );
}

export type BatteryFlow = 'in' | 'out' | null;

/** Which way energy is going: in while charging, out while driving or conditioning the cabin. */
export function batteryFlow(v: Vehicle): { flow: BatteryFlow; why: string | null } {
  if (v.charging?.state === 'charging') return { flow: 'in', why: v.charging.power !== null ? `Charging at ${v.charging.power} kW` : 'Charging' };
  if (v.motion?.moving) return { flow: 'out', why: 'Driving' };
  if (v.climate?.running) return { flow: 'out', why: 'Conditioning the cabin' };
  return { flow: null, why: null };
}

/**
 * The drive battery as a pack. Its full width is the capacity when new; past `health` it is
 * hatched (lost); the charge fills the rest to `level`. While energy flows, stripes move through
 * the charge (in: towards the terminal; out: away from it) and the charge's edge breathes.
 */
export function BatteryPack({ level, health = null, flow = null, out = false, label }: { level: number; health?: number | null; flow?: BatteryFlow; out?: boolean; label?: string }) {
  // A slim segmented bar, as the car apps draw a pack: the charge filled, the capacity lost with age
  // hatched faintly at the end, a soft sheen sweeping it while energy flows in or out.
  const usable = Math.max(0, Math.min(100, health ?? 100));
  const fill = (usable * Math.max(0, Math.min(100, level))) / 100;
  const color = out ? soft(28) : level < 20 ? TONE.warn : 'var(--accent)';
  const text = label ?? `${level}%`;
  return (
    <div role="img" aria-label={`Battery ${text}${health !== null ? `, health ${health}%` : ''}${flow === 'in' ? ', charging' : flow === 'out' ? ', in use' : ''}${out ? ', not in the bike' : ''}`} className="flex w-full flex-col gap-2.5">
      <p aria-hidden className="text-[34px] font-extralight leading-none tracking-tight tabular-nums">
        {text.replace(/%$/, '')}
        {text.endsWith('%') ? <span className="ml-0.5 text-base text-muted">%</span> : null}
      </p>
      <div aria-hidden className={cn('relative h-3 w-full overflow-hidden rounded-full', out && 'outline-1 outline-dashed outline-[color-mix(in_oklab,var(--foreground)_25%,transparent)]')} style={{ background: soft(9) }}>
        {usable < 100 ? <span className="absolute inset-y-0 right-0" style={{ width: `${100 - usable}%`, background: `repeating-linear-gradient(135deg, ${soft(16)} 0 2px, transparent 2px 5px)` }} /> : null}
        <span className="absolute inset-y-0 left-0 overflow-hidden rounded-full" style={{ width: `${fill}%`, background: color }}>
          {flow && fill > 0 ? <span className={cn('pro-battery-sheen absolute inset-0', flow === 'out' && 'is-out')} style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)' }} /> : null}
        </span>
        {/* Cells. */}
        <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1.5px), var(--surface) calc(10% - 1.5px) 10%)' }} />
      </div>
    </div>
  );
}
