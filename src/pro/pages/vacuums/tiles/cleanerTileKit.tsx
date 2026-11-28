/**
 * Vacuum tiles (docs/pro-ui/VACUUM_TILES.md): the Vacuums page in the Room page's layout and tile
 * language, as the Vehicle tiles are. Each tile shows one part of a cleaner (what it is doing, its
 * station, its wearing parts…), drawn with the Area tiles' kit so the pages read as one family.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BatteryCharging01Icon, BatteryFullIcon, BatteryLowIcon, Home01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TileSize } from '../../../areas/tileTypes';
import { TileFrame, TileState } from '../../../areas/tileKit';
import { busy, mainAction, statusWords, type Cleaner, type CleanerAction } from '../../../lib/vacuums/cleaner';

export { Big, IconChip, useDark, wash } from '../../mobility/tiles/vehicleTileKit';

export interface CleanerTileProps {
  c: Cleaner;
  size: TileSize;
  act: (a: CleanerAction) => void;
  now: number;
}

/** The page's hues: teal for cleaning (the Room page's vacuum), and the status pill colours. */
export const CH = {
  on: 'hsl(190 75% 44%)',
  water: 'hsl(205 85% 56%)',
  dirty: 'hsl(32 45% 46%)',
  soap: 'hsl(268 60% 64%)',
  heat: 'hsl(22 95% 58%)',
  ok: 'hsl(152 55% 42%)',
  watch: 'hsl(36 95% 50%)',
  bad: 'hsl(4 82% 54%)',
  idle: 'hsl(230 8% 58%)',
  home: 'hsl(262 60% 62%)'
} as const;

export const toneHue = (t: ReturnType<typeof statusWords>['tone']) => (t === 'on' ? CH.on : t === 'ok' ? CH.ok : t === 'watch' ? CH.watch : t === 'bad' ? CH.bad : CH.idle);

/** How far through a typical run it is (this run's area over the usual whole-home area), or null. */
export function runShare(c: Cleaner): number | null {
  const a = c.run?.areaM2;
  const typical = typicalRun(c);
  if (a == null || !typical) return null;
  return Math.max(0, Math.min(1, a / typical));
}

/** The usual whole-home run in m² (the 75th percentile of finished runs, else the lifetime average). */
export function typicalRun(c: Cleaner): number | null {
  const full = c.history.filter((h) => h.done && h.areaM2 !== null).map((h) => h.areaM2!).sort((x, y) => x - y);
  return full.length ? full[Math.floor(full.length * 0.75)] : c.lifetime?.areaM2 && c.lifetime.count ? c.lifetime.areaM2 / c.lifetime.count : null;
}

