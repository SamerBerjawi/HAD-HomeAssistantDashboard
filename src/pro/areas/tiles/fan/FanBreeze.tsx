/**
 * Fan C · "Breeze". Mode first, for smart fans with presets (Natural, Sleep, Turbo…): the mode is
 * the headline, streaks of air drift across the tile at the fan's speed, and the speed is a short
 * row of numbered pills. Off: the air stops and the tile goes calm. Swing and direction on Large.
 */
import type { CSSProperties } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowReloadHorizontalIcon, Leaf01Icon, Moon02Icon, PowerIcon, Rocket01Icon, AiMagicIcon, FastWindIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import { TileChip, TileFrame, TileIconButton, TileName, TileState } from '../../tileKit';
import { cap, pctOfLevel, type FanTileModel, type TileProps } from '../../tileTypes';
import { AIR, fanLevel } from './fanParts';

const MODE_ICON: Record<string, IconSvgElement> = { natural: Leaf01Icon, nature: Leaf01Icon, sleep: Moon02Icon, turbo: Rocket01Icon, auto: AiMagicIcon, normal: FastWindIcon };
const modeIcon = (m: string | null) => (m && MODE_ICON[m]) || FastWindIcon;

const STREAKS = [
  { top: 18, w: 38, o: 0.55, delay: 0 },
  { top: 34, w: 24, o: 0.35, delay: 0.9 },
  { top: 52, w: 46, o: 0.5, delay: 0.4 },
  { top: 68, w: 28, o: 0.4, delay: 1.5 },
  { top: 84, w: 34, o: 0.3, delay: 0.7 }
];

