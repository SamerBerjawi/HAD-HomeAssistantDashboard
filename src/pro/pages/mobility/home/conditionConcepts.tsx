/**
 * Mobility round 5: Condition and the bike's Battery inside B (docs/pro-ui/MOBILITY.md §0). What
 * the vehicle reports about its health: tyres, 12 V battery, oil, traction battery health,
 * software or firmware, the make's warnings and, for the bike, whether the battery is in. Three
 * ways: tidy cards, a top view of the car, or one health checklist (the bike's Battery folds in).
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  BatteryFullIcon,
  CheckmarkCircle02Icon,
  DashboardSpeed01Icon,
  FlashIcon,
  InformationCircleIcon,
  Leaf01Icon,
  OilBarrelIcon,
  SoftwareIcon,
  TireIcon,
  Wrench01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { fmtDistance, lowTyres, softwareLine, type Tone, type Tyres, type Vehicle } from '../../../lib/mobilityHome';
import { BatteryPack, batteryFlow, Block, chargeMood, conditionMood, soft, Stat, TONE, type VehicleProps } from './parts';

type Props = VehicleProps & { className?: string };

// ---------------------------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------------------------

export interface HealthItem {
  id: string;
  icon: IconSvgElement;
  label: string;
  value: string;
  tone: Tone;
}

const LOW_12V = 12.2;
const TYRE_NAMES: [keyof Omit<Tyres, 'unit' | 'low'>, string][] = [['fl', 'front left'], ['fr', 'front right'], ['rl', 'rear left'], ['rr', 'rear right']];
const RANK: Record<Tone, number> = { bad: 0, warn: 1, info: 2, good: 3 };
const hairline = 'border-[color-mix(in_oklab,var(--foreground)_10%,transparent)]';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Everything the vehicle reports about its health, worst first. `battery`: include the bike's
 * battery (in or out, ride mode), for the checklist that replaces the Battery card.
 */
export function healthItems(v: Vehicle, { battery = false, now = Date.now() }: { battery?: boolean; now?: number } = {}): HealthItem[] {
  const c = v.condition;
  const out: HealthItem[] = c.warnings.map((w, i) => ({ id: `warning-${i}`, icon: Alert02Icon, label: w, value: '', tone: 'warn' }));
  if (c.tyres) {
    const low = lowTyres(c.tyres);
    const vals = TYRE_NAMES.map(([k]) => c.tyres?.[k]).map((x) => (x == null ? '—' : String(x)));
    out.push({
      id: 'tyres',
      icon: TireIcon,
      label: 'Tyres',
      value: low.length ? `${cap(low.join(', '))} low` : `${vals.join(' · ')} ${c.tyres.unit}`,
      tone: low.length ? 'warn' : 'good'
    });
  }
  if (c.battery12v !== null) out.push({ id: '12v', icon: FlashIcon, label: '12 V battery', value: `${c.battery12v.toFixed(1)} V${c.battery12v < LOW_12V ? ', low' : ''}`, tone: c.battery12v < LOW_12V ? 'warn' : 'good' });
  if (battery && v.kind === 'bike' && c.batteryInserted !== null) out.push({ id: 'inserted', icon: BatteryFullIcon, label: 'Battery', value: c.batteryInserted ? 'In the bike' : 'Not in the bike', tone: c.batteryInserted ? 'good' : 'info' });
  if (c.batteryHealth !== null) out.push({ id: 'health', icon: BatteryFullIcon, label: 'Battery health', value: `${c.batteryHealth}%`, tone: c.batteryHealth < 80 ? 'warn' : 'good' });
  if (c.oil !== null) out.push({ id: 'oil', icon: OilBarrelIcon, label: 'Oil life', value: `${c.oil}%`, tone: c.oil < 20 ? 'warn' : 'good' });
  if (c.software) {
    const line = softwareLine(c.software, v.kind, now);
    out.push({ id: 'software', icon: SoftwareIcon, label: v.kind === 'bike' ? 'Firmware' : 'Software', value: line.value, tone: line.tone });
  }
  if (battery && v.kind === 'bike' && v.mode) out.push({ id: 'mode', icon: DashboardSpeed01Icon, label: 'Ride mode', value: v.mode, tone: 'good' });
  return out.sort((a, b) => RANK[a.tone] - RANK[b.tone]);
}

