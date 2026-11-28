import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AiVisionRecognitionIcon,
  Alert02Icon,
  Camera01Icon,
  Car01Icon,
  FullScreenIcon,
  GridViewIcon,
  Image01Icon,
  Layout01Icon,
  Location01Icon,
  Motion01Icon,
  PackageIcon,
  PawPrintIcon,
  Refresh01Icon,
  TimeQuarterPassIcon,
  User02Icon,
  Video01Icon,
  VideoOffIcon,
  VolumeHighIcon,
  VolumeOffIcon
} from '@hugeicons/core-free-icons';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { getCameraMotionStatus, captureAndDownloadSnapshot } from '@/services/cameraIntegrationService';
import { isSurveillanceCamera } from '@/lib/entityClassifiers';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import { useCameraObjectDetection } from '../../hooks/useCameraObjectDetection';
import { entityName } from '../../hooks/useSecurityData';
import type { CameraStreamStatus } from '../../hooks/useWebRtcCamera';
import {
  detectCameraAiAlerts,
  detectCameraNativeAiKinds,
  mergeCameraDetections,
  type CameraAiDetection,
  type CameraAiDetectionKind
} from '../../lib/securityCameras';
import { ProCameraPlayer, type ProCameraPlayerHandle } from './ProCameraPlayer';

const FILTER_MIN_CAMERAS = 5;
const THUMBNAIL_REFRESH_MS = 25_000;
const AI_PREF_KEY = 'had_pro_camera_local_ai';
type CameraLayoutMode = 'featured' | 'grid';

