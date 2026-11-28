import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStreamStatus = 'idle' | 'connecting' | 'live' | 'unavailable' | 'error';

const ICE_GATHER_MAX_MS = 1000;
const ICE_GRACE_MS = 150;
const FIRST_MEDIA_TIMEOUT_MS = 8000;
const MAX_AUTO_RETRIES = 3;
const AUTO_RETRY_BASE_MS = 2000;

/**
 * One WebRTC session per player, straight from go2rtc via `/api/cameras/:id/webrtc` (DESIGN.md 7.5):
 * capped auto-reconnect with exponential backoff + visibility recovery + manual `retry()`.
 * In development without go2rtc (HTTP 503) the status is 'unavailable' and the player keeps its snapshot.
 */
export function useWebRtcCamera(streamId: string | null, token: string, enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const autoRetriesRef = useRef(0);
  const statusRef = useRef<CameraStreamStatus>('idle');
  statusRef.current = status;

  const triggerManualRetry = useCallback(() => {
    autoRetriesRef.current = 0;
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    autoRetriesRef.current = 0;
  }, [streamId, enabled]);

  useEffect(() => {
    if (!enabled || !streamId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && statusRef.current === 'error') {
        autoRetriesRef.current = 0;
        setAttempt((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled, streamId]);

  useEffect(() => {
    if (!enabled || !streamId) {
      setStatus('idle');
      setStream(null);
      return;
    }
    let closed = false;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    const media = new MediaStream();
    let mediaTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleErrorOrRetry = () => {
      if (closed) return;
      setStatus('error');
      if (autoRetriesRef.current < MAX_AUTO_RETRIES && !reconnectTimer) {
        const delay = AUTO_RETRY_BASE_MS * Math.pow(2, autoRetriesRef.current);
        autoRetriesRef.current += 1;
        reconnectTimer = setTimeout(() => {
          if (!closed) setAttempt((n) => n + 1);
        }, delay);
      }
    };

    pc.ontrack = (e) => {
      media.addTrack(e.track);
      if (closed) return;
      if (mediaTimer) clearTimeout(mediaTimer);
      autoRetriesRef.current = 0;
      setStream(media);
      setStatus('live');
    };
    pc.onconnectionstatechange = () => {
      if (!closed && (pc.connectionState === 'failed' || pc.connectionState === 'disconnected')) {
        scheduleErrorOrRetry();
      }
    };

    (async () => {
      setStatus('connecting');
      try {
        await pc.setLocalDescription(await pc.createOffer());
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') return resolve();
          let grace: ReturnType<typeof setTimeout> | null = null;
          const cap = setTimeout(resolve, ICE_GATHER_MAX_MS);
          pc.addEventListener('icegatheringstatechange', () => pc.iceGatheringState === 'complete' && (clearTimeout(cap), resolve()));
          pc.addEventListener('icecandidate', (e) => {
            if (e.candidate && !grace) grace = setTimeout(() => (clearTimeout(cap), resolve()), ICE_GRACE_MS);
          });
        });
        const res = await fetch(`/api/cameras/${encodeURIComponent(streamId)}/webrtc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ type: 'offer', sdp: pc.localDescription?.sdp })
        });
        if (closed) return;
        if (res.status === 503 || res.status === 404) return setStatus('unavailable');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const answer = await res.json();
        await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
        mediaTimer = setTimeout(() => {
          if (!closed && statusRef.current !== 'live') {
            scheduleErrorOrRetry();
          }
        }, FIRST_MEDIA_TIMEOUT_MS);
      } catch {
        scheduleErrorOrRetry();
      }
    })();

    return () => {
      closed = true;
      if (mediaTimer) clearTimeout(mediaTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      pc.close();
      media.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [streamId, token, enabled, attempt]);

  return { stream, status, retry: triggerManualRetry };
}