/** "Today", "Yesterday", "Tue", or "12 Nov" for older days. */
export function dayText(at: number, now: number): string {
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const days = Math.floor((d0.getTime() - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(at).toLocaleDateString(undefined, { weekday: 'short' });
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const clockText = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/** The robot seen from above: body, bumper, the laser turret (spinning while it works) and a status light. */
export function RobotTop({ px, hue, working, className, style }: { px: number; hue: string; working?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden className={cn('relative block shrink-0 rounded-full', className)} style={{ width: px, height: px, ...style }}>
      <span className="absolute inset-0 rounded-full bg-[linear-gradient(160deg,hsl(0_0%_100%),hsl(220_12%_84%))] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4),inset_0_-3px_0_rgba(0,0,0,0.08)] dark:bg-[linear-gradient(160deg,hsl(225_8%_38%),hsl(225_10%_20%))]" />
      {/* bumper */}
      <span className="absolute inset-[3%] rounded-full border-t-[3px] border-black/10 dark:border-white/15" />
      {/* laser turret */}
      <span className="absolute left-1/2 top-[16%] grid -translate-x-1/2 place-items-center rounded-full bg-[hsl(225_10%_24%)] dark:bg-[hsl(225_10%_12%)]" style={{ width: px * 0.3, height: px * 0.3 }}>
        <span className={cn('block rounded-full border-2 border-transparent', working && 'motion-safe:animate-spin [animation-duration:1.6s]')} style={{ width: px * 0.2, height: px * 0.2, borderTopColor: hue }} />
      </span>
      {/* status light */}
      <span className="absolute left-1/2 top-[62%] -translate-x-1/2 rounded-full" style={{ width: px * 0.09, height: px * 0.09, background: hue, boxShadow: working ? `0 0 ${px * 0.12}px ${hue}` : undefined }} />
    </span>
  );
}

/** The main action (Start / Pause / Resume / Retry) and Dock, the Room page's vacuum buttons. */
export function RunButtons({ c, act, size = 'md', iconOnly, dock = true, className }: { c: Cleaner; act: CleanerTileProps['act']; size?: 'sm' | 'md'; iconOnly?: boolean; dock?: boolean; className?: string }) {
  const m = mainAction(c);
  const h = size === 'sm' ? 32 : 38;
  const off = c.activity === 'offline';
  const showDock = dock && c.actions.includes('dock') && !iconOnly;
  const dockOff = off || c.activity === 'returning' || c.activity === 'docked' || c.activity === 'charging' || c.activity === 'washing' || c.activity === 'drying';
  return (
    <div className={cn('flex gap-2', className)}>
      {m ? (
        <Button
          isIconOnly={iconOnly}
          data-tile-control=""
          aria-label={`${c.name}: ${m.label.toLowerCase()}`}
          isDisabled={off}
          onPress={() => act({ type: m.type })}
          className={cn('min-w-0 shrink-0 gap-1.5 rounded-full font-semibold text-white', iconOnly ? 'p-0' : size === 'sm' ? 'flex-1 px-3 text-[12px]' : 'flex-1 px-4 text-[13px]')}
          style={{ height: h, ...(iconOnly ? { width: h } : {}), background: m.type === 'pause' ? CH.watch : CH.on }}
        >
          <HugeiconsIcon icon={m.type === 'pause' ? PauseIcon : PlayIcon} size={size === 'sm' ? 14 : 16} />
          {iconOnly ? null : m.label}
        </Button>
      ) : null}
      {showDock ? (
        <Button variant="tertiary" data-tile-control="" aria-label={`${c.name}: send to the station`} isDisabled={dockOff} onPress={() => act({ type: 'dock' })} className={cn('min-w-0 shrink-0 gap-1.5 rounded-full font-semibold', size === 'sm' ? 'px-3 text-[12px]' : 'px-4 text-[13px]')} style={{ height: h }}>
          <HugeiconsIcon icon={Home01Icon} size={size === 'sm' ? 14 : 16} />
          Dock
        </Button>
      ) : null}
    </div>
  );
}

/** A small labelled action button in a tile (Wash, Dry, Empty, Reset). */
export function ChoreButton({ icon, label, onPress, isDisabled, hue = CH.on, className }: { icon: IconSvgElement; label: string; onPress: () => void; isDisabled?: boolean; hue?: string; className?: string }) {
  return (
    <Button size="sm" variant="ghost" data-tile-control="" isDisabled={isDisabled} onPress={onPress} className={cn('h-8 min-w-0 shrink-0 gap-1.5 rounded-full px-3 text-[12px] font-semibold', className)} style={{ background: `color-mix(in srgb, ${hue} 14%, transparent)`, color: hue }}>
      <HugeiconsIcon icon={icon} size={14} />
      {label}
    </Button>
  );
}

/** The X-small row most concepts share: a visual, the word, the detail, and something at the end. */
export function XsRow({ label, visual, word, detail, hue, aside, className, style }: { label: string; visual: ReactNode; word: string; detail?: string; hue?: string; aside?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <TileFrame label={label} className={cn('pro-surface', className)} style={style}>
      <div className="flex h-full items-center gap-2.5 px-3">
        {visual}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight" style={hue ? { color: hue } : undefined}>
            {word}
          </p>
          {detail ? <TileState className="text-[12px]">{detail}</TileState> : null}
        </div>
        {aside}
      </div>
    </TileFrame>
  );
}

export const isBusy = busy;

/** A small battery note ("62%", charging bolt), for tile corners. */
export function BatteryText({ c, className }: { c: Cleaner; className?: string }) {
  if (c.battery === null) return null;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold tabular-nums', className)} style={{ color: c.battery <= 20 ? CH.bad : undefined }}>
      <HugeiconsIcon icon={c.charging ? BatteryCharging01Icon : c.battery <= 20 ? BatteryLowIcon : BatteryFullIcon} size={14} />
      {c.battery}%
    </span>
  );
}
