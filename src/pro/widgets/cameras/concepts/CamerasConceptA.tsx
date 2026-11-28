/**
 * Cameras concept A — Refined & minimal ("framed"). The picture sits inset in a calm card like a
 * framed photo, with a caption below: name, last motion and a state badge. Small: picture + name.
 * Wide: + previous/next in the caption. Large: live, with the cameras as a quiet list of names.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ProCameraPlayer } from '../../../components/security/ProCameraPlayer';
import type { ProOverviewCamerasModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { CamBadge, NoCameras, OfflineVeil, useCameraPick } from './shared';

export default function CamerasConceptA({ model: base, size, onOpenDetails }: DesignedWidgetProps<ProOverviewCamerasModel>) {
  const { model, cam, step, select } = useCameraPick(base);
  const surface = 'bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
  if (!cam) {
    return (
      <WidgetSurface label="Cameras" className={surface}>
        <NoCameras text={model.subtitleText || 'No cameras'} />
      </WidgetSurface>
    );
  }
  const live = size === 'l';
  const many = model.cameras.length > 1;

  return (
    <WidgetSurface label="Cameras" className={surface}>
      <div className="flex h-full min-h-0 flex-col gap-2 p-2">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px] bg-black">
          <ProCameraPlayer key={`${cam.entityId}-${live}`} camera={cam.entity} live={live} className="absolute inset-0 size-full" />
          {cam.isOffline ? <OfflineVeil /> : null}
          <DetailsButton title="Cameras" onPress={onOpenDetails} ink="light" />
        </div>
        <div className={cn('flex min-w-0 items-center gap-2 px-1.5', size === 's' ? 'pb-0.5' : 'pb-1')}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{cam.name}</p>
            {size !== 's' ? <p className="truncate text-xs text-muted">{cam.lastMotionText || cam.roomName}</p> : null}
          </div>
          {size !== 's' ? <CamBadge cam={cam} live={live} /> : null}
          {size === 'w' && many ? (
            <span className="flex shrink-0 gap-0.5">
              <Button isIconOnly size="sm" variant="ghost" aria-label="Previous camera" className="size-7 min-w-0" onPress={() => step(-1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              </Button>
              <Button isIconOnly size="sm" variant="ghost" aria-label="Next camera" className="size-7 min-w-0" onPress={() => step(1)}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Button>
            </span>
          ) : null}
        </div>
        {live && many ? (
          <div className="flex min-w-0 gap-1 overflow-hidden px-1 pb-1">
            {model.cameras.slice(0, 4).map((c) => (
              <Button
                key={c.entityId}
                size="sm"
                variant="ghost"
                onPress={() => select(c.entityId)}
                aria-pressed={c.entityId === cam.entityId}
                className={cn('h-7 min-w-0 shrink rounded-lg px-2 text-xs', c.entityId === cam.entityId ? 'bg-default font-semibold' : 'text-muted')}
              >
                {c.hasMotion ? <span className="size-1.5 shrink-0 rounded-full bg-warning" /> : null}
                <span className="truncate">{c.name}</span>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
