/**
 * Concept D · "Ambient" (owner's reference screenshots, 2026-11-21): frosted glass cards with a
 * hairline edge, a soft wave of the entity's colour rising from a corner as it's more "on", round
 * glowing buttons, generous type. One colour per kind of thing. Light and dark.
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export const HUE = {
  light: 'hsl(40 95% 60%)',
  power: 'hsl(158 64% 50%)',
  air: 'hsl(176 62% 46%)',
  cool: 'hsl(205 90% 58%)',
  heat: 'hsl(22 95% 58%)',
  media: 'hsl(268 75% 66%)',
  water: 'hsl(210 85% 62%)',
  idle: 'hsl(230 10% 60%)'
} as const;

export function Glass({ label, children, className, style, ...rest }: { label: string; children: ReactNode; className?: string; style?: CSSProperties } & Record<`data-${string}`, string>) {
  return (
    <section
      aria-label={label}
      style={style}
      {...rest}
      className={cn(
        'relative isolate h-full w-full min-w-0 overflow-hidden rounded-[28px] backdrop-blur-xl',
        'bg-white/75 text-[hsl(240_20%_14%)] shadow-[0_10px_30px_-14px_rgba(40,30,80,0.28)] ring-1 ring-black/[0.06]',
        'dark:bg-white/[0.045] dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0))] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_-16px_rgba(0,0,0,0.8)] dark:ring-white/10',
        className
      )}
    >
      {children}
    </section>
  );
}

/** The ambient wave: rises from the bottom-right, further and stronger as `level` (0–1) grows. */
export function Wave({ color, level, from = 'right' }: { color: string; level: number; from?: 'right' | 'bottom' }) {
  const id = useId().replace(/:/g, '');
  if (level <= 0) return null;
  const x0 = 100 - (30 + 62 * level);
  const d =
    from === 'right'
      ? `M ${x0} 100 C ${x0 + 16} 100 ${x0 + 6} 52 ${x0 + 30} 40 S 96 12 100 0 L 100 100 Z`
      : `M 0 ${100 - 40 * level} C 25 ${92 - 46 * level} 55 ${104 - 30 * level} 75 ${96 - 44 * level} S 95 ${80 - 40 * level} 100 ${76 - 40 * level} L 100 100 L 0 100 Z`;
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.08} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.32 + 0.3 * level} />
          <stop offset="1" stopColor={color} stopOpacity={0.55 + 0.35 * level} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} style={{ transition: 'd 500ms cubic-bezier(.2,.8,.2,1)' }} />
    </svg>
  );
}

/** A soft corner glow behind everything (the "light in the room"). */
export const glowStyle = (color: string, level: number, at = '85% 85%'): CSSProperties | undefined =>
  level > 0 ? { backgroundImage: `radial-gradient(120% 90% at ${at}, color-mix(in srgb, ${color} ${Math.round(10 + 22 * level)}%, transparent), transparent 70%)` } : undefined;

export function OrbButton({ icon, label, onPress, on, color, size = 44, isDisabled, iconSize }: { icon: IconSvgElement; label: string; onPress: () => void; on: boolean; color: string; size?: number; isDisabled?: boolean; iconSize?: number }) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      aria-pressed={on}
      isDisabled={isDisabled}
      onPress={onPress}
      data-tile-control=""
      className={cn('min-w-0 shrink-0 rounded-full p-0 transition-[background,box-shadow] duration-300', on ? 'text-[hsl(30_40%_14%)]' : 'bg-black/[0.06] text-current/70 dark:bg-white/10')}
      style={{ width: size, height: size, ...(on ? { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 55%, white), ${color})`, boxShadow: `0 0 26px -2px color-mix(in srgb, ${color} 70%, transparent)` } : {}) }}
    >
      <HugeiconsIcon icon={icon} size={iconSize ?? Math.round(size * 0.46)} />
    </Button>
  );
}

/** Round glass control (up / down / play…). */
export function GlassButton({ icon, label, onPress, size = 40, isDisabled, active }: { icon: IconSvgElement; label: string; onPress: () => void; size?: number; isDisabled?: boolean; active?: boolean }) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      isDisabled={isDisabled}
      onPress={onPress}
      data-tile-control=""
      className={cn('min-w-0 shrink-0 rounded-full p-0 ring-1 ring-black/[0.05] dark:ring-white/10', active ? 'bg-black/15 dark:bg-white/25' : 'bg-black/[0.05] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15')}
      style={{ width: size, height: size }}
    >
      <HugeiconsIcon icon={icon} size={Math.round(size * 0.45)} strokeWidth={2.2} />
    </Button>
  );
}

export function AName({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('line-clamp-2 min-w-0 break-words text-[16px] font-semibold leading-[1.15] tracking-[-0.01em]', className)}>{children}</p>;
}
export function AState({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-1 min-w-0 truncate text-[14px] leading-tight opacity-65 tabular-nums', className)}>{children}</p>;
}
