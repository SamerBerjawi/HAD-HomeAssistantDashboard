/**
 * Shared bits for the batch 4 tiles (camera, lock, door & window, motion, leak & smoke): the safe /
 * attention / alarm colours, the words for each state, icons, a battery note, and `Shell`, a
 * five-size layout that a concept fills with its own visual (each concept still owns its look and
 * interaction; the shell only keeps name and state in the same places across the family).
 */
import type { CSSProperties, ReactNode } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  BatteryLowIcon,
  DoorClosedIcon,
  DoorOpenIcon,
  DropletIcon,
  FireIcon,
  GarageIcon,
  GridViewIcon,
  Motion02Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  User02Icon,
  Alert02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import { agoText, type LockTileModel, type MotionTileModel, type OpeningTileModel, type SafetyTileModel, type TileSize } from '../../tileTypes';

export const SAFE = 'hsl(152 55% 42%)';
export const WATCH = 'hsl(36 95% 50%)';
export const ALARM = 'hsl(4 82% 54%)';
export const CALM = 'hsl(230 8% 58%)';
export const SEEN = 'hsl(205 85% 55%)';

/** "12m", "2h 5m", "3d" (no "for"/"ago"). */
export function span(from: number | null, now = Date.now()): string {
  if (!from) return '';
  const m = Math.max(0, Math.round((now - from) / 60_000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h${m % 60 && h < 10 ? ` ${m % 60}m` : ''}` : `${Math.floor(h / 24)}d`;
}

/* ── Lock ── */
export function lockInfo(l: LockTileModel): { word: string; hue: string; icon: IconSvgElement; safe: boolean } {
  if (!l.available) return { word: 'Unavailable', hue: CALM, icon: SquareLock02Icon, safe: false };
  switch (l.state) {
    case 'locked':
      return { word: 'Locked', hue: SAFE, icon: SquareLock02Icon, safe: true };
    case 'locking':
      return { word: 'Locking…', hue: WATCH, icon: SquareLock02Icon, safe: false };
    case 'unlocking':
      return { word: 'Unlocking…', hue: WATCH, icon: SquareUnlock02Icon, safe: false };
    case 'jammed':
      return { word: 'Jammed', hue: ALARM, icon: Alert02Icon, safe: false };
    case 'open':
      return { word: 'Open', hue: WATCH, icon: DoorOpenIcon, safe: false };
    default:
      return { word: 'Unlocked', hue: WATCH, icon: SquareUnlock02Icon, safe: false };
  }
}
/** "By Sam · 6m ago", "Auto-lock · 1h ago". */
export const lockBy = (l: LockTileModel) => (l.available ? [l.changedBy ? (l.changedBy === 'Auto-lock' || l.changedBy === 'Keypad' ? l.changedBy : `By ${l.changedBy}`) : null, l.lastChanged ? agoText(l.lastChanged) : null].filter(Boolean).join(' · ') : '');

/* ── Door & window ── */
export const openingIcon = (o: OpeningTileModel): IconSvgElement => (o.deviceClass === 'garage_door' ? GarageIcon : o.deviceClass === 'window' ? GridViewIcon : o.isOn ? DoorOpenIcon : DoorClosedIcon);
/** Long open spells get the attention colour: a door after 5 min, a window after 2 h. */
export function openingInfo(o: OpeningTileModel): { word: string; hue: string; long: boolean } {
  if (!o.available) return { word: 'Unavailable', hue: CALM, long: false };
  if (!o.isOn) return { word: 'Closed', hue: SAFE, long: false };
  const mins = o.lastChanged ? (Date.now() - o.lastChanged) / 60_000 : 0;
  const long = mins > (o.deviceClass === 'window' ? 120 : 5);
  return { word: 'Open', hue: long ? ALARM : WATCH, long };
}
export const openingSince = (o: OpeningTileModel) => (o.available && o.lastChanged ? `${o.isOn ? 'Open' : 'Closed'} ${span(o.lastChanged) === 'now' ? 'just now' : `for ${span(o.lastChanged)}`}` : '');

/* ── Motion & presence ── */
export const motionIcon = (m: MotionTileModel): IconSvgElement => (m.deviceClass === 'motion' ? Motion02Icon : User02Icon);
export function motionInfo(m: MotionTileModel): { word: string; hue: string; detail: string } {
  if (!m.available) return { word: 'Unavailable', hue: CALM, detail: '' };
  const presence = m.deviceClass !== 'motion';
  if (m.isOn) return { word: presence ? 'Occupied' : 'Motion', hue: SEEN, detail: presence ? `For ${span(m.lastChanged)}` : 'Detected now' };
  return { word: presence ? 'Empty' : 'Clear', hue: CALM, detail: m.lastChanged ? `Last ${presence ? 'there' : 'motion'} ${agoText(m.lastChanged).toLowerCase()}` : 'No motion yet' };
}

/* ── Leak & smoke ── */
export const safetyIcon = (s: SafetyTileModel): IconSvgElement => (s.deviceClass === 'moisture' ? DropletIcon : s.deviceClass === 'smoke' ? AlarmSmokeIcon : FireIcon);
const HAZARD: Record<SafetyTileModel['deviceClass'], [string, string]> = {
  moisture: ['Dry', 'Leak'],
  smoke: ['No smoke', 'Smoke'],
  gas: ['No gas', 'Gas'],
  carbon_monoxide: ['No CO', 'Carbon monoxide']
};
export function safetyInfo(s: SafetyTileModel): { word: string; hue: string; alarm: boolean; detail: string } {
  if (!s.available) return { word: 'Not reporting', hue: WATCH, alarm: false, detail: s.lastSeen ? `Last heard ${agoText(s.lastSeen).toLowerCase()}` : 'Check the sensor' };
  if (s.isOn) return { word: `${HAZARD[s.deviceClass][1]}!`, hue: ALARM, alarm: true, detail: `Detected ${agoText(s.lastChanged).toLowerCase()}` };
  return { word: HAZARD[s.deviceClass][0], hue: SAFE, alarm: false, detail: s.lastSeen ? `Checked ${agoText(s.lastSeen).toLowerCase()}` : 'All clear' };
}

/* ── Shared pieces ── */

/** A low-battery note (≤ 20 %); nothing otherwise, so healthy sensors stay quiet. */
export function BatteryNote({ battery, className, always }: { battery: number | null; className?: string; always?: boolean }) {
  if (battery === null || (!always && battery > 20)) return null;
  const low = battery <= 20;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums', className)} style={low ? { color: ALARM } : { opacity: 0.6 }}>
      <HugeiconsIcon icon={BatteryLowIcon} size={13} />
      {battery}%
    </span>
  );
}

/** A tinted round icon. */
export function IconDot({ icon, hue, px, solid, className, style }: { icon: IconSvgElement; hue: string; px: number; solid?: boolean; className?: string; style?: CSSProperties }) {
  const ip = Math.round(px * 0.5);
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-full', className)} style={{ width: px, height: px, background: solid ? hue : `color-mix(in srgb, ${hue} 15%, transparent)`, color: solid ? 'white' : hue, ...style }}>
      <HugeiconsIcon icon={icon} size={ip} style={{ width: ip, height: ip }} />
    </span>
  );
}

const VISUAL: Record<TileSize, number> = { xs: 40, s: 52, w: 96, t: 112, l: 150 };

/**
 * The five sizes: X-small a row (visual left), Small visual on top and words below, Wide visual
 * left and words right, Tall visual in the middle, Large visual left with words and extras right.
 * `strip` (a timeline, a meter) goes along the bottom from Small up; `aside` sits top-right.
 */
export function Shell({
  size,
  label,
  name,
  state,
  detail,
  visual,
  strip,
  aside,
  extra,
  wrap,
  className,
  style
}: {
  size: TileSize;
  label: string;
  name: string;
  state: ReactNode;
  detail?: ReactNode;
  visual: (px: number) => ReactNode;
  strip?: ReactNode;
  aside?: ReactNode;
  extra?: ReactNode;
  /** Let the state line wrap (up to three lines) instead of truncating: for sentences. */
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const px = VISUAL[size];
  const sw = wrap ? 'line-clamp-3 whitespace-normal' : '';
  if (size === 'xs') {
    return (
      <TileFrame label={label} className={className} style={style}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {visual(px)}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{name}</TileName>
            <TileState className="text-[12px]">{state}</TileState>
          </div>
          {aside}
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={label} className={className} style={style}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            {visual(px)}
            {aside}
          </div>
          <div className="mt-auto min-w-0">
            <TileName className="line-clamp-2">{name}</TileName>
            <TileState className={sw}>{state}</TileState>
          </div>
          {strip ? <div className="mt-2">{strip}</div> : null}
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={label} className={className} style={style}>
        <div className="flex h-full items-center gap-4 p-3.5 pl-4">
          {visual(px)}
          <div className="flex min-w-0 flex-1 flex-col self-stretch py-0.5">
            <div className="flex items-start gap-2">
              <TileName className="line-clamp-1 flex-1">{name}</TileName>
              {aside}
            </div>
            <TileState className={cn('mt-0.5', sw)}>{state}</TileState>
            {detail ? <div className="mt-1 text-[12px] opacity-60">{detail}</div> : null}
            {strip ? <div className="mt-auto pt-2">{strip}</div> : extra ? <div className="mt-auto pt-2">{extra}</div> : null}
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={label} className={className} style={style}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-start gap-2">
            <TileName className="line-clamp-2 flex-1">{name}</TileName>
            {aside}
          </div>
          <div className="my-auto flex justify-center py-2">{visual(px)}</div>
          <TileState className={cn('text-[15px] font-semibold opacity-100', sw)}>{state}</TileState>
          {detail ? <div className="mt-0.5 text-[12px] opacity-60">{detail}</div> : null}
          {strip ? <div className="mt-3">{strip}</div> : extra ? <div className="mt-3">{extra}</div> : null}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={label} className={className} style={style}>
      <div className="flex h-full flex-col p-5">
        <div className="flex min-h-0 flex-1 items-center gap-5">
          {visual(px)}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start gap-2">
              <TileName className="flex-1 text-[17px]">{name}</TileName>
              {aside}
            </div>
            <div className="text-[22px] font-semibold leading-tight">{state}</div>
            {detail ? <div className="text-[13px] opacity-60">{detail}</div> : null}
            {extra ? <div className="mt-2">{extra}</div> : null}
          </div>
        </div>
        {strip ? <div className="mt-3">{strip}</div> : null}
      </div>
    </TileFrame>
  );
}

/** Tick marks for event times on a 0…`hours` strip ending now (motion, camera). */
export function EventStrip({ times, hours = 6, hue, className, labels }: { times: number[]; hours?: number; hue: string; className?: string; labels?: boolean }) {
  const now = Date.now();
  const x = (t: number) => `${Math.max(0, Math.min(1, 1 - (now - t) / (hours * 3_600_000))) * 100}%`;
  return (
    <div aria-hidden className={className}>
      <div className="relative h-5 rounded-md bg-[color-mix(in_srgb,currentColor_6%,transparent)]">
        {times.map((t, i) => (
          <span key={i} className="absolute inset-y-1 w-[3px] -translate-x-1/2 rounded-full" style={{ left: x(t), background: hue, opacity: 0.35 + 0.65 * (1 - (now - t) / (hours * 3_600_000)) }} />
        ))}
      </div>
      {labels ? (
        <div className="mt-1 flex justify-between text-[10px] opacity-50">
          <span>{hours} h ago</span>
          <span>Now</span>
        </div>
      ) : null}
    </div>
  );
}
