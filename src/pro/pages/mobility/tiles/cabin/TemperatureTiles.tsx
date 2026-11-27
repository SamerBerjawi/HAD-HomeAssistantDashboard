/**
 * Vehicle tiles · batch 2 · Set temperature (docs/pro-ui/VEHICLE_TILES.md): the temperature the
 * climate aims for, set through the values the car accepts (16–28° in halves).
 * A · Stepper: the number big, − / + beside it; nothing else.
 * B · Dial: the Thermostat's ring, 16 to 28, the set point a glowing arc, the cabin now a dot;
 *   − / + under it.
 * C · Presets: Cool 19°, Comfort 21°, Warm 23° (as the charge limit's Daily / Trip); anything
 *   else shows as the value with − / +.
 */
import { MinusSignIcon, PlusSignIcon, TemperatureIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileChip, TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { GlassButton } from '../../../../areas/tiles/ambient/ambientKit';
import { arcPath, RING_START, RING_SWEEP } from '../../../../areas/gestures';
import type { Vehicle } from '../../../../lib/mobilityHome';
import { Big, climateWords, deg, IconChip, stepTemp, TEMP_MAX, TEMP_MIN, VHUE, type VehicleTileProps } from '../vehicleTileKit';

/** The hue of a set point: cool below 20°, warm above 22°, calm between. */
const tempHue = (t: number) => (t < 20 ? VHUE.cool : t > 22 ? VHUE.heat : 'hsl(36 85% 56%)');

function Unavailable({ v }: { v: Vehicle }) {
  return (
    <TileFrame label="Temperature" className="pro-surface opacity-70">
      <div className="flex h-full flex-col p-3.5">
        <IconChip icon={TemperatureIcon} on={false} />
        <TileName className="mt-auto">Temperature</TileName>
        <TileState>{v.climate ? 'Set in the car' : 'Not offered'}</TileState>
      </div>
    </TileFrame>
  );
}

function Steps({ v, act, px = 36 }: { v: Vehicle; act: VehicleTileProps['act']; px?: number }) {
  const t = v.climate!.target!;
  return (
    <>
      <GlassButton icon={MinusSignIcon} label="Cooler" size={px} isDisabled={t <= TEMP_MIN} onPress={() => act({ type: 'temp', value: stepTemp(t, -0.5) })} />
      <GlassButton icon={PlusSignIcon} label="Warmer" size={px} isDisabled={t >= TEMP_MAX} onPress={() => act({ type: 'temp', value: stepTemp(t, 0.5) })} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// A · Stepper
// ---------------------------------------------------------------------------------------------

export function TempStepper({ v, size, act }: VehicleTileProps) {
  const t = v.climate?.target;
  if (t == null) return <Unavailable v={v} />;
  const hue = tempHue(t);
  const inside = v.climate!.cabin != null ? `${deg(v.climate!.cabin)} inside` : 'Set temperature';
  if (size === 'xs')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        <div className="flex h-full items-center gap-1.5 px-3">
          <Big n={deg(t)} className="min-w-0 flex-1 text-[26px]" />
          <Steps v={v} act={act} px={34} />
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-center justify-between">
            <IconChip icon={TemperatureIcon} hue={hue} />
            <div className="flex gap-1.5">
              <Steps v={v} act={act} px={34} />
            </div>
          </div>
          <Big n={deg(t)} className="mt-auto text-[38px]" />
          <TileState className="mt-1">{inside}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Temperature" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <TileName>Temperature</TileName>
        <TileState>{inside}</TileState>
        <div className="mt-auto flex items-end justify-between gap-3">
          <Big n={deg(t)} className={size === 'l' ? 'text-[88px]' : 'text-[56px]'} />
          <div className="flex gap-2 pb-1">
            <Steps v={v} act={act} px={size === 'l' ? 52 : 44} />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Dial
// ---------------------------------------------------------------------------------------------

function Dial({ v, px }: { v: Vehicle; px: number }) {
  const k = v.climate!;
  const t = k.target!;
  const c = px / 2;
  const r = c - 6;
  const angle = (x: number) => RING_START + (RING_SWEEP * (Math.min(TEMP_MAX, Math.max(TEMP_MIN, x)) - TEMP_MIN)) / (TEMP_MAX - TEMP_MIN);
  const hue = tempHue(t);
  const dot = (x: number) => {
    const a = (angle(x) * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const [dx, dy] = k.cabin != null ? dot(k.cabin) : [0, 0];
  const big = px > 100;
  return (
    <svg aria-hidden width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="shrink-0">
      <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={big ? 8 : 5} strokeLinecap="round" />
      <path d={arcPath(c, c, r, RING_START, Math.max(RING_START + 0.5, angle(t)))} fill="none" stroke={hue} strokeWidth={big ? 8 : 5} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${hue})` }} />
      {k.cabin != null ? <circle cx={dx} cy={dy} r={big ? 5 : 3.5} fill="var(--surface)" stroke="currentColor" strokeWidth={2} /> : null}
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="font-semibold tabular-nums" style={{ fontSize: px * 0.27, letterSpacing: '-0.03em' }}>
        {deg(t)}
      </text>
      {big && k.cabin != null ? (
        <text x={c} y={c + px * 0.2} textAnchor="middle" fill="currentColor" opacity={0.6} style={{ fontSize: px * 0.085 }}>
          {deg(k.cabin)} inside
        </text>
      ) : null}
    </svg>
  );
}

export function TempDial({ v, size, act }: VehicleTileProps) {
  if (v.climate?.target == null) return <Unavailable v={v} />;
  const w = climateWords(v);
  if (size === 'xs')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        <div className="flex h-full items-center gap-1.5 px-2.5">
          <Dial v={v} px={52} />
          <span className="flex-1" />
          <Steps v={v} act={act} px={32} />
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        <div className="flex h-full flex-col items-center p-3">
          <Dial v={v} px={92} />
          <div className="mt-auto flex gap-2">
            <Steps v={v} act={act} px={32} />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Temperature" className="pro-surface">
      <div className={cn('flex h-full items-center gap-4', size === 'l' ? 'flex-col justify-center p-5' : 'p-4')}>
        <Dial v={v} px={size === 'l' ? 180 : 116} />
        <div className={cn('flex min-w-0 flex-col gap-1', size === 'l' ? 'items-center text-center' : 'flex-1')}>
          <TileName>Temperature</TileName>
          <TileState>{w.on ? w.word : 'Used when the climate starts'}</TileState>
          <div className="mt-2 flex gap-2">
            <Steps v={v} act={act} px={size === 'l' ? 48 : 40} />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Presets
// ---------------------------------------------------------------------------------------------

const PRESETS = [
  { id: 'cool', name: 'Cool', t: 19, why: 'A hot day' },
  { id: 'comfort', name: 'Comfort', t: 21, why: 'Most days' },
  { id: 'warm', name: 'Warm', t: 23, why: 'A cold morning' }
] as const;

export function TempPresets({ v, size, act }: VehicleTileProps) {
  const t = v.climate?.target;
  if (t == null) return <Unavailable v={v} />;
  const chosen = PRESETS.find((p) => p.t === t);
  const hue = tempHue(t);
  const chips = (compact: boolean) => (
    <div className={cn('flex gap-1.5', compact ? 'flex-nowrap' : 'flex-wrap')}>
      {PRESETS.map((p) => {
        const on = p.t === t;
        const h = tempHue(p.t);
        return (
          <TileChip
            key={p.id}
            label={`${p.name} ${p.t}°`}
            active={on}
            onPress={() => act({ type: 'temp', value: p.t })}
            className={cn(compact ? 'h-7 px-2' : 'h-8 px-3', !on && 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]')}
            style={on ? { background: `color-mix(in srgb, ${h} 22%, transparent)`, color: h } : undefined}
          >
            {compact ? `${p.t}°` : `${p.name} ${p.t}°`}
          </TileChip>
        );
      })}
    </div>
  );
  const word = chosen ? chosen.name : 'Custom';
  if (size === 'xs')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        {/* X-small: the three chips alone, the set one lit; a custom value lights none. */}
        <div className="flex h-full items-center px-3 [&>div]:w-full [&>div]:justify-between">{chips(true)}</div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label="Temperature" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <TileName>Temperature</TileName>
          <p className="mt-0.5 text-[13px]">
            <b className="font-semibold" style={{ color: hue }}>
              {word}
            </b>{' '}
            <span className="opacity-70">{deg(t)}</span>
          </p>
          <div className="mt-auto">{chips(true)}</div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Temperature" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <TileName>Temperature</TileName>
        <p className={cn('mt-1 font-semibold tracking-[-0.02em]', size === 'l' ? 'text-[30px]' : 'text-[22px]')}>
          <span style={{ color: hue }}>{word}</span> <span className="font-normal opacity-70">{deg(t)}</span>
        </p>
        <TileState>{chosen ? chosen.why : 'Your own setting'}</TileState>
        {size === 'l' ? (
          <div className="mt-4 flex items-center gap-2">
            <Steps v={v} act={act} px={40} />
            <span className="text-[12px] opacity-60">Fine-tune in halves</span>
          </div>
        ) : null}
        <div className="mt-auto">{chips(false)}</div>
      </div>
    </TileFrame>
  );
}
