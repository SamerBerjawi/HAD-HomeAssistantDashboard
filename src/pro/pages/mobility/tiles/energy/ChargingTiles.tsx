/**
 * Vehicle tiles · batch 1 · Charging (docs/pro-ui/VEHICLE_TILES.md): is it plugged in, is it
 * charging, when will it be ready; start or pause in one tap.
 * A · Orb: the Ambient family (the Room page's fan and switch tiles): the state word big, a
 *   glowing power orb to start / pause, kW and "ready by" under it, the way to the limit as a bar.
 * B · Plug: the cable and the socket drawn; apart when unplugged, joined when plugged in, energy
 *   flowing along it while charging. Tap the plug to start or pause.
 * C · Timeline: tonight as a line from now to "ready by", the charge at each end.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, ElectricPlugsIcon, PauseIcon, PlayIcon, PlugSocketIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { glowStyle, OrbButton } from '../../../../areas/tiles/ambient/ambientKit';
import { clock, has, type Vehicle } from '../../../../lib/mobilityHome';
import { Big, chargingWords, IconChip, pct, VHUE, type VehicleTileProps } from '../vehicleTileKit';

/** Whether the tile can start or pause the charge now, and what pressing does. */
function control(v: Vehicle, act: VehicleTileProps['act']) {
  const c = v.charging;
  const charging = c?.state === 'charging';
  const can = !!c?.plugged && c.state !== 'complete' && (charging ? has(v, 'charge-pause') : has(v, 'charge-start'));
  return { can, charging, label: charging ? 'Pause charging' : 'Start charging', run: () => act({ type: 'charge', on: !charging }) };
}

