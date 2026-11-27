/**
 * Vehicle tiles · batch 3 · Alarm & find (docs/pro-ui/VEHICLE_TILES.md): is the alarm set or
 * going off (bikes: stolen, crashed), and find the car in a car park by honking and flashing.
 * A · Status: the alarm as a word (Set, Off, Going off) with its shield; Honk & flash as a button.
 * B · Find: one big round Honk & flash button with rings that ripple out when pressed; the alarm
 *   small in the corner.
 * C · Quiet: nothing to see while all is well (a small "Alarm set" and the button); the whole tile
 *   turns red with what happened when the alarm goes off or the bike is stolen or crashed.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Megaphone01Icon, SecurityCheckIcon, SecurityIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { ALARM, SAFE } from '../../../../areas/tiles/security/securityParts';
import { has, type Vehicle } from '../../../../lib/mobilityHome';
import { IconChip, VHUE, type VehicleTileProps, NOT_ON_CAR } from '../vehicleTileKit';

/** The alarm in words: Set, Off, Going off; bikes report stolen and crashed instead. */
function alarmOf(v: Vehicle): { word: string; detail: string; hue: string; alert: boolean } | null {
  const s = v.security;
  if (s.alarm === 'triggered') return { word: 'Going off', detail: 'The alarm is sounding', hue: ALARM, alert: true };
  if (s.stolen) return { word: 'Stolen', detail: 'Reported stolen; tracking is on', hue: ALARM, alert: true };
  if (s.crashed) return { word: 'Crash', detail: 'A crash was detected', hue: ALARM, alert: true };
  if (s.alarm === 'armed') return { word: 'Set', detail: 'Alarm set', hue: SAFE, alert: false };
  if (s.alarm === 'disarmed') return { word: 'Off', detail: 'Alarm off', hue: VHUE.idle, alert: false };
  return v.kind === 'bike' ? { word: 'All well', detail: 'No theft or crash', hue: SAFE, alert: false } : null;
}

function Unavailable() {
  return (
    <TileFrame label="Alarm" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={SecurityIcon} on={false} />
        <TileName className="mt-auto">Alarm</TileName>
        <TileState>{NOT_ON_CAR}</TileState>
      </div>
    </TileFrame>
  );
}

