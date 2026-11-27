/**
 * Mobility round 3: Charging and Climate inside B (docs/pro-ui/MOBILITY.md §0). The hero already
 * carries the charge and the answer, so these cards are about doing: setting the charge limit,
 * starting or pausing a charge, warming the car and its extras. Three ways: tidy cards, dials, or
 * one "Before you leave" card. Each only shows what the vehicle's integration offers.
 */
import { useState, type ReactNode } from 'react';
import { Button, Slider } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { EngineIcon, EngineSlashIcon, HeaterIcon, ElectricPlugsIcon, MinusSignIcon, PlusSignIcon, SeatSelectorIcon, SnowIcon, SteeringIcon, TemperatureIcon, WindPowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { clock, has, type Vehicle } from '../../../lib/mobilityHome';
import { BatteryPack, batteryFlow, Block, chargeMood, climateMood, soft, Stat, TONE, type VehicleProps } from './parts';

type Props = VehicleProps & { className?: string };

// ---------------------------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------------------------

/** Short words that fit four toggles across a phone (the full label is the button's name). */
const SHORT: Record<string, string> = { windscreen: 'Front', rear: 'Rear', wheel: 'Wheel', 'seat-driver': 'Seat', 'seat-passenger': 'Passenger' };
const EXTRA_ICON: Record<string, IconSvgElement> = { windscreen: WindPowerIcon, rear: HeaterIcon, wheel: SteeringIcon, 'seat-driver': SeatSelectorIcon, 'seat-passenger': SeatSelectorIcon };

/** What charging is doing, in one sentence. */
export function chargeSentence(v: Vehicle): string {
  const c = v.charging;
  if (!c) return '';
  if (c.state === 'charging') return `Charging at ${c.power?.toFixed(1) ?? '—'} kW${c.readyAt ? `, ${c.target ?? 100}% by ${clock(c.readyAt)}` : ''}.`;
  if (c.state === 'complete') return `Charged to ${v.level}%, still plugged in.`;
  if (c.plugged) return c.state === 'waiting' ? 'Plugged in, waiting for its charging time.' : 'Plugged in, not charging.';
  return 'Not plugged in.';
}

/** The charge limit on a slider, snapping to the values the car accepts. */
function LimitSlider({ v, act }: Pick<Props, 'v' | 'act'>) {
  const c = v.charging;
  const [drag, setDrag] = useState<number | null>(null);
  if (!c || c.target === null || !c.targets.length || !has(v, 'target')) return null;
  const min = c.targets[0];
  const max = c.targets[c.targets.length - 1];
  const snap = (n: number) => c.targets.reduce((best, t) => (Math.abs(t - n) < Math.abs(best - n) ? t : best), c.targets[0]);
  const shown = drag ?? c.target;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Charge limit</span>
        <span className="tabular-nums">{shown}%</span>
      </div>
      <Slider
        aria-label="Charge limit"
        minValue={min}
        maxValue={max}
        step={5}
        value={shown}
        onChange={(x) => setDrag(snap(Array.isArray(x) ? x[0] : x))}
        onChangeEnd={(x) => {
          setDrag(null);
          act(v.id, { type: 'target', pct: snap(Array.isArray(x) ? x[0] : x) });
        }}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <div className="flex justify-between text-[11px] text-muted tabular-nums">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

function ChargeButton({ v, act, className }: Pick<Props, 'v' | 'act'> & { className?: string }) {
  const c = v.charging;
  if (!c?.plugged || c.state === 'complete' || !(has(v, 'charge-start') || has(v, 'charge-pause'))) return null;
  const on = c.state === 'charging';
  return (
    <Button variant={on ? 'secondary' : 'primary'} onPress={() => act(v.id, { type: 'charge', on: !on })} className={cn('h-10 gap-1.5 rounded-full', className)}>
      <HugeiconsIcon icon={ElectricPlugsIcon} size={16} />
      {on ? 'Pause charging' : 'Start charging'}
    </Button>
  );
}

/** − 21° + : the temperature the climate warms or cools to. */
function TempStepper({ v, act, big }: Pick<Props, 'v' | 'act'> & { big?: boolean }) {
  const k = v.climate;
  if (!k || k.target === null) return null;
  const can = has(v, 'climate');
  const step = (d: number) => act(v.id, { type: 'temp', value: Math.min(28, Math.max(16, (k.target ?? 21) + d)) });
  return (
    <div className="flex items-center gap-3">
      {can ? (
        <Button isIconOnly variant="secondary" aria-label="Cooler" onPress={() => step(-0.5)} className="size-10 min-w-0 rounded-full">
          <HugeiconsIcon icon={MinusSignIcon} size={16} className="[.pro-mob-hued_&]:text-[var(--hue)]" />
        </Button>
      ) : null}
      <span className={cn('min-w-16 text-center font-light tabular-nums tracking-tight', big ? 'text-[40px] leading-none' : 'text-[28px] leading-none')} aria-label={`Set to ${k.target}°`}>
        {k.target}°
      </span>
      {can ? (
        <Button isIconOnly variant="secondary" aria-label="Warmer" onPress={() => step(0.5)} className="size-10 min-w-0 rounded-full">
          <HugeiconsIcon icon={PlusSignIcon} size={16} className="[.pro-mob-hued_&]:text-[var(--hue)]" />
        </Button>
      ) : null}
    </div>
  );
}

/** The climate extras as icon toggles with a word under each. */
function ExtraToggles({ v, act }: Pick<Props, 'v' | 'act'>) {
  const k = v.climate;
  if (!k?.extras.length) return null;
  return (
    <div role="group" aria-label="Climate extras" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${k.extras.length}, minmax(0, 1fr))` }}>
      {k.extras.map((e) => (
        <Button
          key={e.id}
          variant="ghost"
          aria-pressed={e.on}
          aria-label={e.label}
          onPress={() => act(v.id, { type: 'extra', id: e.id, on: !e.on })}
          className={cn('h-auto w-full min-w-0 flex-col gap-1 rounded-2xl px-1 py-2.5', e.on ? 'pro-mob-on bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] [.pro-mob-hued_&]:bg-[var(--default)]')}
        >
          <HugeiconsIcon icon={EXTRA_ICON[e.id] ?? TemperatureIcon} size={18} className={e.on ? undefined : '[.pro-mob-hued_&]:text-[var(--hue)]'} />
          <span className="w-full truncate text-[11px] font-normal">{SHORT[e.id] ?? e.label}</span>
        </Button>
      ))}
    </div>
  );
}

function ClimateButton({ v, act, className }: Pick<Props, 'v' | 'act'> & { className?: string }) {
  const k = v.climate;
  if (!k || !has(v, 'climate')) return null;
  // FordPass warms the cabin by starting the car remotely: the button says that, and what it will do.
  const label = k.remoteStart ? (k.running ? 'Stop remote start' : 'Remote start') : k.running ? 'Turn off' : `Warm up to ${k.target ?? 21}°`;
  const icon = k.remoteStart ? (k.running ? EngineSlashIcon : EngineIcon) : k.running ? SnowIcon : TemperatureIcon;
  const hint = k.remoteStart && !k.running ? (k.target !== null ? `Starts the car and warms the cabin to ${k.target}°.` : 'Starts the car and its climate.') : null;
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <Button variant={k.running ? 'secondary' : 'primary'} onPress={() => act(v.id, { type: 'climate', on: !k.running })} className="h-10 gap-1.5 rounded-full">
        <HugeiconsIcon icon={icon} size={16} />
        {label}
      </Button>
      {hint ? <span className="text-[13px] text-muted">{hint}</span> : null}
    </div>
  );
}

const climateAside = (v: Vehicle) => {
  const k = v.climate;
  if (!k?.running) return 'Off';
  const on = k.remoteStart ? 'Running' : 'On';
  return k.minutesLeft ? `${on} · ${k.minutesLeft} min left` : on;
};

// ---------------------------------------------------------------------------------------------
// 1 · Tidy cards
// ---------------------------------------------------------------------------------------------

/** 1 · Charging: what it is doing in one sentence, the limit on a slider, one button. */
export function ChargingTidy({ v, act, className }: Props) {
  const c = v.charging;
  if (!c) return null;
  return (
    <Block title="Charging" icon={ElectricPlugsIcon} aside={c.plugged ? 'Plugged in' : 'Unplugged'} className={className} mood={chargeMood(v)}>
      <DriveBattery v={v} />
      <p className="text-[15px]">{chargeSentence(v)}</p>
      <LimitSlider v={v} act={act} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {c.lastSessionKwh !== null ? <Stat label="Last session" value={`${c.lastSessionKwh.toFixed(1)} kWh`} /> : <span />}
        <ChargeButton v={v} act={act} />
      </div>
    </Block>
  );
}

/** The car's drive battery (not the 12 V one), moved here from Condition (owner, 2026-11-27): the pack at its charge with lost capacity hatched, flowing while it charges, drives or conditions; energy, health and temperature under it. */
export function DriveBattery({ v }: { v: Vehicle }) {
  if (v.level === null || v.powertrain === 'ice') return null;
  const k = v.condition;
  const { flow, why } = batteryFlow(v);
  const facts = [
    flow === 'out' ? why : null,
    k.batteryKwh !== null ? `${Math.round((v.level * k.batteryKwh) / 100)} of ${k.batteryKwh} kWh` : null,
    k.batteryHealth !== null ? `health ${k.batteryHealth}%` : null,
    k.batteryTemp !== null ? `${k.batteryTemp} °C` : null
  ].filter(Boolean);
  return (
    <div className="flex flex-col gap-1.5">
      <BatteryPack level={v.level} health={k.batteryHealth} flow={flow} />
      {facts.length ? <p className="text-xs text-muted">{facts.join(' · ')}</p> : null}
    </div>
  );
}

/** 1 · Climate: inside and outside, the set temperature with − and +, the extras as icon toggles, one button. */
export function ClimateTidy({ v, act, className }: Props) {
  const k = v.climate;
  if (!k) return null;
  return (
    <Block title="Climate" icon={TemperatureIcon} aside={climateAside(v)} className={className} mood={climateMood(v)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-5">
          <Stat label="Inside" value={k.cabin !== null ? `${k.cabin}°` : '—'} />
          <Stat label="Outside" value={k.outside !== null ? `${k.outside}°` : '—'} />
        </div>
        <TempStepper v={v} act={act} />
      </div>
      <ExtraToggles v={v} act={act} />
      <ClimateButton v={v} act={act} className="self-start" />
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 2 · Dials
// ---------------------------------------------------------------------------------------------

/** A half dial: an arc filled to `value` on `min…max`, with an optional marker. */
function HalfDial({ value, min, max, marker, color, children, size = 200 }: { value: number; min: number; max: number; marker?: number | null; color: string; children: ReactNode; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const h = size / 2 + stroke;
  const f = (n: number) => Math.max(0, Math.min(1, (n - min) / (max - min)));
  const at = (t: number) => {
    const a = Math.PI * (1 - t);
    return [size / 2 + r * Math.cos(a), size / 2 - r * Math.sin(a)] as const;
  };
  const arc = (t: number) => {
    const [x, y] = at(t);
    return `M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${x} ${y}`;
  };
  const m = marker != null ? at(f(marker)) : null;
  return (
    <div className="relative mx-auto" style={{ width: size, height: h }}>
      <svg viewBox={`0 0 ${size} ${h}`} style={{ width: size, height: h }} aria-hidden>
        <path d={arc(1)} fill="none" stroke={soft(10)} strokeWidth={stroke} strokeLinecap="round" />
        {f(value) > 0 ? <path d={arc(f(value))} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" /> : null}
        {m ? <circle cx={m[0]} cy={m[1]} r={stroke / 2 + 2} fill="var(--surface)" stroke="var(--foreground)" strokeWidth={2} /> : null}
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">{children}</div>
    </div>
  );
}

/** 2 · Charging: a half dial of the charge with the limit as a dot, kW and time in the middle; limit chips and the button under. */
export function ChargingDial({ v, act, className }: Props) {
  const c = v.charging;
  if (!c) return null;
  const charging = c.state === 'charging';
  return (
    <Block title="Charging" icon={ElectricPlugsIcon} aside={c.plugged ? 'Plugged in' : 'Unplugged'} className={className}>
      <HalfDial value={v.level ?? 0} min={0} max={100} marker={c.target} color={(v.level ?? 0) < 20 ? TONE.warn : 'var(--accent)'}>
        <span className="text-[30px] font-light leading-none tabular-nums">{charging ? `${c.power?.toFixed(1) ?? '—'} kW` : `${v.level ?? '—'}%`}</span>
        <span className="mt-1 text-xs text-muted">{charging && c.readyAt ? `${c.target}% by ${clock(c.readyAt)}` : c.target !== null ? `limit ${c.target}%` : c.plugged ? 'plugged in' : 'not plugged in'}</span>
      </HalfDial>
      {c.targets.length && has(v, 'target') ? (
        <div role="group" aria-label="Charge limit" className="flex justify-center gap-1.5">
          {[80, 90, 100].filter((t) => c.targets.includes(t)).map((t) => (
            <Button key={t} size="sm" variant={t === c.target ? 'primary' : 'secondary'} aria-pressed={t === c.target} onPress={() => act(v.id, { type: 'target', pct: t })} className="h-8 min-w-14 rounded-full tabular-nums">
              {t}%
            </Button>
          ))}
        </div>
      ) : null}
      <ChargeButton v={v} act={act} className="self-center" />
    </Block>
  );
}

/** 2 · Climate: a thermostat-style half dial, inside temperature moving to the set one, − and + either side, extras under. */
export function ClimateDial({ v, act, className }: Props) {
  const k = v.climate;
  if (!k) return null;
  const can = has(v, 'climate') && k.target !== null;
  const step = (d: number) => act(v.id, { type: 'temp', value: Math.min(28, Math.max(16, (k.target ?? 21) + d)) });
  return (
    <Block title="Climate" icon={TemperatureIcon} aside={climateAside(v)} className={className}>
      <div className="flex items-center justify-center gap-2">
        {can ? (
          <Button isIconOnly variant="secondary" aria-label="Cooler" onPress={() => step(-0.5)} className="size-10 min-w-0 shrink-0 rounded-full">
            <HugeiconsIcon icon={MinusSignIcon} size={16} className="[.pro-mob-hued_&]:text-[var(--hue)]" />
          </Button>
        ) : null}
        <HalfDial value={k.cabin ?? 16} min={0} max={30} marker={k.target} color={k.running ? 'hsl(16 85% 56%)' : soft(28)} size={180}>
          <span className="text-[34px] font-light leading-none tabular-nums">{k.target !== null ? `${k.target}°` : '—'}</span>
          <span className="mt-1 text-xs text-muted">{k.cabin !== null ? `${k.cabin}° inside · ${k.outside ?? '—'}° out` : ''}</span>
        </HalfDial>
        {can ? (
          <Button isIconOnly variant="secondary" aria-label="Warmer" onPress={() => step(0.5)} className="size-10 min-w-0 shrink-0 rounded-full">
            <HugeiconsIcon icon={PlusSignIcon} size={16} className="[.pro-mob-hued_&]:text-[var(--hue)]" />
          </Button>
        ) : null}
      </div>
      <ExtraToggles v={v} act={act} />
      <ClimateButton v={v} act={act} className="self-center" />
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 3 · Before you leave
// ---------------------------------------------------------------------------------------------

/**
 * 3 · Before you leave: one card for both, as they answer the same question. A line on top says
 * how the car will be when you go ("90% by 07:10, cabin warming to 21°"); charge on one side, cabin
 * on the other (stacked on phones), each with its one control; the buttons share the bottom row.
 */
export function BeforeYouLeave({ v, act, width, className }: Props) {
  const c = v.charging;
  const k = v.climate;
  if (!c && !k) return null;
  const phone = width < 640;
  const charging = c?.state === 'charging';
  const line = [
    c ? (charging && c.readyAt ? `${c.target ?? 100}% by ${clock(c.readyAt)}` : `${v.level ?? '—'}%${c.plugged ? (c.state === 'complete' ? ', charged' : ', plugged in') : ''}`) : null,
    k ? (k.running ? `cabin warming to ${k.target}°` : k.cabin !== null ? `cabin ${k.cabin}°` : null) : null
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <Block title="Before you leave" icon={TemperatureIcon} className={className}>
      <p className="-mt-1 text-[15px]">{line.charAt(0).toUpperCase() + line.slice(1)}.</p>
      <div className={cn('grid gap-5', phone ? 'grid-cols-1' : 'grid-cols-2')}>
        {c ? (
          <div className="flex min-w-0 flex-col gap-3">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <HugeiconsIcon icon={ElectricPlugsIcon} size={15} />
              Charge · {charging ? `${c.power?.toFixed(1) ?? '—'} kW` : c.plugged ? 'plugged in' : 'unplugged'}
            </p>
            <LimitSlider v={v} act={act} />
          </div>
        ) : null}
        {k ? (
          <div className={cn('flex min-w-0 flex-col gap-3', !phone && c && 'border-l border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pl-5')}>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <HugeiconsIcon icon={TemperatureIcon} size={15} />
              Cabin · {k.cabin !== null ? `${k.cabin}° inside` : ''}{k.outside !== null ? `, ${k.outside}° out` : ''}
            </p>
            <div className="flex items-center justify-between gap-3">
              <TempStepper v={v} act={act} />
            </div>
            <ExtraToggles v={v} act={act} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pt-4">
        <ChargeButton v={v} act={act} />
        <ClimateButton v={v} act={act} />
      </div>
    </Block>
  );
}
