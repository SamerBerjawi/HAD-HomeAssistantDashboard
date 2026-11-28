/**
 * Door locks concept A — Refined & minimal. A plain headline ("All locked", "Back door unlocked")
 * with how many are locked; a quiet row per lock with a soft tint, who changed it and when, and its
 * action: Lock in one tap, Unlock by press and hold. Small: headline + Lock all. Wide: headline |
 * rows. Tall/Large: rows with actions (Large adds battery).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryLowIcon, DoorLockIcon, SquareLock02Icon, SquareLockCheck02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProLockItem, ProLocksModel } from '../../../lib/overviewLocks';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { LockAction, lockable, lockSince, lockTone, locksSummary, lowBattery, TINT, useLockActions } from './shared';

function Row({ l, actions, compact, battery, narrow = false }: { l: ProLockItem; actions: ReturnType<typeof useLockActions> | null; compact: boolean; battery: boolean; narrow?: boolean }) {
  const tone = lockTone(l);
  const since = lockSince(l);
  return (
    <li className="flex min-w-0 items-center gap-2.5 py-1">
      {narrow ? (
        <span className={cn('size-2.5 shrink-0 rounded-full', TINT[tone])} />
      ) : (
        <span className={cn('grid shrink-0 place-items-center rounded-xl', compact ? 'size-7' : 'size-8', TINT[tone])}>
          <HugeiconsIcon icon={tone === 'locked' ? SquareLock02Icon : SquareUnlock02Icon} size={compact ? 14 : 16} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight">{l.shortName}</span>
        <span className="block truncate text-[11px] text-muted">
          {l.doorOpen ? <span className="font-medium text-[hsl(30_85%_40%)] dark:text-[hsl(40_95%_65%)]">Door open · </span> : null}
          {compact ? l.stateLabel : tone === 'locked' ? (since ?? 'Locked') : [l.stateLabel, since].filter(Boolean).join(' · ')}
        </span>
      </span>
      {battery && l.batteryPct !== null ? (
        <span className={cn('flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums', lowBattery(l) ? 'font-semibold text-danger' : 'text-muted')}>
          {lowBattery(l) ? <HugeiconsIcon icon={BatteryLowIcon} size={12} /> : null}
          {l.batteryPct}%
        </span>
      ) : null}
      {actions ? <LockAction l={l} a={actions} iconOnly={narrow} /> : null}
    </li>
  );
}

export default function LocksConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProLocksModel>) {
  const actions = useLockActions(m);
  const problem = m.jammed > 0 || m.unlocked > 0;
  const head = (
    <div className="min-w-0 pr-8">
      <p className="text-[11px] text-muted">Door locks</p>
      <p className={cn('line-clamp-2 font-semibold leading-tight', size === 's' ? 'text-lg' : 'text-xl', m.jammed > 0 && 'text-danger')}>{m.headline}</p>
      <p className="truncate text-xs text-muted">{locksSummary(m, size !== 'l')}</p>
    </div>
  );
  const lockAll =
    lockable(m).length > 0 ? (
      <Button size="sm" variant="primary" fullWidth onPress={() => void actions.lockAll()} className="h-9 shrink-0 text-xs">
        <HugeiconsIcon icon={SquareLock02Icon} size={14} />
        {lockable(m).length === 1 ? 'Lock it' : `Lock all ${lockable(m).length}`}
      </Button>
    ) : null;

  return (
    <WidgetSurface label="Door locks" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Door locks" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {m.total === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={DoorLockIcon} size={22} />
            <p className="text-sm font-medium">No locks</p>
            <p className="text-xs">{locksSummary(m)}</p>
          </div>
        ) : size === 's' ? (
          <>
            {head}
            <div className="mt-auto">
              {lockAll ?? (
                <p className={cn('flex items-center gap-1.5 text-xs font-medium', problem ? 'text-danger' : 'text-success')}>
                  <HugeiconsIcon icon={SquareLockCheck02Icon} size={16} />
                  {m.jammed > 0 ? 'Needs a hand' : 'Secure'}
                </p>
              )}
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex w-[44%] shrink-0 flex-col justify-between gap-2">
              {head}
              {lockAll}
            </div>
            <ul aria-label="Locks" className="mt-1 flex min-w-0 flex-1 flex-col justify-center divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {m.locks.slice(0, 3).map((l) => (
                <Row key={l.entityId} l={l} actions={null} compact battery={false} />
              ))}
            </ul>
          </div>
        ) : (
          <>
            {head}
            <ul aria-label="Locks" className="flex min-h-0 flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))] overflow-hidden">
              {m.locks.slice(0, size === 'l' ? 5 : 3).map((l) => (
                <Row key={l.entityId} l={l} actions={actions} compact={size === 't'} narrow={size === 't'} battery={size === 'l'} />
              ))}
            </ul>
            {m.locks.length > (size === 'l' ? 5 : 3) ? <p className="text-[11px] text-muted">+{m.locks.length - (size === 'l' ? 5 : 3)} more</p> : null}
            <div className="mt-auto">{lockAll}</div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
