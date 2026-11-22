/** Media player actions (same behaviour as the old `useProOverviewActions` media handlers). */
import { useCallback, useMemo, useRef } from 'react';
import { haWebSocketService } from '@/services/haWebSocket';
import type { ProMediaOverviewModel, ProMediaQueueTrack } from '../../lib/overviewMedia';
import { useServiceCall } from '../shared/useServiceCall';

type Repeat = 'off' | 'all' | 'one';

export interface MediaActions {
  playPause: (entityId: string) => void;
  next: (entityId: string) => void;
  prev: (entityId: string) => void;
  seek: (entityId: string, seconds: number) => void;
  setVolume: (entityId: string, pct: number) => void;
  toggleMute: (entityId: string, muted: boolean) => void;
  togglePower: (entityId: string) => void;
  toggleShuffle: (entityId: string, shuffle: boolean) => void;
  cycleRepeat: (entityId: string, current: Repeat) => void;
  selectSource: (entityId: string, source: string) => void;
  selectSoundMode: (entityId: string, mode: string) => void;
  playQueueTrack: (entityId: string, track: ProMediaQueueTrack) => void;
}

export function useMediaActions(model: ProMediaOverviewModel): MediaActions {
  const { call, setOptimistic } = useServiceCall();
  const playersRef = useRef(model.players);
  playersRef.current = model.players;
  const isDemo = haWebSocketService.isDemo();

  const svc = useCallback((service: string, data: Record<string, unknown>, entityId: string) => void call('media_player', service, data, entityId), [call]);
  const applyDemoTrack = useCallback(
    (entityId: string, t: ProMediaQueueTrack) =>
      setOptimistic(entityId, 'playing', {
        media_title: t.title,
        media_artist: t.artist,
        ...(t.album ? { media_album_name: t.album } : {}),
        ...(t.albumArt ? { media_image: t.albumArt } : {}),
        ...(t.durationSecs > 0 ? { media_duration: t.durationSecs } : {}),
        media_position: 0,
        media_position_updated_at: new Date().toISOString()
      }),
    [setOptimistic]
  );
  const skip = useCallback(
    (entityId: string, dir: 1 | -1) => {
      const queue = playersRef.current.find((p) => p.entityId === entityId)?.upNextQueue ?? [];
      if (isDemo && queue.length > 0) applyDemoTrack(entityId, dir === 1 ? queue[0] : queue[queue.length - 1]);
      svc(dir === 1 ? 'media_next_track' : 'media_previous_track', {}, entityId);
    },
    [applyDemoTrack, isDemo, svc]
  );
  const setAttr = useCallback(
    (entityId: string, attrs: Record<string, unknown>, service: string, data: Record<string, unknown>) => {
      setOptimistic(entityId, null, attrs);
      svc(service, data, entityId);
    },
    [setOptimistic, svc]
  );

  return useMemo<MediaActions>(
    () => ({
      playPause: (id) => svc('media_play_pause', {}, id),
      next: (id) => skip(id, 1),
      prev: (id) => skip(id, -1),
      seek: (id, seconds) => setAttr(id, { media_position: seconds, media_position_updated_at: new Date().toISOString() }, 'media_seek', { seek_position: seconds }),
      setVolume: (id, pct) => {
        const level = Math.max(0, Math.min(1, pct / 100));
        setAttr(id, { volume_level: level }, 'volume_set', { volume_level: level });
      },
      toggleMute: (id, muted) => setAttr(id, { is_volume_muted: muted }, 'volume_mute', { is_volume_muted: muted }),
      togglePower: (id) => {
        const isOff = playersRef.current.find((p) => p.entityId === id)?.isOff ?? false;
        setOptimistic(id, isOff ? 'idle' : 'off');
        svc(isOff ? 'turn_on' : 'turn_off', {}, id);
      },
      toggleShuffle: (id, shuffle) => setAttr(id, { shuffle }, 'shuffle_set', { shuffle }),
      cycleRepeat: (id, current) => {
        const repeat: Repeat = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
        setAttr(id, { repeat }, 'repeat_set', { repeat });
      },
      selectSource: (id, source) => setAttr(id, { source }, 'select_source', { source }),
      selectSoundMode: (id, mode) => setAttr(id, { sound_mode: mode }, 'select_sound_mode', { sound_mode: mode }),
      playQueueTrack: (id, track) => {
        applyDemoTrack(id, track);
        if (track.mediaContentId) svc('play_media', { media_content_id: track.mediaContentId, media_content_type: track.mediaContentType || 'music' }, id);
        else if (!isDemo) svc('media_next_track', {}, id);
      }
    }),
    [applyDemoTrack, isDemo, setAttr, setOptimistic, skip, svc]
  );
}