function readAiPref(): boolean {
  try {
    return localStorage.getItem(AI_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

const AI_ICON: Record<CameraAiDetectionKind, IconSvgElement> = {
  person: User02Icon,
  vehicle: Car01Icon,
  package: PackageIcon,
  animal: PawPrintIcon
};

/** Green live; orange motion, connecting or snapshot only; red error/offline. */
function CameraStatus({ status, motion }: { status: CameraStreamStatus; motion: boolean }) {
  const [color, icon, label] = motion
    ? (['warning', Motion01Icon, 'Motion'] as const)
    : status === 'live'
      ? (['success', Video01Icon, 'Live'] as const)
      : status === 'connecting'
        ? (['warning', TimeQuarterPassIcon, 'Connecting'] as const)
        : status === 'error'
          ? (['danger', Alert02Icon, 'Error'] as const)
          : (['warning', Image01Icon, 'Snapshot'] as const);
  return (
    <Chip size="sm" variant="soft" color={color}>
      <HugeiconsIcon icon={icon} size={12} />
      {label}
    </Chip>
  );
}

/**
 * Cameras (DESIGN.md 7.5): Featured + Strip or 2×2 Wall Grid toggle, AI detection Chips
 * (Person / Vehicle / Package / Animal), 1-tap jump to active motion on non-featured cameras,
 * audio mute/unmute, WebRTC retry button, snapshot download, and full-window prev/next.
 */
export function SecurityCameras({
  cameras: all,
  focusedCameraId,
  onError
}: {
  cameras: ResolvedEntity[];
  focusedCameraId?: string | null;
  onError: (m: string | null) => void;
}) {
  const { binarySensors, serverUrl } = useAutoLayoutStore(
    useShallow((s) => ({ binarySensors: s.domainGroups['binary_sensor'], serverUrl: s.serverUrl }))
  );
  const cameras = useMemo(() => all.filter(isSurveillanceCamera), [all]);
  const [area, setArea] = useState('all');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<CameraLayoutMode>('featured');
  const [aiEnabled, setAiEnabled] = useState<boolean>(readAiPref);

  const toggleAi = () => {
    setAiEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AI_PREF_KEY, next ? '1' : '0');
      } catch {
        /* per-browser experimental toggle */
      }
      return next;
    });
  };

  useEffect(() => {
    if (focusedCameraId) {
      setPickedId(focusedCameraId);
      setLayoutMode('featured');
    }
  }, [focusedCameraId]);

  const { motion, aiByCam, nativeAiKindsByCam } = useMemo(() => {
    const motionMap: Record<string, boolean> = {};
    const aiMap: Record<string, CameraAiDetection[]> = {};
    const nativeKindsMap: Record<string, Set<CameraAiDetectionKind>> = {};
    const sensors = binarySensors || [];
    for (const c of cameras) {
      motionMap[c.entity_id] = getCameraMotionStatus(c, sensors).isMotionActive;
      aiMap[c.entity_id] = detectCameraAiAlerts(c, sensors);
      nativeKindsMap[c.entity_id] = detectCameraNativeAiKinds(c, sensors);
    }
    return { motion: motionMap, aiByCam: aiMap, nativeAiKindsByCam: nativeKindsMap };
  }, [cameras, binarySensors]);

  const areas = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of cameras) if (c.area_id) seen.set(c.area_id, c.area?.name ?? c.area_id);
    return [...seen.entries()];
  }, [cameras]);

  const showFilter = cameras.length >= FILTER_MIN_CAMERAS && areas.length >= 2;
  const visible = showFilter && area !== 'all' ? cameras.filter((c) => c.area_id === area) : cameras;

  if (cameras.length === 0) return null;

  const featured =
    visible.find((c) => c.entity_id === pickedId) ??
    visible.find((c) => motion[c.entity_id] || (aiByCam[c.entity_id]?.length ?? 0) > 0) ??
    visible[0];
  const others = visible.filter((c) => c !== featured);
  const featuredIdx = featured ? visible.findIndex((c) => c.entity_id === featured.entity_id) : 0;

  const offscreenAlertCam =
    layoutMode === 'featured'
      ? others.find((c) => motion[c.entity_id] || (aiByCam[c.entity_id]?.length ?? 0) > 0)
      : undefined;

  const cycleCamera = (delta: -1 | 1) => {
    if (visible.length < 2) return;
    const next = visible[(featuredIdx + delta + visible.length) % visible.length];
    if (next) setPickedId(next.entity_id);
  };

  const snapshot = async (camera: ResolvedEntity, video: HTMLVideoElement | null) => {
    const ok = await captureAndDownloadSnapshot(video, camera, serverUrl);
    if (!ok) onError(`No picture from ${entityName(camera)} to save yet`);
  };

  return (
    <section
      id="pro-security-cameras"
      aria-label="Cameras"
      className="pro-surface flex flex-col gap-4 p-4 md:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <HugeiconsIcon icon={Video01Icon} size={18} className="text-[var(--accent)]" />
            Cameras
            <span className="text-sm font-normal text-muted">· {cameras.length}</span>
          </h2>

          {offscreenAlertCam ? (
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 min-h-7 gap-1.5 rounded-full bg-warning/15 px-2.5 text-xs font-medium text-warning"
              onPress={() => setPickedId(offscreenAlertCam.entity_id)}
            >
              <HugeiconsIcon
                icon={
                  aiByCam[offscreenAlertCam.entity_id]?.[0]
                    ? AI_ICON[aiByCam[offscreenAlertCam.entity_id][0].kind]
                    : Motion01Icon
                }
                size={13}
              />
              {aiByCam[offscreenAlertCam.entity_id]?.[0]?.label || 'Motion'} on{' '}
              {entityName(offscreenAlertCam)}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Tooltip delay={0}>
            <Button
              size="sm"
              variant={aiEnabled ? 'primary' : 'tertiary'}
              aria-pressed={aiEnabled}
              onPress={toggleAi}
            >
              <HugeiconsIcon icon={AiVisionRecognitionIcon} size={15} />
              AI
            </Button>
            <Tooltip.Content>
              {aiEnabled
                ? 'Disable on-device AI fallback (native camera AI always stays active)'
                : 'Enable experimental on-device AI for cameras without native detection'}
            </Tooltip.Content>
          </Tooltip>

          {visible.length >= 2 ? (
            <ToggleButtonGroup
              aria-label="Camera layout"
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([layoutMode])}
              onSelectionChange={(keys) => {
                const next = [...keys][0] as CameraLayoutMode | undefined;
                if (next) setLayoutMode(next);
              }}
            >
              <ToggleButton id="featured" aria-label="Featured camera view">
                <HugeiconsIcon icon={Layout01Icon} size={15} />
              </ToggleButton>
              <ToggleButton id="grid" aria-label="2 by 2 camera grid view">
                <HugeiconsIcon icon={GridViewIcon} size={15} />
              </ToggleButton>
            </ToggleButtonGroup>
          ) : null}
        </div>
      </header>

      {layoutMode === 'grid' && visible.length >= 2 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.slice(0, 4).map((cam) => (
            <FeaturedCamera
              key={cam.entity_id}
              camera={cam}
              motion={motion[cam.entity_id]}
              detections={aiByCam[cam.entity_id] || []}
              nativeAiKinds={nativeAiKindsByCam[cam.entity_id]}
              aiEnabled={aiEnabled}
              compact
              onSnapshot={snapshot}
            />
          ))}
        </div>
      ) : (
        <>
          {featured && (
            <FeaturedCamera
              camera={featured}
              motion={motion[featured.entity_id]}
              detections={aiByCam[featured.entity_id] || []}
              nativeAiKinds={nativeAiKindsByCam[featured.entity_id]}
              aiEnabled={aiEnabled}
              onSnapshot={snapshot}
              onPrev={visible.length > 1 ? () => cycleCamera(-1) : undefined}
              onNext={visible.length > 1 ? () => cycleCamera(1) : undefined}
            />
          )}

          {others.length > 0 && (
            <ul
              aria-label="Other cameras"
              className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
            >
              {others.map((c) => {
                const hasAlert = motion[c.entity_id] || (aiByCam[c.entity_id]?.length ?? 0) > 0;
                const firstAi = aiByCam[c.entity_id]?.[0];
                return (
                  <li key={c.entity_id} className="w-40 shrink-0 snap-start md:w-48">
                    <Button
                      variant="ghost"
                      aria-label={`Show ${entityName(c)}`}
                      className="flex h-auto w-full flex-col items-stretch gap-1.5 rounded-xl p-0 hover:bg-transparent"
                      onPress={() => setPickedId(c.entity_id)}
                    >
                      <span
                        className={cn(
                          'relative block aspect-video overflow-hidden rounded-xl bg-black',
                          hasAlert && 'ring-2 ring-warning'
                        )}
                      >
                        <ProCameraPlayer
                          camera={c}
                          live={false}
                          refreshIntervalMs={THUMBNAIL_REFRESH_MS}
                          className="pointer-events-none absolute inset-0 h-full w-full"
                        />
                      </span>
                      <span className="flex items-center gap-1 px-0.5 text-left text-xs font-medium">
                        <HugeiconsIcon
                          icon={firstAi ? AI_ICON[firstAi.kind] : hasAlert ? Motion01Icon : Video01Icon}
                          size={12}
                          className={hasAlert ? 'text-warning' : 'text-muted'}
                        />
                        <span className="truncate">{entityName(c)}</span>
                        {firstAi ? (
                          <span className="ml-auto shrink-0 text-[10px] font-semibold text-warning">
                            {firstAi.label}
                          </span>
                        ) : null}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

interface FeaturedCameraProps {
  camera: ResolvedEntity;
  motion: boolean;
  detections: CameraAiDetection[];
  nativeAiKinds?: ReadonlySet<CameraAiDetectionKind>;
  aiEnabled: boolean;
  compact?: boolean;
  onSnapshot: (camera: ResolvedEntity, video: HTMLVideoElement | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const EMPTY_AI_KINDS: ReadonlySet<CameraAiDetectionKind> = new Set();

function FeaturedCamera({
  camera,
  motion,
  detections,
  nativeAiKinds = EMPTY_AI_KINDS,
  aiEnabled,
  compact = false,
  onSnapshot,
  onPrev,
  onNext
}: FeaturedCameraProps) {
  const player = useRef<ProCameraPlayerHandle>(null);
  const offline = camera.state === 'unavailable' || camera.state === 'off';
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const [muted, setMuted] = useState(true);
  const fullscreen = () => player.current?.enterFullscreen();

  // Prioritize native HA camera AI (e.g. Tapo C260 person & pet detection) over local TFJS.
  const useLocalAi = aiEnabled && status === 'live' && !offline && nativeAiKinds.size === 0;
  const { detections: localDetections, modelStatus } = useCameraObjectDetection(
    () => player.current?.video ?? null,
    useLocalAi
  );

  const mergedDetections = useMemo(
    () => mergeCameraDetections(detections, localDetections, nativeAiKinds),
    [detections, localDetections, nativeAiKinds]
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <ProCameraPlayer
          key={camera.entity_id}
          ref={player}
          camera={camera}
          live
          muted={muted}
          onStatus={setStatus}
          onPrev={onPrev}
          onNext={onNext}
          onToggleMute={() => setMuted((m) => !m)}
          onSnapshot={() => onSnapshot(camera, player.current?.video ?? null)}
          className="absolute inset-0 h-full w-full"
        />
        {offline && (
          <span className="absolute inset-0 grid place-items-center text-white/60">
            <HugeiconsIcon icon={VideoOffIcon} size={32} />
          </span>
        )}
        <Button
          variant="ghost"
          aria-label={`${entityName(camera)} full screen`}
          className="absolute inset-0 h-full w-full rounded-none opacity-0"
          onPress={fullscreen}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn('inline-flex min-w-0 items-center gap-1.5 font-semibold', compact && 'text-sm')}>
            <HugeiconsIcon icon={Video01Icon} size={15} className="shrink-0 text-[var(--accent)]" />
            <span className="truncate">{entityName(camera)}</span>
          </span>
          {camera.area?.name && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <HugeiconsIcon icon={Location01Icon} size={12} />
              <span className="truncate">{camera.area.name}</span>
            </span>
          )}
        </span>

        {useLocalAi && modelStatus === 'loading' ? (
          <Chip size="sm" variant="soft" color="default">
            <HugeiconsIcon icon={AiVisionRecognitionIcon} size={12} />
            Loading AI…
          </Chip>
        ) : null}

        {mergedDetections.map((d) => (
          <Chip key={d.kind} size="sm" variant="soft" color="warning">
            <HugeiconsIcon icon={AI_ICON[d.kind]} size={12} />
            {d.label}
          </Chip>
        ))}

        {offline ? (
          <Chip size="sm" variant="soft" color="danger">
            <HugeiconsIcon icon={VideoOffIcon} size={12} />
            Offline
          </Chip>
        ) : (
          <CameraStatus status={status} motion={motion} />
        )}
        {status === 'error' && !offline ? (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Retry ${entityName(camera)} stream`}
              onPress={() => player.current?.retry()}
            >
              <HugeiconsIcon icon={Refresh01Icon} size={16} />
            </Button>
            <Tooltip.Content>Retry stream</Tooltip.Content>
          </Tooltip>
        ) : null}
        {status === 'live' && !offline ? (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={muted ? `Unmute ${entityName(camera)}` : `Mute ${entityName(camera)}`}
              onPress={() => setMuted((m) => !m)}
            >
              <HugeiconsIcon icon={muted ? VolumeOffIcon : VolumeHighIcon} size={16} />
            </Button>
            <Tooltip.Content>{muted ? 'Unmute audio' : 'Mute audio'}</Tooltip.Content>
          </Tooltip>
        ) : null}
        <Tooltip delay={0}>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Save snapshot"
            isDisabled={offline}
            onPress={() => onSnapshot(camera, player.current?.video ?? null)}
          >
            <HugeiconsIcon icon={Camera01Icon} size={17} />
          </Button>
          <Tooltip.Content>Save snapshot</Tooltip.Content>
        </Tooltip>
        <Tooltip delay={0}>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Full screen" onPress={fullscreen}>
            <HugeiconsIcon icon={FullScreenIcon} size={17} />
          </Button>
          <Tooltip.Content>Full screen</Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}
