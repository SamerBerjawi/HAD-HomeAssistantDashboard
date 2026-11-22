/**
 * Rain chance as bars (owner review 2026-11-20, WIDGET_DESIGN.md §8 #15): one bar per hour (or
 * day), its height the chance of rain, the number on the bars that matter (20% and up).
 * `ink="light"` on the sky widget, theme colours in the sheet. Nothing to draw when it stays dry.
 */
import { cn } from '@/lib/utils';

export interface RainSlot {
  key: string;
  label: string;
  pct: number;
}

export const anyRain = (slots: readonly RainSlot[]) => slots.some((s) => s.pct > 0);

export function RainChance({ slots, ink = 'theme', height = 56, labels = true, className }: { slots: RainSlot[]; ink?: 'theme' | 'light'; height?: number; labels?: boolean; className?: string }) {
  const light = ink === 'light';
  return (
    <ul aria-label="Chance of rain" className={cn('grid items-end gap-1', className)} style={{ gridTemplateColumns: `repeat(${Math.max(1, slots.length)}, minmax(0, 1fr))` }}>
      {slots.map((s, i) => (
        <li key={s.key} className="flex min-w-0 flex-col items-center gap-1" aria-label={`${s.label}: ${s.pct}% chance of rain`}>
          <span className={cn('text-[10px] font-semibold tabular-nums', light ? 'text-white/90' : 'text-[hsl(205_85%_50%)]', s.pct < 20 && 'invisible')}>{s.pct}%</span>
          <span className={cn('relative w-full max-w-4 overflow-hidden rounded-full', light ? 'bg-white/15' : 'bg-default/50')} style={{ height }}>
            <span
              className={cn('absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-500', light ? 'bg-[hsl(200_90%_82%)]' : 'bg-[hsl(205_85%_55%)]')}
              style={{ height: `${Math.max(0, Math.min(100, s.pct))}%` }}
            />
          </span>
          {labels ? (
            // Many bars: every third label, so they never run together on a phone.
            <span className={cn('whitespace-nowrap text-[10px]', light ? 'text-white/75' : 'text-muted', slots.length > 8 && i % 3 !== 0 && 'invisible')}>{s.label}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
