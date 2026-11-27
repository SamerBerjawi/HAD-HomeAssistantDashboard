/**
 * Vehicle tiles · batch 1 · Charge limit (docs/pro-ui/VEHICLE_TILES.md): where charging stops,
 * set in one tap. Only the steps the car accepts (FordPass: 50–100).
 * A · Ladder: the steps as rungs, filled up to the limit (the Blind tile's Positions).
 * B · Scale: a ruler from the lowest step to 100; the charge now a dot, the limit a pin; − / +
 *   (the Thermostat tile's Scale).
 * C · Presets: what the limit is for, in words: Daily 80%, Long trip 100%, or Custom.
 */
import { Button } from '@heroui/react';
import { MinusSignIcon, PlusSignIcon, Target02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileIconButton, TileName, TileState } from '../../../../areas/tileKit';
import { has, type Vehicle } from '../../../../lib/mobilityHome';
import { Big, IconChip, pct, VHUE, wash, type VehicleTileProps } from '../vehicleTileKit';

function limitOf(v: Vehicle) {
  const c = v.charging;
  const steps = c?.targets.length ? [...c.targets].sort((a, b) => a - b) : [];
  const target = c?.target ?? null;
  const can = !!c && steps.length > 0 && has(v, 'target');
  const i = target !== null ? steps.indexOf(target) : -1;
  return { steps, target, can, prev: i > 0 ? steps[i - 1] : null, next: i >= 0 && i < steps.length - 1 ? steps[i + 1] : null };
}

/** The rungs worth showing: every ten, plus the one chosen. */
const rungsOf = (steps: number[], target: number | null) => steps.filter((s) => s % 10 === 0 || s === target);

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label="Charge limit" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={Target02Icon} on={false} />
        <TileName className="mt-auto">Charge limit</TileName>
        <TileState>{v.charging?.target != null ? `${v.charging.target}% · set in the car` : 'Not offered'}</TileState>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Ladder
// ---------------------------------------------------------------------------------------------

