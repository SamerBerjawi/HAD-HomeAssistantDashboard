import { useMemo, useRef, useState } from 'react';
import { Button, Chip, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, FullScreenIcon, Image01Icon, Location01Icon, Motion01Icon, TimeQuarterPassIcon, Video01Icon, VideoOffIcon } from '@hugeicons/core-free-icons';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { getCameraMotionStatus, captureAndDownloadSnapshot } from '@/services/cameraIntegrationService';
import { isSurveillanceCamera } from '@/lib/entityClassifiers';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import { entityName } from '../../hooks/useSecurityData';
import { ProCameraPlayer, type ProCameraPlayerHandle } from './ProCameraPlayer';
import type { CameraStreamStatus } from '../../hooks/useWebRtcCamera';

const FILTER_MIN_CAMERAS = 5;

/** Green live; orange motion, connecting or snapshot only. Offline (red) is handled by the caller. */
function CameraStatus({ status, motion }: { status: CameraStreamStatus; motion: boolean }) {
  const [color, icon, label] =
    motion
      ? (['warning', Motion01Icon, 'Motion'] as const)
      : status === 'live'
        ? (['success', Video01Icon, 'Live'] as const)
        : status === 'connecting'
          ? (['warning', TimeQuarterPassIcon, 'Connecting'] as const)
          : (['warning', Image01Icon, 'Snapshot'] as const);
  return (
    <Chip size="sm" variant="soft" color={color}>
      <HugeiconsIcon icon={icon} size={12} />
      {label}
    </Chip>
  );
}

/**
 * Cameras (DESIGN.md 7.5): one featured camera (motion first) with its caption below the video,
 * a thumbnail strip with names below, area filter from 5 cameras in 2+ areas, full-screen modal.
 */
export function SecurityCameras({ cameras: all, onError }: { cameras: ResolvedEntity[]; onError: (m: string | null) => void }) {
  const { binarySensors, serverUrl } = useAutoLayoutStore(useShallow((s) => ({ binarySensors: s.domainGroups['binary_sensor'], serverUrl: s.serverUrl })));
  const cameras = useMemo(() => all.filter(isSurveillanceCamera), [all]);
  const [area, setArea] = useState('all');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const motion = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const c of cameras) map[c.entity_id] = getCameraMotionStatus(c, binarySensors || []).isMotionActive;
    return map;
  }, [cameras, binarySensors]);

  const areas = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of cameras) if (c.area_id) seen.set(c.area_id, c.area?.name ?? c.area_id);
    return [...seen.entries()];
  }, [cameras]);
  const showFilter = cameras.length >= FILTER_MIN_CAMERAS && areas.length >= 2;
  const visible = showFilter && area !== 'all' ? cameras.filter((c) => c.area_id === area) : cameras;

  if (cameras.length === 0) return null;
  const featured = visible.find((c) => c.entity_id === pickedId) ?? visible.find((c) => motion[c.entity_id]) ?? visible[0];
  const others = visible.filter((c) => c !== featured);

  const snapshot = async (camera: ResolvedEntity, video: HTMLVideoElement | null) => {
    const ok = await captureAndDownloadSnapshot(video, camera, serverUrl);
    if (!ok) onError(`No live picture from ${entityName(camera)} to save yet`);
  };

  return (
    <section aria-label="Cameras" className="pro-surface flex flex-col gap-4 p-4 md:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={Video01Icon} size={18} className="text-[var(--accent)]" />
          Cameras
          <span className="text-sm font-normal text-muted">· {cameras.length}</span>
        </h2>
        {showFilter && (
          <ToggleButtonGroup
            aria-label="Filter cameras by area"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([area])}
            onSelectionChange={(keys) => setArea(String([...keys][0] ?? 'all'))}
            className="flex-wrap"
          >
            <ToggleButton id="all">
              <HugeiconsIcon icon={Video01Icon} size={14} />
              All
            </ToggleButton>
            {areas.map(([id, name]) => (
              <ToggleButton key={id} id={id}>
                <HugeiconsIcon icon={Location01Icon} size={14} />
                {name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </header>

      {featured && (
        <FeaturedCamera
          camera={featured}
          motion={motion[featured.entity_id]}
          onSnapshot={snapshot}
        />
      )}

      {others.length > 0 && (
        <ul aria-label="Other cameras" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {others.map((c) => (
            <li key={c.entity_id} className="w-40 shrink-0 snap-start md:w-48">
              <Button
                variant="ghost"
                aria-label={`Show ${entityName(c)}`}
                className="flex h-auto w-full flex-col items-stretch gap-1.5 rounded-xl p-0 hover:bg-transparent"
                onPress={() => setPickedId(c.entity_id)}
              >
                <span className={cn('relative block aspect-video overflow-hidden rounded-xl bg-black', motion[c.entity_id] && 'ring-2 ring-warning')}>
                  <ProCameraPlayer camera={c} live={false} className="pointer-events-none absolute inset-0 h-full w-full" />
                </span>
                <span className="flex items-center gap-1 px-0.5 text-left text-xs font-medium">
                  <HugeiconsIcon icon={motion[c.entity_id] ? Motion01Icon : Video01Icon} size={12} className={motion[c.entity_id] ? 'text-warning' : 'text-muted'} />
                  <span className="truncate">{entityName(c)}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

    </section>
  );
}

interface FeaturedCameraProps {
  camera: ResolvedEntity;
  motion: boolean;
  onSnapshot: (camera: ResolvedEntity, video: HTMLVideoElement | null) => void;
}

function FeaturedCamera({ camera, motion, onSnapshot }: FeaturedCameraProps) {
  const player = useRef<ProCameraPlayerHandle>(null);
  const offline = camera.state === 'unavailable' || camera.state === 'off';
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const fullscreen = () => player.current?.enterFullscreen();
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <ProCameraPlayer key={camera.entity_id} ref={player} camera={camera} live onStatus={setStatus} className="absolute inset-0 h-full w-full" />
        {offline && (
          <span className="absolute inset-0 grid place-items-center text-white/60">
            <HugeiconsIcon icon={VideoOffIcon} size={32} />
          </span>
        )}
        <Button variant="ghost" aria-label={`${entityName(camera)} full screen`} className="absolute inset-0 h-full w-full rounded-none opacity-0" onPress={fullscreen} />
      </div>
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold">
            <HugeiconsIcon icon={Video01Icon} size={16} className="shrink-0 text-[var(--accent)]" />
            <span className="truncate">{entityName(camera)}</span>
          </span>
          {camera.area?.name && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <HugeiconsIcon icon={Location01Icon} size={12} />
              {camera.area.name}
            </span>
          )}
        </span>
        {offline ? (
          <Chip size="sm" variant="soft" color="danger">
            <HugeiconsIcon icon={VideoOffIcon} size={12} />
            Offline
          </Chip>
        ) : (
          <CameraStatus status={status} motion={motion} />
        )}
        <Tooltip delay={0}>
          <Button isIconOnly variant="ghost" aria-label="Save snapshot" isDisabled={status !== 'live'} onPress={() => onSnapshot(camera, player.current?.video ?? null)}>
            <HugeiconsIcon icon={Camera01Icon} size={18} />
          </Button>
          <Tooltip.Content>Save snapshot</Tooltip.Content>
        </Tooltip>
        <Tooltip delay={0}>
          <Button isIconOnly variant="ghost" aria-label="Full screen" onPress={fullscreen}>
            <HugeiconsIcon icon={FullScreenIcon} size={18} />
          </Button>
          <Tooltip.Content>Full screen</Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}
