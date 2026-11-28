/**
 * Switch B · "Meter". For plugs, the interesting part is what flows through them: the live
 * wattage leads, a frameless trace of the last hours sits under it, the toggle stays in the
 * corner. A switch with no power reading leads with On / Off and how long instead.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from '../../../widgets/controls/ControlParts';
import { TileFrame, TileName, TileState } from '../../tileKit';
import { forText, type SwitchTileModel, type TileProps } from '../../tileTypes';
import { Sparkline, switchIcon, watts } from './switchParts';

const TRACE = 'var(--accent)';

export default function SwitchMeter({ e, size, act }: TileProps<SwitchTileModel>) {
  const on = e.isOn && e.available;
  const metered = e.powerW !== null;
  const lead = !e.available ? 'Unavailable' : metered ? (on ? watts(e.powerW) : '0 W') : on ? 'On' : 'Off';
  const since = forText(e.lastChanged);
  const toggle = (
    <span data-tile-control="" className={cn(!e.available && 'pointer-events-none opacity-50')}>
      <ToggleSwitch isSelected={on} onChange={() => act({ type: 'toggle' })} label={`${e.name}: ${on ? 'on' : 'off'}`} />
    </span>
  );
  const icon = <HugeiconsIcon icon={switchIcon(e)} size={20} className={on ? 'text-[var(--accent)]' : 'text-muted'} />;
  const leadCls = cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', !on && 'text-muted');
  const trace = (h: number) => (metered && e.powerHistory.length > 1 ? <Sparkline values={on ? e.powerHistory : e.powerHistory.map((v, i) => (i < e.powerHistory.length - 4 ? v : 0))} width={300} height={h} color={on ? TRACE : 'var(--muted)'} /> : null);
  const sub = metered ? (on ? (since ? `On ${since}` : 'On') : 'Off') : since ? (on ? `On ${since}` : `Off ${since}`) : '';

  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        {metered ? <div className="absolute inset-x-0 bottom-0 opacity-50">{trace(30)}</div> : null}
        <div className="relative flex h-full items-center gap-2 px-3.5">
          <div className="min-w-0 flex-1">
            <p className={cn(leadCls, 'text-[20px]')}>{lead}</p>
            <p className="mt-1 truncate text-[12px] font-medium opacity-70">{e.name}</p>
          </div>
          {toggle}
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            {icon}
            {toggle}
          </div>
          <p className={cn(leadCls, 'mt-auto text-[26px]')}>{lead}</p>
          <TileName className="mt-1.5">{e.name}</TileName>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        {metered ? <div className="absolute inset-x-0 bottom-0 opacity-90">{trace(64)}</div> : null}
        <div className="relative flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {icon}
              <TileName>{e.name}</TileName>
            </div>
            {toggle}
          </div>
          <div className="mt-auto flex items-baseline gap-2">
            <p className={cn(leadCls, 'text-[34px]')}>{lead}</p>
            <TileState>{sub}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-start justify-between">
            {icon}
            {toggle}
          </div>
          <div className="min-w-0">
            <TileName>{e.name}</TileName>
            <TileState>{sub || e.appliance || ''}</TileState>
          </div>
          <p className={cn(leadCls, 'mt-auto text-[40px]')}>{lead}</p>
          {metered ? <div className="-mx-4 -mb-4 mt-1">{trace(84)}</div> : null}
          {!metered ? <p className="text-xs text-muted">No power reading</p> : null}
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon}
            <div className="min-w-0">
              <TileName className="text-[17px]">{e.name}</TileName>
              <TileState>{sub}</TileState>
            </div>
          </div>
          {toggle}
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">{metered ? 'Drawing now' : 'State'}</p>
            <p className={cn(leadCls, 'mt-1 text-[52px]')}>{lead}</p>
          </div>
          {e.energyTodayKwh !== null ? (
            <div className="text-right">
              <p className="text-xs text-muted">Today</p>
              <p className="text-lg font-semibold tabular-nums">{e.energyTodayKwh.toFixed(2)} kWh</p>
            </div>
          ) : null}
        </div>
        {metered ? (
          <div className="-mx-5 -mb-5 mt-auto">
            <div className="flex justify-between px-5 pb-1 text-[11px] text-muted">
              <span>Last 6 hours</span>
              <span className="tabular-nums">peak {watts(Math.max(...e.powerHistory))}</span>
            </div>
            {trace(96)}
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}