/** From the charge now to the limit, as a slim bar (where it is on the way). */
function ToLimit({ v, className }: { v: Vehicle; className?: string }) {
  const level = pct(v.level);
  const limit = v.charging?.target ?? 100;
  return (
    <div aria-hidden className={cn('relative h-1.5 rounded-full bg-[color-mix(in_srgb,currentColor_10%,transparent)]', className)}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(level, limit)}%`, background: VHUE.charge, boxShadow: `0 0 10px -1px ${VHUE.charge}` }} />
      <span className="absolute -inset-y-1 w-0.5 rounded-full bg-current opacity-60" style={{ left: `${limit}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Orb
// ---------------------------------------------------------------------------------------------

export function ChargingOrb({ v, size, act }: VehicleTileProps) {
  const w = chargingWords(v);
  const k = control(v, act);
  const on = w.tone === 'on';
  const hue = w.tone === 'warn' ? VHUE.low : VHUE.charge;
  const style = glowStyle(hue, on ? 0.9 : w.tone === 'done' ? 0.35 : w.tone === 'warn' ? 0.4 : 0, '85% 15%');
  const orb = (px: number) => <OrbButton icon={k.charging ? PauseIcon : ElectricPlugsIcon} label={k.label} on={on} color={VHUE.charge} size={px} isDisabled={!k.can} onPress={k.run} />;
  if (size === 'xs')
    return (
      <TileFrame label="Charging" className="pro-surface" style={style}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {orb(40)}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{w.word}</p>
            <TileState className="text-[12px]">{w.detail || 'Charging'}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Charging" className="pro-surface" style={style}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <IconChip icon={PlugSocketIcon} hue={hue} on={w.tone !== 'idle'} />
            {orb(44)}
          </div>
          <TileName className="mt-auto">{w.word}</TileName>
          <TileState>{w.detail || (v.charging?.plugged ? 'Plugged in' : 'Not plugged in')}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charging" className="pro-surface" style={style}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <HugeiconsIcon icon={PlugSocketIcon} size={22} style={{ color: w.tone === 'idle' ? undefined : hue }} className={cn(w.tone === 'idle' && 'opacity-60')} />
            <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[24px]')}>{w.word}</p>
          </div>
          {orb(size === 'l' ? 60 : 52)}
        </div>
        {size === 'l' && v.charging?.power != null && on ? <Big n={v.charging.power.toFixed(1)} unit="kW" className="mt-4 text-[56px]" style={{ color: hue }} /> : null}
        <div className="mt-auto">
          <TileName className="text-[15px]">Charging</TileName>
          <TileState>{w.detail || (v.charging?.plugged ? 'Plugged in' : 'Not plugged in')}</TileState>
          {v.charging?.plugged ? <ToLimit v={v} className="mt-3" /> : null}
          {size === 'l' && v.charging?.lastSessionKwh != null ? <p className="mt-3 text-[12px] opacity-60">Last session {v.charging.lastSessionKwh} kWh</p> : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Plug
// ---------------------------------------------------------------------------------------------

/** The plug and the socket: apart when unplugged, joined when plugged in, energy flowing while charging. */
function Cable({ v, width, height }: { v: Vehicle; width: number; height: number }) {
  const plugged = !!v.charging?.plugged;
  const charging = v.charging?.state === 'charging';
  const y = height / 2;
  const socketX = width - 22;
  const headX = plugged ? socketX - 22 : socketX - 46;
  const line = 'color-mix(in oklab, currentColor 55%, transparent)';
  const path = `M 0 ${y + 10} C ${width * 0.3} ${y + 10}, ${width * 0.35} ${y}, ${headX} ${y}`;
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{ width: '100%', maxWidth: width, height: 'auto', aspectRatio: `${width} / ${height}` }}>
      <path d={path} fill="none" stroke={line} strokeWidth={4} strokeLinecap="round" />
      {charging ? <path d={path} fill="none" stroke={VHUE.charge} strokeWidth={2.5} strokeDasharray="3 7" strokeLinecap="round" className="pro-mob-cable" style={{ filter: `drop-shadow(0 0 4px ${VHUE.charge})` }} /> : null}
      {/* Plug head with its pins. */}
      <rect x={headX} y={y - 9} width={16} height={18} rx={4} fill="currentColor" opacity={0.85} />
      <path d={`M ${headX + 16} ${y - 4} h 6 M ${headX + 16} ${y + 4} h 6`} stroke="currentColor" strokeOpacity={0.85} strokeWidth={2.5} strokeLinecap="round" />
      {/* Socket on the car. */}
      <rect x={socketX} y={y - 15} width={20} height={30} rx={8} fill="none" stroke={charging ? VHUE.charge : 'currentColor'} strokeOpacity={charging ? 1 : 0.5} strokeWidth={2} style={charging ? { filter: `drop-shadow(0 0 6px ${VHUE.charge})` } : undefined} />
      <circle cx={socketX + 10} cy={y - 5} r={2} fill="currentColor" opacity={0.5} />
      <circle cx={socketX + 10} cy={y + 5} r={2} fill="currentColor" opacity={0.5} />
    </svg>
  );
}

export function ChargingPlug({ v, size, act }: VehicleTileProps) {
  const w = chargingWords(v);
  const k = control(v, act);
  const hue = w.tone === 'warn' ? VHUE.low : VHUE.charge;
  const tinted = w.tone === 'on' || w.tone === 'done';
  const words = (
    <div className="min-w-0">
      <TileName className={cn(size === 'l' && 'text-[20px]')}>
        <span style={tinted ? { color: hue } : undefined}>{w.word}</span>
      </TileName>
      <TileState>{w.detail || (v.charging?.plugged ? 'Plugged in' : 'Plug in to charge')}</TileState>
    </div>
  );
  const drawing = (width: number, height: number) =>
    k.can ? (
      <Button variant="ghost" aria-label={k.label} onPress={k.run} data-tile-control="" className="h-auto w-full min-w-0 justify-start rounded-2xl p-1 data-[hovered=true]:bg-[color-mix(in_srgb,currentColor_6%,transparent)]">
        <Cable v={v} width={width} height={height} />
      </Button>
    ) : (
      <div className="w-full p-1">
        <Cable v={v} width={width} height={height} />
      </div>
    );
  if (size === 'xs')
    return (
      <TileFrame label="Charging" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold" style={tinted ? { color: hue } : undefined}>
              {w.word}
            </p>
            <TileState className="text-[12px]">{w.detail || (v.charging?.plugged ? 'Plugged in' : 'Unplugged')}</TileState>
          </div>
          {w.tone === 'done' ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} style={{ color: hue }} /> : <div className="w-[68px] shrink-0">{drawing(56, 30)}</div>}
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Charging" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="-ml-1">{drawing(128, 52)}</div>
          <div className="mt-auto">{words}</div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charging" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center justify-between gap-2">
          <TileName>Charging</TileName>
          {k.can ? <span className="text-[12px] opacity-60">Tap the plug to {k.charging ? 'pause' : 'start'}</span> : null}
        </div>
        <div className="my-auto">{drawing(300, size === 'l' ? 96 : 60)}</div>
        {words}
        {size === 'l' && v.charging?.plugged ? <ToLimit v={v} className="mt-3" /> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Timeline
// ---------------------------------------------------------------------------------------------

function Line({ v, now, labels }: { v: Vehicle; now: number; labels: boolean }) {
  const c = v.charging;
  const charging = c?.state === 'charging';
  const end = c?.readyAt ?? null;
  const from = v.level ?? 0;
  const to = c?.target ?? 100;
  const done = c?.state === 'complete';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-8">
        <span
          className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full"
          style={{
            background: charging
              ? `linear-gradient(90deg, ${VHUE.charge}, color-mix(in srgb, ${VHUE.charge} 25%, transparent))`
              : c?.plugged
              ? 'color-mix(in srgb, currentColor 18%, transparent)'
              : 'repeating-linear-gradient(90deg, color-mix(in srgb, currentColor 30%, transparent) 0 6px, transparent 6px 11px)'
          }}
        />
        <span className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)]" style={{ background: charging || done ? VHUE.charge : 'color-mix(in srgb, currentColor 50%, transparent)' }} />
        <span className="absolute right-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2" style={{ borderColor: done ? VHUE.charge : 'color-mix(in srgb, currentColor 40%, transparent)', background: done ? VHUE.charge : 'var(--surface)' }} />
      </div>
      {labels ? (
        <div className="flex justify-between text-[12px] tabular-nums">
          <span>
            <b className="font-semibold">{from}%</b> <span className="opacity-60">now · {clock(now)}</span>
          </span>
          <span className="text-right">
            <b className="font-semibold">{to}%</b> <span className="opacity-60">{done ? 'reached' : end ? `by ${clock(end)}` : charging ? 'limit' : c?.plugged ? 'when started' : 'when plugged in'}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ChargingTimeline({ v, size, act, now }: VehicleTileProps) {
  const w = chargingWords(v);
  const k = control(v, act);
  const hue = w.tone === 'warn' ? VHUE.low : VHUE.charge;
  const button = (compact: boolean) =>
    k.can ? (
      <Button size="sm" variant={k.charging ? 'secondary' : 'primary'} onPress={k.run} data-tile-control="" className={cn('shrink-0 gap-1 rounded-full', compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4')}>
        <HugeiconsIcon icon={k.charging ? PauseIcon : PlayIcon} size={14} />
        {k.charging ? 'Pause' : 'Start'}
      </Button>
    ) : null;
  const head = (
    <p className="font-semibold tracking-[-0.02em]" style={w.tone !== 'idle' ? { color: hue } : undefined}>
      {w.word}
      {v.charging?.state === 'charging' && v.charging.readyAt ? <span className="font-normal text-[var(--foreground)] opacity-70">, ready {clock(v.charging.readyAt)}</span> : null}
    </p>
  );
  if (size === 'xs')
    return (
      <TileFrame label="Charging" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold" style={w.tone !== 'idle' ? { color: hue } : undefined}>
              {w.word}
            </p>
            <TileState className="text-[12px]">{v.charging?.readyAt && v.charging.state === 'charging' ? `ready ${clock(v.charging.readyAt)}` : w.detail || 'Charging'}</TileState>
          </div>
          {button(true)}
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Charging" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="text-[18px] leading-tight">{head}</div>
          <div className="mt-auto">
            <Line v={v} now={now} labels={false} />
            <div className="mt-1 flex justify-between text-[12px] tabular-nums opacity-70">
              <span>{v.level ?? '—'}%</span>
              <span>{v.charging?.target ?? 100}%</span>
            </div>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Charging" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className={cn('min-w-0', size === 'l' ? 'text-[26px]' : 'text-[20px]')}>{head}</div>
          {button(false)}
        </div>
        {size === 'l' ? <TileState className="mt-1">{w.detail}</TileState> : null}
        <div className="mt-auto">
          <Line v={v} now={now} labels />
        </div>
        {size === 'l' && v.charging?.lastSessionKwh != null ? <p className="mt-4 text-[12px] opacity-60">Last session {v.charging.lastSessionKwh} kWh</p> : null}
      </div>
    </TileFrame>
  );
}