const problems = (items: HealthItem[]) => items.filter((i) => i.tone === 'warn' || i.tone === 'bad').length;

/** The card's aside: "All fine" or how many need a look. */
function verdict(items: HealthItem[]) {
  const n = problems(items);
  return n ? `${n} to check` : 'All fine';
}

const toneTint = (t: Tone) => (t === 'warn' || t === 'bad' ? `color-mix(in oklab, ${TONE[t]} 14%, transparent)` : undefined);

/** A warning the make reports, on a tinted row. */
function WarningRow({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm" style={{ background: toneTint('warn') }}>
      <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0" style={{ color: TONE.warn }} />
      {text}
    </p>
  );
}

/** A bar of the traction battery's health (share of its new capacity). */
function HealthBar({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">Battery health</span>
        <span className="text-[15px] tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: soft(10) }} role="img" aria-label={`Battery health ${pct}%`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct < 80 ? TONE.warn : 'var(--accent)' }} />
      </div>
      <span className="text-xs text-muted">of what it held when new</span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 1 · Tidy cards
// ---------------------------------------------------------------------------------------------

function TyreCell({ t, k, name }: { t: Tyres; k: keyof Omit<Tyres, 'unit' | 'low'>; name: string }) {
  const val = t[k];
  const low = val !== null && val < t.low;
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-2xl px-3 py-2" style={{ background: low ? toneTint('warn') : soft(5) }}>
      <span className="truncate text-xs text-muted">{cap(name)}</span>
      <span className="text-[15px] font-light tabular-nums" style={low ? { color: TONE.warn } : undefined}>
        {val ?? '—'}
      </span>
    </div>
  );
}

/** 1 · Condition: warnings on top, the tyres laid out like the car, the other readings in two columns. The bike's battery health stays on its Battery card. */
export function ConditionTidy({ v, home, className }: Props) {
  const c = v.condition;
  const items = healthItems(v, { now: home.now }).filter((i) => !(v.kind === 'bike' && i.id === 'health'));
  if (!items.length) return null;
  const rest = items.filter((i) => !i.id.startsWith('warning') && i.id !== 'tyres');
  return (
    <Block title="Condition" icon={Wrench01Icon} aside={verdict(items)} className={className} mood={conditionMood(problems(items))}>
      {c.warnings.map((w) => (
        <WarningRow key={w} text={w} />
      ))}
      {c.tyres ? (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center justify-between text-sm text-muted">
            <span>Tyres</span>
            <span className="text-xs">{c.tyres.unit}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TYRE_NAMES.map(([k, name]) => (
              <TyreCell key={k} t={c.tyres as Tyres} k={k} name={name} />
            ))}
          </div>
        </div>
      ) : null}
      {rest.length ? (
        <div className="grid grid-cols-2 gap-3">
          {rest.map((i) => (
            <Stat key={i.id} label={i.label} value={i.value} tone={i.tone === 'good' ? undefined : i.tone} />
          ))}
        </div>
      ) : null}
    </Block>
  );
}

