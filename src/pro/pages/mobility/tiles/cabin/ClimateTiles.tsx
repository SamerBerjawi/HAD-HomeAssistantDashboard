/**
 * Vehicle tiles · batch 2 · Remote start & climate (docs/pro-ui/VEHICLE_TILES.md): is the cabin
 * being warmed (or cooled), how long is left, how warm it is inside; start or stop in one tap.
 * A · Orb: the Ambient family, as Charging A: the state word big, a glowing orb to start / stop.
 * B · Countdown: the minutes left of the remote start as a ring running down, the cabin inside.
 * C · Warm-up: the cabin now to the set temperature as a line (Charging's Timeline for the cabin),
 *   outside beside it; Start / Stop as a button.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { EngineIcon, EngineSlashIcon, PlayIcon, StopIcon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileIconButton, TileName, TileState } from '../../../../areas/tileKit';
import { glowStyle, OrbButton } from '../../../../areas/tiles/ambient/ambientKit';
import { arcPath, RING_START, RING_SWEEP } from '../../../../areas/gestures';
import { has, type Vehicle } from '../../../../lib/mobilityHome';
import { Big, climateWords, deg, IconChip, TEMP_MAX, TEMP_MIN, VHUE, type VehicleTileProps, NOT_ON_CAR } from '../vehicleTileKit';

/** A remote start runs for 15 minutes (FordPass; others similar), so the ring counts down from that. */
const RUN_MINUTES = 15;

function control(v: Vehicle, act: VehicleTileProps['act']) {
  const k = v.climate;
  const on = !!k?.running;
  const start = k?.remoteStart ? 'Start the car' : 'Start climate';
  const stop = k?.remoteStart ? 'Stop the car' : 'Stop climate';
  return { can: !!k && has(v, 'climate'), on, label: on ? stop : start, run: () => act({ type: 'climate', on: !on }) };
}

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label="Climate" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={TemperatureIcon} on={false} />
        <TileName className="mt-auto">Climate</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Orb
// ---------------------------------------------------------------------------------------------

