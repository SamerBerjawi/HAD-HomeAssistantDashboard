/**
 * Vacuums concept C — Innovative ("energy ring"). Each robot is a ring: the fill is its battery,
 * the colour its state, and a dashed outer ring turns while it cleans. The robot sits in the
 * middle. Small: one ring. Wide: ring + status + actions. Tall: big ring over status.
 * Large: a ring per robot, side by side.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { RoboticIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProVacuumItem, ProVacuumsModel } from '../../../lib/overviewAppliances';
import { useBoxSize } from '../../shared/useBoxSize';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { batteryColor, stateDetail, stateHue, stateWord, VacuumButtons } from './shared';

function Ring({ v }: { v: ProVacuumItem }) {
  const box = useBoxSize<HTMLDivElement>({ width: 100, height: 100 });
  const d = Math.max(48, Math.min(box.width, box.height));
  const stroke = Math.max(5, d * 0.07);
  const r = d / 2 - stroke * 1.9;
  const c = 2 * Math.PI * r;
  const pct = (v.batteryPct ?? 0) / 100;
  const hue = stateHue(v) ?? batteryColor(v.batteryPct);
  return (
    <div ref={box.ref} className="grid size-full place-items-center">
      <div className="relative" style={{ width: d, height: d }} role="img" aria-label={`${v.name}: ${stateWord(v)}${v.batteryPct !== null ? `, battery ${v.batteryPct}%` : ''}`}>
        <svg width={d} height={d} className="absolute inset-0 -rotate-90">
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} />
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
        </svg>
        <svg width={d} height={d} className={cn('absolute inset-0', v.isCleaning && 'motion-safe:animate-[spin_6s_linear_infinite]')} aria-hidden>
          <circle cx={d / 2} cy={d / 2} r={d / 2 - stroke * 0.5} fill="none" stroke={hue} strokeOpacity={v.isCleaning ? 0.7 : 0.2} strokeWidth={1.5} strokeDasharray="2 6" />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center">
            <HugeiconsIcon icon={RoboticIcon} size={Math.round(d * 0.24)} style={{ color: hue }} />
            {v.batteryPct !== null ? <span className="text-xs font-semibold tabular-nums">{v.batteryPct}%</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Status({ v }: { v: ProVacuumItem }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-base font-semibold leading-tight" style={{ color: stateHue(v) ?? undefined }}>
        {stateWord(v)}
      </p>
      <p className="truncate text-xs text-muted">{stateDetail(v)}</p>
    </div>
  );
}

export default function VacuumsConceptC({ model, size, onOpenDetails }: DesignedWidgetProps<ProVacuumsModel>) {
  const v = model.primaryVacuum;
  const hue = v ? stateHue(v) : null;
  return (
    <WidgetSurface
      label="Vacuums"
      className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      style={{ backgroundImage: hue ? `radial-gradient(80% 80% at 20% 50%, color-mix(in oklab, ${hue} 14%, transparent), transparent 70%)` : undefined }}
    >
      <DetailsButton title="Vacuums" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {!v ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={RoboticIcon} size={22} />
            <p className="text-sm font-medium">No robot vacuums</p>
          </div>
        ) : null}

        {v && size === 's' ? (
          <>
            <div className="min-h-0 flex-1">
              <Ring v={v} />
            </div>
            <p className="truncate text-center text-xs font-medium" style={{ color: hue ?? undefined }}>
              {stateWord(v)}
            </p>
          </>
        ) : null}

        {v && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="aspect-square h-full">
              <Ring v={v} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-6">
              <Status v={v} />
              <VacuumButtons v={v} />
            </div>
          </div>
        ) : null}

        {v && size === 't' ? (
          <>
            <div className="aspect-square w-full">
              <Ring v={v} />
            </div>
            <Status v={v} />
            <div className="mt-auto">
              <VacuumButtons v={v} />
            </div>
          </>
        ) : null}

        {v && size === 'l' ? (
          <ul aria-label="Robots" className="grid h-full grid-cols-2 gap-3">
            {model.items.slice(0, 2).map((item) => (
              <li key={item.entityId} className="flex min-h-0 min-w-0 flex-col gap-2">
                <p className="truncate pr-6 text-xs font-medium text-muted">{item.name}</p>
                <div className="min-h-0 flex-1">
                  <Ring v={item} />
                </div>
                <Status v={item} />
                <VacuumButtons v={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
