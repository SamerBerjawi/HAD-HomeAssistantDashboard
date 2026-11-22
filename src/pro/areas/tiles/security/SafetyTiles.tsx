/**
 * Leak & smoke, batch 4 concepts (read-only sensors; an alarm must be impossible to miss, and a
 * dead sensor is a risk too).
 * - A · "Alarm": calm green check while clear; on an alarm the whole tile floods red and pulses,
 *   the hazard in big letters.
 * - B · "Device": the sensor itself, a puck with its status light (slow green blink when fine,
 *   fast red when not) and its battery; "last heard" up front, because silence is a failure too.
 * - C · "Advice": deliberately quiet while clear (grey, one line); on an alarm it says what to do
 *   ("Turn off the water at the main valve").
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { SafetyTileModel, TileProps } from '../../tileTypes';
import { ALARM, BatteryNote, IconDot, SAFE, safetyIcon, safetyInfo, Shell, WATCH } from './securityParts';

const ADVICE: Record<SafetyTileModel['deviceClass'], string> = {
  moisture: 'Turn off the water at the main valve',
  smoke: 'Get everyone out, then check the source',
  gas: 'Open windows, no switches, leave the house',
  carbon_monoxide: 'Get fresh air now and call for help'
};

/* ── A · Alarm ── */
export function SafetyAlarm({ e: s, size }: TileProps<SafetyTileModel>) {
  const info = safetyInfo(s);
  const flood = info.alarm;
  return (
    <Shell
      size={size}
      label={s.name}
      name={flood && size !== 'xs' ? s.name : s.name}
      className={cn(!flood && 'pro-surface', flood && 'text-white motion-safe:animate-[had-alarm_1.2s_ease-in-out_infinite]', !s.available && 'opacity-80')}
      style={flood ? { background: `linear-gradient(150deg, ${ALARM}, color-mix(in srgb, ${ALARM} 70%, black))` } : undefined}
      state={
        flood ? (
          <span className={cn('font-bold tracking-tight', size === 'xs' ? '' : size === 'l' ? 'text-[34px]' : 'text-[24px] leading-none')}>{info.word}</span>
        ) : (
          <span style={{ color: info.hue }}>{info.word}</span>
        )
      }
      detail={info.detail}
      visual={(px) => (
        <IconDot
          icon={flood ? safetyIcon(s) : s.available ? CheckmarkCircle02Icon : safetyIcon(s)}
          hue={flood ? 'white' : info.hue}
          px={size === 'xs' ? 38 : size === 's' ? 40 : Math.round(px * 0.6)}
          style={flood ? { background: 'rgba(255,255,255,0.2)', color: 'white' } : undefined}
        />
      )}
      aside={<BatteryNote battery={s.battery} className={flood ? '!text-white' : ''} />}
    />
  );
}

/* ── B · Device ── */
function Puck({ s, px }: { s: SafetyTileModel; px: number }) {
  const info = safetyInfo(s);
  const led = !s.available ? WATCH : info.alarm ? ALARM : SAFE;
  const blink = !s.available ? '' : info.alarm ? 'motion-safe:animate-[had-blink_0.5s_steps(2)_infinite]' : 'motion-safe:animate-[had-blink_3s_ease-in-out_infinite]';
  const bat = s.battery;
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      <span className="absolute inset-[6%] rounded-full bg-[linear-gradient(160deg,hsl(0_0%_100%),hsl(220_10%_88%))] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35),inset_0_-3px_0_rgba(0,0,0,0.06)] dark:bg-[linear-gradient(160deg,hsl(225_8%_34%),hsl(225_10%_20%))]" />
      <span className="absolute inset-[22%] rounded-full border border-black/5 dark:border-white/10" />
      <span className={cn('relative rounded-full', blink)} style={{ width: Math.max(6, px * 0.12), height: Math.max(6, px * 0.12), background: led, boxShadow: `0 0 ${Math.round(px * 0.12)}px ${led}` }} />
      <HugeiconsIcon icon={safetyIcon(s)} size={Math.round(px * 0.16)} className="absolute bottom-[26%] opacity-35" />
      {bat !== null && px >= 80 ? (
        <span className="absolute bottom-[10%] h-1 w-[34%] overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <span className="block h-full rounded-full" style={{ width: `${bat}%`, background: bat <= 20 ? ALARM : SAFE }} />
        </span>
      ) : null}
    </span>
  );
}

export function SafetyDevice({ e: s, size }: TileProps<SafetyTileModel>) {
  const info = safetyInfo(s);
  return (
    <Shell
      size={size}
      label={s.name}
      name={s.name}
      className={cn('pro-surface', info.alarm && 'ring-2 ring-inset ring-[hsl(4_82%_54%)]')}
      state={<span style={{ color: info.hue }}>{info.alarm || !s.available ? info.word : size === 'xs' || size === 's' ? info.detail : info.word}</span>}
      detail={
        <span className="flex flex-wrap items-center gap-x-2">
          {info.detail}
          {s.battery !== null ? <BatteryNote battery={s.battery} always /> : null}
        </span>
      }
      visual={(px) => <Puck s={s} px={size === 'xs' ? 46 : size === 's' ? 58 : px} />}
    />
  );
}

/* ── C · Advice ── */
export function SafetyAdvice({ e: s, size }: TileProps<SafetyTileModel>) {
  const info = safetyInfo(s);
  const quiet = !info.alarm && s.available;
  if (quiet) {
    return (
      <Shell
        size={size}
        label={s.name}
        name={s.name}
        className="pro-surface"
        state={<span className="opacity-80">{info.word}</span>}
        detail={info.detail}
        visual={(px) => <IconDot icon={safetyIcon(s)} hue="hsl(230 8% 58%)" px={size === 'xs' ? 34 : size === 's' ? 32 : Math.round(px * 0.36)} />}
        aside={<BatteryNote battery={s.battery} />}
      />
    );
  }
  const tone = info.alarm ? ALARM : WATCH;
  const advice = info.alarm ? ADVICE[s.deviceClass] : 'It hasn’t reported in. Check its battery or connection';
  return (
    <Shell
      size={size}
      label={s.name}
      name={size === 'xs' ? info.word : `${info.word} ${s.name}`}
      wrap
      className="shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${tone} 22%, var(--surface)), color-mix(in srgb, ${tone} 8%, var(--surface)))`, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${tone} 55%, transparent)` }}
      state={<span className={cn('font-semibold', size === 'l' && 'text-[18px] leading-snug')} style={{ color: tone }}>{size === 'xs' ? s.name : advice}</span>}
      detail={size === 'xs' ? undefined : info.detail}
      visual={(px) => <IconDot icon={safetyIcon(s)} hue={tone} px={size === 'xs' ? 36 : size === 's' ? 36 : Math.round(px * 0.45)} solid />}
      aside={<BatteryNote battery={s.battery} />}
    />
  );
}
