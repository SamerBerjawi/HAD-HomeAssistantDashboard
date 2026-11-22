/**
 * Media concept A — Refined & minimal. Neutral surface; the cover is the only image and the
 * artist takes its colour. Small: cover, title, play. Wide: cover beside title and transport.
 * Tall: cover on top. Large: cover, title, progress and transport, with the room.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote03Icon } from '@hugeicons/core-free-icons';
import type { ProMediaOverviewModel } from '../../../lib/overviewMedia';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { Art, Progress, TrackText, Transport, useMediaView } from './shared';

export default function MediaConceptA({ model, size, onOpenDetails }: DesignedWidgetProps<ProMediaOverviewModel>) {
  const view = useMediaView(model, size === 'l');
  const p = view.player;
  const accent = view.palette.isExtracted ? view.palette.primary : undefined;
  const artist = view.palette.isExtracted ? view.palette.badgeText : undefined;
  const room = p ? `${p.roomName || p.shortName}${p.isPlaying ? '' : ' · paused'}` : '';

  return (
    <WidgetSurface label="Media" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Media" onPress={onOpenDetails} />
      <div ref={view.darkRef} className="flex h-full min-h-0 flex-col p-3.5">
        {!p ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={MusicNote03Icon} size={22} />
            <p className="text-sm font-medium">Nothing playing</p>
            <p className="text-xs">{model.subtitleText}</p>
          </div>
        ) : null}

        {p && size === 's' ? (
          <>
            <Art url={view.imageUrl} className="size-12" />
            <div className="mt-auto flex items-end justify-between gap-2">
              <TrackText view={view} artistColor={artist} />
              <Transport view={view} compact accent={accent} />
            </div>
          </>
        ) : null}

        {p && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <Art url={view.imageUrl} className="aspect-square h-full" />
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-6">
              <p className="truncate text-xs text-muted">{room}</p>
              <TrackText view={view} artistColor={artist} />
              <Transport view={view} accent={accent} />
            </div>
          </div>
        ) : null}

        {p && size === 't' ? (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <Art url={view.imageUrl} className="aspect-square w-full" rounded="rounded-2xl" />
            <TrackText view={view} artistColor={artist} />
            <div className="mt-auto flex justify-center">
              <Transport view={view} accent={accent} />
            </div>
          </div>
        ) : null}

        {p && size === 'l' ? (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex min-h-0 flex-1 gap-3">
              <Art url={view.imageUrl} className="aspect-square h-full max-h-32" rounded="rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col justify-end gap-1 pr-6">
                <p className="truncate text-xs text-muted">{room}</p>
                <TrackText view={view} big artistColor={artist} />
              </div>
            </div>
            <Progress view={view} color={accent ?? 'var(--foreground)'} />
            <div className="flex justify-center">
              <Transport view={view} accent={accent} />
            </div>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
