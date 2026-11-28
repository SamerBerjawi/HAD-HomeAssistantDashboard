/**
 * Cameras concept C — Innovative ("wall of screens"). Several cameras at once, like a security
 * desk: cameras with motion move to the front and get an amber frame. Small: the busiest camera
 * with a "+n" count. Wide: two side by side. Large: the busiest one big and live, three below;
 * tap a screen to bring it up.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Motion01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ProCameraPlayer } from '../../../components/security/ProCameraPlayer';
import type { ProOverviewCameraItem, ProOverviewCamerasModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { NoCameras, OfflineVeil, useCameraPick } from './shared';

function Screen({ c, live, onPress, big }: { c: ProOverviewCameraItem; live?: boolean; onPress?: () => void; big?: boolean }) {
  const inner = (
    <>
      <ProCameraPlayer key={`${c.entityId}-${Boolean(live)}`} camera={c.entity} live={Boolean(live)} className="pointer-events-none absolute inset-0 size-full" />
      {c.isOffline ? <OfflineVeil /> : null}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1 pt-4 text-left text-white">
        {c.hasMotion ? (
          <HugeiconsIcon icon={Motion01Icon} size={11} className="shrink-0 text-warning" />
        ) : (
          <span className={cn('size-1.5 shrink-0 rounded-full', c.isOffline ? 'bg-danger' : 'bg-success')} />
        )}
        <span className={cn('truncate font-semibold', big ? 'text-xs' : 'text-[10px]')}>{c.name}</span>
        {big && c.lastMotionText ? <span className="ml-auto shrink-0 text-[10px] text-white/70">{c.lastMotionText}</span> : null}
      </span>
    </>
  );
  const frame = cn('relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-xl bg-black p-0', c.hasMotion ? 'ring-2 ring-warning' : 'ring-1 ring-white/10');
  return onPress ? (
    <Button variant="ghost" onPress={onPress} aria-label={`Bring up ${c.name}${c.hasMotion ? ', motion' : ''}`} className={frame}>
      {inner}
    </Button>
  ) : (
    <div className={frame}>{inner}</div>
  );
}

export default function CamerasConceptC({ model: base, size, onOpenDetails }: DesignedWidgetProps<ProOverviewCamerasModel>) {
  const { model, cam, select } = useCameraPick(base);
  if (!cam) {
    return (
      <WidgetSurface label="Cameras" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <NoCameras text={model.subtitleText || 'No cameras'} />
      </WidgetSurface>
    );
  }
  // Motion first, then online, keeping the picked camera at the front.
  const rank = (c: ProOverviewCameraItem) => (c.entityId === cam.entityId ? -1 : c.hasMotion ? 0 : c.isOffline ? 2 : 1);
  const ordered = [...model.cameras].sort((a, b) => rank(a) - rank(b));
  const rest = ordered.slice(1);

  return (
    <WidgetSurface label="Cameras" ink="light" className="bg-[hsl(220_14%_10%)]">
      <DetailsButton title="Cameras" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-1.5 p-1.5">
        {size === 's' ? (
          <div className="relative h-full">
            <Screen c={ordered[0]} big />
            {rest.length > 0 ? <span className="absolute left-2 top-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold">+{rest.length}</span> : null}
          </div>
        ) : null}
        {size === 'w' ? (
          <div className="grid h-full min-h-0 grid-cols-2 gap-1.5">
            {ordered.slice(0, 2).map((c, i) => (
              <Screen key={c.entityId} c={c} big={ordered.length === 1} onPress={i === 0 ? undefined : () => select(c.entityId)} />
            ))}
          </div>
        ) : null}
        {size === 'l' ? (
          <>
            <div className="min-h-0 flex-[2]">
              <Screen c={ordered[0]} live big />
            </div>
            {rest.length > 0 ? (
              <div className="grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(3, rest.length)}, minmax(0, 1fr))` }}>
                {rest.slice(0, 3).map((c) => (
                  <Screen key={c.entityId} c={c} onPress={() => select(c.entityId)} />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
