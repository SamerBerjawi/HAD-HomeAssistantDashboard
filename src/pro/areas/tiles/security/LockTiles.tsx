/**
 * Lock, batch 4 concepts. Locking is always one action; unlocking never happens by a stray tap.
 * - A · "Hold": one round key. Tap to lock; press and hold to unlock while a ring fills (0.8 s).
 * - B · "Bolt": the deadbolt itself as a two-way switch, Unlocked | Locked; the bolt slides into
 *   the strike plate when locked. Pick a side. Large adds Open (unlatch) when the lock has it.
 * - C · "Status": the word first, green Locked or amber Unlocked, with who did it and when; one
 *   button that locks in a tap. Unlock is two steps: press it, then hold it (0.8 s) while it fills.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DoorOpenIcon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { LockTileModel, TileProps, TileSize } from '../../tileTypes';
import { BatteryNote, IconDot, lockBy, lockInfo, SAFE, Shell } from './securityParts';

const HOLD_MS = 800;

/* ── A · Hold ── */
function HoldKey({ l, act, px }: { l: LockTileModel; act: TileProps<LockTileModel>['act']; px: number }) {
  const info = lockInfo(l);
  const locked = l.state === 'locked';
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const r = px / 2 - 3;
  const c = 2 * Math.PI * r;
  const ip = Math.round(px * 0.4);
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg aria-hidden width={px} height={px} className="absolute inset-0 -rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={4} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={info.hue}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={holding ? 0 : c}
          style={{ transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'stroke-dashoffset 200ms ease-out' }}
        />
      </svg>
      <Button
        isIconOnly
        variant="ghost"
        data-tile-control=""
        aria-label={`${l.name}: ${locked ? 'press and hold to unlock' : 'lock'}`}
        isDisabled={!l.available || l.state === 'locking' || l.state === 'unlocking'}
        onPressStart={() => {
          fired.current = false;
          if (!locked) return;
          setHolding(true);
          timer.current = window.setTimeout(() => {
            fired.current = true;
            setHolding(false);
            act({ type: 'lock', cmd: 'unlock' });
          }, HOLD_MS);
        }}
        onPressEnd={() => {
          if (!locked) return;
          window.clearTimeout(timer.current);
          setHolding(false);
          if (!fired.current) {
            setHint(true);
            window.setTimeout(() => setHint(false), 1500);
          }
        }}
        onPress={() => {
          // The release that ends a successful hold must not lock it straight back.
          if (fired.current) {
            fired.current = false;
            return;
          }
          if (!locked) act({ type: 'lock', cmd: 'lock' });
        }}
        className="absolute inset-[7px] h-auto w-auto min-w-0 rounded-full p-0 transition-[background,transform] duration-200 data-[pressed=true]:scale-95"
        style={{ background: `color-mix(in srgb, ${info.hue} ${locked ? 18 : 14}%, transparent)`, color: info.hue }}
      >
        <HugeiconsIcon icon={info.icon} size={ip} style={{ width: ip, height: ip }} />
      </Button>
      {hint ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white">Hold to unlock</span>
      ) : null}
    </div>
  );
}

export function LockHold({ e: l, size, act }: TileProps<LockTileModel>) {
  const info = lockInfo(l);
  const hint = !l.available ? '' : l.state === 'locked' ? 'Hold to unlock' : l.state === 'jammed' ? 'Check the door' : 'Tap to lock';
  return (
    <Shell
      size={size}
      label={l.name}
      name={l.name}
      className={cn('pro-surface', !l.available && 'opacity-60')}
      state={<span style={{ color: info.hue }}>{info.word}</span>}
      detail={lockBy(l)}
      visual={(px) => <HoldKey l={l} act={act} px={size === 'xs' ? 46 : size === 's' ? 60 : px} />}
      aside={<BatteryNote battery={l.battery} />}
      extra={size === 'l' || size === 't' ? <p className="text-[12px] opacity-60">{hint}</p> : undefined}
    />
  );
}

