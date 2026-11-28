/**
 * Vehicle tiles · batch 7 · Statistics (docs/pro-ui/VEHICLE_TILES.md): the pieces the Distance,
 * Efficiency, Charging-history and Allowance tiles share. Charts are frameless (no axes, no grid),
 * drawn with divs and one SVG path, in the tile's own colour so they work light and dark.
 */
import type { ReactNode } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { TileSize } from '../../../../areas/tileTypes';
import { IconChip } from '../vehicleTileKit';

export const ACCENT = 'var(--accent)';
export const FAINT = 'color-mix(in srgb, currentColor 14%, transparent)';
export const pad = (size: TileSize) => (size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4');
export const n0 = (n: number) => Math.round(n).toLocaleString();

/** The greyed tile for a vehicle with no history for this part. */
export function StatsUnavailable({ title, icon, text }: { title: string; icon: IconSvgElement; text: string }) {
  return (
    <TileFrame label={title} className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={icon} on={false} />
        <TileName className="mt-auto">{title}</TileName>
        <TileState>{text}</TileState>
      </div>
    </TileFrame>
  );
}

/** X-small: chip, value, what it is. */
export function StatsRow({ title, icon, hue = ACCENT, value, label }: { title: string; icon: IconSvgElement; hue?: string; value: ReactNode; label: ReactNode }) {
  return (
    <TileFrame label={title} className="pro-surface">
      <div className="flex h-full items-center gap-2.5 px-3">
        <IconChip icon={icon} hue={hue} px={32} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tabular-nums">{value}</p>
          <TileState className="text-[12px]">{label}</TileState>
        </div>
      </div>
    </TileFrame>
  );
}

/** Month bars, bottom aligned; `lit` bars in their colour, the rest faint. */
export function Bars({ values, colors, labels, className, max }: { values: number[]; colors: (string | null)[]; labels?: string[]; className?: string; max?: number }) {
  const top = max ?? Math.max(1, ...values);
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 items-end gap-[3px]">
        {values.map((x, i) => (
          <span key={i} className="min-w-0 flex-1 rounded-[3px]" style={{ height: `${Math.max(4, (x / top) * 100)}%`, background: colors[i] ?? FAINT }} />
        ))}
      </div>
      {labels ? (
        <div className="mt-1 flex gap-[3px] text-[10px] leading-none opacity-50">
          {labels.map((l, i) => (
            <span key={i} className="min-w-0 flex-1 truncate text-center">
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A path through `values` across a w × h box (nulls skipped), for an SVG with preserveAspectRatio none. */
export function linePath(values: (number | null)[], w: number, h: number, min: number, max: number, count = values.length) {
  const span = max - min || 1;
  return values
    .map((y, i) => (y === null ? null : `${(i / Math.max(1, count - 1)) * w},${h - ((y - min) / span) * h}`))
    .filter(Boolean)
    .map((p, i) => `${i ? 'L' : 'M'}${p}`)
    .join(' ');
}

/** A month's first letter, as the bars' labels. */
export const initial = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'narrow' });
