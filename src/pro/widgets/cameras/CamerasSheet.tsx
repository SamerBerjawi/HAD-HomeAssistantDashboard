/**
 * Cameras details (sheet kit, WIDGET_DESIGN.md §8). Here the hero is the picture: the chosen
 * camera streams live in the hero's frame with its name, room and Live / Motion / Offline over it,
 * and Snapshot, Full screen and Close on top. Under it, every camera as a still to switch to.
 * `?sheet=cameras&id=camera.porch` opens on that camera.
 */
import { useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, Cancel01Icon, FullScreenIcon, Motion01Icon, Video01Icon, VideoOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { captureAndDownloadSnapshot } from '@/services/cameraIntegrationService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { ProCameraPlayer, type ProCameraPlayerHandle } from '../../components/security/ProCameraPlayer';
import type { CameraStreamStatus } from '../../hooks/useWebRtcCamera';
import type { ProOverviewCamerasModel } from '../../lib/overviewSecurity';
import type { ResolvedEntity } from '@/types';
import { cameraDetectionSensorIds } from '../../lib/cameraSensors';
import { RecentEvents } from '../shared/sheet/RecentEvents';
import { DetailSheet, SheetHero, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { withFeatured } from './useCamerasModel';

/** What the chosen camera saw (owner review 2026-11-20): its motion and AI detection sensors' last 24 h. */
function CameraEvents({ camera, name }: { camera: ResolvedEntity; name: string }) {
  const resolved = useAutoLayoutStore((s) => s.resolvedEntities);
  const ids = useMemo(
    () =>
      cameraDetectionSensorIds(
        camera,
        Object.values(resolved).filter((e) => e.entity_id.startsWith('binary_sensor.'))
      ),
    [camera, resolved]
  );
  if (ids.length === 0) return null;
  return <RecentEvents key={camera.entity_id} title={`Seen by ${name}`} groups={{ motionSensors: ids }} empty="No motion in the last 24 hours" />;
}

const GLASS = 'pro-touch-44 size-9 min-w-0 rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-md hover:bg-black/60';

export default function CamerasSheet({ model, itemId, onClose }: WidgetSheetProps<ProOverviewCamerasModel>) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const [selected, setSelected] = useState<string | null>(itemId ?? null);
  const m = withFeatured(model, selected);
  const cam = m.featuredCamera;
  const player = useRef<ProCameraPlayerHandle>(null);
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const [note, setNote] = useState<string | null>(null);
  const snapshot = async () => {
    if (!cam) return;
    setNote(null);
    const ok = await captureAndDownloadSnapshot(player.current?.video ?? null, cam.entity, serverUrl);
    if (!ok) setNote(`No live picture from ${cam.name} to save yet`);
  };
  const badge = !cam ? null : cam.isOffline ? 'Offline' : cam.hasMotion ? 'Motion' : status === 'live' ? 'Live' : 'Still';

  const hero = cam ? (
    <section aria-label={cam.name} className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-black text-white">
      <ProCameraPlayer key={cam.entityId} ref={player} camera={cam.entity} live onStatus={setStatus} className="absolute inset-0 size-full" />
      {cam.isOffline ? (
        <div className="absolute inset-0 grid place-items-center bg-black/55 text-white/75">
          <HugeiconsIcon icon={VideoOffIcon} size={32} />
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent p-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md',
            cam.isOffline ? 'bg-[hsl(0_70%_45%)]/80' : cam.hasMotion ? 'bg-[hsl(36_90%_45%)]/85' : status === 'live' ? 'bg-[hsl(0_75%_50%)]/85' : 'bg-black/45'
          )}
        >
          <HugeiconsIcon icon={cam.isOffline ? VideoOffIcon : cam.hasMotion ? Motion01Icon : Video01Icon} size={13} />
          {badge}
        </span>
        <span className="flex gap-1.5">
          <Button isIconOnly size="sm" variant="ghost" aria-label="Save snapshot" isDisabled={status !== 'live'} onPress={() => void snapshot()} className={GLASS}>
            <HugeiconsIcon icon={Camera01Icon} size={16} />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Full screen" onPress={() => player.current?.enterFullscreen()} className={GLASS}>
            <HugeiconsIcon icon={FullScreenIcon} size={16} />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Close" onPress={onClose} className={GLASS}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </Button>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-8">
        <h2 className="text-lg font-semibold leading-tight">{cam.name}</h2>
        <p className="text-xs text-white/80">{[cam.roomName, cam.lastMotionText].filter(Boolean).join(' · ')}</p>
      </div>
    </section>
  ) : (
    // No camera: a plain slate hero, so the sheet still has its Close button.
    <SheetHero icon={Video01Icon} eyebrow="Cameras" headline="No cameras yet" sub="Add RTSP / go2rtc camera sources in Settings to watch them here." tone="slate" onClose={onClose} />
  );

  return (
    <DetailSheet title="Cameras details" onClose={onClose} hero={hero}>
      {note ? <p className="text-xs text-warning">{note}</p> : null}
      {cam ? <CameraEvents camera={cam.entity} name={cam.name} /> : null}
      {cam && m.cameras.length > 1 ? (
        <SheetSection
          title="All cameras"
          aside={[m.motionCount ? `${m.motionCount} motion` : null, m.offlineCount ? `${m.offlineCount} offline` : null].filter(Boolean).join(' · ') || `${m.totalCount}`}
          plain
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {m.cameras.map((c) => {
              const on = c.entityId === cam.entityId;
              return (
                <Button
                  key={c.entityId}
                  variant="ghost"
                  aria-pressed={on}
                  aria-label={`${c.name}${c.isOffline ? ', offline' : c.hasMotion ? ', motion' : ''}`}
                  onPress={() => setSelected(c.entityId)}
                  className={cn('pro-surface h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-2xl p-1.5 text-left', on && 'ring-2 ring-[var(--accent)]')}
                >
                  <span className="relative block aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <ProCameraPlayer camera={c.entity} live={false} className="pointer-events-none absolute inset-0 size-full" />
                  </span>
                  <span className="flex min-w-0 items-center gap-1 px-1 pb-0.5 text-xs font-medium">
                    {c.isOffline || c.hasMotion ? <span className={cn('size-1.5 shrink-0 rounded-full', c.isOffline ? 'bg-danger' : 'bg-warning')} /> : null}
                    <span className="truncate">{c.name}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </SheetSection>
      ) : null}
    </DetailSheet>
  );
}
