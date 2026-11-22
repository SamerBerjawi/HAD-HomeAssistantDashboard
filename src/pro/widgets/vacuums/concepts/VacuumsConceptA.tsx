/**
 * Vacuums concept A — Refined & minimal. Neutral surface; one word says what the robot is doing,
 * coloured by state, with where and how below and the battery as a number. Small: word + main
 * action. Wide: word, details, battery + actions. Tall: adds a battery bar. Large: every robot.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { RoboticIcon } from '@hugeicons/core-free-icons';
import type { ProVacuumItem, ProVacuumsModel } from '../../../lib/overviewAppliances';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { batteryColor, stateDetail, stateHue, stateWord, VacuumButtons } from './shared';

function Status({ v, big }: { v: ProVacuumItem; big?: boolean }) {
  return (
    <div className="min-w-0">
      <p
        className={big ? 'truncate pb-0.5 text-[34px] font-light leading-[1.1] tracking-tight' : 'truncate pb-0.5 text-[26px] font-light leading-[1.1] tracking-tight'}
        style={{ color: stateHue(v) ?? undefined }}
      >
        {stateWord(v)}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{stateDetail(v)}</p>
    </div>
  );
}

function Battery({ v, bar }: { v: ProVacuumItem; bar?: boolean }) {
  if (v.batteryPct === null) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-sm font-medium tabular-nums">
        {v.batteryPct}%<span className="ml-1 text-xs font-normal text-muted">{v.batteryCharging ? 'charging' : 'battery'}</span>
      </p>
      {bar ? (
        <span className="h-1 w-full overflow-hidden rounded-full bg-default">
          <span className="block h-full rounded-full" style={{ width: `${v.batteryPct}%`, background: batteryColor(v.batteryPct) }} />
        </span>
      ) : null}
    </div>
  );
}

export default function VacuumsConceptA({ model, size, onOpenDetails }: DesignedWidgetProps<ProVacuumsModel>) {
  const v = model.primaryVacuum;
  return (
    <WidgetSurface label="Vacuums" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Vacuums" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col p-3.5">
        {!v ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={RoboticIcon} size={22} />
            <p className="text-sm font-medium">No robot vacuums</p>
          </div>
        ) : null}

        {v && size === 's' ? (
          <>
            <div className="flex items-start gap-2 pr-8">
              <VacuumButtons v={v} compact />
              <Battery v={v} />
            </div>
            <div className="mt-auto">
              <Status v={v} />
            </div>
          </>
        ) : null}

        {v && size === 'w' ? (
          <div className="flex h-full flex-col justify-between">
            <div className="pr-8">
              <Status v={v} big />
            </div>
            <div className="flex items-end justify-between gap-2">
              <Battery v={v} />
              <VacuumButtons v={v} />
            </div>
          </div>
        ) : null}

        {v && size === 't' ? (
          <div className="flex h-full flex-col gap-3">
            <HugeiconsIcon icon={RoboticIcon} size={22} className="text-muted" />
            <Status v={v} big />
            <div className="mt-auto flex flex-col gap-3">
              <Battery v={v} bar />
              <VacuumButtons v={v} />
            </div>
          </div>
        ) : null}

        {v && size === 'l' ? (
          <ul aria-label="Robots" className="flex h-full flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
            {model.items.slice(0, 2).map((item) => (
              <li key={item.entityId} className="flex min-h-0 flex-1 flex-col justify-center gap-2 py-2 first:pt-0 last:pb-0">
                <p className="truncate pr-8 text-xs font-medium text-muted">{item.name}</p>
                <div className="flex items-end justify-between gap-3">
                  <Status v={item} big />
                  <div className="w-24 shrink-0">
                    <Battery v={item} bar />
                  </div>
                </div>
                <VacuumButtons v={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