/** 1 · Battery (bike): in or out in one sentence, the health as a bar, time ridden and CO₂ saved. */
export function BatteryTidy({ v, className }: Props) {
  if (v.kind !== 'bike') return null;
  const c = v.condition;
  const sentence = c.batteryInserted === false ? 'Not in the bike. Put it back before you ride.' : `In the bike${v.mode ? `, ${v.mode} mode` : ''}.`;
  return (
    <Block title="Battery" icon={BatteryFullIcon} aside={c.batteryInserted === false ? 'Out' : undefined} className={className} mood={chargeMood(v)}>
      <p className="text-[15px]">{sentence}</p>
      {c.batteryHealth !== null ? <HealthBar pct={c.batteryHealth} /> : null}
      <div className={cn('grid grid-cols-2 gap-3 border-t pt-3', hairline)}>
        {v.lifetime?.hours != null ? <Stat label="Ridden" value={`${v.lifetime.hours} h`} /> : null}
        {v.lifetime?.co2SavedKg != null ? <Stat label="CO₂ saved" value={`${v.lifetime.co2SavedKg} kg`} tone="good" /> : null}
      </div>
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 2 · Top view
// ---------------------------------------------------------------------------------------------

/** The car from above: four wheels, each lit amber when its tyre is low. */
function CarTop({ t }: { t: Tyres }) {
  const low = new Set(lowTyres(t));
  const wheel = (x: number, y: number, name: string) => <rect key={name} x={x} y={y} width={11} height={30} rx={4} fill={low.has(name) ? TONE.warn : soft(55)} />;
  return (
    <svg viewBox="0 0 96 168" className="h-[148px] w-auto shrink-0" aria-hidden>
      {wheel(6, 30, 'front left')}
      {wheel(79, 30, 'front right')}
      {wheel(6, 118, 'rear left')}
      {wheel(79, 118, 'rear right')}
      <rect x={14} y={6} width={68} height={156} rx={26} fill={soft(8)} stroke={soft(30)} strokeWidth={1.5} />
      <path d="M24 52 Q48 40 72 52 L68 70 Q48 64 28 70 Z" fill={soft(22)} />
      <path d="M28 120 Q48 126 68 120 L71 134 Q48 142 25 134 Z" fill={soft(22)} />
      <rect x={30} y={76} width={36} height={38} rx={8} fill={soft(12)} />
    </svg>
  );
}

function TyreLabel({ t, k, name, align }: { t: Tyres; k: keyof Omit<Tyres, 'unit' | 'low'>; name: string; align: 'left' | 'right' }) {
  const val = t[k];
  const low = val !== null && val < t.low;
  return (
    <div className={cn('flex flex-col', align === 'right' ? 'items-end text-right' : 'items-start')}>
      <span className="text-[22px] font-light leading-none tabular-nums tracking-tight" style={low ? { color: TONE.warn } : undefined}>
        {val ?? '—'}
      </span>
      <span className="mt-1 text-xs text-muted">
        {cap(name)}
        {low ? ', low' : ''}
      </span>
    </div>
  );
}

/** A reading as a soft pill: its icon in its tone, the label and the value. */
function ReadingPill({ i }: { i: HealthItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2" style={{ background: toneTint(i.tone) ?? soft(5) }}>
      <HugeiconsIcon icon={i.icon} size={16} className="shrink-0" style={{ color: i.tone === 'good' ? undefined : TONE[i.tone] }} />
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{i.label}</span>
      <span className="shrink-0 text-sm tabular-nums">{i.value}</span>
    </div>
  );
}

/** 2 · Condition (owner's pick, 2026-11-27): the car from above with a pressure by each wheel, the other readings as pills under it. The drive battery is on the Charging card (owner, 2026-11-27). */
export function ConditionTop({ v, home, className }: Props) {
  const c = v.condition;
  const items = healthItems(v, { now: home.now }).filter((i) => !(v.kind === 'bike' && i.id === 'health'));
  if (!items.length) return null;
  const onCharging = v.kind === 'car' && !!v.charging;
  const pills = items.filter((i) => !i.id.startsWith('warning') && i.id !== 'tyres' && !(onCharging && i.id === 'health'));
  const t = c.tyres;
  return (
    <Block title="Condition" icon={Wrench01Icon} aside={verdict(items)} className={className} mood={conditionMood(problems(items))}>
      {c.warnings.map((w) => (
        <WarningRow key={w} text={w} />
      ))}
      {/* Full width (an odd card out in the cockpit): the top view beside the readings. */}
      <div className="flex flex-col gap-4 @[560px]:grid @[560px]:grid-cols-2 @[560px]:items-center @[560px]:gap-6">
      {t ? (
        <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 items-center gap-x-3">
          <div className="self-start pt-5">
            <TyreLabel t={t} k="fl" name="front left" align="right" />
          </div>
          <div className="row-span-2 flex justify-center">
            <CarTop t={t} />
          </div>
          <div className="self-start pt-5">
            <TyreLabel t={t} k="fr" name="front right" align="left" />
          </div>
          <div className="self-end pb-5">
            <TyreLabel t={t} k="rl" name="rear left" align="right" />
          </div>
          <div className="self-end pb-5">
            <TyreLabel t={t} k="rr" name="rear right" align="left" />
          </div>
        </div>
      ) : null}
      {pills.length ? (
        <div className="flex flex-col gap-1.5">
          {pills.map((i) => (
            <ReadingPill key={i.id} i={i} />
          ))}
        </div>
      ) : null}
      </div>
    </Block>
  );
}

/** 2 · Battery (bike): the pack drawn like the car's (charge, lost capacity hatched), in or out under it, the mode and lifetime numbers. */
export function BatteryPackCard({ v, className }: Props) {
  if (v.kind !== 'bike') return null;
  const c = v.condition;
  const out = c.batteryInserted === false;
  return (
    <Block title="Battery" icon={BatteryFullIcon} aside={v.mode ?? undefined} className={className} mood={chargeMood(v)}>
      <div className="flex flex-col gap-2">
        {v.level !== null ? <BatteryPack level={v.level} health={c.batteryHealth} flow={batteryFlow(v).flow} out={out} /> : null}
        <p className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={out ? InformationCircleIcon : CheckmarkCircle02Icon} size={15} style={{ color: out ? TONE.info : TONE.good }} />
          {out ? 'Not in the bike' : 'In the bike'}
          {c.batteryHealth !== null ? <span className="text-muted"> · health {c.batteryHealth}% of new</span> : null}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {v.lifetime?.co2SavedKg != null ? (
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: `color-mix(in oklab, ${TONE.good} 12%, transparent)` }}>
            <HugeiconsIcon icon={Leaf01Icon} size={18} style={{ color: TONE.good }} />
            <Stat label="CO₂ saved" value={`${v.lifetime.co2SavedKg} kg`} />
          </div>
        ) : null}
        {v.lifetime?.hours != null ? (
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: soft(5) }}>
            <HugeiconsIcon icon={DashboardSpeed01Icon} size={18} className="text-muted" />
            <Stat label="Ridden" value={`${v.lifetime.hours} h`} />
          </div>
        ) : null}
      </div>
    </Block>
  );
}

