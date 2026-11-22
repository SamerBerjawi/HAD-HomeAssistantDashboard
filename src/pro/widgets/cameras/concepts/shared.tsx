/** Cameras pieces the concepts share: the camera on show, stepping, the state badge and empty state. */
import { useState } from 'react';
import { Badge } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Motion01Icon, Video01Icon, VideoOffIcon } from '@hugeicons/core-free-icons';
import type { ProOverviewCameraItem, ProOverviewCamerasModel } from '../../../lib/overviewSecurity';
import { withFeatured } from '../useCamerasModel';

export function useCameraPick(base: ProOverviewCamerasModel) {
  const [selected, setSelected] = useState<string | null>(null);
  const model = withFeatured(base, selected);
  const cam = model.featuredCamera;
  const index = cam ? model.cameras.findIndex((c) => c.entityId === cam.entityId) : -1;
  const step = (d: number) => {
    if (model.cameras.length === 0) return;
    setSelected(model.cameras[(index + d + model.cameras.length) % model.cameras.length].entityId);
  };
  return { model, cam, index, step, select: setSelected };
}

export const camLabel = (c: ProOverviewCameraItem, live?: boolean) => (c.isOffline ? 'Offline' : c.hasMotion ? 'Motion' : live ? 'Live' : 'Ready');

export function CamBadge({ cam, live }: { cam: ProOverviewCameraItem; live?: boolean }) {
  return (
    <Badge
      size="sm"
      variant="soft"
      color={cam.isOffline ? 'danger' : cam.hasMotion ? 'warning' : 'success'}
      className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
    >
      <HugeiconsIcon icon={cam.isOffline ? VideoOffIcon : cam.hasMotion ? Motion01Icon : Video01Icon} size={11} />
      <Badge.Label>{camLabel(cam, live)}</Badge.Label>
    </Badge>
  );
}

export function NoCameras({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
      <HugeiconsIcon icon={Video01Icon} size={22} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

/** Dark veil with the offline icon over a camera that is not reachable. */
export function OfflineVeil() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 text-white/75">
      <HugeiconsIcon icon={VideoOffIcon} size={24} />
    </div>
  );
}
