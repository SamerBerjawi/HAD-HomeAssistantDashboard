/**
 * Media concept B — Expressive & immersive ("album"). The cover is the card: blurred and
 * enlarged behind everything, with the sharp cover on top and white type on a soft scrim.
 * Without art, the art's palette (or one from the title) paints the card.
 * Small: the cover fills the card. Wide: cover + text + transport. Tall: cover on top.
 * Large: big cover, title, progress, transport.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote03Icon } from '@hugeicons/core-free-icons';
import type { ProMediaOverviewModel } from '../../../lib/overviewMedia';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { Art, Progress, TrackText, Transport, useMediaView, type MediaView } from './shared';

export function Backdrop({ view, sharp }: { view: MediaView; sharp?: boolean }) {
  const { imageUrl, palette } = view;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: `linear-gradient(150deg, ${palette.primary}, ${palette.dark})` }}>
      {imageUrl ? <img src={imageUrl} alt="" className={sharp ? 'size-full object-cover' : 'size-full scale-125 object-cover opacity-80 blur-2xl'} /> : null}
      <div className={sharp ? 'absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/75 to-transparent' : 'absolute inset-0 bg-black/30'} />
    </div>
  );
}

export default function MediaConceptB({ model, size, onOpenDetails }: DesignedWidgetProps<ProMediaOverviewModel>) {
  const view = useMediaView(model, size === 'l');
  const p = view.player;

  if (!p) {
    return (
      <WidgetSurface label="Media" ink="light" style={{ background: 'linear-gradient(150deg, hsl(260 20% 26%), hsl(240 18% 12%))' }}>
        <DetailsButton title="Media" onPress={onOpenDetails} ink="light" />
        <div ref={view.darkRef} className="flex h-full flex-col justify-end gap-1 p-3.5">
          <HugeiconsIcon icon={MusicNote03Icon} size={24} className="text-white/70" />
          <p className="text-sm font-semibold">Nothing playing</p>
          <p className="text-xs text-white/70">{model.subtitleText}</p>
        </div>
      </WidgetSurface>
    );
  }

  return (
    <WidgetSurface label="Media" ink="light">
      <Backdrop view={view} sharp={size === 's'} />
      <DetailsButton title="Media" onPress={onOpenDetails} ink="light" />
      <div ref={view.darkRef} className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? (
          <div className="mt-auto flex items-end justify-between gap-2">
            <TrackText view={view} sub="text-white/75" />
            <Transport view={view} compact ink="light" />
          </div>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <Art url={view.imageUrl} className="aspect-square h-full shadow-xl ring-1 ring-white/20" rounded="rounded-2xl" style={{ background: view.palette.light }} />
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-6">
              <p className="truncate text-xs text-white/75">{p.roomName || p.shortName}</p>
              <TrackText view={view} sub="text-white/75" />
              <Transport view={view} ink="light" />
            </div>
          </div>
        ) : null}

        {size === 't' ? (
          <>
            <Art url={view.imageUrl} className="aspect-square w-full shadow-xl ring-1 ring-white/20" rounded="rounded-2xl" style={{ background: view.palette.light }} />
            <TrackText view={view} sub="text-white/75" />
            <div className="mt-auto flex justify-center">
              <Transport view={view} ink="light" />
            </div>
          </>
        ) : null}

        {size === 'l' ? (
          <>
            <div className="flex min-h-0 flex-1 items-end gap-3">
              <Art url={view.imageUrl} className="aspect-square h-full max-h-44 shadow-2xl ring-1 ring-white/20" rounded="rounded-2xl" style={{ background: view.palette.light }} />
              <div className="min-w-0 flex-1 pb-1">
                <p className="mb-1 truncate text-xs text-white/75">{p.roomName || p.shortName}</p>
                <TrackText view={view} big sub="text-white/80" />
              </div>
            </div>
            <Progress view={view} color="white" track="bg-white/25" />
            <div className="flex justify-center">
              <Transport view={view} ink="light" />
            </div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
