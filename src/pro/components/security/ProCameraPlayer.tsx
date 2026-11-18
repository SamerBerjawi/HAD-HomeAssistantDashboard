import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Video01Icon } from '@hugeicons/core-free-icons';
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
}

interface ProCameraPlayerProps {
  camera: ResolvedEntity;
  /** Stream live (featured camera); thumbnails show the HA snapshot only. */
  live: boolean;
  onStatus?: (status: CameraStreamStatus) => void;
  className?: string;
}

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null };

const fullscreenElement = () => document.fullscreenElement ?? (document as FsDocument).webkitFullscreenElement ?? null;

/** Same lookup as the classic CameraFeed: the configured go2rtc source for this camera. */
function useStreamId(cameraId: string): string | null {
  const { config } = useUserConfig();
  const sources = config.cameras?.sources;
  if (!sources) return null;
  const s =
    sources[cameraId] ||
    Object.values(sources).find(
      (x) => x.id === cameraId || x.haEntityId === cameraId || (x.id && `camera.${x.id}` === cameraId) || (cameraId.startsWith('camera.') && x.id === cameraId.replace('camera.', ''))
    );
  return s?.rtspUrl ? s.id || cameraId : null;
}

/**
 * Clean pro camera player (DESIGN.md 7.5, owner 2026-11-18): native <video> fed by WebRTC, the HA
 * snapshot underneath until the first frame, and no text over the picture.
 */
export const ProCameraPlayer = forwardRef<ProCameraPlayerHandle, ProCameraPlayerProps>(function ProCameraPlayer(
  { camera, live, onStatus, className },
  ref
) {
  const { authState } = useAuth();
  const token = authState.tokens?.access_token || '';
  const streamId = useStreamId(camera.entity_id);
  const offline = camera.state === 'unavailable' || camera.state === 'off';
  const { stream, status } = useWebRtcCamera(streamId, token, live && !offline);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<FsVideo>(null);
  const [playing, setPlaying] = useState(false);
  const [pictureFailed, setPictureFailed] = useState(false);
  /** Full-window fallback where the browser can't (or won't) go full screen. */
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const picture = camera.attributes?.entity_picture as string | undefined;
  // HA rotates the token in entity_picture; a new URL deserves a new try.
  useEffect(() => setPictureFailed(false), [picture]);

  useEffect(() => onStatus?.(offline ? 'unavailable' : status), [status, offline, onStatus]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    setPlaying(false);
    v.srcObject = stream;
    if (stream) v.play().catch(() => {});
  }, [stream]);

  useImperativeHandle(ref, () => ({
    get video() {
      return playing ? video.current : null;
    },
    enterFullscreen() {
      const el = frame.current as FsElement | null;
      const v = video.current;
      // iPhone has no element full screen: the system video player when live, else full window.
      const fallback = () => {
        if (fullscreenElement() === el) return;
        if (playing && v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
        else setPseudoFullscreen(true);
      };
      const request = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
      if (!el || !request) return fallback();
      try {
        Promise.resolve(request.call(el)).catch(fallback);
        // Some embedded browsers neither enter full screen nor reject: check shortly after.
        setTimeout(fallback, 400);
      } catch {
        fallback();
      }
    }
  }));

  useEffect(() => {
    if (!pseudoFullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPseudoFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pseudoFullscreen]);


  return (
    <div
      ref={frame}
      className={cn(
        'relative overflow-hidden bg-black',
        // In full screen show the whole picture, not a crop.
        '[&:fullscreen_img]:object-contain [&:fullscreen_video]:object-contain',
        pseudoFullscreen ? 'fixed! inset-0 z-[100] h-dvh! w-screen! rounded-none! [&_img]:object-contain [&_video]:object-contain' : className
      )}
      role={pseudoFullscreen ? 'dialog' : undefined}
      aria-label={pseudoFullscreen ? `${camera.name || camera.entity_id} full screen` : undefined}
    >
      {picture && !offline && !pictureFailed ? (
        <HAImage src={picture} alt="" loading="lazy" decoding="async" onError={() => setPictureFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        !playing && (
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-white/40">
            <HugeiconsIcon icon={Video01Icon} size={28} />
          </span>
        )
      )}
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        onPlaying={() => setPlaying(true)}
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', playing ? 'opacity-100' : 'opacity-0')}
      />
      {pseudoFullscreen && (
        <Button
          isIconOnly
          variant="secondary"
          aria-label="Exit full screen"
          autoFocus
          className="absolute right-[max(16px,env(safe-area-inset-right))] top-[max(16px,env(safe-area-inset-top))] z-10"
          onPress={() => setPseudoFullscreen(false)}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </Button>
      )}
    </div>
  );
});
