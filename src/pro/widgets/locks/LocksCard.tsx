/**
 * Door locks card — the owner's choice (2026-11-20): concept C, "bolts". Each lock is a deadbolt on
 * a rail: tap an open bolt to shoot it into the frame, swipe a locked one back to unlock;
 * a jammed bolt sticks halfway; a door that is open can't be bolted.
 * Owner review (2026-11-20): unlocking is a swipe instead of a hold: drag the bolt back along
 * its rail to the end (it springs back if let go early); tapping the rail nudges it as a hint.
 * Revised on choosing: an icon per lock (front door, garage, gate, shed…) and in the header; text
 * wraps instead of being cut off; with one lock, Small shows its bolt so it can be locked and
 * unlocked there too (several locks: a row of mini bolts).
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, Door01Icon, Door02Icon, DoorLockIcon, FenceIcon, GarageIcon, SquareLock02Icon, SquareUnlock02Icon, WarehouseIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProLockItem, ProLocksModel } from '../../lib/overviewLocks';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { useSlideToConfirm } from '../shared/useSlideToConfirm';
import { lockSince, lockTone, locksSummary, lowBattery, TINT, useLockActions } from './concepts/shared';

/** A door-type icon from the lock's name or room. */
export function lockIcon(l: Pick<ProLockItem, 'name' | 'roomName'>): IconSvgElement {
  const t = `${l.name} ${l.roomName}`.toLowerCase();
  if (/garage|carport/.test(t)) return GarageIcon;
  if (/gate|fence|garden gate/.test(t)) return FenceIcon;
  if (/shed|storage|cellar|basement|barn/.test(t)) return WarehouseIcon;
  if (/patio|terrace|balcony|slid|garden|back/.test(t)) return Door02Icon;
  return Door01Icon;
}

const WARM = 'text-[hsl(30_85%_35%)] dark:text-[hsl(40_95%_65%)]';

