/**
 * Ambient (D) for batch 4's new types: glass cards where the state's colour glows from a corner
 * (green safe, amber open or unlocked, blue motion, red alarm), a round status orb, generous type.
 * - Lock: the orb is the control. Tap to lock; unlocking asks "Tap again" for three seconds.
 * - Door & window, Motion & presence, Leak & smoke: read-only; the orb shows the state, a wave rises
 *   while it's open, seeing someone, or alarming.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { LockTileModel, MotionTileModel, OpeningTileModel, SafetyTileModel, TileProps, TileSize } from '../../tileTypes';
import { BatteryNote, lockBy, lockInfo, motionIcon, motionInfo, openingIcon, openingInfo, openingSince, safetyIcon, safetyInfo } from '../security/securityParts';
import { AName, AState, Glass, glowStyle, OrbButton, Wave } from './ambientKit';

/** A non-interactive orb (sensors only report). */
export function StatusOrb({ icon, hue, on, px }: { icon: IconSvgElement; hue: string; on: boolean; px: number }) {
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full', on ? 'text-white' : 'bg-black/[0.06] dark:bg-white/10')}
      style={{ width: px, height: px, ...(on ? { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${hue} 55%, white), ${hue})`, boxShadow: `0 0 26px -2px color-mix(in srgb, ${hue} 70%, transparent)` } : { color: hue }) }}
    >
      <HugeiconsIcon icon={icon} size={Math.round(px * 0.46)} />
    </span>
  );
}

/** The shared Ambient layout: X-small a row, Small orb at the bottom, Wide orb right, Tall orb centred, Large orb top-right with a big word. */
export function AmbientCard({ size, label, name, word, detail, hue, level, orb, aside, dim }: { size: TileSize; label: string; name: string; word: string; detail: string; hue: string; level: number; orb: (px: number) => ReactNode; aside?: ReactNode; dim?: boolean }) {
  const style = level > 0 ? glowStyle(hue, level, size === 'xs' ? '10% 50%' : '85% 85%') : undefined;
  const wave = size === 'xs' ? null : <Wave color={hue} level={level * 0.7} />;
  const cls = cn(dim && 'opacity-60');
  if (size === 'xs') {
    return (
      <Glass label={label} style={style} className={cls}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {orb(42)}
          <div className="min-w-0 flex-1">
            <AName className="line-clamp-1 truncate text-[14px]">{name}</AName>
            <AState className="mt-0.5 text-[12px]">{word}</AState>
          </div>
          {aside}
        </div>
      </Glass>
    );
  }
  if (size === 's') {
    return (
      <Glass label={label} style={style} className={cls}>
        {wave}
        <div className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <AName className="text-[15px]">{name}</AName>
              <AState className="text-[12px]">{word}</AState>
            </div>
            {aside}
          </div>
          <div className="mt-auto flex justify-center">{orb(52)}</div>
        </div>
      </Glass>
    );
  }
  if (size === 'w') {
    return (
      <Glass label={label} style={style} className={cls}>
        {wave}
        <div className="flex h-full items-center gap-4 p-4 pl-5">
          <div className="min-w-0 flex-1">
            <AName>{name}</AName>
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight" style={{ color: level > 0 ? hue : undefined }}>
              {word}
            </p>
            <AState className="mt-1.5 text-[12px]">{detail}</AState>
          </div>
          <div className="flex flex-col items-end gap-2">
            {aside}
            {orb(60)}
          </div>
        </div>
      </Glass>
    );
  }
  return (
    <Glass label={label} style={style} className={cls}>
      {wave}
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start gap-2">
          <AName className={cn('flex-1', size === 'l' && 'text-[18px]')}>{name}</AName>
          {aside}
        </div>
        {size === 't' ? <div className="my-auto flex justify-center">{orb(80)}</div> : <div className="mt-4">{orb(72)}</div>}
        <p className={cn('font-semibold leading-none tracking-tight', size === 'l' ? 'mt-auto text-[40px]' : 'text-[24px]')} style={{ color: level > 0 ? hue : undefined }}>
          {word}
        </p>
        <AState className="mt-1.5 text-[12px]">{detail}</AState>
      </div>
    </Glass>
  );
}

export function AmbientLock({ e: l, size, act }: TileProps<LockTileModel>) {
  const info = lockInfo(l);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => setConfirm(false), [l.state]);
  const locked = l.state === 'locked';
  const orb = (px: number) => (
    <OrbButton
      icon={info.icon}
      label={`${l.name}: ${locked ? (confirm ? 'tap again to unlock' : 'unlock') : 'lock'}`}
      on={l.available}
      color={confirm ? 'hsl(36 95% 50%)' : info.hue}
      size={px}
      isDisabled={!l.available}
      onPress={() => {
        if (!locked) return act({ type: 'lock', cmd: 'lock' });
        if (confirm) {
          setConfirm(false);
          return act({ type: 'lock', cmd: 'unlock' });
        }
        setConfirm(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setConfirm(false), 3000);
      }}
    />
  );
  return (
    <AmbientCard
      size={size}
      label={l.name}
      name={l.name}
      word={confirm ? 'Tap again to unlock' : info.word}
      detail={lockBy(l)}
      hue={info.hue}
      level={l.available ? (info.safe ? 0.45 : 0.85) : 0}
      orb={orb}
      aside={<BatteryNote battery={l.battery} />}
      dim={!l.available}
    />
  );
}

export function AmbientOpening({ e: o, size }: TileProps<OpeningTileModel>) {
  const info = openingInfo(o);
  const open = o.available && o.isOn;
  return (
    <AmbientCard
      size={size}
      label={o.name}
      name={o.name}
      word={size === 'xs' ? openingSince(o) || info.word : info.word}
      detail={openingSince(o)}
      hue={info.hue}
      level={open ? 0.8 : 0}
      orb={(px) => <StatusOrb icon={openingIcon(o)} hue={info.hue} on={open} px={px} />}
      aside={<BatteryNote battery={o.battery} />}
      dim={!o.available}
    />
  );
}

export function AmbientMotion({ e: m, size }: TileProps<MotionTileModel>) {
  const info = motionInfo(m);
  const on = m.available && m.isOn;
  return (
    <AmbientCard
      size={size}
      label={m.name}
      name={m.name}
      word={size === 'xs' && !on ? info.detail || info.word : info.word}
      detail={info.detail}
      hue={info.hue}
      level={on ? 0.75 : 0}
      orb={(px) => <StatusOrb icon={motionIcon(m)} hue={info.hue} on={on} px={px} />}
      aside={<BatteryNote battery={m.battery} />}
      dim={!m.available}
    />
  );
}

export function AmbientSafety({ e: s, size }: TileProps<SafetyTileModel>) {
  const info = safetyInfo(s);
  return (
    <AmbientCard
      size={size}
      label={s.name}
      name={s.name}
      word={info.word}
      detail={info.detail}
      hue={info.hue}
      level={info.alarm ? 1 : s.available ? 0.25 : 0.5}
      orb={(px) => <StatusOrb icon={info.alarm || !s.available ? safetyIcon(s) : CheckmarkCircle02Icon} hue={info.hue} on={info.alarm || !s.available} px={px} />}
      aside={<BatteryNote battery={s.battery} />}
    />
  );
}