export function LimitLadder({ v, size, act }: VehicleTileProps) {
  const l = limitOf(v);
  if (!l.can || l.target === null) return <Unavailable v={v} />;
  const rungs = rungsOf(l.steps, l.target);
  const set = (p: number) => act({ type: 'target', pct: p });
  const Rung = ({ s, vertical }: { s: number; vertical?: boolean }) => {
    const filled = s <= l.target!;
    const chosen = s === l.target;
    return (
      <Button
        variant="ghost"
        aria-label={`Charge to ${s}%`}
        aria-pressed={chosen}
        onPress={() => set(s)}
        data-tile-control=""
        className={cn('min-w-0 rounded-[10px] p-0 text-[12px] font-semibold tabular-nums transition-colors', vertical ? 'h-auto w-full flex-1' : 'h-full w-full flex-1')}
        style={{ background: filled ? `color-mix(in srgb, ${VHUE.charge} ${chosen ? 85 : 30}%, transparent)` : 'color-mix(in srgb, currentColor 8%, transparent)', color: chosen ? 'hsl(160 40% 12%)' : undefined }}
      >
        {s}
      </Button>
    );
  };
  if (size === 'xs')
    return (
      <TileFrame label="Charge limit" className="pro-surface">
        <div className="flex h-full items-center gap-1 px-2.5">
          {rungs.slice(-4).map((s) => (
            <div key={s} className="h-9 flex-1">
              <Rung s={s} />
            </div>
          ))}
        </div>
      </TileFrame>
    );
  if (size === 's' || size === 't')
    return (
      <TileFrame label="Charge limit" className="pro-surface">
        <div className="flex h-full gap-3 p-3.5">
          <div className="flex min-w-0 flex-1 flex-col">
            <IconChip icon={Target02Icon} hue={VHUE.charge} />
            <Big n={l.target} unit="%" className="mt-auto text-[30px]" />
            <TileState className="mt-1">Charge limit</TileState>
          </div>
          <div className="flex w-12 flex-col-reverse gap-1">
            {rungs.map((s) => (
              <Rung key={s} s={s} vertical />
            ))}
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charge limit" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center gap-2">
          <IconChip icon={Target02Icon} hue={VHUE.charge} />
          <TileName className="flex-1">Charge limit</TileName>
          <Big n={l.target} unit="%" className="text-[24px]" />
        </div>
        {size === 'l' ? <p className="mt-3 text-[13px] opacity-70">Stops charging at {l.target}%. Up to 80–90% for every day keeps the battery healthy; 100% before a long trip.</p> : null}
        <div className={cn('mt-auto flex gap-1.5', size === 'l' ? 'h-14' : 'h-11')}>
          {rungs.map((s) => (
            <Rung key={s} s={s} />
          ))}
        </div>
        <p className="mt-2 text-[12px] opacity-60 tabular-nums">Charge now {v.level ?? '—'}%</p>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Scale
// ---------------------------------------------------------------------------------------------

function Ruler({ v, l, set, labels }: { v: Vehicle; l: ReturnType<typeof limitOf>; set: (p: number) => void; labels: boolean }) {
  const lo = l.steps[0] ?? 50;
  const f = (p: number) => `${((Math.max(lo, Math.min(100, p)) - lo) / (100 - lo)) * 100}%`;
  const level = pct(v.level);
  return (
    <div className="relative pt-5">
      <div className="relative flex h-6 items-end justify-between">
        {Array.from({ length: (100 - lo) / 5 + 1 }, (_, i) => lo + i * 5).map((t) => (
          <Button key={t} variant="ghost" aria-label={`Charge to ${t}%`} isDisabled={!l.steps.includes(t)} onPress={() => set(t)} data-tile-control="" className="h-full w-3 min-w-0 rounded-none p-0 data-[disabled=true]:opacity-100">
            <span className="block w-px bg-current" style={{ height: t % 10 === 0 ? 14 : 8, opacity: t % 10 === 0 ? 0.45 : 0.25 }} />
          </Button>
        ))}
        {/* The stretch from the charge now to the limit. */}
        <span aria-hidden className="pointer-events-none absolute bottom-0 h-1 rounded-full" style={{ left: f(level), right: `calc(100% - ${f(l.target ?? 100)})`, background: level < (l.target ?? 0) ? `color-mix(in srgb, ${VHUE.charge} 55%, transparent)` : 'transparent' }} />
      </div>
      <span aria-hidden className="pointer-events-none absolute top-[18px] size-3 -translate-x-1/2 rounded-full border-2 border-[var(--surface)] bg-current" style={{ left: f(level) }} />
      <span aria-hidden className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: f(l.target ?? 100) }}>
        <span className="size-4 rounded-full border-[3px] border-[var(--surface)]" style={{ background: VHUE.charge, boxShadow: `0 0 10px ${VHUE.charge}` }} />
        <span className="h-6 w-0.5" style={{ background: VHUE.charge }} />
      </span>
      {labels ? (
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums opacity-50">
          <span>{lo}</span>
          <span>{Math.round((lo + 100) / 2)}</span>
          <span>100</span>
        </div>
      ) : null}
    </div>
  );
}

