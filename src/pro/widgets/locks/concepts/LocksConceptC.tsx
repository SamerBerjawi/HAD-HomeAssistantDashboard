/**
 * Door locks concept C — Innovative ("bolts"). Each lock is a bolt on a rail, like a real deadbolt:
 * shot across into the frame when locked, drawn back when unlocked. Tap an open bolt to shoot it;
 * press and hold a locked one and the bolt slides back as you hold. A jammed bolt sits stuck in
 * the middle; a door that is open can't be bolted. Small: a row of mini bolts.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, DoorLockIcon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProLockItem, ProLocksModel } from '../../../lib/overviewLocks';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { lockSince, lockTone, locksSummary, lowBattery, TINT, useHold, useLockActions } from './shared';

const KNOB = 32;

function Bolt({ l, a, tall, detail }: { l: ProLockItem; a: ReturnType<typeof useLockActions>; tall: boolean; detail: boolean }) {
  const tone = lockTone(l);
  const hold = useHold(() => void a.unlock(l.entityId));
  // 1 = shot into the frame (right), 0 = drawn back (left); jammed sticks halfway.
  const pos = tone === 'locked' ? 1 - hold.progress : tone === 'jammed' ? 0.5 : tone === 'offline' ? 1 : 0;
  const since = lockSince(l);
  const sub = l.doorOpen
    ? 'Door open'
    : hold.hint
      ? 'Hold to unlock'
      : tone === 'locked'
        ? detail
          ? [since ?? 'Locked', lowBattery(l) ? `battery ${l.batteryPct}%` : null].filter(Boolean).join(' · ')
          : 'Locked'
        : l.stateLabel;
  const disabled = tone === 'jammed' || tone === 'offline' || (tone === 'unlocked' && l.doorOpen === true);
  const press = tone === 'locked' ? hold.pressProps : { onPress: () => void a.lock(l.entityId) };
  return (
    <li className="min-w-0">
      <Button
        variant="ghost"
        fullWidth
        isDisabled={disabled}
        isPending={a.busy(l.entityId)}
        aria-label={tone === 'locked' ? `${l.name}, locked. Press and hold to unlock` : tone === 'unlocked' ? `${l.name}, unlocked. Lock` : `${l.name}, ${l.stateLabel}`}
        {...press}
        className={cn(
          'relative min-w-0 overflow-hidden rounded-full p-0 data-[disabled=true]:opacity-100',
          tall ? 'h-11' : 'h-9',
          tone === 'locked'
            ? 'bg-default/70'
            : tone === 'unlocked'
              ? 'bg-[hsl(44_100%_92%)] dark:bg-[hsl(40_60%_22%)]'
              : tone === 'jammed'
                ? 'bg-[hsl(0_100%_95%)] dark:bg-[hsl(0_50%_22%)]'
                : 'bg-default/40 opacity-60'
        )}
      >
        {/* The strike plate the bolt shoots into. */}
        <span aria-hidden className="absolute inset-y-1.5 right-1 w-1 rounded-full bg-foreground/15" />
        <span className={cn('relative flex w-full min-w-0 flex-col items-start px-3 text-left', tone === 'locked' || tone === 'offline' ? 'pr-12' : 'pl-12')}>
          <span className="w-full truncate text-xs font-semibold leading-tight text-foreground">{l.shortName}</span>
          <span
            className={cn(
              'w-full truncate text-[10px] leading-tight',
              l.doorOpen || tone === 'unlocked' ? 'text-[hsl(30_85%_35%)] dark:text-[hsl(40_95%_65%)]' : tone === 'jammed' ? 'text-danger' : 'text-muted'
            )}
          >
            {sub}
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full shadow-sm transition-[left] duration-300 ease-out motion-reduce:transition-none',
            tone === 'locked' ? 'bg-foreground text-background' : TINT[tone],
            hold.progress > 0 && 'duration-0'
          )}
          style={{ width: tall ? KNOB + 4 : KNOB - 4, height: tall ? KNOB + 4 : KNOB - 4, left: `calc(${pos} * (100% - ${tall ? KNOB + 14 : KNOB + 6}px) + 4px)` }}
        >
          <HugeiconsIcon icon={tone === 'jammed' ? Alert02Icon : tone === 'locked' || tone === 'offline' ? SquareLock02Icon : SquareUnlock02Icon} size={tall ? 16 : 14} />
        </span>
      </Button>
    </li>
  );
}

/** Small: one mini bolt per lock, shot or drawn. */
function MiniBolts({ m }: { m: ProLocksModel }) {
  return (
    <ul aria-label="Locks" className="flex flex-col gap-1">
      {m.locks.slice(0, 4).map((l) => {
        const tone = lockTone(l);
        const shot = tone === 'locked' || tone === 'offline';
        return (
          <li key={l.entityId} className="flex min-w-0 items-center gap-1.5" aria-label={`${l.shortName}: ${l.stateLabel}`}>
            <span className="relative h-2 w-7 shrink-0 rounded-full bg-default">
              <span
                className={cn(
                  'absolute top-0 h-2 w-3.5 rounded-full',
                  tone === 'locked' ? 'bg-foreground' : tone === 'unlocked' ? 'bg-[hsl(38_95%_55%)]' : tone === 'jammed' ? 'bg-danger' : 'bg-muted'
                )}
                style={{ left: shot ? 14 : tone === 'jammed' ? 7 : 0 }}
              />
            </span>
            <span className={cn('truncate text-[11px]', shot ? 'text-muted' : 'font-medium')}>{l.shortName}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function LocksConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProLocksModel>) {
  const a = useLockActions(m);
  const rows = size === 'l' || size === 't' ? 4 : 2;
  const head = (
    <div className="min-w-0 pr-8">
      <p className={cn('line-clamp-2 font-semibold leading-tight', size === 's' ? 'text-base' : 'text-lg', m.jammed > 0 && 'text-danger')}>{m.headline}</p>
      <p className="truncate text-xs text-muted">{locksSummary(m, size !== 'l')}</p>
    </div>
  );
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
              <MiniBolts m={m} />
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex w-[38%] shrink-0 flex-col justify-end">{head}</div>
            <ul aria-label="Locks" className="mt-7 flex min-w-0 flex-1 flex-col justify-end gap-1.5">
              {m.locks.slice(0, rows).map((l) => (
                <Bolt key={l.entityId} l={l} a={a} tall={false} detail={false} />
              ))}
            </ul>
          </div>
        ) : (
          <>
            {head}
            <ul aria-label="Locks" className="mt-auto flex min-h-0 flex-col gap-1.5">
              {m.locks.slice(0, rows).map((l) => (
                <Bolt key={l.entityId} l={l} a={a} tall detail={size === 'l'} />
              ))}
            </ul>
            {m.locks.length > rows ? <p className="text-[11px] text-muted">+{m.locks.length - rows} more</p> : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
