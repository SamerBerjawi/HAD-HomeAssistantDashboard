/**
 * Media, as chosen by the owner (WIDGET_DESIGN.md, Phase 1, 2026-11-19): a mix of the studio
 * concepts.
 * - Small: concept A's layout (cover, title, play) on concept C's surface (neutral, tinted by the
 *   cover's colour).
 * - Wide, Tall, Large: concept B: the static cover on the cover blurred behind everything, white
 *   type and B's progress bar; C's equaliser by the title. Large adds what plays next (from C).
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote03Icon, Tv01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProMediaOverviewModel } from '../../lib/overviewMedia';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { Backdrop } from './concepts/MediaConceptB';
import { Equaliser } from './concepts/MediaConceptC';
import { Art, Progress, TrackText, Transport, useMediaView, type MediaView } from './concepts/shared';

function Title({ view, big, eq = true }: { view: MediaView; big?: boolean; eq?: boolean }) {
  return (
    <div className="flex min-w-0 items-end gap-2">
      <TrackText view={view} big={big} sub="text-white/75" />
      {eq ? <Equaliser color="white" playing={Boolean(view.player?.isPlaying)} /> : null}
    </div>
  );
}

function Nothing({ model, onOpenDetails, small }: { model: ProMediaOverviewModel; onOpenDetails?: () => void; small: boolean }) {
  return (
    <WidgetSurface
      label="Media"
      ink={small ? 'auto' : 'light'}
      className={small ? 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : undefined}
      style={small ? undefined : { background: 'linear-gradient(150deg, hsl(260 20% 26%), hsl(240 18% 12%))' }}
    >
      <DetailsButton title="Media" onPress={onOpenDetails} ink={small ? 'auto' : 'light'} />
      <div className="flex h-full flex-col justify-end gap-1 p-3.5">
        <HugeiconsIcon icon={MusicNote03Icon} size={22} className={small ? 'text-muted' : 'text-white/70'} />
        <p className="text-sm font-semibold">Nothing playing</p>
        <p className={small ? 'truncate text-xs text-muted' : 'truncate text-xs text-white/70'}>{model.subtitleText}</p>
      </div>
    </WidgetSurface>
  );
}

export default function MediaCard({ model, size, onOpenDetails }: DesignedWidgetProps<ProMediaOverviewModel>) {
  const view = useMediaView(model, size !== 's');
  const p = view.player;
  if (!p) return <Nothing model={model} onOpenDetails={onOpenDetails} small={size === 's'} />;

  if (size === 's') {
    const accent = view.palette.isExtracted ? view.palette.primary : undefined;
    return (
      <WidgetSurface
        label="Media"
        className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        style={{ backgroundImage: `radial-gradient(90% 90% at 0% 100%, color-mix(in oklab, ${view.palette.primary} 22%, transparent), transparent 70%)` }}
      >
        <DetailsButton title="Media" onPress={onOpenDetails} />
        <div ref={view.darkRef} className="flex h-full min-h-0 flex-col p-3.5">
          <Art url={view.imageUrl} className="size-12" />
          <div className="mt-auto flex items-end justify-between gap-2">
            <TrackText view={view} artistColor={view.palette.isExtracted ? view.palette.badgeText : undefined} />
            <Transport view={view} compact accent={accent} />
          </div>
        </div>
      </WidgetSurface>
    );
  }

  const room = <p className="truncate text-xs text-white/75">{p.roomName || p.shortName}</p>;
  const progress = <Progress view={view} color="white" track="bg-white/25" />;
  const transport = (
    <div className="flex justify-center">
      <Transport view={view} ink="light" />
    </div>
  );
  const cover = (className: string) => (
    <Art url={view.imageUrl} className={cn('aspect-square shadow-xl ring-1 ring-white/20', className)} rounded="rounded-2xl" style={{ background: view.palette.light }} />
  );
  const next = p.upNextQueue.slice(0, 2);

  if (!p.rawImage) return <NoArt view={view} size={size} onOpenDetails={onOpenDetails} />;

  return (
    <WidgetSurface label="Media" ink="light">
      <Backdrop view={view} />
      <DetailsButton title="Media" onPress={onOpenDetails} ink="light" />
      <div ref={view.darkRef} className="flex h-full min-h-0 flex-col p-3.5">
        {size === 'w' ? (
          // Cover | room, title, then progress over centred controls, all on the same left edge.
          <div className="flex h-full min-w-0 gap-3">
            {cover('h-full')}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="min-w-0 pr-7">
                {room}
                <Title view={view} />
              </div>
              <div className="mt-auto flex flex-col gap-1">
                {progress}
                {transport}
              </div>
            </div>
          </div>
        ) : null}

        {size === 't' ? (
          <div className="flex h-full min-h-0 flex-col gap-2">
            {cover('w-full')}
            <Title view={view} />
            <div className="mt-auto flex flex-col gap-1">
              {progress}
              {transport}
            </div>
          </div>
        ) : null}

        {size === 'l' ? (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex min-h-0 flex-1 gap-3">
              {cover('h-full max-h-36 self-start')}
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-7">
                {/* The equaliser sits by the room here, so a long title gets the full width. */}
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0 flex-1">{room}</div>
                  <Equaliser color="white" playing={Boolean(p.isPlaying)} />
                </div>
                <Title view={view} big eq={false} />
                {next.length > 0 ? (
                  <div className="mt-auto">
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/70">Up next</p>
                    <ul className="flex flex-col gap-0.5">
                      {next.map((t) => (
                        <li key={t.id} className="truncate text-xs">
                          {t.title} <span className="text-white/70">· {t.artist}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {progress}
              {transport}
            </div>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}

/**
 * No cover (owner, 2026-11-19): no empty art box. A small icon for the kind of player sits by
 * the room, and the title gets the space the cover would have taken.
 */
function NoArt({ view, size, onOpenDetails }: { view: MediaView; size: DesignedWidgetProps<ProMediaOverviewModel>['size']; onOpenDetails?: () => void }) {
  const p = view.player;
  if (!p) return null;
  const icon = /tv|television/i.test(p.deviceKindLabel) ? Tv01Icon : MusicNote03Icon;
  const big = size !== 'w';
  const header = (
    <div className="flex min-w-0 items-center gap-2 pr-7">
      <span className={cn('grid shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20', big ? 'size-10' : 'size-7')}>
        <HugeiconsIcon icon={icon} size={big ? 20 : 15} />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs text-white/75">{p.roomName || p.shortName}</p>
      <Equaliser color="white" playing={p.isPlaying} />
    </div>
  );
  const progress = <Progress view={view} color="white" track="bg-white/25" />;
  const next = p.upNextQueue.slice(0, 2);

  return (
    <WidgetSurface label="Media" ink="light">
      <Backdrop view={view} />
      <DetailsButton title="Media" onPress={onOpenDetails} ink="light" />
      <div ref={view.darkRef} className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {header}
        {size === 'w' ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <TrackText view={view} sub="text-white/75" />
              </div>
              <Transport view={view} ink="light" />
            </div>
            <div className="mt-auto">{progress}</div>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <p className={cn('line-clamp-2 font-semibold leading-tight', size === 'l' ? 'text-2xl' : 'text-lg')}>{p.title || p.shortName}</p>
              <p className="mt-0.5 truncate text-sm text-white/75">{p.artist || p.deviceKindLabel}</p>
            </div>
            {size === 'l' && next.length > 0 ? (
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/70">Up next</p>
                <ul className="flex flex-col gap-0.5">
                  {next.map((t) => (
                    <li key={t.id} className="truncate text-xs">
                      {t.title} <span className="text-white/70">· {t.artist}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-auto flex flex-col gap-1.5">
              {progress}
              <div className="flex justify-center">
                <Transport view={view} ink="light" />
              </div>
            </div>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
