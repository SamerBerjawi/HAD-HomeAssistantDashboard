/**
 * Cameras concept B — Expressive & immersive ("cinema"). The picture is the card, edge to edge,
 * with the name and state over a dark fade and a dot per camera. Small: picture + name. Wide: +
 * previous/next. Large: live, with a filmstrip of the other cameras' snapshots and full screen.
 */
import { useRef } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, FullScreenIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ProCameraPlayer, type ProCameraPlayerHandle } from '../../../components/security/ProCameraPlayer';
import type { ProOverviewCamerasModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { CamBadge, NoCameras, OfflineVeil, useCameraPick } from './shared';

const GLASS = 'bg-black/40 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-black/55';

export default function CamerasConceptB({ model: base, size, onOpenDetails }: DesignedWidgetProps<ProOverviewCamerasModel>) {
  const { model, cam, step, select } = useCameraPick(base);
  const playerRef = useRef<ProCameraPlayerHandle>(null);
  if (!cam) {
    return (
      <WidgetSurface label="Cameras" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <NoCameras text={model.subtitleText || 'No cameras'} />
      </WidgetSurface>
    );
  }
  const live = size === 'l';
  const many = model.cameras.length > 1;
  const others = model.cameras.filter((c) => c.entityId !== cam.entityId).slice(0, 3);

  return (
    <WidgetSurface label="Cameras" ink="light" className="bg-black">
      <ProCameraPlayer key={`${cam.entityId}-${live}`} ref={playerRef} camera={cam.entity} live={live} className="absolute inset-0 -z-10 size-full" />
      {cam.isOffline ? <OfflineVeil /> : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
      {cam.hasMotion ? <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] rounded-[24px] ring-[3px] ring-inset ring-warning" /> : null}
      <DetailsButton title="Cameras" onPress={onOpenDetails} ink="light" />
      <div className="relative flex h-full min-h-0 flex-col gap-2 p-3">
        {many && size !== 's' ? (
          <div className="flex gap-1" aria-hidden>
            {model.cameras.slice(0, 8).map((c) => (
              <span
                key={c.entityId}
                className={cn('h-1 rounded-full', c.entityId === cam.entityId ? 'w-4 bg-white' : 'w-1.5 bg-white/45', c.hasMotion && c.entityId !== cam.entityId && 'bg-warning')}
              />
            ))}
          </div>
        ) : null}
        {size === 'w' && many ? (
          <div className="my-auto flex justify-between">
            <Button isIconOnly size="sm" variant="ghost" aria-label="Previous camera" className={cn('size-8 min-w-0 rounded-full', GLASS)} onPress={() => step(-1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Next camera" className={cn('size-8 min-w-0 rounded-full', GLASS)} onPress={() => step(1)}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </Button>
          </div>
        ) : null}
        <div className="mt-auto flex min-w-0 items-end gap-2">
          <div className="min-w-0 flex-1 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
            <p className={cn('truncate font-semibold leading-tight', size === 's' ? 'text-sm' : 'text-base')}>{cam.name}</p>
            {size !== 's' ? <p className="truncate text-[11px] text-white/75">{cam.lastMotionText || cam.roomName}</p> : null}
          </div>
          {size !== 's' ? <CamBadge cam={cam} live={live} /> : null}
          {live ? (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Full screen ${cam.name}`}
              className={cn('size-8 min-w-0 rounded-full', GLASS)}
              onPress={() => playerRef.current?.enterFullscreen()}
            >
              <HugeiconsIcon icon={FullScreenIcon} size={14} />
            </Button>
          ) : null}
        </div>
        {live && others.length > 0 ? (
          <div className="grid h-16 shrink-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${others.length}, minmax(0, 1fr))` }}>
            {others.map((c) => (
              <Button
                key={c.entityId}
                variant="ghost"
                onPress={() => select(c.entityId)}
                aria-label={`Show ${c.name}${c.hasMotion ? ', motion' : ''}`}
                className={cn('relative h-full w-full min-w-0 overflow-hidden rounded-xl p-0 ring-1', c.hasMotion ? 'ring-2 ring-warning' : 'ring-white/25')}
              >
                <ProCameraPlayer camera={c.entity} live={false} className="pointer-events-none absolute inset-0 size-full" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-0.5 pt-3 text-left text-[10px] font-semibold text-white">{c.name}</span>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