function Bolt({ l, a, big, detail, compact = false }: { l: ProLockItem; a: ReturnType<typeof useLockActions>; big: boolean; detail: boolean; compact?: boolean }) {
  const tone = lockTone(l);
  const knob = big ? 36 : 28;
  const rail = useRef<HTMLDivElement>(null);
  // Owner review (2026-11-20): a locked bolt is swiped back to unlock, like "slide to unlock".
  const slide = useSlideToConfirm({ onConfirm: () => void a.unlock(l.entityId), travel: () => (rail.current?.clientWidth ?? 0) - knob - 10, disabled: tone !== 'locked' || a.busy(l.entityId) });
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (hintTimer.current && clearTimeout(hintTimer.current)), []);
  const nudge = () => {
    setHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), 1800);
  };
  // 1 = shot into the frame (right), 0 = drawn back (left); jammed sticks halfway; a tap peeks.
  const pos = tone === 'locked' ? (slide.progress > 0 ? 1 - slide.progress : hint ? 0.86 : 1) : tone === 'jammed' ? 0.5 : tone === 'offline' ? 1 : 0;
  const since = lockSince(l);
  const sub = l.doorOpen
    ? 'Door open'
    : tone === 'locked' && (slide.progress > 0 || hint)
      ? slide.armed
        ? 'Let go to unlock'
        : 'Slide the bolt to unlock'
      : tone === 'locked'
        ? detail
          ? [since ?? 'Locked', lowBattery(l) ? `battery ${l.batteryPct}%` : null].filter(Boolean).join(' · ')
          : 'Locked'
        : l.stateLabel;
  const showSub = !(compact && !l.doorOpen && !hint && slide.progress === 0);
  const surface = cn(
    'relative min-w-0 overflow-hidden rounded-[22px] p-0',
    big ? 'min-h-11' : 'min-h-9',
    tone === 'locked'
      ? 'bg-default/70'
      : tone === 'unlocked'
        ? 'bg-[hsl(44_100%_92%)] dark:bg-[hsl(40_60%_22%)]'
        : tone === 'jammed'
          ? 'bg-[hsl(0_100%_95%)] dark:bg-[hsl(0_50%_22%)]'
          : 'bg-default/40 opacity-60'
  );
  const content = (
    <>
      {/* The strike plate the bolt shoots into. */}
      <span aria-hidden className="absolute inset-y-1.5 right-1 w-1 rounded-full bg-foreground/15" />
      {/* While sliding, the rail fills behind the bolt with the unlocked colour. */}
      {tone === 'locked' && slide.progress > 0 ? (
        <span aria-hidden className="absolute inset-y-0 right-0 bg-[hsl(44_100%_88%)] dark:bg-[hsl(40_60%_26%)]" style={{ left: `calc(${pos} * (100% - ${knob + 10}px) + ${knob / 2 + 4}px)` }} />
      ) : null}
      <span
        className={cn(
          'relative flex w-full min-w-0 items-center gap-1.5 py-1.5 text-left',
          // Room for the knob on whichever side it sits.
          tone === 'locked' || tone === 'offline' ? (big ? 'pl-2.5 pr-12' : 'pl-2.5 pr-10') : big ? 'pl-12 pr-3' : 'pl-10 pr-3'
        )}
      >
        <HugeiconsIcon icon={lockIcon(l)} size={big ? 16 : 14} className={cn('shrink-0', tone === 'locked' ? 'text-muted' : tone === 'jammed' ? 'text-danger' : WARM)} />
        <span className="min-w-0 flex-1">
          <span className="block whitespace-normal break-words text-xs font-semibold leading-tight text-foreground">{l.shortName}</span>
          {showSub ? (
            <span
              className={cn(
                'block whitespace-normal break-words text-[10px] leading-tight',
                l.doorOpen || tone === 'unlocked' || slide.armed ? WARM : tone === 'jammed' ? 'text-danger' : 'text-muted'
              )}
            >
              {sub}
            </span>
          ) : null}
        </span>
      </span>
    </>
  );
  const knobClass = cn(
    'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full shadow-sm transition-[left] duration-300 ease-out motion-reduce:transition-none',
    tone === 'locked' ? (slide.armed ? TINT.unlocked : 'bg-foreground text-background') : TINT[tone],
    slide.dragging && 'duration-0'
  );
  const knobStyle = { width: knob, height: knob, left: `calc(${pos} * (100% - ${knob + 10}px) + 4px)` };
  const knobIcon = (
    <HugeiconsIcon
      icon={tone === 'jammed' ? Alert02Icon : tone === 'locked' ? (slide.armed ? SquareUnlock02Icon : SquareLock02Icon) : tone === 'offline' ? SquareLock02Icon : SquareUnlock02Icon}
      size={big ? 16 : 14}
    />
  );

  if (tone === 'locked') {
    return (
      <li className="min-w-0">
        {/* A tap anywhere but the bolt explains how to unlock. */}
        <div ref={rail} className={cn(surface, 'flex select-none items-center')} onPointerDown={(e) => !(e.target as HTMLElement).closest('[role="slider"]') && nudge()}>
          {content}
          <span
            role="slider"
            tabIndex={0}
            aria-label={`${l.name}, locked. Slide to unlock`}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(slide.progress * 100)}
            aria-valuetext={slide.armed ? 'Release to unlock' : 'Locked'}
            aria-busy={a.busy(l.entityId) || undefined}
            {...slide.moveProps}
            className={cn(knobClass, 'cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:cursor-grabbing')}
            style={knobStyle}
          >
            {knobIcon}
          </span>
        </div>
      </li>
    );
  }

  const disabled = tone === 'jammed' || tone === 'offline' || (tone === 'unlocked' && l.doorOpen === true);
  return (
    <li className="min-w-0">
      <Button
        variant="ghost"
        fullWidth
        isDisabled={disabled}
        isPending={a.busy(l.entityId)}
        aria-label={tone === 'unlocked' ? `${l.name}, unlocked. Lock` : `${l.name}, ${l.stateLabel}`}
        onPress={() => void a.lock(l.entityId)}
        className={cn(surface, 'h-auto data-[disabled=true]:opacity-100')}
      >
        {content}
        <span aria-hidden className={knobClass} style={knobStyle}>
          {knobIcon}
        </span>
      </Button>
    </li>
  );
}

