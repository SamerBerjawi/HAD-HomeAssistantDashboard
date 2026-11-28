/**
 * Fan A · "Rotor". The fan you can see: its rotor turns at the fan's real speed (still when off,
 * a blur at the top speed). Tap the rotor to switch it; − and + step the speed, with a row of
 * level dots so "how fast" is never a guess. Large adds the modes, oscillation and direction.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowReloadHorizontalIcon, MinusSignIcon, PlusSignIcon, RotateClockwiseIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileChip, TileFrame, TileIconButton, TileName, TileState } from '../../tileKit';
import { cap, pctOfLevel, type FanTileModel, type TileProps, type TileSize } from '../../tileTypes';
import { AIR, fanLevel, fanState, Rotor } from './fanParts';

const ROTOR: Record<TileSize, number> = { xs: 30, s: 58, w: 100, t: 116, l: 104 };

function Dots({ e, act }: { e: FanTileModel; act: TileProps<FanTileModel>['act'] }) {
  const at = fanLevel(e);
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${e.name} speed`}>
      {Array.from({ length: e.levels }, (_, i) => (
        <Button
          key={i}
          variant="ghost"
          isDisabled={!e.available}
          aria-label={`${e.name}: speed ${i + 1}${i + 1 === at ? ', current' : ''}`}
          aria-pressed={i + 1 === at}
          onPress={() => act({ type: 'percentage', pct: pctOfLevel(i + 1, e.levels) })}
          className="h-6 min-w-0 flex-1 rounded-full p-0"
        >
          <span className={cn('block h-2 w-full rounded-full transition-colors', i < at ? '' : 'bg-default')} style={i < at ? { background: AIR, opacity: 0.55 + (0.45 * (i + 1)) / e.levels } : undefined} />
        </Button>
      ))}
    </div>
  );
}

export default function FanRotor({ e, size, act }: TileProps<FanTileModel>) {
  const on = e.isOn && e.available;
  const at = fanLevel(e);
  const step = (d: 1 | -1) => {
    const next = Math.max(0, Math.min(e.levels, at + d));
    act({ type: 'percentage', pct: next === 0 ? 0 : pctOfLevel(next, e.levels) });
  };
  const rotor = (
    <Button
      isIconOnly
      variant="ghost"
      isDisabled={!e.available}
      onPress={() => act({ type: 'toggle' })}
      aria-label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
      aria-pressed={on}
      className={cn('h-auto w-auto min-w-0 shrink-0 rounded-full p-1.5 transition-colors', on ? 'bg-[color-mix(in_oklab,hsl(176_60%_42%)_14%,transparent)]' : 'bg-default/60 text-muted')}
      style={on ? { color: AIR } : undefined}
    >
      <Rotor e={e} px={ROTOR[size]} />
    </Button>
  );
  const minus = <TileIconButton icon={MinusSignIcon} label={`${e.name}: slower`} onPress={() => step(-1)} size={size === 's' ? 30 : 34} className="bg-default" />;
  const plus = <TileIconButton icon={PlusSignIcon} label={`${e.name}: faster`} onPress={() => step(1)} size={size === 's' ? 30 : 34} className="bg-default" />;
  const surface = cn('pro-surface', !e.available && 'opacity-60');

  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={surface}>
        <div className="flex h-full items-center gap-1.5 px-1.5">
          {rotor}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.name}</TileName>
            <TileState className="text-[12px]">{fanState(e, false)}</TileState>
          </div>
          {e.supportsSpeed && e.available ? (
            <TileIconButton icon={PlusSignIcon} label={`${e.name}: next speed`} size={30} className="bg-default" onPress={() => act({ type: 'percentage', pct: pctOfLevel(at >= e.levels ? 1 : at + 1, e.levels) })} />
          ) : null}
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={e.name} className={surface}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <div className="-ml-1 -mt-1">{rotor}</div>
            {e.supportsSpeed && e.available ? (
              <div className="flex flex-col gap-1.5">
                {plus}
                {minus}
              </div>
            ) : null}
          </div>
          <div className="mt-auto min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{fanState(e, false)}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={e.name} className={surface}>
        <div className="flex h-full items-center gap-4 p-3.5 pl-4">
          {rotor}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <TileName>{e.name}</TileName>
              <TileState>{fanState(e)}</TileState>
            </div>
            {e.supportsSpeed ? (
              <div className="flex items-center gap-2">
                {minus}
                <div className="min-w-0 flex-1">
                  <Dots e={e} act={act} />
                </div>
                {plus}
              </div>
            ) : null}
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={e.name} className={surface}>
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{e.presetMode && on ? cap(e.presetMode) : on ? 'On' : fanState(e)}</TileState>
          </div>
          <div className="my-auto self-center">{rotor}</div>
          {e.supportsSpeed ? (
            <>
              <Dots e={e} act={act} />
              <div className="flex items-center justify-between">
                {minus}
                <p className={cn('text-[22px] font-semibold tabular-nums', !on && 'text-muted')}>{on ? at : 'Off'}</p>
                {plus}
              </div>
            </>
          ) : null}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={surface}>
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-4">
          {rotor}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <TileName className="text-[17px]">{e.name}</TileName>
              <TileState>{fanState(e, false)}</TileState>
            </div>
            {e.supportsSpeed ? (
              <div className="flex items-center justify-between gap-2">
                {minus}
                <span className={cn('text-[22px] font-semibold tabular-nums', !on && 'text-muted')}>{on ? at : 'Off'}</span>
                {plus}
              </div>
            ) : null}
          </div>
        </div>
        {e.supportsSpeed ? <Dots e={e} act={act} /> : null}
        <div className="mt-auto flex flex-col gap-2">
          {e.presetModes.length ? (
            <div className="flex flex-wrap gap-1.5">
              {e.presetModes.map((m) => (
                <TileChip key={m} label={`${e.name} mode: ${cap(m)}`} active={on && e.presetMode === m} onPress={() => act({ type: 'preset', mode: m })} className={on && e.presetMode === m ? 'text-white' : 'bg-default'} style={on && e.presetMode === m ? { background: AIR } : undefined}>
                  {cap(m)}
                </TileChip>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {e.oscillating !== null ? (
              <TileChip label={`${e.name}: oscillate`} active={e.oscillating} onPress={() => act({ type: 'oscillate', on: !e.oscillating })} className={cn('gap-1.5', e.oscillating ? 'pro-soft' : 'bg-default')}>
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} />
                Swing
              </TileChip>
            ) : null}
            {e.direction ? (
              <TileChip label={`${e.name}: direction ${e.direction}`} onPress={() => act({ type: 'direction', dir: e.direction === 'forward' ? 'reverse' : 'forward' })} className="gap-1.5 bg-default">
                <HugeiconsIcon icon={RotateClockwiseIcon} size={13} className={e.direction === 'reverse' ? '-scale-x-100' : ''} />
                {e.direction === 'forward' ? 'Forward' : 'Reverse'}
              </TileChip>
            ) : null}
          </div>
        </div>
      </div>
    </TileFrame>
  );
}
