/**
 * Fans concept B — Expressive & immersive ("airflow"). A cool mint card with air streaming
 * across it; the stream and the fan blades move faster the faster the fans run, and stop when
 * all are off (motion only when allowed). Small: blades + speed + all. Wide: + running fans.
 * Tall/Large: + a row per fan with its speed.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Fan01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProFansModel } from '../../../lib/overviewAppliances';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useFanActions } from '../useFanActions';

export default function FansConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProFansModel>) {
  const actions = useFanActions(m);
  const anyOn = m.onCount > 0;
  const speed = anyOn ? (m.avgSpeedPct ?? 66) : 0;
  // Seconds per turn / per stream pass: faster fans, shorter durations.
  const spin = anyOn ? Math.max(0.35, 2.4 - speed / 50) : 0;
  const flow = anyOn ? Math.max(1.2, 6 - speed / 20) : 0;
  const all = (
    <Button
      size="sm"
      variant="ghost"
      onPress={() => void actions.toggleAll(!anyOn)}
      className="h-8 rounded-full bg-white/20 px-3 text-xs font-semibold text-white ring-1 ring-white/25 hover:bg-white/30"
    >
      {anyOn ? 'All off' : 'All on'}
    </Button>
  );
  const head = (
    <div className="flex min-w-0 items-center gap-2">
      <HugeiconsIcon
        icon={Fan01Icon}
        size={size === 's' ? 28 : 30}
        className={cn('shrink-0', anyOn ? 'motion-safe:animate-spin' : 'opacity-60')}
        style={anyOn ? { animationDuration: `${spin}s` } : undefined}
      />
      <div className="min-w-0">
        <p className="text-3xl font-semibold leading-none tabular-nums">{anyOn ? `${speed}%` : 'Off'}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-white/80">{anyOn ? `${m.onCount} of ${m.totalCount} running` : `${m.totalCount} fans`}</p>
      </div>
    </div>
  );

  return (
    <WidgetSurface
      label="Fans"
      ink="light"
      style={{ background: anyOn ? 'linear-gradient(150deg, hsl(172 55% 46%), hsl(196 60% 34%))' : 'linear-gradient(150deg, hsl(190 12% 40%), hsl(205 14% 24%))' }}
    >
      {anyOn ? (
        <div aria-hidden className="pro-airflow pointer-events-none absolute inset-0 -z-10" style={{ ['--pro-flow' as string]: `${flow}s` }}>
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      <DetailsButton title="Fans" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {m.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-white/70">
            <HugeiconsIcon icon={Fan01Icon} size={22} />
            <p className="text-sm font-medium">No fans</p>
          </div>
        ) : null}
        {m.totalCount > 0 ? <div className="pr-8">{head}</div> : null}
        {m.totalCount > 0 && size === 's' ? <div className="mt-auto">{all}</div> : null}
        {m.totalCount > 0 && size === 'w' ? (
          <div className="mt-auto flex items-end justify-between gap-2">
            <ul aria-label="Running" className="flex min-w-0 flex-wrap gap-1.5">
              {m.items
                .filter((f) => f.isOn)
                .slice(0, 2)
                .map((f) => (
                  <li key={f.entityId} className="truncate rounded-full bg-white/15 px-2.5 py-1 text-xs ring-1 ring-white/20">
                    {f.roomName} · {f.percentage}%
                  </li>
                ))}
            </ul>
            {all}
          </div>
        ) : null}
        {m.totalCount > 0 && (size === 't' || size === 'l') ? (
          <>
            <ul aria-label="Fans" className={cn('mt-auto gap-1.5', size === 'l' ? 'grid grid-cols-2' : 'flex flex-col')}>
              {m.items.slice(0, size === 'l' ? 6 : 4).map((f) => (
                <li key={f.entityId} className="min-w-0">
                  <Button
                    variant="ghost"
                    onPress={() => actions.toggleFan(f)}
                    aria-label={`${f.name}, ${f.isOn ? `${f.percentage}%` : 'off'}. Switch ${f.isOn ? 'off' : 'on'}`}
                    className={cn(
                      'h-auto w-full min-w-0 flex-col items-start gap-1 rounded-xl px-2.5 py-1.5 text-left text-white ring-1',
                      f.isOn ? 'bg-white/20 ring-white/25' : 'bg-white/5 text-white/60 ring-white/10'
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{f.roomName}</span>
                      <span className="tabular-nums">{f.isOn ? `${f.percentage}%` : 'Off'}</span>
                    </span>
                    <span className="h-1 w-full overflow-hidden rounded-full bg-white/15">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${f.isOn ? f.percentage : 0}%` }} />
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">{all}</div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
