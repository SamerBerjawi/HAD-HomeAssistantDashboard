import { useEffect, useState } from 'react';

export type CameraStreamStatus = 'idle' | 'connecting' | 'live' | 'unavailable' | 'error';

const ICE_GATHER_MAX_MS = 1000;
const ICE_GRACE_MS = 150;
const FIRST_MEDIA_TIMEOUT_MS = 8000;

/**
 * One WebRTC session per player, straight from go2rtc via `/api/cameras/:id/webrtc` (DESIGN.md 7.5,
 * owner 2026-11-18): no shared pool, no HLS fallback, no frame copying. Returns the MediaStream for
 * a native <video>. In development without go2rtc (HTTP 503) the status is 'unavailable' and the
 * player keeps its snapshot.
 */
export function useWebRtcCamera(streamId: string | null, token: string, enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const [attempt, setAttempt] = useState(0);

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

    pc.ontrack = (e) => {
      media.addTrack(e.track);
      if (closed) return;
      if (mediaTimer) clearTimeout(mediaTimer);
      setStream(media);
      setStatus('live');
    };
    pc.onconnectionstatechange = () => {
      if (!closed && (pc.connectionState === 'failed' || pc.connectionState === 'disconnected')) setStatus('error');
    };

    (async () => {
      setStatus('connecting');
      try {
        await pc.setLocalDescription(await pc.createOffer());
        // go2rtc's endpoint isn't trickle: wait briefly for local candidates.
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
        mediaTimer = setTimeout(() => !closed && setStatus((s) => (s === 'live' ? s : 'error')), FIRST_MEDIA_TIMEOUT_MS);
      } catch {
        if (!closed) setStatus('error');
      }
    })();

    return () => {
      closed = true;
      if (mediaTimer) clearTimeout(mediaTimer);
      pc.close();
      media.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [streamId, token, enabled, attempt]);

  return { stream, status, retry: () => setAttempt((n) => n + 1) };
}
