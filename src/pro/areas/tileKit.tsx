/**
 * The few things every area tile shares, so different designs still read as one family: the
 * frame (radius, clipping), the name and state type styles, and small in-tile controls that a
 * tile's own drag gesture leaves alone (`data-tile-control`).
 */
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export const TILE_RADIUS = 'rounded-[26px]';

export function TileFrame({ label, className, style, children, ...rest }: { label: string; className?: string; style?: CSSProperties; children: ReactNode } & Record<`data-${string}`, string>) {
  return (
    <section aria-label={label} className={cn('relative isolate h-full w-full min-w-0 overflow-hidden', TILE_RADIUS, className)} style={style} {...rest}>
      {children}
    </section>
  );
}

/** Entity name: semibold, two lines at most, never clipped mid-word. */
export function TileName({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('line-clamp-2 min-w-0 break-words text-[15px] font-semibold leading-[1.15] tracking-[-0.01em]', className)}>{children}</p>;
}

/** State line under the name ("62% · Warm", "Off", "On for 2h"). */
export function TileState({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('min-w-0 truncate text-[13px] leading-tight opacity-70', className)}>{children}</p>;
}

/** A small round control inside a tile. */
export function TileIconButton({
  icon,
  label,
  onPress,
  className,
  style,
  size = 34,
  pressed,
  isDisabled
}: {
  icon: IconSvgElement;
  label: string;
  onPress: () => void;
  className?: string;
  style?: CSSProperties;
  size?: number;
  pressed?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      aria-pressed={pressed}
      isDisabled={isDisabled}
      onPress={onPress}
      data-tile-control=""
      className={cn('min-w-0 shrink-0 rounded-full p-0', className)}
      style={{ width: size, height: size, ...style }}
    >
      <HugeiconsIcon icon={icon} size={Math.round(size * 0.5)} />
    </Button>
  );
}

/** A small text chip inside a tile (presets, modes). */
export function TileChip({ children, label, onPress, active, className, style, isDisabled }: { children: ReactNode; label: string; onPress: () => void; active?: boolean; className?: string; style?: CSSProperties; isDisabled?: boolean }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      isDisabled={isDisabled}
      onPress={onPress}
      data-tile-control=""
      className={cn('h-7 min-w-0 shrink-0 rounded-full px-2.5 text-[12px] font-semibold', className)}
      style={style}
    >
      {children}
    </Button>
  );
}

/** Tone presets for white light (kelvin). */
export const WHITE_TONES = [
  { id: 'warm', label: 'Warm', k: 2700 },
  { id: 'soft', label: 'Soft', k: 3500 },
  { id: 'neutral', label: 'Neutral', k: 4200 },
  { id: 'day', label: 'Daylight', k: 6000 }
] as const;

/** Colour presets for colour lights. */
export const COLOR_PRESETS = [
  { label: 'Ember', rgb: 'rgb(255, 120, 60)' },
  { label: 'Rose', rgb: 'rgb(255, 92, 160)' },
  { label: 'Violet', rgb: 'rgb(123, 97, 255)' },
  { label: 'Ocean', rgb: 'rgb(56, 150, 255)' },
  { label: 'Mint', rgb: 'rgb(70, 220, 170)' }
] as const;

/** "Warm", "Daylight" or "" for a kelvin value. */
export const toneName = (k: number | null) => (k ? [...WHITE_TONES].sort((a, b) => Math.abs(a.k - k) - Math.abs(b.k - k))[0].label : '');