/* ── B · Bolt ── */
function Bolt({ l, act, h, labels }: { l: LockTileModel; act: TileProps<LockTileModel>['act']; h: number; labels: boolean }) {
  const info = lockInfo(l);
  const locked = l.state === 'locked' || l.state === 'locking';
  const side = (cmd: 'lock' | 'unlock') => {
    const active = cmd === 'lock' ? locked && l.available : !locked && l.available;
    return (
      <Button
        variant="ghost"
        data-tile-control=""
        aria-label={`${l.name}: ${cmd}`}
        aria-pressed={active}
        isDisabled={!l.available}
        onPress={() => act({ type: 'lock', cmd })}
        className={cn('relative z-10 h-full min-w-0 flex-1 basis-0 gap-1.5 rounded-full p-0 font-semibold transition-colors duration-300', active ? 'text-white' : 'opacity-60', labels ? 'text-[13px]' : 'text-[0px]')}
      >
        <HugeiconsIcon icon={cmd === 'lock' ? SquareLock02Icon : SquareUnlock02Icon} size={labels ? 16 : 18} />
        {labels ? (cmd === 'lock' ? 'Locked' : 'Unlocked') : null}
      </Button>
    );
  };
  return (
    <div role="group" aria-label={`${l.name} lock`} className="relative flex w-full rounded-full bg-[color-mix(in_srgb,currentColor_7%,transparent)] p-1" style={{ height: h }}>
      {/* the bolt, sliding into the strike plate on the right when locked */}
      {l.available ? (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] transition-[left,background] duration-300 ease-out"
          style={{ left: locked ? '50%' : '4px', width: 'calc(50% - 4px)', background: l.state === 'jammed' ? info.hue : locked ? info.hue : 'hsl(36 95% 50%)' }}
        />
      ) : null}
      {side('unlock')}
      {side('lock')}
    </div>
  );
}

const BOLT_H: Record<TileSize, number> = { xs: 34, s: 40, w: 44, t: 48, l: 52 };