export function LimitScale({ v, size, act }: VehicleTileProps) {
  const l = limitOf(v);
  if (!l.can || l.target === null) return <Unavailable v={v} />;
  const set = (p: number) => act({ type: 'target', pct: p });
  const steppers = (px: number) => (
    <div className="flex gap-1.5">
      <TileIconButton icon={MinusSignIcon} label="Lower the limit" size={px} onPress={() => l.prev !== null && set(l.prev)} className="bg-[color-mix(in_srgb,currentColor_8%,transparent)]" />
      <TileIconButton icon={PlusSignIcon} label="Raise the limit" size={px} onPress={() => l.next !== null && set(l.next)} className="bg-[color-mix(in_srgb,currentColor_8%,transparent)]" />
    </div>
  );
  if (size === 'xs')
    return (
      <TileFrame label="Charge limit" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tabular-nums" style={{ color: VHUE.charge }}>
              {l.target}%
            </p>
            <TileState className="text-[12px]">Charge limit</TileState>
          </div>
          {steppers(30)}
        </div>
      </TileFrame>
    );
  if (size === 's' || size === 't')
    return (
      <TileFrame label="Charge limit" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <TileName className="text-[14px]">Charge limit</TileName>
          </div>
          <Big n={l.target} unit="%" className="mt-auto text-[34px]" style={{ color: VHUE.charge }} />
          <div className="mt-2 flex items-center justify-between">
            <TileState className="text-[12px]">now {v.level ?? '—'}%</TileState>
            {steppers(30)}
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charge limit" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <TileName>Charge limit</TileName>
            <Big n={l.target} unit="%" className={cn('mt-1', size === 'l' ? 'text-[56px]' : 'text-[34px]')} style={{ color: VHUE.charge }} />
          </div>
          {steppers(size === 'l' ? 40 : 34)}
        </div>
        <div className="mt-auto">
          <Ruler v={v} l={l} set={set} labels={size === 'l'} />
          {size === 'l' ? <p className="mt-3 text-[12px] opacity-60">Dot: the charge now ({v.level ?? '—'}%). Tap the ruler to move the limit.</p> : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Presets
// ---------------------------------------------------------------------------------------------

function presetsOf(steps: number[]) {
  const pick = (want: number) => (steps.includes(want) ? want : [...steps].sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0]);
  return [
    { id: 'daily', label: 'Daily', short: 'Daily', pct: steps.includes(90) ? 90 : pick(80), hue: VHUE.charge, why: 'Kind to the battery for everyday driving' },
    { id: 'trip', label: 'Long trip', short: 'Trip', pct: 100, hue: VHUE.info, why: 'Full, for a long drive tomorrow' }
  ].filter((p, i, all) => steps.includes(p.pct) && all.findIndex((x) => x.pct === p.pct) === i);
}

export function LimitPresets({ v, size, act }: VehicleTileProps) {
  const l = limitOf(v);
  if (!l.can || l.target === null) return <Unavailable v={v} />;
  const presets = presetsOf(l.steps);
  const current = presets.find((p) => p.pct === l.target);
  const hue = current?.hue ?? VHUE.idle;
  const word = current ? current.label : 'Custom';
  const set = (p: number) => act({ type: 'target', pct: p });
  const chips = (compact: boolean) => (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => {
        const on = p.pct === l.target;
        return (
          <Button
            key={p.id}
            size="sm"
            variant="ghost"
            aria-pressed={on}
            onPress={() => set(p.pct)}
            data-tile-control=""
            className={cn('min-w-0 gap-1 rounded-full font-semibold', compact ? 'h-7 px-2 text-[11px]' : 'h-9 px-3.5 text-[13px]')}
            style={on ? { background: p.hue, color: 'hsl(200 40% 10%)' } : { background: 'color-mix(in srgb, currentColor 8%, transparent)' }}
          >
            {compact ? p.short : p.label} <span className="font-normal opacity-70 tabular-nums">{p.pct}%</span>
          </Button>
        );
      })}
    </div>
  );
  if (size === 'xs')
    return (
      <TileFrame label="Charge limit" style={wash(hue)}>
        <div className="flex h-full items-center justify-between gap-2 px-3">
          <p className="truncate text-[15px] font-semibold" style={{ color: hue }}>
            {word} <span className="font-normal text-[var(--foreground)] opacity-70 tabular-nums">{l.target}%</span>
          </p>
        </div>
      </TileFrame>
    );
  if (size === 's' || size === 't')
    return (
      <TileFrame label="Charge limit" style={wash(hue)}>
        <div className="flex h-full flex-col p-3.5">
          <TileState className="text-[12px]">Charge limit</TileState>
          <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em]" style={{ color: hue }}>
            {word} <span className="text-[15px] font-normal text-[var(--foreground)] opacity-70 tabular-nums">{l.target}%</span>
          </p>
          <div className="mt-auto">{chips(true)}</div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charge limit" style={wash(hue)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center gap-2">
          <IconChip icon={Target02Icon} hue={hue} />
          <TileName className="flex-1">Charge limit</TileName>
        </div>
        <p className={cn('mt-auto font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[38px]' : 'text-[26px]')} style={{ color: hue }}>
          {word} <span className="font-normal text-[var(--foreground)] opacity-70 tabular-nums">{l.target}%</span>
        </p>
        <p className="mb-3 truncate text-[13px] opacity-70">{current?.why ?? `Stops at ${l.target}%`}</p>
        {chips(false)}
        {size === 'l' ? (
          <div className="mt-4 flex items-center gap-2 text-[12px] opacity-70">
            <span>Custom</span>
            <TileIconButton icon={MinusSignIcon} label="Lower the limit" size={28} onPress={() => l.prev !== null && set(l.prev)} className="bg-[color-mix(in_srgb,currentColor_8%,transparent)]" />
            <span className="tabular-nums">{l.target}%</span>
            <TileIconButton icon={PlusSignIcon} label="Raise the limit" size={28} onPress={() => l.next !== null && set(l.next)} className="bg-[color-mix(in_srgb,currentColor_8%,transparent)]" />
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}

