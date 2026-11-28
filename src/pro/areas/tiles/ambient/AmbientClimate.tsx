/**
 * Ambient (D) previews for batch 2, refined to the owner's reference (2026-11-21):
 * - Thermostat: a ring on a cold-to-warm gradient with a knob at the target (turn it), the target
 *   big in the middle with what it's doing ("Heating"), − / + under it. Small: the ring with the
 *   current temperature and "→ target". Wide: words left, a smaller ring right. X-small: one row.
 * - Blind: the window with lit slats coming down as far as it's closed, round up / down buttons.
 * - Reading: icon, name, value, and a soft line chart of the last hours along the bottom.
 */
import type { PointerEvent, ReactNode } from 'react';
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AirVentIcon, ArrowDown01Icon, ArrowUp01Icon, BlindsIcon, DropletIcon, MinusSignIcon, PlusSignIcon, StopIcon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { modeOf } from '../../../widgets/thermostat/concepts/ModeMenu';
import { arcPath, RING_START, RING_SWEEP, useRingValue } from '../../gestures';
import type { ClimateTileModel, CoverTileModel, ReadingTileModel, TileProps } from '../../tileTypes';
import { AName, AState, Glass, GlassButton, glowStyle, HUE } from './ambientKit';

const fmt = (v: number | null, unit = '°') => (v === null ? '—' : `${v.toFixed(1)}${unit}`);
const actionHue = (t: ClimateTileModel) => (!t.isOn ? HUE.idle : t.action === 'heating' || t.mode === 'heat' ? HUE.heat : t.action === 'cooling' || t.mode === 'cool' ? HUE.cool : modeOf(t.mode).hue || HUE.cool);
const actionWord = (t: ClimateTileModel) => (!t.isOn ? 'Off' : t.action ? t.action.charAt(0).toUpperCase() + t.action.slice(1) : modeOf(t.mode).label);

function Action({ t, className }: { t: ClimateTileModel; className?: string }) {
  const icon = t.action === 'heating' ? modeOf('heat').icon : t.action === 'cooling' ? modeOf('cool').icon : modeOf(t.mode).icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-medium', className)}>
      <HugeiconsIcon icon={icon} size={14} style={{ color: actionHue(t) }} />
      <span className="opacity-80">{actionWord(t)}</span>
    </span>
  );
}