function Air({ e }: { e: FanTileModel }) {
  if (!e.isOn || !e.available) return null;
  const pct = e.supportsSpeed ? e.percentage : 60;
  const d = Math.max(0.9, 4.2 - pct / 30);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STREAKS.slice(0, 2 + Math.ceil((pct / 100) * 3)).map((s, i) => (
        <span
          key={i}
          className="had-breeze absolute left-0 h-[3px] rounded-full"
          style={{ top: `${s.top}%`, width: `${s.w}%`, background: `linear-gradient(90deg, transparent, ${AIR})`, ['--o' as string]: s.o, ['--d' as string]: `${d + i * 0.25}s`, ['--delay' as string]: `${s.delay}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Speeds({ e, act }: { e: FanTileModel; act: TileProps<FanTileModel>['act'] }) {
  if (!e.supportsSpeed) return null;
  const at = fanLevel(e);
  return (
    <div role="group" aria-label={`${e.name} speed`} className="flex gap-1 rounded-full bg-default/70 p-1 backdrop-blur-sm">
      {Array.from({ length: e.levels }, (_, i) => (
        <Button
          key={i}
          variant="ghost"
          isDisabled={!e.available}
          aria-label={`${e.name}: speed ${i + 1}${i + 1 === at ? ', current' : ''}`}
          aria-pressed={i + 1 === at}
          onPress={() => act({ type: 'percentage', pct: pctOfLevel(i + 1, e.levels) })}
          className={cn('h-7 min-w-0 flex-1 rounded-full p-0 text-[12px] font-semibold tabular-nums', i + 1 === at ? 'text-white shadow-sm' : 'text-muted')}
          style={i + 1 === at ? { background: AIR } : undefined}
        >
          {i + 1}
        </Button>
      ))}
    </div>
  );
}

function Modes({ e, act, max, vertical }: { e: FanTileModel; act: TileProps<FanTileModel>['act']; max: number; vertical?: boolean }) {
  const on = e.isOn && e.available;
  return (
    <div className={cn('flex gap-1.5', vertical ? 'flex-col' : 'flex-wrap')}>
      {e.presetModes.slice(0, max).map((m) => {
        const active = on && e.presetMode === m;
        return (
          <TileChip key={m} label={`${e.name} mode: ${cap(m)}`} active={active} onPress={() => act({ type: 'preset', mode: m })} className={cn('gap-1.5', vertical && 'justify-start', active ? 'text-white' : 'bg-default/80 backdrop-blur-sm')} style={active ? { background: AIR } : undefined}>
            <HugeiconsIcon icon={modeIcon(m)} size={13} />
            {cap(m)}
          </TileChip>
        );
      })}
    </div>
  );
}

export default function FanBreeze({ e, size, act }: TileProps<FanTileModel>) {
  const on = e.isOn && e.available;
  const title = !e.available ? 'Unavailable' : on ? (e.presetMode ? cap(e.presetMode) : 'On') : 'Off';
  const power = (
    <TileIconButton
      icon={PowerIcon}
      label={`${e.name}: ${on ? 'on, turn off' : 'off, turn on'}`}
      pressed={on}
      onPress={() => e.available && act({ type: 'toggle' })}
      size={size === 'xs' ? 30 : size === 's' ? 32 : 36}
      className={on ? 'text-white' : 'bg-default text-muted'}
      style={on ? { background: AIR } : undefined}
    />
  );
  const bg: CSSProperties | undefined = on ? { background: `linear-gradient(160deg, color-mix(in srgb, ${AIR} 20%, var(--surface)), var(--surface) 70%)` } : undefined;
  const head = (cls: string) => (
    <p className={cn('flex items-center gap-2 font-semibold leading-none tracking-[-0.02em]', cls, !on && 'text-muted')}>
      {on ? <HugeiconsIcon icon={modeIcon(e.presetMode)} size={cls.includes('34') ? 26 : 20} style={{ color: AIR }} /> : null}
      <span className="truncate">{title}</span>
    </p>
  );
  const speedText = on && e.supportsSpeed ? `Speed ${fanLevel(e)} of ${e.levels}` : on ? 'On' : '';
  return (
    <TileFrame label={e.name} className={cn(on ? 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'pro-surface', !e.available && 'opacity-60')} style={bg}>
      <Air e={e} />
      {size === 'xs' ? (
        <div className="relative flex h-full items-center gap-2 px-3.5">
          <div className="min-w-0 flex-1">
            {head('text-[17px]')}
            <p className="mt-1 truncate text-[12px] opacity-70">{e.name}</p>
          </div>
          {power}
        </div>
      ) : size === 's' ? (
        <div className="relative flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            {head('text-[20px] min-w-0')}
            {power}
          </div>
          <div className="mt-auto min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{speedText || (on ? '' : 'Tap power to start')}</TileState>
          </div>
        </div>
      ) : size === 'w' ? (
        <div className="relative flex h-full flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <TileName>{e.name}</TileName>
              {head('mt-1 text-[24px]')}
            </div>
            {power}
          </div>
          <div className="mt-auto">{on ? <Speeds e={e} act={act} /> : <Modes e={e} act={act} max={4} />}</div>
        </div>
      ) : size === 't' ? (
        <div className="relative flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <TileName>{e.name}</TileName>
            {power}
          </div>
          {head('text-[26px]')}
          <TileState>{speedText}</TileState>
          <div className="mt-auto flex flex-col gap-2">
            <Modes e={e} act={act} max={4} vertical />
            <Speeds e={e} act={act} />
          </div>
        </div>
      ) : (
        <div className="relative flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <TileName className="text-[17px]">{e.name}</TileName>
              <TileState>{speedText || 'Off'}</TileState>
            </div>
            {power}
          </div>
          {head('text-[34px]')}
          <div className="mt-auto flex flex-col gap-3">
            <Modes e={e} act={act} max={6} />
            <Speeds e={e} act={act} />
            {e.oscillating !== null || e.direction ? (
              <div className="flex gap-1.5">
                {e.oscillating !== null ? (
                  <TileChip label={`${e.name}: swing`} active={e.oscillating} onPress={() => act({ type: 'oscillate', on: !e.oscillating })} className={cn('gap-1.5', e.oscillating ? 'pro-soft' : 'bg-default/80')}>
                    <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} />
                    Swing {e.oscillating ? 'on' : 'off'}
                  </TileChip>
                ) : null}
                {e.direction ? (
                  <TileChip label={`${e.name}: direction ${e.direction}`} onPress={() => act({ type: 'direction', dir: e.direction === 'forward' ? 'reverse' : 'forward' })} className="bg-default/80">
                    {e.direction === 'forward' ? 'Forward' : 'Reverse'}
                  </TileChip>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </TileFrame>
  );
}
