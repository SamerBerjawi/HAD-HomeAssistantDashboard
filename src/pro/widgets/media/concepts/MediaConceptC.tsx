/**
 * Media concept C — Innovative ("record"). The cover becomes a round record inside a progress
 * ring in the art's colour; it turns slowly while playing and an equaliser moves beside the title
 * (both only when motion is allowed). Large adds what plays next.
 * Small: the record with play in its centre. Wide: record + text + transport. Tall: record on top.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote03Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProMediaOverviewModel } from '../../../lib/overviewMedia';
import { useBoxSize } from '../../shared/useBoxSize';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { TrackText, Transport, useMediaView, type MediaView } from './shared';

export function Equaliser({ color, playing }: { color: string; playing: boolean }) {
  return (
    <span aria-hidden className={cn('pro-eq flex h-3.5 shrink-0 items-end gap-[2px]', playing && 'is-playing')}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-[3px] rounded-full" style={{ background: color, height: playing ? undefined : 4 }} />
      ))}
    </span>
  );
}

/** Square box; the record fills it. `ring` draws the progress ring around it (concept C). */
export function Record({ view, withButton, ring = true }: { view: MediaView; withButton?: boolean; ring?: boolean }) {
  const box = useBoxSize<HTMLDivElement>({ width: 120, height: 120 });
  const d = Math.max(40, Math.min(box.width, box.height));
  const stroke = Math.max(3, d * 0.035);
  const r = d / 2 - stroke;
  const c = 2 * Math.PI * r;
  const { duration, currentPosition } = view.position;
  const pct = duration ? Math.min(1, currentPosition / duration) : 0;
  const p = view.player;
  const color = view.palette.primary;
  return (
    <div ref={box.ref} className="relative grid size-full place-items-center">
      <div className="relative" style={{ width: d, height: d }}>
        {ring ? (
          <svg width={d} height={d} className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
            {duration ? <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} /> : null}
          </svg>
        ) : null}
        <div
          className={cn('absolute overflow-hidden rounded-full shadow-lg', p?.isPlaying && 'motion-safe:animate-[spin_16s_linear_infinite]')}
          style={{ inset: ring ? stroke * 2.2 : 0, background: `repeating-radial-gradient(circle, ${view.palette.dark} 0 2px, ${view.palette.primary} 2px 4px)` }}
        >
          {view.imageUrl ? (
            <img src={view.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-white/80">
              <HugeiconsIcon icon={MusicNote03Icon} size={d / 5} />
            </div>
          )}
          {/* The spindle hole. */}
          <span className="absolute left-1/2 top-1/2 size-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--surface)] ring-2 ring-black/10" />
        </div>
        {withButton && p ? (
          <Button
            isIconOnly
            aria-label={p.isPlaying ? 'Pause' : 'Play'}
            onPress={() => view.actions.playPause(p.entityId)}
            className="absolute left-1/2 top-1/2 size-10 min-w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white backdrop-blur"
          >
            <HugeiconsIcon icon={p.isPlaying ? PauseIcon : PlayIcon} size={18} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Title({ view, big }: { view: MediaView; big?: boolean }) {
  const p = view.player;
  return (
    <div className="flex min-w-0 items-end gap-2">
      <TrackText view={view} big={big} artistColor={view.palette.isExtracted ? view.palette.badgeText : undefined} />
      <Equaliser color={view.palette.primary} playing={Boolean(p?.isPlaying)} />
    </div>
  );
}

export default function MediaConceptC({ model, size, onOpenDetails }: DesignedWidgetProps<ProMediaOverviewModel>) {
  const view = useMediaView(model, true);
  const p = view.player;
  const tint = `radial-gradient(90% 90% at 0% 100%, color-mix(in oklab, ${view.palette.primary} 22%, transparent), transparent 70%)`;
  const next = p?.upNextQueue.slice(0, 2) ?? [];

  return (
    <WidgetSurface label="Media" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]" style={{ backgroundImage: p ? tint : undefined }}>
      <DetailsButton title="Media" onPress={onOpenDetails} />
      <div ref={view.darkRef} className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {!p ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={MusicNote03Icon} size={22} />
            <p className="text-sm font-medium">Nothing playing</p>
            <p className="text-xs">{model.subtitleText}</p>
          </div>
        ) : null}

        {p && size === 's' ? <Record view={view} withButton /> : null}

        {p && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="aspect-square h-full">
              <Record view={view} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-6">
              <p className="truncate text-xs text-muted">{p.roomName || p.shortName}</p>
              <Title view={view} />
              <Transport view={view} accent={view.palette.primary} />
            </div>
          </div>
        ) : null}

        {p && size === 't' ? (
          <>
            <div className="aspect-square w-full">
              <Record view={view} />
            </div>
            <Title view={view} />
            <div className="mt-auto flex justify-center">
              <Transport view={view} accent={view.palette.primary} />
            </div>
          </>
        ) : null}

        {p && size === 'l' ? (
          <div className="flex h-full min-h-0 gap-3">
            <div className="aspect-square h-full max-w-[46%]">
              <Record view={view} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pr-6">
              <p className="truncate text-xs text-muted">{p.roomName || p.shortName}</p>
              <Title view={view} big />
              <Transport view={view} accent={view.palette.primary} />
              {next.length > 0 ? (
                <div className="mt-auto">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Up next</p>
                  <ul className="flex flex-col gap-0.5">
                    {next.map((t) => (
                      <li key={t.id} className="truncate text-xs">
                        {t.title} <span className="text-muted">· {t.artist}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