/** Small with several locks: one mini bolt per lock, with its icon. */
function MiniBolts({ m, max }: { m: ProLocksModel; max: number }) {
  return (
    <ul aria-label="Locks" className="flex flex-col gap-1">
      {m.locks.slice(0, max).map((l) => {
        const tone = lockTone(l);
        const shot = tone === 'locked' || tone === 'offline';
        return (
          <li key={l.entityId} className="flex min-w-0 items-center gap-1.5" aria-label={`${l.shortName}: ${l.stateLabel}`}>
            <span className="relative h-2 w-6 shrink-0 rounded-full bg-default">
              <span
                className={cn('absolute top-0 h-2 w-3 rounded-full', tone === 'locked' ? 'bg-foreground' : tone === 'unlocked' ? 'bg-[hsl(38_95%_55%)]' : tone === 'jammed' ? 'bg-danger' : 'bg-muted')}
                style={{ left: shot ? 12 : tone === 'jammed' ? 6 : 0 }}
              />
            </span>
            <HugeiconsIcon icon={lockIcon(l)} size={12} className={cn('shrink-0', shot ? 'text-muted' : WARM)} />
            <span className={cn('min-w-0 break-words text-[11px] leading-tight', shot ? 'text-muted' : 'font-medium')}>{l.shortName}</span>
          </li>
        );
      })}
      {m.locks.length > max ? <li className="text-[10px] text-muted">+{m.locks.length - max} more</li> : null}
    </ul>
  );
}

export default function LocksCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProLocksModel>) {
  const a = useLockActions(m);
  const single = m.total === 1;
  // Tall keeps a line for "+n more" when not every lock fits.
  const rows = size === 'l' ? 4 : size === 't' ? (m.total > 4 ? 3 : 4) : 2;
  const head = (
    <div className={cn('flex min-w-0 gap-2', size === 's' || size === 't' ? 'flex-col gap-1.5' : 'items-start pr-8')}>
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', m.jammed > 0 ? TINT.jammed : m.unlocked > 0 ? TINT.unlocked : TINT.locked)}>
        <HugeiconsIcon icon={m.total === 0 ? DoorLockIcon : m.jammed > 0 || m.unlocked > 0 ? SquareUnlock02Icon : SquareLock02Icon} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('break-words font-semibold leading-tight', size === 's' ? 'text-sm' : 'text-base', m.jammed > 0 && 'text-danger')}>{m.headline}</p>
        {size === 's' && single ? null : <p className="break-words text-[11px] leading-tight text-muted">{locksSummary(m, size !== 'l')}</p>}
      </div>
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
              {single ? (
                <ul aria-label="Locks">
                  <Bolt l={m.locks[0]} a={a} big={false} detail={false} />
                </ul>
              ) : (
                <MiniBolts m={m} max={m.total > 3 ? 2 : 3} />
              )}
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex w-[40%] shrink-0 flex-col justify-end gap-1 [&>div]:pr-0">
              {head}
              {m.locks.length > rows ? <p className="text-[10px] text-muted">+{m.locks.length - rows} more</p> : null}
            </div>
            {/* Wide: the bolt's side and colour say locked or not; the state line shows only for an open door. */}
            <ul aria-label="Locks" className="mt-7 flex min-w-0 flex-1 flex-col justify-end gap-1.5">
              {m.locks.slice(0, rows).map((l) => (
                <Bolt key={l.entityId} l={l} a={a} big={false} detail={false} compact />
              ))}
            </ul>
          </div>
        ) : (
          <>
            {head}
            <ul aria-label="Locks" className="mt-auto flex min-h-0 flex-col gap-1.5">
              {m.locks.slice(0, rows).map((l) => (
                <Bolt key={l.entityId} l={l} a={a} big detail={size === 'l'} />
              ))}
            </ul>
            {m.locks.length > rows ? <p className="text-[11px] text-muted">+{m.locks.length - rows} more</p> : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