export function ClimateOrb({ v, size, act }: VehicleTileProps) {
  if (!v.climate) return <Unavailable v={v} />;
  const w = climateWords(v);
  const k = control(v, act);
  const style = glowStyle(w.hue, w.on ? 0.85 : 0, '85% 15%');
  const orb = (px: number) => <OrbButton icon={v.climate?.remoteStart ? (k.on ? EngineSlashIcon : EngineIcon) : TemperatureIcon} label={k.label} on={w.on} color={w.hue} size={px} isDisabled={!k.can} onPress={k.run} />;
  if (size === 'xs')
    return (
      <TileFrame label={w.name} className="pro-surface" style={style}>
        <div className="flex h-full items-center gap-2.5 px-3">
          {orb(40)}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{w.on ? w.word : w.name}</p>
            <TileState className="text-[12px]">{w.on ? w.detail : w.detail || 'Off'}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={w.name} className="pro-surface" style={style}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <IconChip icon={TemperatureIcon} hue={w.hue} on={w.on} />
            {orb(44)}
          </div>
          <TileName className="mt-auto">{w.name}</TileName>
          <TileState>{w.on ? `${w.word}${v.climate.minutesLeft != null ? ` · ${v.climate.minutesLeft} min` : ''}` : w.detail || 'Off'}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={w.name} className="pro-surface" style={style}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[24px]')} style={w.on ? { color: w.hue } : undefined}>
              {w.on ? w.word : 'Off'}
            </p>
            {w.on && v.climate.minutesLeft != null ? <TileState className="mt-0.5">{v.climate.minutesLeft} min left</TileState> : null}
          </div>
          {orb(size === 'l' ? 60 : 52)}
        </div>
        {size === 'l' && v.climate.cabin != null ? <Big n={deg(v.climate.cabin)} className="mt-4 text-[56px]" /> : null}
        <div className="mt-auto">
          <TileName className="text-[15px]">{w.name}</TileName>
          <TileState>
            {[v.climate.cabin != null ? `${deg(v.climate.cabin)} inside` : null, v.climate.outside != null ? `${deg(v.climate.outside)} outside` : null, v.climate.target != null ? `set ${deg(v.climate.target)}` : null].filter(Boolean).join(' · ') || 'Tap to start'}
          </TileState>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Countdown
// ---------------------------------------------------------------------------------------------

/** The ring: the minutes left of the run, the cabin temperature in the middle. */
function Ring({ v, px }: { v: Vehicle; px: number }) {
  const k = v.climate!;
  const w = climateWords(v);
  const left = k.running ? Math.max(0, Math.min(RUN_MINUTES, k.minutesLeft ?? RUN_MINUTES)) : 0;
  const c = px / 2;
  const r = c - 4;
  const end = RING_START + (RING_SWEEP * left) / RUN_MINUTES;
  return (
    <svg aria-hidden width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="shrink-0">
      <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={px > 60 ? 6 : 4} strokeLinecap="round" />
      {left > 0 ? <path d={arcPath(c, c, r, RING_START, end)} fill="none" stroke={w.hue} strokeWidth={px > 60 ? 6 : 4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${w.hue})` }} /> : null}
      <text x={c} y={c + (px > 60 ? 2 : 1)} textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="font-semibold tabular-nums" style={{ fontSize: px * (px > 60 ? 0.26 : 0.3), letterSpacing: '-0.03em' }}>
        {k.running && k.minutesLeft != null ? k.minutesLeft : deg(k.cabin)}
      </text>
      {px > 60 ? (
        <text x={c} y={c + px * 0.22} textAnchor="middle" fill="currentColor" opacity={0.6} style={{ fontSize: px * 0.1 }}>
          {k.running && k.minutesLeft != null ? 'min left' : 'inside'}
        </text>
      ) : null}
    </svg>
  );
}

function StartStop({ v, act, compact }: { v: Vehicle; act: VehicleTileProps['act']; compact?: boolean }) {
  const k = control(v, act);
  if (!k.can) return null;
  if (compact)
    return <TileIconButton icon={k.on ? StopIcon : PlayIcon} label={k.label} pressed={k.on} size={34} onPress={k.run} className={k.on ? 'bg-[color-mix(in_srgb,currentColor_10%,transparent)]' : 'bg-[var(--accent)] text-[var(--accent-foreground)]'} />;
  return (
    <Button size="sm" variant={k.on ? 'secondary' : 'primary'} onPress={k.run} data-tile-control="" className="h-9 shrink-0 gap-1 rounded-full px-4">
      <HugeiconsIcon icon={k.on ? StopIcon : PlayIcon} size={14} />
      {k.on ? 'Stop' : 'Start'}
    </Button>
  );
}

export function ClimateCountdown({ v, size, act }: VehicleTileProps) {
  if (!v.climate) return <Unavailable v={v} />;
  const w = climateWords(v);
  if (size === 'xs')
    return (
      <TileFrame label={w.name} className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <Ring v={v} px={44} />
          {/* X-small is too narrow for the word beside the ring and the button: the ring carries it. */}
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight" style={w.on ? { color: w.hue } : undefined}>
            {w.on ? (v.climate.minutesLeft != null ? 'min left' : 'On') : 'Off'}
          </p>
          <StartStop v={v} act={act} compact />
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={w.name} className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Ring v={v} px={56} />
            <StartStop v={v} act={act} compact />
          </div>
          <TileName className="mt-auto">{w.name}</TileName>
          <TileState>{w.on ? w.word : w.detail || 'Off'}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={w.name} className="pro-surface">
      <div className={cn('flex h-full items-center gap-4', size === 'l' ? 'flex-col justify-center p-5' : 'p-4')}>
        <Ring v={v} px={size === 'l' ? 150 : 112} />
        <div className={cn('flex min-w-0 flex-col gap-1', size === 'l' ? 'items-center text-center' : 'flex-1')}>
          <TileName className={cn(size === 'l' && 'text-[20px]')}>
            <span style={w.on ? { color: w.hue } : undefined}>{w.on ? w.word : w.name}</span>
          </TileName>
          <TileState>{[v.climate.cabin != null ? `${deg(v.climate.cabin)} inside` : null, v.climate.target != null ? `set ${deg(v.climate.target)}` : null].filter(Boolean).join(' · ') || (w.on ? 'On' : 'Off')}</TileState>
          <div className="mt-2">
            <StartStop v={v} act={act} />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Warm-up
// ---------------------------------------------------------------------------------------------

/** From the cabin now to the set temperature on the 16–28° scale; outside a faint tick. */
function WarmLine({ v, labels }: { v: Vehicle; labels: boolean }) {
  const k = v.climate!;
  const w = climateWords(v);
  // From just below the colder of the cabin and 16° to just above 28°, so the stretch to go fills the line.
  const lo = Math.min(k.cabin ?? TEMP_MIN, TEMP_MIN) - 2;
  const hi = TEMP_MAX + 2;
  const at = (t: number | null) => ((Math.min(hi, Math.max(lo, t ?? TEMP_MIN)) - lo) / (hi - lo)) * 100;
  const from = at(k.cabin);
  const to = at(k.target);
  const left = Math.min(from, to);
  const right = Math.max(from, to);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-8">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ background: 'color-mix(in srgb, currentColor 14%, transparent)' }} />
        {k.cabin != null && k.target != null ? (
          <span
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
            style={{ left: `${left}%`, width: `${right - left}%`, background: w.on ? `linear-gradient(90deg, ${VHUE.cool}, ${w.hue})` : 'color-mix(in srgb, currentColor 30%, transparent)', boxShadow: w.on ? `0 0 10px -1px ${w.hue}` : undefined }}
          />
        ) : null}
        {k.outside != null && k.outside >= lo ? <span className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-current opacity-35" style={{ left: `${at(k.outside)}%` }} /> : null}
        {k.cabin != null ? <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)]" style={{ left: `${from}%`, background: w.on ? w.hue : 'color-mix(in srgb, currentColor 55%, transparent)' }} /> : null}
        {k.target != null ? <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ left: `${to}%`, borderColor: w.on ? w.hue : 'color-mix(in srgb, currentColor 45%, transparent)', background: 'var(--surface)' }} /> : null}
      </div>
      {labels ? (
        <div className="flex justify-between text-[12px] tabular-nums">
          <span>
            <b className="font-semibold">{deg(k.cabin)}</b> <span className="opacity-60">inside{k.outside != null ? ` · ${deg(k.outside)} out` : ''}</span>
          </span>
          {k.target != null ? (
            <span className="text-right">
              <b className="font-semibold">{deg(k.target)}</b> <span className="opacity-60">set</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ClimateWarmup({ v, size, act }: VehicleTileProps) {
  if (!v.climate) return <Unavailable v={v} />;
  const w = climateWords(v);
  const head = (
    <p className="font-semibold tracking-[-0.02em]" style={w.on ? { color: w.hue } : undefined}>
      {w.on ? w.word : w.name}
      {w.on && v.climate.minutesLeft != null ? <span className="font-normal text-[var(--foreground)] opacity-70">, {v.climate.minutesLeft} min</span> : null}
    </p>
  );
  if (size === 'xs')
    return (
      <TileFrame label={w.name} className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px]">{head}</div>
            <TileState className="text-[12px]">
              {deg(v.climate.cabin)} inside{v.climate.target != null ? ` → ${deg(v.climate.target)}` : ''}
            </TileState>
          </div>
          <StartStop v={v} act={act} compact />
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={w.name} className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="text-[18px] leading-tight">{head}</div>
          <div className="mt-auto">
            <WarmLine v={v} labels={false} />
            <div className="mt-1 flex justify-between text-[12px] tabular-nums opacity-70">
              <span>{deg(v.climate.cabin)}</span>
              <span>{deg(v.climate.target)}</span>
            </div>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={w.name} className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className={cn('min-w-0', size === 'l' ? 'text-[26px]' : 'text-[20px]')}>{head}</div>
          <StartStop v={v} act={act} />
        </div>
        {size === 'l' ? <TileState className="mt-1">{w.on ? (v.climate.remoteStart ? 'The car is running; it stops by itself.' : 'The cabin is being conditioned.') : 'Start it 10–15 minutes before you leave.'}</TileState> : null}
        <div className="mt-auto">
          <WarmLine v={v} labels />
        </div>
      </div>
    </TileFrame>
  );
}
