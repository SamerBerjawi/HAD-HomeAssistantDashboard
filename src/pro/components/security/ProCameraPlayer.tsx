import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Camera01Icon,
  Cancel01Icon,
  Video01Icon,
  VolumeHighIcon,
  VolumeOffIcon
} from '@hugeicons/core-free-icons';
import HAImage from '@/components/ui/HAImage';
import { useAuth } from '@/contexts/AuthContext';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import { useWebRtcCamera, type CameraStreamStatus } from '../../hooks/useWebRtcCamera';

export interface ProCameraPlayerHandle {
  /** The <video> while live, for snapshots. */
  video: HTMLVideoElement | null;
  /** Native full screen: the video element (system player on iPhone), else the snapshot frame. */
  enterFullscreen: () => void;
  /** Manually retry the WebRTC stream. */
  retry: () => void;
}

interface ProCameraPlayerProps {
  camera: ResolvedEntity;
  /** Stream live (featured camera); thumbnails show the HA snapshot only. */
  live: boolean;
  /** Audio mute state for live video (default true). */
  muted?: boolean;
  /** Optional periodic snapshot refresh ms for non-live thumbnails (e.g. 25000). */
  refreshIntervalMs?: number;
  onStatus?: (status: CameraStreamStatus) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleMute?: () => void;
  onSnapshot?: () => void;
  className?: string;
}

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null };

const fullscreenElement = () =>
  document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null;

/** Same lookup as the classic CameraFeed: the configured go2rtc source for this camera. */
function useStreamId(cameraId: string): string | null {
  const { config } = useUserConfig();
  const sources = config.cameras?.sources;
  if (!sources) return null;
  const s =
    sources[cameraId] ||
    Object.values(sources).find(
      (x) =>
        x.id === cameraId ||
        x.haEntityId === cameraId ||
        (x.id && `camera.${x.id}` === cameraId) ||
        (cameraId.startsWith('camera.') && x.id === cameraId.replace('camera.', ''))
    );
  return s?.rtspUrl ? s.id || cameraId : null;
}

/**
 * Clean pro camera player (DESIGN.md 7.5): native <video> fed by WebRTC with audio mute toggle,
 * auto-reconnect + manual retry, periodic thumbnail snapshot refresh, and full-window prev/next controls.
 */
export const ProCameraPlayer = forwardRef<ProCameraPlayerHandle, ProCameraPlayerProps>(
  function ProCameraPlayer(
    {
      camera,
      live,
      muted = true,
      refreshIntervalMs,
      onStatus,
      onPrev,
      onNext,
      onToggleMute,
      onSnapshot,
      className
    },
    ref
  ) {
    const { authState } = useAuth();
    const token = authState.tokens?.access_token || '';
    const streamId = useStreamId(camera.entity_id);
    const offline = camera.state === 'unavailable' || camera.state === 'off';
    const { stream, status, retry } = useWebRtcCamera(streamId, token, live && !offline);
    const frame = useRef<HTMLDivElement>(null);
    const video = useRef<FsVideo>(null);
    const [playing, setPlaying] = useState(false);
    const [pictureFailed, setPictureFailed] = useState(false);
    const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);

    const rawPicture = camera.attributes?.entity_picture as string | undefined;
    useEffect(() => setPictureFailed(false), [rawPicture]);

    // Gentle periodic snapshot refresh for non-live thumbnails while tab is visible.
    useEffect(() => {
      if (live || offline || !refreshIntervalMs || !rawPicture) return;
      const id = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          setRefreshTick((t) => t + 1);
        }
      }, refreshIntervalMs);
      return () => window.clearInterval(id);
    }, [live, offline, refreshIntervalMs, rawPicture]);

    const picture =
      rawPicture && refreshTick > 0
        ? `${rawPicture}${rawPicture.includes('?') ? '&' : '?'}_r=${refreshTick}`
        : rawPicture;

    useEffect(() => onStatus?.(offline ? 'unavailable' : status), [status, offline, onStatus]);

    useEffect(() => {
      const v = video.current;
      if (!v) return;
      v.muted = muted;
    }, [muted]);

    useEffect(() => {
      const v = video.current;
      if (!v) return;
      setPlaying(false);
      v.srcObject = stream;
      v.muted = muted;
      if (stream) v.play().catch(() => {});
    }, [stream, muted]);

    useImperativeHandle(
      ref,
      () => ({
        get video() {
          return playing ? video.current : null;
        },
        retry,
        enterFullscreen() {
          const el = frame.current as FsElement | null;
          const v = video.current;
          const fallback = () => {
            if (fullscreenElement() === el) return;
            if (playing && v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
            else setPseudoFullscreen(true);
          };
          const request = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
          if (!el || !request) return fallback();
          try {
            Promise.resolve(request.call(el)).catch(fallback);
            setTimeout(fallback, 400);
          } catch {
            fallback();
          }
        }
      }),
      [playing, retry]
    );

    useEffect(() => {
      if (!pseudoFullscreen) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPseudoFullscreen(false);
        else if (e.key === 'ArrowLeft' && onPrev) onPrev();
        else if (e.key === 'ArrowRight' && onNext) onNext();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [pseudoFullscreen, onPrev, onNext]);

    return (
      <div
        ref={frame}
        className={cn(
          'relative overflow-hidden bg-black',
          '[&:fullscreen_img]:object-contain [&:fullscreen_video]:object-contain',
          pseudoFullscreen
            ? 'fixed! inset-0 z-[100] h-dvh! w-screen! rounded-none! [&_img]:object-contain [&_video]:object-contain'
            : className
        )}
        role={pseudoFullscreen ? 'dialog' : undefined}
        aria-label={pseudoFullscreen ? `${camera.name || camera.entity_id} full screen` : undefined}
      >
        {picture && !offline && !pictureFailed ? (
          <HAImage
            src={picture}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPictureFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          !playing && (
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-white/40">
              <HugeiconsIcon icon={Video01Icon} size={28} />
            </span>
          )
        )}
        <video
          ref={video}
          muted={muted}
          playsInline
          autoPlay
          onPlaying={() => setPlaying(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
            playing ? 'opacity-100' : 'opacity-0'
          )}
        />
        {pseudoFullscreen && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 pt-[max(16px,env(safe-area-inset-top))]">
            <span className="truncate text-sm font-semibold text-white">
              {camera.name || camera.entity_id}
            </span>
            <div className="flex items-center gap-1.5">
              {onPrev ? (
                <Button isIconOnly variant="secondary" aria-label="Previous camera" onPress={onPrev}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                </Button>
              ) : null}
              {onNext ? (
                <Button isIconOnly variant="secondary" aria-label="Next camera" onPress={onNext}>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Button>
              ) : null}
              {live && onToggleMute ? (
                <Button
                  isIconOnly
                  variant="secondary"
                  aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                  onPress={onToggleMute}
                >
                  <HugeiconsIcon icon={muted ? VolumeOffIcon : VolumeHighIcon} size={18} />
                </Button>
              ) : null}
              {onSnapshot ? (
                <Button isIconOnly variant="secondary" aria-label="Save snapshot" onPress={onSnapshot}>
                  <HugeiconsIcon icon={Camera01Icon} size={18} />
                </Button>
              ) : null}
              <Button
                isIconOnly
                variant="secondary"
                aria-label="Exit full screen"
                autoFocus
                onPress={() => setPseudoFullscreen(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
