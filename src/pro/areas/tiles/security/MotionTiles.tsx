/**
 * Motion & presence, batch 4 concepts (read-only sensors).
 * - A · "Pulse": a dot sends out rings while it sees someone; still and fading the longer the
 *   room has been quiet. Presence sensors hold a steady glow instead of ripples.
 * - B · "Ticks": every detection in the last six hours as a tick on a strip, with the count, so
 *   you can tell a busy hallway from a room nobody has been in.
 * - C · "Since": one big number, how long since anyone moved ("14m"), or "Now". For checking
 *   whether a room is really empty before switching it off.
 */
import { cn } from '@/lib/utils';
import type { MotionTileModel, TileProps } from '../../tileTypes';
import { BatteryNote, CALM, EventStrip, IconDot, motionIcon, motionInfo, SEEN, Shell, span } from './securityParts';

/* ── A · Pulse ── */
function PulseDot({ m, px }: { m: MotionTileModel; px: number }) {
  const on = m.available && m.isOn;
  const presence = m.deviceClass !== 'motion';
  const mins = m.lastChanged ? (Date.now() - m.lastChanged) / 60_000 : 999;
  const fade = on ? 1 : Math.max(0.25, 1 - mins / 120);
  const core = Math.round(px * 0.34);
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      {on && !presence
        ? [0, 1, 2].map((i) => (
            <span key={i} className="absolute inset-0 rounded-full border-2 motion-safe:animate-[had-ripple_2.4s_ease-out_infinite]" style={{ borderColor: SEEN, animationDelay: `${i * 0.8}s`, opacity: 0 }} />
          ))
        : null}
      {on && presence ? <span className="absolute inset-[12%] rounded-full" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${SEEN} 35%, transparent), transparent 70%)` }} /> : null}
      <span className="relative rounded-full transition-[background,box-shadow] duration-500" style={{ width: core, height: core, background: on ? SEEN : CALM, opacity: m.available ? fade : 0.3, boxShadow: on ? `0 0 ${core}px ${SEEN}` : undefined }} />
    </span>
  );
}

export function MotionPulse({ e: m, size }: TileProps<MotionTileModel>) {
  const info = motionInfo(m);
  return (
    <Shell
      size={size}
      label={m.name}
      name={m.name}
      className={cn('pro-surface', !m.available && 'opacity-60')}
      state={<span style={{ color: m.isOn && m.available ? SEEN : undefined }}>{size === 'xs' || size === 's' ? (m.isOn ? info.word : info.detail || info.word) : info.word}</span>}
      detail={size === 'xs' || size === 's' ? undefined : info.detail}
      visual={(px) => <PulseDot m={m} px={size === 'xs' ? 42 : size === 's' ? 54 : px} />}
      aside={<BatteryNote battery={m.battery} />}
    />
  );
}

/* ── B · Ticks ── */
export function MotionTicks({ e: m, size }: TileProps<MotionTileModel>) {
  const info = motionInfo(m);
  const n = m.events.length;
  const count = !m.available ? '' : n ? `${n}× in 6 h` : 'None in 6 h';
  return (
    <Shell
      size={size}
      label={m.name}
      name={m.name}
      className={cn('pro-surface', !m.available && 'opacity-60')}
      state={
        <span>
          <span className="font-semibold" style={{ color: m.isOn && m.available ? SEEN : undefined }}>
            {info.word}
          </span>
          {count && size !== 't' && size !== 'l' ? <span className="opacity-80"> · {count}</span> : null}
        </span>
      }
      detail={size === 't' || size === 'l' ? `${info.detail}${count ? ` · ${count}` : ''}` : info.detail}
      visual={(px) => (size === 'w' ? null : <IconDot icon={motionIcon(m)} hue={m.isOn && m.available ? SEEN : CALM} px={size === 'xs' ? 36 : size === 's' ? 34 : Math.round(px * 0.45)} solid={m.isOn && m.available} />)}
      aside={<BatteryNote battery={m.battery} />}
      strip={m.available ? <EventStrip times={m.events} hue={SEEN} labels={size !== 's'} /> : undefined}
    />
  );
}

/* ── C · Since ── */
export function MotionSince({ e: m, size }: TileProps<MotionTileModel>) {
  const on = m.available && m.isOn;
  const presence = m.deviceClass !== 'motion';
  const big = !m.available ? '—' : on ? (presence ? span(m.lastChanged) : 'Now') : span(m.lastChanged) || '—';
  const caption = !m.available ? 'Unavailable' : on ? (presence ? 'occupied' : 'motion detected') : presence ? 'empty' : 'since motion';
  const Big = ({ cls }: { cls: string }) => (
    <span className="flex flex-col">
      <span className={cn('font-semibold leading-none tracking-[-0.04em] tabular-nums', cls)} style={{ color: on ? SEEN : undefined }}>
        {big}
      </span>
      <span className="mt-1 text-[13px] font-medium opacity-60">{caption}</span>
    </span>
  );
  return (
    <Shell
      size={size}
      label={m.name}
      name={size === 'xs' ? m.name : m.name}
      className={cn('pro-surface', !m.available && 'opacity-60')}
      style={on ? { background: `linear-gradient(160deg, color-mix(in srgb, ${SEEN} 12%, var(--surface)), var(--surface) 70%)` } : undefined}
      state={size === 'xs' ? `${big === 'Now' ? 'Motion now' : `${big} ${caption}`}` : <Big cls={size === 'l' ? 'text-[56px]' : size === 's' ? 'text-[34px]' : 'text-[40px]'} />}
      detail={size === 'xs' ? undefined : presence ? 'Presence sensor' : undefined}
      visual={() => (size === 'xs' ? <IconDot icon={motionIcon(m)} hue={on ? SEEN : CALM} px={36} /> : null)}
      aside={<BatteryNote battery={m.battery} />}
    />
  );
}
