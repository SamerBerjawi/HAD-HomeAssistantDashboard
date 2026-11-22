/**
 * Vacuums concept B — Expressive & immersive ("floor"). The card is the floor: a tiled surface
 * with the robot on it. Cleaning, it sweeps across leaving a clean trail and the floor takes the
 * state colour; docked, it rests on its dock, charging; in trouble, the floor turns red.
 * Movement only when motion is allowed. All sizes share the scene; bigger sizes add details.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { FlashIcon, RoboticIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProVacuumItem, ProVacuumsModel } from '../../../lib/overviewAppliances';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { batteryColor, batteryIcon, stateDetail, stateHue, stateWord, VacuumButtons } from './shared';

function Floor({ v }: { v: ProVacuumItem }) {
  const hue = stateHue(v);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#efe9df] dark:bg-[#1d2027]">
      {/* Tiles */}
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:28px_28px] dark:[background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      {hue ? <div className="absolute inset-0" style={{ background: `radial-gradient(110% 90% at 70% 60%, color-mix(in oklab, ${hue} 26%, transparent), transparent 70%)` }} /> : null}
      {v.isCleaning ? <div className="pro-vac-trail absolute inset-x-0 bottom-0 top-1/3" /> : null}
    </div>
  );
}

function Robot({ v, size }: { v: ProVacuumItem; size: number }) {
  const hue = stateHue(v);
  const atDock = v.isDocked || v.isReturning || (!v.isCleaning && !v.isPaused && !v.isError);
  const body = (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute', v.isCleaning ? 'left-0 top-0' : atDock ? 'bottom-3 right-3' : 'bottom-6 right-1/3')}
      style={{ width: size, height: size }}
    >
      {atDock ? <span className="absolute -bottom-1 left-1/2 h-2 w-[130%] -translate-x-1/2 rounded-full bg-black/15 dark:bg-white/15" /> : null}
      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-[#d9dde3] shadow-[0_6px_14px_rgba(0,0,0,0.25)] ring-1 ring-black/10 dark:from-[#4a4f59] dark:to-[#2b2f37] dark:ring-white/10" />
      <span
        className="absolute left-1/2 top-[18%] size-[22%] -translate-x-1/2 rounded-full ring-2 ring-black/10"
        style={{ background: hue ?? 'hsl(220 10% 70%)', boxShadow: hue ? `0 0 8px ${hue}` : undefined }}
      />
      {v.isDocked && v.batteryCharging ? <HugeiconsIcon icon={FlashIcon} size={size * 0.32} className="absolute bottom-[16%] left-1/2 -translate-x-1/2 text-[hsl(145_55%_42%)]" /> : null}
    </div>
  );
  // Cleaning: the robot rides a card-sized layer that the sweep animation translates (pro.css).
  return v.isCleaning ? (
    <div aria-hidden className="pro-vac-bot is-cleaning pointer-events-none absolute inset-0">
      {body}
    </div>
  ) : (
    body
  );
}

function Status({ v }: { v: ProVacuumItem }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-lg font-semibold leading-tight">{stateWord(v)}</p>
      <p className="truncate text-xs text-foreground/70">{stateDetail(v)}</p>
      {v.batteryPct !== null ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium tabular-nums text-foreground/70">
          <HugeiconsIcon icon={batteryIcon(v.batteryPct, v.batteryCharging)} size={14} style={{ color: batteryColor(v.batteryPct) }} aria-hidden />
          {v.batteryPct}%<span className="sr-only">{v.batteryCharging ? ' battery, charging' : ' battery'}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function VacuumsConceptB({ model, size, onOpenDetails }: DesignedWidgetProps<ProVacuumsModel>) {
  const v = model.primaryVacuum;
  if (!v) {
    return (
      <WidgetSurface label="Vacuums" className="bg-[#efe9df] dark:bg-[#1d2027]">
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-foreground/60">
          <HugeiconsIcon icon={RoboticIcon} size={22} />
          <p className="text-sm font-medium">No robot vacuums</p>
        </div>
      </WidgetSurface>
    );
  }
  const others = model.items.filter((i) => i.entityId !== v.entityId);
  const bot = size === 'l' ? 64 : size === 's' ? 40 : 52;

  return (
    <WidgetSurface label="Vacuums">
      <Floor v={v} />
      <Robot v={v} size={bot} />
      <DetailsButton title="Vacuums" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="pr-8">
          <Status v={v} />
        </div>
        {size === 'l' && others.length > 0 ? (
          <ul aria-label="Other robots" className="flex flex-wrap gap-1.5">
            {others.map((o) => (
              <li key={o.entityId} className="rounded-full bg-white/70 px-2.5 py-1 text-xs shadow-sm dark:bg-black/30">
                {o.name.split(' ')[0]} · {stateWord(o).toLowerCase()}
                {o.batteryPct !== null ? (
                  <>
                    {' · '}
                    <HugeiconsIcon icon={batteryIcon(o.batteryPct, o.batteryCharging)} size={12} className="inline align-[-2px]" style={{ color: batteryColor(o.batteryPct) }} aria-hidden />{' '}
                    {o.batteryPct}%
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto">
          <VacuumButtons v={v} compact={size === 's'} />
        </div>
      </div>
    </WidgetSurface>
  );
}
