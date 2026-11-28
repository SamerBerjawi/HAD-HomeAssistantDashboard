/** Shared bits for the fan tiles: the "air" colour, words for speed and modes, the rotor drawing. */
import { cn } from '@/lib/utils';
import { cap, levelOf, type FanTileModel } from '../../tileTypes';

/** The one colour of moving air across the fan tiles (also the Overview Fans widget's "on"). */
export const AIR = 'hsl(176 60% 42%)';

export const fanLevel = (e: FanTileModel) => levelOf(e.percentage, e.levels, e.isOn && e.available);

/** "Off", "Speed 3", "Speed 3 · Natural", "On", "Unavailable". */
export function fanState(e: FanTileModel, withMode = true): string {
  if (!e.available) return 'Unavailable';
  if (!e.isOn) return 'Off';
  const base = e.supportsSpeed ? `Speed ${fanLevel(e)}` : 'On';
  return withMode && e.presetMode ? `${base} · ${cap(e.presetMode)}` : base;
}

/** Seconds per turn: slow at speed 1, a blur at the top. */
export const spinSeconds = (e: FanTileModel) => (e.isOn ? Math.max(0.28, 2.4 - (e.supportsSpeed ? e.percentage : 60) / 45) : 0);

/** Five curved blades on a hub. Spins at the fan's speed (not with reduced motion). */
export function Rotor({ e, px, className }: { e: FanTileModel; px: number; className?: string }) {
  const s = spinSeconds(e);
  return (
    <svg width={px} height={px} viewBox="-50 -50 100 100" aria-hidden className={cn('block shrink-0', className)} style={{ width: px, height: px }}>
      <g className={s ? 'motion-safe:animate-spin' : ''} style={s ? { animationDuration: `${s}s`, transformOrigin: 'center', transformBox: 'fill-box' } : undefined}>
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M 0 -6 C 10 -14 20 -34 8 -44 C 0 -48 -8 -40 -7 -30 C -6 -20 -4 -12 0 -6 Z" fill="currentColor" opacity={0.9} />
        ))}
        <circle r={9} fill="currentColor" />
        <circle r={4} className="fill-[var(--surface)]" />
      </g>
    </svg>
  );
}
