/**
 * Fan B · "Throttle". A notched lever, like the speed slider on a desk fan: Off is the first
 * notch, then 1, 2, 3… Push the grip (it snaps to a notch when you let go) or tap a notch. One
 * control answers both "is it on?" and "how fast?". The lever stands up in the Tall tile.
 */
import { useRef, useState, type PointerEvent } from 'react';
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowReloadHorizontalIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileChip, TileFrame, TileName, TileState } from '../../tileKit';
import { cap, pctOfLevel, type FanTileModel, type TileProps } from '../../tileTypes';
import { AIR, fanLevel, fanState } from './fanParts';

function Lever({ e, act, vertical, labels, compact }: { e: FanTileModel; act: TileProps<FanTileModel>['act']; vertical?: boolean; labels: 'all' | 'ends' | 'none'; compact?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const n = e.supportsSpeed ? e.levels : 1;
  const at = e.supportsSpeed ? fanLevel(e) : e.isOn ? 1 : 0;
  const pos = drag ?? at / n; // 0 … 1
  const commit = (level: number) => {
    if (level === 0) act({ type: 'percentage', pct: 0 });
    else if (!e.supportsSpeed) act({ type: 'toggle' });
    else act({ type: 'percentage', pct: pctOfLevel(level, n) });
  };
  const fromPointer = (ev: PointerEvent) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return 0;
    const t = vertical ? 1 - (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width;
    return Math.max(0, Math.min(1, t));
  };
  return (
    <div className={cn('relative', vertical ? 'h-full w-16' : compact ? 'h-8 w-full' : 'h-11 w-full')}>
      <div ref={track} className={cn('absolute rounded-full bg-default shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)]', vertical ? 'inset-y-[15px] left-1/2 w-3 -translate-x-1/2' : 'inset-x-[15px] top-1/2 h-3 -translate-y-1/2')}>
        <div className={cn('absolute rounded-full', vertical ? 'inset-x-0 bottom-0' : 'inset-y-0 left-0', drag === null && 'transition-all duration-300')} style={{ background: AIR, ...(vertical ? { height: `${pos * 100}%` } : { width: `${pos * 100}%` }) }} />
        {Array.from({ length: n + 1 }, (_, i) => {
          const p = (i / n) * 100;
          const show = labels === 'all' || (labels === 'ends' && (i === 0 || i === n));
          return (
            <Button
              key={i}
              variant="ghost"
              isDisabled={!e.available}
              aria-label={`${e.name}: ${i === 0 ? 'off' : e.supportsSpeed ? `speed ${i}` : 'on'}${i === at ? ', current' : ''}`}
              aria-pressed={i === at}
              onPress={() => commit(i)}
              className={cn('absolute h-9 w-9 min-w-0 rounded-full p-0', vertical ? 'left-1/2 -translate-x-1/2 translate-y-1/2' : 'top-1/2 -translate-x-1/2 -translate-y-1/2')}
              style={vertical ? { bottom: `${p}%` } : { left: `${p}%` }}
            >
              <span className={cn('size-1.5 rounded-full', i <= at && at > 0 ? 'bg-white/90' : 'bg-foreground/25')} />
              {show ? (
                <span className={cn('pointer-events-none absolute whitespace-nowrap text-[10px] font-semibold text-muted', vertical ? 'left-[calc(100%+8px)]' : 'top-[calc(100%+4px)]', i === at && 'text-foreground')}>{i === 0 ? 'Off' : e.supportsSpeed ? i : 'On'}</span>
              ) : null}
            </Button>
          );
        })}
      </div>
      {e.available ? (
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${e.name} speed`}
          aria-valuemin={0}
          aria-valuemax={n}
          aria-valuenow={at}
          aria-valuetext={fanState(e, false)}
          data-tile-control=""
          className={cn('absolute z-10 grid cursor-grab place-items-center rounded-[10px] bg-white shadow-[0_3px_10px_rgba(0,0,0,0.25)] ring-1 ring-black/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:cursor-grabbing', drag === null && 'transition-all duration-300 ease-out', vertical ? 'left-1/2 h-[22px] w-11 -translate-x-1/2 translate-y-1/2' : compact ? 'top-1/2 h-7 w-[18px] -translate-x-1/2 -translate-y-1/2' : 'top-1/2 h-11 w-[22px] -translate-x-1/2 -translate-y-1/2')}
          style={{ touchAction: 'none', ...(vertical ? { bottom: `calc(15px + ${pos} * (100% - 30px))` } : { left: `calc(15px + ${pos} * (100% - 30px))` }) }}
          onPointerDown={(ev) => {
            ev.currentTarget.setPointerCapture(ev.pointerId);
            setDrag(fromPointer(ev));
          }}
          onPointerMove={(ev) => {
            if (drag !== null) setDrag(fromPointer(ev));
          }}
          onPointerUp={() => {
            if (drag !== null) commit(Math.round(drag * n));
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
          onKeyDown={(ev) => {
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') commit(Math.min(n, at + 1));
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') commit(Math.max(0, at - 1));
          }}
        >
          <span aria-hidden className={cn('flex gap-[3px]', vertical ? 'flex-row' : 'flex-col')}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('rounded-full bg-black/25', vertical ? 'h-2.5 w-[2px]' : 'h-[2px] w-2.5')} />
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ModeMenu({ e, act }: { e: FanTileModel; act: TileProps<FanTileModel>['act'] }) {
  if (!e.presetModes.length) return null;
  return (
    <Dropdown>
      <Button size="sm" variant="secondary" data-tile-control="" aria-label={`${e.name} mode: ${e.presetMode ? cap(e.presetMode) : 'none'}. Change the mode`} className="h-7 min-w-0 gap-1 rounded-full px-2.5 text-[12px] font-semibold">
        {e.presetMode ? cap(e.presetMode) : 'Mode'}
        <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-60" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-36">
        <Dropdown.Menu aria-label={`${e.name} mode`} selectionMode="single" selectedKeys={new Set(e.presetMode ? [e.presetMode] : [])} onAction={(k) => act({ type: 'preset', mode: String(k) })}>
          {e.presetModes.map((m) => (
            <Dropdown.Item key={m} id={m} textValue={cap(m)}>
              {cap(m)}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export default function FanThrottle({ e, size, act }: TileProps<FanTileModel>) {
  const on = e.isOn && e.available;
  const head = (
    <p className={cn('font-semibold leading-none tracking-[-0.02em] tabular-nums', size === 's' ? 'text-[22px]' : size === 'l' ? 'text-[40px]' : 'text-[28px]', !on && 'text-muted')} style={on ? { color: AIR } : undefined}>
      {!e.available ? '—' : on ? (e.supportsSpeed ? fanLevel(e) : 'On') : 'Off'}
    </p>
  );
  const surface = cn('pro-surface', !e.available && 'opacity-60');
  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={surface}>
        <div className="flex h-full flex-col justify-center px-3">
          <div className="flex items-center gap-2 px-1">
            <TileName className="line-clamp-1 min-w-0 flex-1 truncate text-[14px]">{e.name}</TileName>
            <span className={cn('text-[13px] font-semibold tabular-nums', !on && 'text-muted')} style={on ? { color: AIR } : undefined}>
              {!e.available ? '—' : on ? (e.supportsSpeed ? fanLevel(e) : 'On') : 'Off'}
            </span>
          </div>
          <Lever e={e} act={act} labels="none" compact />
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
            <TileState>{fanState(e, false)}</TileState>
          </div>
          <div className="flex min-h-0 flex-1 items-stretch justify-between gap-2 py-1">
            <div className="flex flex-col justify-end">{head}</div>
            <Lever e={e} act={act} vertical labels="all" />
          </div>
          <ModeMenu e={e} act={act} />
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={surface}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'gap-4 p-5' : 'gap-1 p-3.5 px-4')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <TileName className={size === 'l' ? 'text-[17px]' : undefined}>{e.name}</TileName>
            <TileState>{size === 's' ? (on && e.presetMode ? cap(e.presetMode) : on ? 'Running' : fanState(e, false)) : fanState(e)}</TileState>
          </div>
          {size === 's' ? head : <ModeMenu e={e} act={act} />}
        </div>
        {size === 'l' ? (
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
              {head}
              <span className="text-sm text-muted">{on && e.supportsSpeed ? `of ${e.levels}` : ''}</span>
            </div>
            <div className="flex gap-1.5">
              {e.oscillating !== null ? (
                <TileChip label={`${e.name}: swing`} active={e.oscillating} onPress={() => act({ type: 'oscillate', on: !e.oscillating })} className={cn('gap-1.5', e.oscillating ? 'pro-soft' : 'bg-default')}>
                  <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} />
                  Swing
                </TileChip>
              ) : null}
              {e.direction ? (
                <TileChip label={`${e.name}: direction ${e.direction}`} onPress={() => act({ type: 'direction', dir: e.direction === 'forward' ? 'reverse' : 'forward' })} className="bg-default">
                  {e.direction === 'forward' ? 'Forward' : 'Reverse'}
                </TileChip>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={cn('mt-auto', size === 's' ? 'pb-3' : 'pb-4')}>
          <Lever e={e} act={act} labels={size === 's' ? 'ends' : 'all'} />
        </div>
      </div>
    </TileFrame>
  );
}
