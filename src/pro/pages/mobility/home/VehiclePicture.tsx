/**
 * The hero's vehicle picture, which the owner can change (2026-11-27): tap it for the Room page's
 * picture control: the picture its integration gives it in Home Assistant, their own upload
 * (PNG, JPEG or WebP up to 5 MB, saved to the dashboard's assets) or none (the silhouette). The
 * choice is saved per HA device, so the Room page's car tile shows the same picture.
 */
import { createContext, useContext } from 'react';
import { Button, Popover } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { Vehicle } from '../../../lib/mobilityHome';
import type { PictureSource } from '../../../lib/mobility/pictures';
import { CarPictureControl } from '../../../areas/page/CarPictureControl';
import { VehicleArt } from './parts';

export interface VehiclePictures {
  source: (v: Vehicle) => PictureSource;
  /** The integration gives the vehicle a picture of its own. */
  hasOwn: (v: Vehicle) => boolean;
  busy: (v: Vehicle) => boolean;
  error: (v: Vehicle) => string | null;
  choose: (v: Vehicle, s: Exclude<PictureSource, 'upload'>) => void;
  upload: (v: Vehicle, file: File) => void | Promise<void>;
}

/** Provided by the live page; absent in the studio and demo, where the picture is not editable. */
export const VehiclePicturesContext = createContext<VehiclePictures | null>(null);

export function EditableVehicleArt({ v, size, className, stage }: { v: Vehicle; size: number; className?: string; stage?: boolean }) {
  const p = useContext(VehiclePicturesContext);
  if (!p || !v.deviceId) return <VehicleArt v={v} size={size} className={className} stage={stage} />;
  const integration = v.integration === 'fordpass' ? 'FordPass' : v.integration === 'cowboy' ? 'Cowboy' : 'Its integration';
  return (
    <Popover>
      <Button variant="ghost" aria-label={`Change ${v.name}’s picture`} className={cn('group relative h-auto min-w-0 p-0 data-[hovered=true]:bg-transparent', stage ? 'rounded-2xl' : 'rounded-[32%]')}>
        <VehicleArt v={v} size={size} className={className} stage={stage} />
        <span aria-hidden className={cn('absolute grid size-7 place-items-center rounded-full bg-[var(--surface)] text-muted shadow-sm ring-1 ring-[color-mix(in_oklab,var(--foreground)_10%,transparent)] transition-opacity group-data-[hovered=true]:text-[var(--foreground)]', stage ? 'right-0 top-0' : '-bottom-1 -right-1')}>
          <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
        </span>
      </Button>
      <Popover.Content placement="bottom end" className="pro max-w-[min(92vw,360px)]">
        <Popover.Dialog aria-label={`${v.name}’s picture`} className={cn('flex flex-col gap-2 p-3')}>
          <CarPictureControl label={`${v.name}’s picture`} source={p.source(v)} onSource={(s) => p.choose(v, s)} onUpload={(f) => void p.upload(v, f)} busy={p.busy(v)} error={p.error(v)} />
          {!p.hasOwn(v) ? <p className="text-xs text-muted">{integration} gives no picture of the {v.kind}, so “From the car” shows the outline. Upload a photo of yours instead.</p> : null}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
