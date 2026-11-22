/** Shared bits for the cover tiles: colour, words, icon, and the stop / open / close buttons. */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, BlindsIcon, CurtainsIcon, GarageIcon, StopIcon, Sun03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { CoverTileModel, TileAction } from '../../tileTypes';

/** Daylight teal (the Rooms accent). */
export const COVER = 'hsl(186 68% 42%)';

export const coverIcon = (c: CoverTileModel): IconSvgElement => (c.deviceClass === 'garage' ? GarageIcon : c.deviceClass === 'curtain' ? CurtainsIcon : c.deviceClass === 'awning' ? Sun03Icon : BlindsIcon);

/** How open, 0–100: the position, or 0 / 100 for open/close-only covers. */
export const openness = (c: CoverTileModel) => (c.position ?? (c.isOn ? 100 : 0));

/** "Open · 60%", "Closed", "Opening…", "Unavailable". */
export function coverState(c: CoverTileModel): string {
  if (!c.available) return 'Unavailable';
  if (c.moving) return c.moving === 'opening' ? 'Opening…' : 'Closing…';
  if (c.position === null) return c.isOn ? 'Open' : 'Closed';
  if (c.position <= 0) return 'Closed';
  if (c.position >= 100) return 'Open';
  return `Open · ${c.position}%`;
}

export function CoverButton({
  c,
  act,
  cmd,
  size = 34,
  className,
  children,
  variant = 'secondary'
}: {
  c: CoverTileModel;
  act: (a: TileAction) => void;
  cmd: 'open' | 'close' | 'stop';
  size?: number;
  className?: string;
  children?: ReactNode;
  variant?: 'secondary' | 'ghost';
}) {
  const icon = cmd === 'open' ? ArrowUp01Icon : cmd === 'close' ? ArrowDown01Icon : StopIcon;
  const at = openness(c);
  const blocked = !c.available || (cmd === 'open' && at >= 100 && !c.moving) || (cmd === 'close' && at <= 0 && !c.moving);
  const word = cmd === 'open' ? 'open' : cmd === 'close' ? 'close' : 'stop';
  const px = Math.round(size * 0.48);
  return (
    <Button
      isIconOnly={!children}
      variant={variant}
      data-tile-control=""
      aria-label={`${c.name}: ${word}`}
      isDisabled={blocked}
      onPress={() => act({ type: 'cover', cmd })}
      className={cn('min-w-0 shrink-0 rounded-full p-0', children && 'gap-1.5 px-3 text-[13px] font-semibold', className)}
      style={children ? { height: size } : { width: size, height: size }}
    >
      <HugeiconsIcon icon={icon} size={px} style={{ width: px, height: px }} />
      {children}
    </Button>
  );
}