/** The gauge. `center` is what sits in the middle. */
function Ring({ t, act, px, center }: { t: ClimateTileModel; act: TileProps<ClimateTileModel>['act']; px: number; center: (live: number) => ReactNode }) {
  const ring = useRingValue({ value: t.target ?? t.min, min: t.min, max: t.max, onCommit: (v) => act({ type: 'target', value: v }) });
  const live = Math.round(ring.shown / t.step) * t.step;
  const stroke = Math.max(5, Math.round(px * 0.05));
  const r = px / 2 - stroke / 2 - 7;
  const c = px / 2;
  const end = RING_START + (RING_SWEEP * (live - t.min)) / (t.max - t.min);
  const knob = [c + r * Math.cos((end * Math.PI) / 180), c + r * Math.sin((end * Math.PI) / 180)];
  const id = `ring-${t.entityId.replace(/\W/g, '')}-${px}`;
  const active = t.isOn && t.target !== null;
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg
        width={px}
        height={px}
        {...(active ? ring.props : {})}
        className={cn('absolute inset-0 overflow-visible outline-none', active && 'cursor-grab')}
        role="slider"
        tabIndex={0}
        aria-label={`${t.name} target`}
        aria-valuemin={t.min}
        aria-valuemax={t.max}
        aria-valuenow={t.target ?? undefined}
        onKeyDown={(ev) => {
          if (t.target === null) return;
          if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') act({ type: 'target', value: t.target + t.step });
          if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') act({ type: 'target', value: t.target - t.step });
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(214 90% 58%)" />
            <stop offset="0.5" stopColor="hsl(250 70% 72%)" />
            <stop offset="1" stopColor="hsl(28 95% 58%)" />
          </linearGradient>
        </defs>
        <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke={active ? `url(#${id})` : 'currentColor'} strokeOpacity={active ? 0.18 : 0.12} strokeWidth={stroke} strokeLinecap="round" />
        {active ? (
          <>
            <path d={arcPath(c, c, r, RING_START, Math.max(RING_START + 1, end))} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${stroke}px color-mix(in srgb, ${actionHue(t)} 55%, transparent))` }} />
            <circle cx={knob[0]} cy={knob[1]} r={stroke * 1.25} fill="white" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />
          </>
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center(live)}</div>
    </div>
  );
}

function ModeChip({ t, act }: { t: ClimateTileModel; act: TileProps<ClimateTileModel>['act'] }) {
  const now = modeOf(t.mode);
  return (
    <Dropdown>
      <Button size="sm" variant="ghost" data-tile-control="" aria-label={`${t.name} mode: ${now.label}. Change the mode`} className="h-8 min-w-0 gap-1.5 rounded-full bg-black/[0.05] px-3 text-[12px] font-semibold ring-1 ring-black/[0.05] dark:bg-white/10 dark:ring-white/10">
        <HugeiconsIcon icon={now.icon} size={14} style={now.hue ? { color: now.hue } : undefined} />
        {now.label}
      </Button>
      <Dropdown.Popover placement="bottom" className="min-w-40">
        <Dropdown.Menu aria-label={`${t.name} mode`} selectionMode="single" selectedKeys={new Set([t.mode])} onAction={(k) => act({ type: 'hvac', mode: String(k) })}>
          {t.modes.map((m) => (
            <Dropdown.Item key={m} id={m} textValue={modeOf(m).label}>
              <HugeiconsIcon icon={modeOf(m).icon} size={15} style={modeOf(m).hue ? { color: modeOf(m).hue! } : undefined} />
              {modeOf(m).label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

const Thermo = ({ px = 24 }: { px?: number }) => <HugeiconsIcon icon={ThermometerIcon} size={px} style={{ color: 'hsl(214 90% 66%)' }} />;

export function AmbientThermostat({ e: t, size, act }: TileProps<ClimateTileModel>) {
  const step = (d: 1 | -1) => t.target !== null && act({ type: 'target', value: t.target + d * t.step });
  const minus = <GlassButton icon={MinusSignIcon} label={`${t.name}: lower target`} onPress={() => step(-1)} isDisabled={!t.isOn} size={44} />;
  const plus = <GlassButton icon={PlusSignIcon} label={`${t.name}: raise target`} onPress={() => step(1)} isDisabled={!t.isOn} size={44} />;
  const style = t.isOn ? glowStyle(actionHue(t), 0.35, '50% 45%') : undefined;
  const target = (v: number) => (t.isOn && t.target !== null ? fmt(v, t.unit) : fmt(t.current, t.unit));
  if (size === 'xs') {
    return (
      <Glass label={t.name} style={style}>
        <div className="flex h-full items-center gap-2.5 px-3.5">
          <Thermo px={22} />
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-semibold leading-none tabular-nums">{target(t.target ?? 0)}</p>
            <Action t={t} className="mt-1 text-[12px]" />
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 's') {
    return (
      <Glass label={t.name} style={style}>
        <div className="grid h-full place-items-center">
          <Ring
            t={t}
            act={act}
            px={136}
            center={(v) => (
              <>
                <HugeiconsIcon icon={modeOf(t.mode).icon} size={18} style={{ color: actionHue(t) }} />
                <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{fmt(t.current, t.unit)}</p>
                <p className="mt-1.5 text-[13px] font-medium tabular-nums" style={{ color: actionHue(t) }}>
                  {t.isOn && t.target !== null ? `→ ${fmt(v, t.unit)}` : 'Off'}
                </p>
              </>
            )}
          />
        </div>
      </Glass>
    );
  }
  if (size === 'w') {
    return (
      <Glass label={t.name} style={style}>
        <div className="flex h-full items-center gap-3 p-4 pr-3">
          <div className="flex min-w-0 flex-1 flex-col self-stretch">
            <div className="flex items-center gap-2">
              <Thermo px={22} />
              <AName className="truncate text-[15px]">{t.name}</AName>
            </div>
            <p className="mt-auto text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{target(t.target ?? 0)}</p>
            <Action t={t} className="mt-1.5" />
          </div>
          <Ring t={t} act={act} px={118} center={() => <span className="text-[12px] opacity-60 tabular-nums">{t.current !== null ? `Now ${fmt(t.current, t.unit)}` : ''}</span>} />
        </div>
      </Glass>
    );
  }
  const px = size === 'l' ? 210 : 140;
  return (
    <Glass label={t.name} style={style}>
      <div className={cn('flex h-full flex-col items-center', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex w-full items-center gap-2">
          <Thermo px={size === 'l' ? 26 : 22} />
          <AName className={cn('truncate', size === 'l' ? 'text-[18px]' : 'text-[15px]')}>{t.name}</AName>
          {size === 'l' ? (
            <div className="ml-auto">
              <ModeChip t={t} act={act} />
            </div>
          ) : null}
        </div>
        <div className="my-auto">
          <Ring
            t={t}
            act={act}
            px={px}
            center={(v) => (
              <>
                <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', size === 'l' ? 'text-[46px]' : 'text-[32px]')}>{target(v)}</p>
                <Action t={t} className="mt-2" />
              </>
            )}
          />
        </div>
        <div className={cn('flex w-full items-center', size === 'l' ? 'justify-center gap-16' : 'justify-between')}>
          {minus}
          {size === 't' ? <ModeChip t={t} act={act} /> : null}
          {plus}
        </div>
      </div>
    </Glass>
  );
}

function Window({ e, act, className }: { e: CoverTileModel; act: TileProps<CoverTileModel>['act']; className?: string }) {
  const pos = e.position ?? (e.isOn ? 100 : 0);
  const onPointer = (ev: PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    act({ type: 'position', pct: Math.round(Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / r.height)) * 20) * 5 });
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`${e.name} position. Tap the window to set it`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pos}
      onPointerUp={onPointer}
      onKeyDown={(ev) => {
        if (ev.key === 'ArrowUp') act({ type: 'position', pct: Math.min(100, pos + 10) });
        if (ev.key === 'ArrowDown') act({ type: 'position', pct: Math.max(0, pos - 10) });
      }}
      className={cn(
        'relative h-full cursor-pointer overflow-hidden rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
        'bg-[radial-gradient(60%_50%_at_30%_100%,hsl(140_25%_40%),transparent),linear-gradient(180deg,hsl(205_70%_80%),hsl(35_70%_86%))]',
        'dark:bg-[radial-gradient(4px_4px_at_30%_70%,hsl(35_100%_65%),transparent),radial-gradient(3px_3px_at_70%_80%,hsl(35_100%_65%),transparent),radial-gradient(70%_45%_at_40%_100%,hsl(140_25%_14%),transparent),linear-gradient(180deg,hsl(220_45%_10%),hsl(200_25%_14%))]',
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 transition-[height] duration-500 ease-out"
        style={{
          height: `${Math.max(10, 100 - pos)}%`,
          background: 'repeating-linear-gradient(180deg, hsl(32 30% 82%) 0 8px, hsl(28 25% 52%) 8px 9px, hsl(30 28% 70%) 9px 12px)',
          boxShadow: '0 6px 12px -4px rgba(0,0,0,0.45)'
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,190,120,0.18),transparent_60%)] dark:bg-[linear-gradient(90deg,rgba(255,170,90,0.25),transparent_60%)]" />
    </div>
  );
}

export function AmbientCover({ e, size, act }: TileProps<CoverTileModel>) {
  const pos = e.position ?? (e.isOn ? 100 : 0);
  const state = pos >= 100 ? 'Open' : pos <= 0 ? 'Closed' : `Open · ${pos}%`;
  const btn = size === 'xs' ? 28 : 42;
  const up = <GlassButton icon={ArrowUp01Icon} label={`${e.name}: open`} onPress={() => act({ type: 'cover', cmd: 'open' })} size={btn} />;
  const down = <GlassButton icon={ArrowDown01Icon} label={`${e.name}: close`} onPress={() => act({ type: 'cover', cmd: 'close' })} size={btn} />;
  const stop = <GlassButton icon={StopIcon} label={`${e.name}: stop`} onPress={() => act({ type: 'cover', cmd: 'stop' })} size={btn} />;
  const icon = (px: number) => <HugeiconsIcon icon={BlindsIcon} size={px} className="shrink-0 opacity-85" />;
  if (size === 'xs') {
    return (
      <Glass label={e.name}>
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight">{e.name}</p>
            <p className="mt-0.5 truncate text-[12px] opacity-65 tabular-nums">{state}</p>
          </div>
          <div className="flex flex-col gap-1">
            {up}
            {down}
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 's' || size === 'w') {
    return (
      <Glass label={e.name}>
        <div className="flex h-full items-stretch gap-3 p-4 pr-3">
          <div className="flex min-w-0 flex-1 flex-col">
            {icon(30)}
            <div className="mt-auto min-w-0">
              <AName>{e.name}</AName>
              <AState>{state}</AState>
            </div>
          </div>
          {size === 'w' ? <Window e={e} act={act} className="w-[118px] shrink-0" /> : null}
          <div className="flex flex-col justify-center gap-2.5">
            {up}
            {down}
          </div>
        </div>
      </Glass>
    );
  }
  return (
    <Glass label={e.name}>
      <div className={cn('flex h-full flex-col gap-3', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start gap-2.5">
          {icon(28)}
          <div className="min-w-0">
            <AName className={size === 'l' ? 'text-[18px]' : undefined}>{e.name}</AName>
            <AState>{state}</AState>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 gap-3">
          <Window e={e} act={act} className="w-full" />
          {size === 'l' ? (
            <div className="flex flex-col justify-center gap-2.5">
              {up}
              {stop}
              {down}
            </div>
          ) : null}
        </div>
        {size === 't' ? (
          <div className="flex justify-between">
            {up}
            {stop}
            {down}
          </div>
        ) : null}
      </div>
    </Glass>
  );
}

const READING_ICON: Record<string, typeof DropletIcon> = { humidity: DropletIcon, temperature: ThermometerIcon };
/** Reference colours: temperature blue, humidity violet, CO₂ green until it's high. */
const readingHue = (r: ReadingTileModel) => (r.deviceClass === 'humidity' ? 'hsl(268 75% 68%)' : r.deviceClass === 'temperature' ? 'hsl(208 90% 62%)' : (r.value ?? 0) > 1000 ? HUE.heat : HUE.power);

/** Smooth line of the last hours (Catmull-Rom → Bézier) in a 100 × 100 box; `area` closes it. */
function curve(values: number[], area: boolean): string {
  if (values.length < 2) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 90 - ((v - lo) / (hi - lo || 1)) * 75] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return area ? `${d} L 100 100 L 0 100 Z` : d;
}

function Trend({ e, className }: { e: ReadingTileModel; className?: string }) {
  const hue = readingHue(e);
  const id = `rd-${e.entityId.replace(/\W/g, '')}`;
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('pointer-events-none overflow-visible', className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue} stopOpacity={0.35} />
          <stop offset="1" stopColor={hue} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={curve(e.history, true)} fill={`url(#${id})`} />
      <path d={curve(e.history, false)} fill="none" stroke={hue} strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${hue})` }} />
    </svg>
  );
}

export function AmbientReading({ e, size }: TileProps<ReadingTileModel>) {
  const hue = readingHue(e);
  const value = e.value === null ? '—' : `${e.unit === '°' || e.value % 1 ? e.value.toFixed(1) : e.value}${e.unit === '%' ? '%' : e.unit === '°' ? '°C' : ` ${e.unit}`}`;
  const icon = (px: number) => <HugeiconsIcon icon={READING_ICON[e.deviceClass] ?? AirVentIcon} size={px} className="shrink-0" style={{ color: hue }} />;
  const lo = Math.min(...e.history);
  const hi = Math.max(...e.history);
  if (size === 'xs') {
    return (
      <Glass label={`${e.name}: ${value}`}>
        <div className="flex h-full items-center gap-2 px-3.5">
          {icon(20)}
          <p className="text-[17px] font-semibold tabular-nums">{value}</p>
          <Trend e={e} className="ml-auto h-8 w-[42%]" />
        </div>
      </Glass>
    );
  }
  return (
    <Glass label={e.name}>
      <Trend e={e} className={cn('absolute bottom-3 right-0', size === 'w' ? 'h-[55%] w-[58%]' : size === 's' ? 'h-[32%] w-full' : 'h-[38%] w-full')} />
      <div className={cn('relative flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        {icon(size === 'l' ? 30 : 26)}
        <div className={size === 's' || size === 'w' ? 'mt-2' : 'mt-4'}>
          <AName className="text-[15px]">{e.name}</AName>
          <p className={cn('mt-1 font-semibold leading-none tracking-[-0.02em] tabular-nums', size === 's' || size === 'w' ? 'text-[26px]' : 'text-[44px]')}>{value}</p>
          {size === 't' || size === 'l' ? <AState>{`Last 6 h · ${lo.toFixed(e.unit === 'ppm' ? 0 : 1)}–${hi.toFixed(e.unit === 'ppm' ? 0 : 1)}`}</AState> : null}
        </div>
      </div>
    </Glass>
  );
}
