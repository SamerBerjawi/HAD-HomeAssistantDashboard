/**
 * Cover C · "Arrows". The tile is two big buttons: the top half opens, the bottom half closes
 * (X-small and Wide put them side by side). How open it is runs as a bar between them; while the
 * cover moves, its arrow keeps nudging that way and the bar turns into a Stop button. Made for
 * gloved fingers, the wall tablet and people who only ever want "up" or "down".
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown02Icon, ArrowUp02Icon, StopIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { CoverTileModel, TileProps, TileSize } from '../../tileTypes';
import { COVER, coverState, openness } from './coverParts';

const ARROW: Record<TileSize, number> = { xs: 20, s: 26, w: 28, t: 34, l: 40 };

function Half({ c, act, cmd, size, className }: { c: CoverTileModel; act: TileProps<CoverTileModel>['act']; cmd: 'open' | 'close'; size: TileSize; className?: string }) {
  const at = openness(c);
  const going = (cmd === 'open' && c.moving === 'opening') || (cmd === 'close' && c.moving === 'closing');
  const done = !c.moving && (cmd === 'open' ? at >= 100 : at <= 0);
  const px = ARROW[size];
  const word = cmd === 'open' ? (c.deviceClass === 'garage' || c.deviceClass === 'awning' ? 'Open' : 'Up') : c.deviceClass === 'garage' || c.deviceClass === 'awning' ? 'Close' : 'Down';
  return (
    <Button
      variant="ghost"
      data-tile-control=""
      aria-label={`${c.name}: ${cmd}`}
      isDisabled={!c.available || done}
      onPress={() => act({ type: 'cover', cmd })}
      className={cn(
        'h-auto min-h-0 w-full min-w-0 flex-1 basis-0 gap-1 rounded-[20px] p-0 font-semibold transition-[background,color] duration-200',
        size === 'xs' ? 'flex-row text-[0px]' : 'flex-col text-[12px]',
        going ? 'text-white' : 'bg-[color-mix(in_srgb,currentColor_6%,transparent)]',
        done && 'opacity-40',
        className
      )}
      style={going ? { background: COVER } : undefined}
    >
      <HugeiconsIcon
        icon={cmd === 'open' ? ArrowUp02Icon : ArrowDown02Icon}
        size={px}
        className={cn(going && (cmd === 'open' ? 'animate-[had-nudge-up_1s_ease-in-out_infinite]' : 'animate-[had-nudge-down_1s_ease-in-out_infinite]'), 'motion-reduce:animate-none')}
        style={{ width: px, height: px }}
      />
      {size === 'xs' ? null : <span className="opacity-70">{word}</span>}
    </Button>
  );
}

/** How open, as a bar; a Stop button while it moves. */
function Middle({ c, act, vertical, className }: { c: CoverTileModel; act: TileProps<CoverTileModel>['act']; vertical?: boolean; className?: string }) {
  const at = openness(c);
  if (c.moving) {
    return (
      <Button variant="secondary" data-tile-control="" aria-label={`${c.name}: stop`} onPress={() => act({ type: 'cover', cmd: 'stop' })} className={cn('h-7 min-w-0 gap-1 rounded-full px-3 text-[12px] font-semibold', className)}>
        <HugeiconsIcon icon={StopIcon} size={13} />
        Stop
      </Button>
    );
  }
  return (
    <div aria-hidden className={cn('relative overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_10%,transparent)]', vertical ? 'w-1.5' : 'h-1.5', className)}>
      <div className={cn('absolute rounded-full transition-all duration-500', vertical ? 'inset-x-0 bottom-0' : 'inset-y-0 left-0')} style={{ [vertical ? 'height' : 'width']: `${at}%`, background: COVER }} />
    </div>
  );
}

export default function CoverArrows({ e: c, size, act }: TileProps<CoverTileModel>) {
  const state = coverState(c);
  const frame = cn('pro-surface', !c.available && 'opacity-60');
  const big = !c.available ? '—' : c.position === null ? (c.isOn ? 'Open' : 'Closed') : `${c.position}%`;

  if (size === 'xs') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full items-stretch gap-1 p-1.5">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pl-2 pr-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{c.name}</TileName>
            {c.moving ? <TileState className="text-[12px]">{state}</TileState> : <Middle c={c} act={act} />}
          </div>
          <Half c={c} act={act} cmd="close" size={size} className="max-w-[34px] rounded-[14px]" />
          <Half c={c} act={act} cmd="open" size={size} className="max-w-[34px] rounded-[14px]" />
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full gap-2 p-2">
          <div className="flex min-w-0 flex-1 flex-col p-2.5 pr-1">
            <TileName className="line-clamp-1">{c.name}</TileName>
            <TileState>{state}</TileState>
            <p className="mt-auto text-[28px] font-semibold leading-none tracking-tight tabular-nums">{big}</p>
            <Middle c={c} act={act} className={cn('mt-2.5', c.moving ? 'self-start' : 'w-full')} />
          </div>
          <Half c={c} act={act} cmd="close" size={size} className="max-w-[26%]" />
          <Half c={c} act={act} cmd="open" size={size} className="max-w-[26%]" />
        </div>
      </TileFrame>
    );
  }
  if (size === 'l') {
    return (
      <TileFrame label={c.name} className={frame}>
        <div className="flex h-full gap-2 p-2">
          <div className="flex min-w-0 flex-1 flex-col p-3.5">
            <TileName className="text-[17px]">{c.name}</TileName>
            <TileState>{state}</TileState>
            <p className="mt-auto text-[48px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{big}</p>
            <Middle c={c} act={act} className={cn('mt-3', c.moving ? 'self-start' : 'w-full')} />
          </div>
          <div className="flex w-[44%] shrink-0 flex-col gap-2">
            <Half c={c} act={act} cmd="open" size={size} />
            <Half c={c} act={act} cmd="close" size={size} />
          </div>
        </div>
      </TileFrame>
    );
  }
  // Small and Tall: up on top, down below, the name and the bar between them.
  return (
    <TileFrame label={c.name} className={frame}>
      <div className="flex h-full flex-col gap-1.5 p-1.5">
        <Half c={c} act={act} cmd="open" size={size} />
        <div className={cn('flex flex-col items-center px-2 text-center', size === 't' ? 'gap-1.5 py-2' : 'gap-1 py-0.5')}>
          <TileName className={cn('line-clamp-1 w-full truncate', size === 's' && 'text-[13px]')}>{c.name}</TileName>
          {size === 't' ? <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">{big}</p> : null}
          <Middle c={c} act={act} className={c.moving ? '' : 'w-3/4'} />
          {size === 't' && !c.moving ? <TileState className="text-[12px]">{state}</TileState> : null}
        </div>
        <Half c={c} act={act} cmd="close" size={size} />
      </div>
    </TileFrame>
  );
}
