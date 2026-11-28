/**
 * Door locks concept B — Expressive & immersive ("the padlock"). One big padlock is the house: its
 * shackle is shut on a calm night-blue card when everything is locked, springs open on a warm
 * amber card when a door is unlocked, and the card turns red when a lock is jammed. Locks are glass
 * pills (Wide) or glass tiles with their action (Tall/Large).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProLockItem, ProLocksModel } from '../../../lib/overviewLocks';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { LockAction, lockable, lockSince, lockTone, locksSummary, useLockActions, type LockTone } from './shared';

const CARD = {
  locked: 'linear-gradient(155deg, hsl(208 45% 30%), hsl(224 48% 13%))',
  unlocked: 'linear-gradient(155deg, hsl(38 92% 54%), hsl(18 80% 38%))',
  jammed: 'linear-gradient(155deg, hsl(0 78% 52%), hsl(350 70% 28%))',
  none: 'linear-gradient(155deg, hsl(215 12% 42%), hsl(220 14% 22%))'
};
const DOT: Record<LockTone, string> = { locked: 'bg-white/80', unlocked: 'bg-[hsl(48_100%_70%)]', jammed: 'bg-[hsl(0_100%_75%)]', offline: 'bg-white/30' };

/** The padlock: the shackle lifts and swings open when `open`. */
function Padlock({ open, size }: { open: boolean; size: number }) {
  return (
    <svg viewBox="0 0 64 72" width={size} height={(size * 72) / 64} aria-hidden className="shrink-0 drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]">
      <path
        d="M18 34V22a14 14 0 0 1 28 0v12"
        fill="none"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="7"
        strokeLinecap="round"
        className="transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transformOrigin: '46px 34px', transform: open ? 'translateY(-7px) rotate(28deg)' : 'none' }}
      />
      <rect x="8" y="32" width="48" height="38" rx="11" fill="white" fillOpacity="0.95" />
      <circle cx="32" cy="48" r="5" fill="rgba(0,0,0,0.55)" />
      <rect x="30" y="50" width="4" height="10" rx="2" fill="rgba(0,0,0,0.55)" />
    </svg>
  );
}

function Tile({ l, a, ink, narrow }: { l: ProLockItem; a: ReturnType<typeof useLockActions>; ink: string; narrow: boolean }) {
  const tone = lockTone(l);
  const since = lockSince(l);
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/14 px-2.5 py-2 ring-1 ring-white/20 backdrop-blur-md">
      <span className={cn('size-2 shrink-0 rounded-full', DOT[tone])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight">{l.shortName}</span>
        <span className="block truncate text-[11px] text-white/75">{l.doorOpen ? 'Door open' : narrow ? l.stateLabel : [l.stateLabel, since].filter(Boolean).join(' · ')}</span>
      </span>
      <LockAction l={l} a={a} ink={ink} iconOnly={narrow} />
    </li>
  );
}

export default function LocksConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProLocksModel>) {
  const a = useLockActions(m);
  const state = m.total === 0 ? 'none' : m.jammed > 0 ? 'jammed' : m.unlocked > 0 ? 'unlocked' : 'locked';
  const ink = state === 'unlocked' ? 'hsl(22 80% 38%)' : state === 'jammed' ? 'hsl(350 70% 32%)' : 'hsl(220 48% 18%)';
  const open = state === 'unlocked' || state === 'jammed';
  const head = (
    <div className="min-w-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.2)]">
      <p className={cn('line-clamp-2 font-semibold leading-tight', size === 's' || size === 't' ? 'text-lg' : 'text-2xl')}>{m.headline}</p>
      <p className="truncate text-xs text-white/80">{locksSummary(m, size !== 'l')}</p>
    </div>
  );
  const lockAll =
    lockable(m).length > 0 ? (
      <Button size="sm" variant="ghost" fullWidth onPress={() => void a.lockAll()} className="h-9 shrink-0 bg-white text-xs font-semibold shadow-sm hover:bg-white/90" style={{ color: ink }}>
        <HugeiconsIcon icon={SquareLock02Icon} size={14} />
        {lockable(m).length === 1 ? 'Lock it' : `Lock all ${lockable(m).length}`}
      </Button>
    ) : null;
  const rows = size === 'l' ? (lockAll ? 3 : 4) : size === 't' ? (lockAll ? 2 : 3) : 0;

  return (
    <WidgetSurface label="Door locks" ink="light" style={{ background: CARD[state] }}>
      {state === 'jammed' ? <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[hsl(0_90%_60%)] opacity-30 motion-safe:animate-pulse" /> : null}
      <DetailsButton title="Door locks" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2.5 p-3.5">
        {m.total === 0 ? (
          <>
            <Padlock open={false} size={40} />
            <div className="mt-auto">{head}</div>
          </>
        ) : size === 's' ? (
          <>
            {lockable(m).length > 0 ? (
              <Button
                variant="ghost"
                isIconOnly
                aria-label={m.unlocked === 1 ? `Lock ${m.locks.find((l) => l.isUnlocked)?.name ?? 'it'}` : `Lock all ${m.unlocked}`}
                onPress={() => void a.lockAll()}
                className="h-auto w-auto min-w-0 self-start rounded-2xl p-1 hover:bg-white/10"
              >
                <Padlock open size={40} />
              </Button>
            ) : (
              <Padlock open={open} size={44} />
            )}
            <div className="mt-auto">
              {head}
              {lockable(m).length > 0 ? <p className="mt-0.5 text-[11px] font-medium text-white/90">Tap the lock to lock</p> : null}
            </div>
          </>
        ) : size === 'w' ? (
          <div className="flex h-full min-w-0 items-center gap-3.5">
            <Padlock open={open} size={64} />
            <div className="flex min-w-0 flex-1 flex-col gap-2 pr-6">
              {head}
              <ul aria-label="Locks" className="flex min-w-0 flex-wrap gap-1">
                {m.locks.slice(0, 4).map((l) => (
                  <li key={l.entityId} className="flex min-w-0 max-w-full items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] ring-1 ring-white/20">
                    <span className={cn('size-1.5 shrink-0 rounded-full', DOT[lockTone(l)])} />
                    <span className="truncate">{l.shortName}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className={cn('flex min-w-0 gap-3 pr-6', size === 'l' ? 'items-center' : 'flex-col gap-1.5')}>
              <Padlock open={open} size={size === 'l' ? 52 : 36} />
              {head}
            </div>
            <ul aria-label="Locks" className="flex min-h-0 flex-col gap-1.5 overflow-hidden">
              {m.locks.slice(0, rows).map((l) => (
                <Tile key={l.entityId} l={l} a={a} ink={ink} narrow={size === 't'} />
              ))}
            </ul>
            {m.locks.length > rows ? <p className="text-[11px] text-white/70">+{m.locks.length - rows} more</p> : null}
            <div className="mt-auto">{lockAll}</div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
