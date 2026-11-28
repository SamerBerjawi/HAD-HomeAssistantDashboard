/**
 * Rain, snow and storm for weather designs on a plain card (design C, owner 2026-11-20). The same
 * drops, flakes and lightning as the Sky design, tinted for the surface (blue drops on light
 * cards, pale ones on dark) and kept faint so the line and bars stay readable. Still with
 * reduced motion; nothing for dry weather.
 */
import { cn } from '@/lib/utils';
import { skyKind } from './sky';

export function WeatherFx({ condition }: { condition: string }) {
  const kind = skyKind(condition);
  if (kind !== 'rain' && kind !== 'storm' && kind !== 'snow') return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {kind === 'storm' ? (
        <div className="pro-sky-flash absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 70% 0%, hsl(228 95% 82% / 0.75), hsl(228 95% 82% / 0.2) 55%, transparent 80%)' }} />
      ) : null}
      {kind === 'snow' ? (
        <div className="pro-sky-snow is-ink absolute inset-0 text-[hsl(212_45%_60%)] opacity-60 dark:text-white dark:opacity-55" />
      ) : (
        <div className={cn('pro-sky-rain is-ink absolute inset-0 text-[hsl(212_75%_50%)] dark:text-[hsl(205_85%_80%)]', kind === 'storm' ? 'is-heavy opacity-45' : 'opacity-35')} />
      )}
    </div>
  );
}