export function LockBolt({ e: l, size, act }: TileProps<LockTileModel>) {
  const info = lockInfo(l);
  const bolt = <Bolt l={l} act={act} h={BOLT_H[size]} labels={size === 'w' || size === 'l'} />;
  if (size === 'xs') {
    return (
      <Shell
        size={size}
        label={l.name}
        name={l.name}
        className={cn('pro-surface', !l.available && 'opacity-60')}
        state={<span style={{ color: info.hue }}>{info.word}</span>}
        visual={() => null}
        aside={<div className="w-[68px] shrink-0">{bolt}</div>}
      />
    );
  }
  return (
    <Shell
      size={size}
      label={l.name}
      name={l.name}
      className={cn('pro-surface', !l.available && 'opacity-60')}
      state={<span style={{ color: info.hue }}>{info.word}</span>}
      detail={lockBy(l)}
      visual={(px) => (size === 'w' ? null : <IconDot icon={info.icon} hue={info.hue} px={size === 's' ? 36 : Math.round(px * 0.55)} />)}
      aside={<BatteryNote battery={l.battery} />}
      strip={
        <div className="flex items-center gap-2">
          {bolt}
          {size === 'l' && l.supportsOpen ? (
            <Button variant="secondary" data-tile-control="" aria-label={`${l.name}: open the door (unlatch)`} isDisabled={!l.available} onPress={() => act({ type: 'lock', cmd: 'open' })} className="h-[52px] min-w-0 shrink-0 gap-1.5 rounded-full px-4 text-[13px] font-semibold">
              <HugeiconsIcon icon={DoorOpenIcon} size={16} />
              Open
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

/* ── C · Status ── */

/**
 * Lock in one press; unlock in two steps (owner, 2026-11-21): a press arms it ("Hold to unlock"),
 * then the same button must be held while it fills. A short tap keeps it armed for 4 s, and the
 * release that ends a successful hold never locks it straight back. Shared with the car tiles.
 */
export function GuardedLockButton({
  name,
  locked,
  available,
  onLock,
  onUnlock,
  compact,
  full,
  className
}: {
  name: string;
  locked: boolean;
  available: boolean;
  onLock: () => void;
  onUnlock: () => void;
  compact?: boolean;
  full?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [holding, setHolding] = useState(false);
  const disarm = useRef<number | undefined>(undefined);
  const hold = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const pressing = useRef(false);
  useEffect(
    () => () => {
      window.clearTimeout(disarm.current);
      window.clearTimeout(hold.current);
    },
    []
  );
  useEffect(() => {
    setArmed(false);
    setHolding(false);
  }, [locked]);
  const keepArmed = () => {
    window.clearTimeout(disarm.current);
    disarm.current = window.setTimeout(() => setArmed(false), 4000);
  };
  if (!available) return null;
  const label = locked ? (armed ? (compact ? 'Hold' : 'Hold to unlock') : 'Unlock') : 'Lock';
  return (
    <Button
      size="sm"
      variant={locked && !armed ? 'secondary' : 'primary'}
      data-tile-control=""
      aria-label={`${name}: ${locked ? (armed ? 'press and hold to unlock' : 'unlock') : 'lock'}`}
      onPressStart={() => {
        fired.current = false;
        if (!locked || !armed) return;
        window.clearTimeout(disarm.current);
        pressing.current = true;
        setHolding(true);
        hold.current = window.setTimeout(() => {
          fired.current = true;
          pressing.current = false;
          setHolding(false);
          onUnlock();
        }, HOLD_MS);
      }}
      onPressEnd={() => {
        if (!pressing.current) return;
        pressing.current = false;
        window.clearTimeout(hold.current);
        setHolding(false);
        if (!fired.current) keepArmed();
      }}
      onPress={() => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        if (!locked) return onLock();
        if (!armed) {
          setArmed(true);
          keepArmed();
        }
      }}
      className={cn('relative min-w-0 shrink-0 overflow-hidden rounded-full font-semibold', compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4 text-[13px]', full && 'w-full', className)}
      style={!locked ? { background: SAFE, color: 'white' } : armed ? { background: 'color-mix(in srgb, hsl(36 95% 50%) 40%, var(--surface))', color: 'hsl(30 70% 16%)' } : undefined}
    >
      {locked && armed ? (
        <span aria-hidden className="absolute inset-y-0 left-0 bg-[hsl(36_95%_50%)]" style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${HOLD_MS}ms linear` : 'width 150ms ease-out' }} />
      ) : null}
      <span className="relative">{label}</span>
    </Button>
  );
}

export function LockStatus({ e: l, size, act }: TileProps<LockTileModel>) {
  const info = lockInfo(l);
  const button = (
    <GuardedLockButton
      name={l.name}
      locked={l.state === 'locked'}
      available={l.available}
      onLock={() => act({ type: 'lock', cmd: 'lock' })}
      onUnlock={() => act({ type: 'lock', cmd: 'unlock' })}
      compact={size === 'xs'}
      full={size !== 'xs' && size !== 'w'}
    />
  );
  const tint = l.available ? { background: `linear-gradient(160deg, color-mix(in srgb, ${info.hue} ${info.safe ? 10 : 18}%, var(--surface)), var(--surface) 70%)` } : undefined;
  const big = (cls: string) => (
    <span className={cn('font-semibold leading-none tracking-[-0.02em]', cls)} style={{ color: info.hue }}>
      {info.word}
    </span>
  );
  return (
    <Shell
      size={size}
      label={l.name}
      name={size === 'xs' ? info.word : l.name}
      className={cn(!l.available && 'pro-surface opacity-60', l.available && 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]')}
      style={tint}
      state={size === 'xs' ? l.name : size === 's' ? big('text-[22px]') : big(size === 'l' ? 'text-[34px]' : 'text-[24px]')}
      detail={
        <span className="flex flex-wrap items-center gap-x-2">
          {lockBy(l)}
          <BatteryNote battery={l.battery} always={size === 'l'} />
        </span>
      }
      visual={(px) => (size === 'xs' || size === 'w' ? null : <IconDot icon={info.icon} hue={info.hue} px={size === 's' ? 34 : Math.round(px * 0.45)} />)}
      aside={size === 'xs' || size === 'w' ? button : size === 's' ? <BatteryNote battery={l.battery} /> : undefined}
      strip={size === 's' || size === 't' || size === 'l' ? button : undefined}
    />
  );
}
