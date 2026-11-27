/**
 * Vehicle tiles · batch 3 · Doors (docs/pro-ui/VEHICLE_TILES.md): is the car locked; lock in one
 * press, unlock in two steps (press, then hold while it fills: the Room page's rule, 2026-11-21).
 * A · Status: the Room page's Lock · Status for the car: Locked in green or Unlocked in amber, by
 *   word, one button.
 * B · Shield: the whole verdict (locks, openings, alarm) as a shield with its three checks; the
 *   same button.
 * C · Car: the car's side drawn in fine line, a padlock on the door, tinted by the state.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, SecurityCheckIcon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { GuardedLockButton } from '../../../../areas/tiles/security/LockTiles';
import { ALARM, SAFE, WATCH } from '../../../../areas/tiles/security/securityParts';
import { has, type Vehicle } from '../../../../lib/mobilityHome';
import { VehicleSilhouette } from '../../home/parts';
import { IconChip, openLabel, securityWords, VHUE, wash, type VehicleTileProps } from '../vehicleTileKit';

const TONE = { safe: SAFE, watch: WATCH, alarm: ALARM, idle: VHUE.idle } as const;

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label="Doors" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={SquareLock02Icon} on={false} />
        <TileName className="mt-auto">Doors</TileName>
        <TileState>{v.kind === 'bike' ? 'No lock on this bike' : 'Not reporting its locks'}</TileState>
      </div>
    </TileFrame>
  );
}

function LockButton({ v, act, compact, full }: { v: Vehicle; act: VehicleTileProps['act']; compact?: boolean; full?: boolean }) {
  const locked = !!v.security.locked;
  return <GuardedLockButton name={v.name} locked={locked} available={has(v, locked ? 'unlock' : 'lock')} onLock={() => act({ type: 'lock' })} onUnlock={() => act({ type: 'unlock' })} compact={compact} full={full} />;
}

const lockWord = (v: Vehicle) => (v.security.locked ? 'Locked' : 'Unlocked');
const lockHue = (v: Vehicle) => (v.security.locked ? SAFE : WATCH);

// ---------------------------------------------------------------------------------------------
// A · Status
// ---------------------------------------------------------------------------------------------

export function DoorsStatus({ v, size, act }: VehicleTileProps) {
  if (v.security.locked === null) return <Unavailable v={v} />;
  const hue = lockHue(v);
  const icon = v.security.locked ? SquareLock02Icon : SquareUnlock02Icon;
  const detail = v.security.locked ? (v.security.alarm === 'armed' ? 'Alarm set' : 'Doors') : 'Lock it before you go';
  if (size === 'xs')
    return (
      <TileFrame label="Doors" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={{ color: hue }}>
            {lockWord(v)}
          </p>
          <LockButton v={v} act={act} compact />
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Doors" className="pro-surface" style={v.security.locked ? undefined : wash(WATCH)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <IconChip icon={icon} hue={hue} px={size === 'l' ? 40 : 32} />
          {size === 'w' ? <LockButton v={v} act={act} /> : null}
        </div>
        <div className="mt-auto">
          <TileName className="opacity-70">Doors</TileName>
          <p className={cn('font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[34px]' : 'text-[22px]')} style={{ color: hue }}>
            {lockWord(v)}
          </p>
          {size !== 's' ? <TileState>{detail}</TileState> : null}
          {size !== 'w' ? (
            <div className="mt-2.5">
              <LockButton v={v} act={act} full />
            </div>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Shield
// ---------------------------------------------------------------------------------------------

function checks(v: Vehicle) {
  const s = v.security;
  return [
    { id: 'lock', ok: !!s.locked, text: s.locked ? 'Locked' : 'Unlocked' },
    v.kind === 'car' ? { id: 'open', ok: s.open.length === 0, text: s.open.length ? (s.open.length === 1 ? `${openLabel(s.open[0])} open` : `${s.open.length} open`) : 'All closed' } : null,
    s.alarm ? { id: 'alarm', ok: s.alarm === 'armed', text: s.alarm === 'armed' ? 'Alarm set' : s.alarm === 'triggered' ? 'Alarm going off' : 'Alarm off' } : null
  ].filter((c) => c !== null);
}

export function DoorsShield({ v, size, act }: VehicleTileProps) {
  if (v.security.locked === null) return <Unavailable v={v} />;
  const w = securityWords(v);
  const hue = TONE[w.tone];
  const secure = w.tone === 'safe';
  const word = secure ? 'Secure' : w.word;
  const shield = (px: number) => (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: px, height: px, background: `color-mix(in srgb, ${hue} 16%, transparent)`, color: hue, boxShadow: secure ? undefined : `0 0 18px -4px ${hue}` }}>
      <HugeiconsIcon icon={secure ? SecurityCheckIcon : Alert02Icon} size={Math.round(px * 0.5)} />
    </span>
  );
  const list = (
    <ul className="flex flex-col gap-1">
      {checks(v).map((c) => (
        <li key={c.id} className="flex items-center gap-1.5 text-[13px]">
          <HugeiconsIcon icon={c.ok ? CheckmarkCircle02Icon : Alert02Icon} size={15} style={{ color: c.ok ? SAFE : c.id === 'alarm' && v.security.alarm === 'triggered' ? ALARM : WATCH }} />
          <span className={cn(c.ok && 'opacity-75')}>{c.text}</span>
        </li>
      ))}
    </ul>
  );
  if (size === 'xs')
    return (
      <TileFrame label="Doors" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          {shield(34)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold" style={{ color: hue }}>
              {word}
            </p>
            <TileState className="text-[12px]">{w.detail}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Doors" className="pro-surface" style={secure ? undefined : wash(hue)}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            {shield(40)}
            <LockButton v={v} act={act} compact />
          </div>
          <p className="mt-auto truncate text-[18px] font-semibold tracking-[-0.02em]" style={{ color: hue }}>
            {word}
          </p>
          <TileState>{w.detail}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Doors" className="pro-surface" style={secure ? undefined : wash(hue)}>
      <div className={cn('flex h-full', size === 'l' ? 'flex-col p-5' : 'gap-4 p-4')}>
        <div className={cn('flex flex-col', size === 'w' && 'min-w-0 flex-1')}>
          {shield(size === 'l' ? 56 : 44)}
          <p className={cn('mt-auto font-semibold tracking-[-0.02em]', size === 'l' ? 'pt-4 text-[30px]' : 'text-[22px]')} style={{ color: hue }}>
            {word}
          </p>
        </div>
        <div className={cn('flex flex-col justify-between gap-3', size === 'w' ? 'shrink-0' : 'mt-4 flex-1')}>
          {list}
          <LockButton v={v} act={act} full={size === 'l'} />
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Car
// ---------------------------------------------------------------------------------------------

export function DoorsCar({ v, size, act }: VehicleTileProps) {
  if (v.security.locked === null) return <Unavailable v={v} />;
  const hue = lockHue(v);
  const icon = v.security.locked ? SquareLock02Icon : SquareUnlock02Icon;
  // The car in fine line with a padlock badge where the front door is.
  const car = (width: string) => (
    <div className="relative mx-auto" style={{ width }}>
      <VehicleSilhouette kind={v.kind} className="w-full" style={{ filter: `drop-shadow(0 0 10px color-mix(in srgb, ${hue} 35%, transparent))` }} />
      <span className="absolute left-[50%] top-[46%] grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ring-2 ring-[var(--surface)]" style={{ width: '18%', aspectRatio: '1', background: hue, color: 'white' }}>
        <HugeiconsIcon icon={icon} className="h-1/2 w-1/2" />
      </span>
    </div>
  );
  if (size === 'xs')
    return (
      <TileFrame label="Doors" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          {/* X-small: the badge's colour says it; no room for the word too. */}
          <div className="min-w-0 flex-1" title={lockWord(v)}>
            {car('100%')}
          </div>
          <LockButton v={v} act={act} compact />
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Doors" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <TileName>Doors</TileName>
          <span className="text-[13px] font-semibold" style={{ color: hue }}>
            {lockWord(v)}
          </span>
        </div>
        <div className="my-auto py-1">{car(size === 's' ? '100%' : size === 'w' ? '62%' : '88%')}</div>
        <LockButton v={v} act={act} compact={size === 's'} full />
      </div>
    </TileFrame>
  );
}