// ---------------------------------------------------------------------------------------------
// 3 · Health check
// ---------------------------------------------------------------------------------------------

/** 3 · One checklist for everything the vehicle reports, problems first; for the bike it takes in the Battery card. Lifetime numbers at the foot. */
export function HealthCheck({ v, home, className }: Props) {
  const items = healthItems(v, { battery: true, now: home.now });
  if (!items.length) return null;
  const foot =
    v.kind === 'bike'
      ? [v.lifetime?.co2SavedKg != null ? `${v.lifetime.co2SavedKg} kg CO₂ saved` : '', v.lifetime?.hours != null ? `${v.lifetime.hours} h ridden` : ''].filter(Boolean).join(' · ')
      : v.odometer !== null
      ? `${fmtDistance(v.odometer, v.unit)} on the clock`
      : '';
  return (
    <Block title={v.kind === 'bike' ? 'Health' : 'Condition'} icon={Wrench01Icon} aside={verdict(items)} className={className} mood={conditionMood(problems(items))}>
      <ul className="grid grid-cols-1 gap-x-6 @[560px]:grid-cols-2">
        {items.map((i) => {
          const problem = i.tone === 'warn' || i.tone === 'bad';
          return (
            <li key={i.id} className={cn('flex items-center gap-3 border-b py-2.5 last:border-b-0 @[560px]:[&:nth-last-child(2):nth-child(odd)]:border-b-0', hairline)}>
              <HugeiconsIcon icon={problem ? Alert02Icon : i.tone === 'info' ? InformationCircleIcon : CheckmarkCircle02Icon} size={17} className="shrink-0" style={{ color: TONE[i.tone] }} />
              <span className={cn('min-w-0 flex-1 truncate text-sm', !problem && 'text-muted')}>{i.label}</span>
              {i.value ? (
                <span className="shrink-0 text-sm tabular-nums" style={problem ? { color: TONE[i.tone] } : undefined}>
                  {i.value}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {foot ? <p className="-mt-1 text-xs text-muted">{foot}</p> : null}
    </Block>
  );
}