function HonkButton({ v, act, compact, full }: { v: Vehicle; act: VehicleTileProps['act']; compact?: boolean; full?: boolean }) {
  if (!has(v, 'honk')) return null;
  return (
    <Button size="sm" variant="secondary" onPress={() => act({ type: 'honk' })} data-tile-control="" className={cn('shrink-0 gap-1.5 rounded-full', compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-4', full && 'w-full')}>
      <HugeiconsIcon icon={Megaphone01Icon} size={14} />
      {compact ? 'Honk' : 'Honk & flash'}
    </Button>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Status
// ---------------------------------------------------------------------------------------------

export function AlarmStatus({ v, size, act }: VehicleTileProps) {
  const a = alarmOf(v);
  if (!a && !has(v, 'honk')) return <Unavailable />;
  const hue = a?.hue ?? VHUE.idle;
  const icon = a?.alert ? Alert02Icon : a?.word === 'Set' ? SecurityCheckIcon : SecurityIcon;
  const word = a ? (a.alert ? a.word : `Alarm ${a.word.toLowerCase()}`) : 'Find the car';
  if (size === 'xs')
    return (
      <TileFrame label="Alarm" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-3">
          <IconChip icon={icon} hue={hue} px={32} />
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={a?.alert ? { color: hue } : undefined}>
            {word}
          </p>
          <HonkButton v={v} act={act} compact />
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Alarm" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 's' ? 'p-3.5' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <IconChip icon={icon} hue={hue} px={size === 'l' ? 40 : 32} />
          {size === 'w' ? <HonkButton v={v} act={act} /> : null}
        </div>
        <div className="mt-auto">
          <p className={cn('font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[20px]')} style={a?.alert ? { color: hue } : undefined}>
            {word}
          </p>
          <TileState>{a?.alert ? a.detail : has(v, 'honk') ? 'Honk and flash to find it' : (a?.detail ?? '')}</TileState>
          {size !== 'w' && has(v, 'honk') ? (
            <div className="mt-2.5">
              <HonkButton v={v} act={act} compact={size === 's'} full />
            </div>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Find
// ---------------------------------------------------------------------------------------------

/** The big round button; rings ripple out for a moment after each press. */
function Beacon({ v, act, px }: { v: Vehicle; act: VehicleTileProps['act']; px: number }) {
  const [pulse, setPulse] = useState(0);
  const hue = 'hsl(40 95% 58%)';
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      {pulse
        ? [0, 1].map((i) => (
            <span
              key={`${pulse}-${i}`}
              aria-hidden
              className="pro-mob-ping absolute inset-0 rounded-full"
              style={{ border: `2px solid ${hue}`, animationDelay: `${i * 0.35}s` }}
            />
          ))
        : null}
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Honk and flash the lights"
        isDisabled={!has(v, 'honk')}
        onPress={() => {
          act({ type: 'honk' });
          setPulse((n) => n + 1);
        }}
        data-tile-control=""
        className="relative min-w-0 rounded-full p-0 text-[hsl(30_40%_14%)]"
        style={{ width: px * 0.78, height: px * 0.78, background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${hue} 55%, white), ${hue})`, boxShadow: `0 0 24px -4px ${hue}` }}
      >
        <HugeiconsIcon icon={Megaphone01Icon} size={Math.round(px * 0.32)} />
      </Button>
    </div>
  );
}

export function AlarmFind({ v, size, act }: VehicleTileProps) {
  const a = alarmOf(v);
  if (!has(v, 'honk')) return a ? <AlarmQuiet v={v} size={size} act={act} now={0} /> : <Unavailable />;
  const corner = a ? (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: a.hue }}>
      <HugeiconsIcon icon={a.alert ? Alert02Icon : SecurityCheckIcon} size={14} />
      {a.alert ? a.word : `Alarm ${a.word.toLowerCase()}`}
    </span>
  ) : null;
  if (size === 'xs')
    return (
      <TileFrame label="Find" className="pro-surface">
        <div className="flex h-full items-center gap-2 px-2.5">
          <Beacon v={v} act={act} px={52} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">Find</p>
            <div className="truncate">{corner}</div>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Find" className="pro-surface">
      <div className={cn('flex h-full', size === 'w' ? 'items-center gap-4 p-4' : 'flex-col items-center p-3.5 text-center')}>
        <Beacon v={v} act={act} px={size === 'l' ? 150 : size === 'w' ? 104 : 84} />
        <div className={cn('min-w-0', size === 'w' ? 'flex-1' : 'mt-auto')}>
          <TileName className={cn(size === 'l' && 'text-[20px]')}>Find the car</TileName>
          {size !== 's' ? <TileState>Honk and flash the lights</TileState> : null}
          {corner ? <div className={cn(size !== 's' && 'mt-1.5')}>{corner}</div> : null}
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Quiet
// ---------------------------------------------------------------------------------------------

export function AlarmQuiet({ v, size, act }: VehicleTileProps) {
  const a = alarmOf(v);
  if (!a && !has(v, 'honk')) return <Unavailable />;
  if (a?.alert)
    return (
      <TileFrame label="Alarm" className="text-white" style={{ background: `linear-gradient(150deg, ${ALARM}, color-mix(in srgb, ${ALARM} 70%, black))` }}>
        <div className={cn('flex h-full', size === 'xs' ? 'items-center gap-2 px-3' : 'flex-col p-4')}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20">
            <HugeiconsIcon icon={Alert02Icon} size={18} />
          </span>
          <div className={cn('min-w-0', size === 'xs' ? 'flex-1' : 'mt-auto')}>
            <p className={cn('truncate font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[32px]' : size === 'xs' ? 'text-[15px]' : 'text-[22px]')}>{a.word}</p>
            {size !== 'xs' ? <p className="text-[13px] opacity-85">{a.detail}</p> : null}
          </div>
          {size !== 'xs' && has(v, 'honk') ? (
            <Button size="sm" variant="secondary" onPress={() => act({ type: 'honk' })} data-tile-control="" className="mt-3 h-9 w-full gap-1.5 rounded-full bg-white/90 text-[hsl(4_70%_30%)]">
              <HugeiconsIcon icon={Megaphone01Icon} size={14} />
              Honk & flash
            </Button>
          ) : null}
        </div>
      </TileFrame>
    );
  const note = a ? (a.word === 'Set' ? 'Alarm set' : a.detail) : 'No alarm';
  if (size === 'xs' || size === 's')
    return (
      <TileFrame label="Alarm" className="pro-surface">
        <div className={cn('flex h-full', size === 'xs' ? 'items-center gap-2 px-3' : 'flex-col p-3.5')}>
          <div className={cn('flex min-w-0 items-center gap-1.5', size === 'xs' && 'flex-1')}>
            <HugeiconsIcon icon={SecurityCheckIcon} size={16} style={{ color: a?.hue }} className={a ? undefined : 'opacity-50'} />
            <span className="truncate text-[13px] opacity-75">{note}</span>
          </div>
          <div className={cn(size === 's' && 'mt-auto')}>
            <HonkButton v={v} act={act} compact full={size === 's'} />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Alarm" className="pro-surface">
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={SecurityCheckIcon} size={16} style={{ color: a?.hue }} />
          <span className="text-[13px] opacity-75">{note}</span>
        </div>
        <TileState className="mt-auto">Lost it in a car park?</TileState>
        <div className="mt-2">
          <HonkButton v={v} act={act} full={size === 'l'} />
        </div>
      </div>
    </TileFrame>
  );
}
