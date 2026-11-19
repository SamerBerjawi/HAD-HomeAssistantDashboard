/**
 * Device & playback service action handlers for pro Overview (lights, switches, fans, vacuums, and
 * media players). Keeps ProOverview.tsx concise and within file-size limits.
 */
import { useCallback } from 'react';
import type { ProFanItem, ProFansModel } from '../lib/overviewAppliances';
import type { ProControlDomain, ProControlDomainModel, ProControlItem } from '../lib/overviewControls';
import type { ProMediaOverviewModel, ProMediaQueueTrack } from '../lib/overviewMedia';
import type { ProOverviewAlarmModel } from '../lib/overviewSecurity';
import type { AlarmModeId } from '../lib/securityLogic';

interface UseProOverviewActionsParams {
  isDemo: boolean;
  lightsModel: ProControlDomainModel;
  switchesModel: ProControlDomainModel;
  fansModel: ProFansModel;
  mediaModel: ProMediaOverviewModel;
  alarmModel: ProOverviewAlarmModel;
  callHAService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id: string | string[] }
  ) => Promise<void>;
  updateEntityState: (
    entityId: string,
    newState?: string | null,
    newAttributes?: Record<string, unknown>
  ) => void;
}

export function useProOverviewActions({
  isDemo,
  lightsModel,
  switchesModel,
  fansModel,
  mediaModel,
  alarmModel,
  callHAService,
  updateEntityState
}: UseProOverviewActionsParams) {
  const safeCall = useCallback(
    async (
      domain: string,
      service: string,
      data: Record<string, unknown>,
      target: { entity_id: string | string[] }
    ) => {
      try {
        await callHAService(domain, service, data, target);
      } catch {
        // Error state & toast already reported by serviceSlice
      }
    },
    [callHAService]
  );

  // Lights & Switches
  const handleToggleControlItem = useCallback(
    (item: ProControlItem) => {
      const nextOn = !item.isOn;
      const service = nextOn ? 'turn_on' : 'turn_off';
      const data =
        nextOn && item.domain === 'light' && item.supportsBrightness
          ? { brightness_pct: item.brightnessPct && item.brightnessPct > 0 ? item.brightnessPct : 80 }
          : {};
      updateEntityState(item.entityId, nextOn ? 'on' : 'off', data);
      void safeCall(item.domain, service, data, { entity_id: item.entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleToggleControlBatch = useCallback(
    async (domain: ProControlDomain, forceOn: boolean) => {
      const haDomain = domain === 'lights' ? 'light' : 'switch';
      const source = domain === 'lights' ? lightsModel.items : switchesModel.items;
      const targets = source.filter((item) => (forceOn ? !item.isOn : item.isOn));
      for (const item of targets) {
        const data =
          forceOn && haDomain === 'light' && item.supportsBrightness
            ? { brightness_pct: item.brightnessPct && item.brightnessPct > 0 ? item.brightnessPct : 80 }
            : {};
        updateEntityState(item.entityId, forceOn ? 'on' : 'off', data);
      }
      for (const item of targets) {
        const data =
          forceOn && haDomain === 'light' && item.supportsBrightness
            ? { brightness_pct: item.brightnessPct && item.brightnessPct > 0 ? item.brightnessPct : 80 }
            : {};
        await safeCall(haDomain, forceOn ? 'turn_on' : 'turn_off', data, {
          entity_id: item.entityId
        });
      }
    },
    [lightsModel.items, switchesModel.items, safeCall, updateEntityState]
  );

  const handleChangeLightBrightness = useCallback(
    (entityId: string, brightnessPct: number) => {
      const pct = Math.max(1, Math.min(100, Math.round(brightnessPct)));
      updateEntityState(entityId, 'on', {
        brightness_pct: pct,
        brightness: Math.round((pct / 100) * 255)
      });
      void safeCall('light', 'turn_on', { brightness_pct: pct }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  // Fans
  const handleToggleFan = useCallback(
    (fan: ProFanItem) => {
      const nextOn = !fan.isOn;
      const nextPct = nextOn ? (fan.percentage > 0 ? fan.percentage : 66) : 0;
      const data = nextOn ? { percentage: nextPct } : {};
      updateEntityState(fan.entityId, nextOn ? 'on' : 'off', { percentage: nextPct });
      void safeCall('fan', nextOn ? 'turn_on' : 'turn_off', data, { entity_id: fan.entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleToggleFanBatch = useCallback(
    async (forceOn: boolean) => {
      const targets = fansModel.items.filter((fan) => (forceOn ? !fan.isOn : fan.isOn));
      for (const fan of targets) {
        const nextPct = forceOn ? (fan.percentage > 0 ? fan.percentage : 66) : 0;
        updateEntityState(fan.entityId, forceOn ? 'on' : 'off', { percentage: nextPct });
      }
      for (const fan of targets) {
        const data = forceOn ? { percentage: fan.percentage > 0 ? fan.percentage : 66 } : {};
        await safeCall('fan', forceOn ? 'turn_on' : 'turn_off', data, { entity_id: fan.entityId });
      }
    },
    [fansModel.items, safeCall, updateEntityState]
  );

  const handleChangeFanSpeed = useCallback(
    (entityId: string, percentage: number) => {
      const pct = Math.max(0, Math.min(100, Math.round(percentage)));
      if (pct === 0) {
        updateEntityState(entityId, 'off', { percentage: 0 });
        void safeCall('fan', 'turn_off', {}, { entity_id: entityId });
      } else {
        updateEntityState(entityId, 'on', { percentage: pct });
        void safeCall('fan', 'set_percentage', { percentage: pct }, { entity_id: entityId });
      }
    },
    [safeCall, updateEntityState]
  );

  const handleToggleFanOscillate = useCallback(
    (fan: ProFanItem) => {
      const nextOsc = !fan.oscillating;
      updateEntityState(fan.entityId, undefined, { oscillating: nextOsc });
      void safeCall('fan', 'oscillate', { oscillating: nextOsc }, { entity_id: fan.entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleToggleFanDirection = useCallback(
    (fan: ProFanItem) => {
      const nextDir = fan.direction === 'reverse' ? 'forward' : 'reverse';
      updateEntityState(fan.entityId, undefined, { direction: nextDir });
      void safeCall('fan', 'set_direction', { direction: nextDir }, { entity_id: fan.entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleSelectFanPreset = useCallback(
    (entityId: string, presetMode: string) => {
      updateEntityState(entityId, 'on', { preset_mode: presetMode });
      void safeCall('fan', 'set_preset_mode', { preset_mode: presetMode }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  // Vacuums
  const handleVacuumAction = useCallback(
    (entityId: string, action: 'start' | 'pause' | 'return_to_base' | 'locate') => {
      if (action === 'start') {
        updateEntityState(entityId, 'cleaning');
      } else if (action === 'pause') {
        updateEntityState(entityId, 'paused');
      } else if (action === 'return_to_base') {
        updateEntityState(entityId, 'returning');
      }
      void safeCall('vacuum', action, {}, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleChangeVacuumSuction = useCallback(
    (entityId: string, speed: string) => {
      updateEntityState(entityId, undefined, { fan_speed: speed });
      void safeCall('vacuum', 'set_fan_speed', { fan_speed: speed }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  // Media Players
  const applyDemoTrack = useCallback(
    (entityId: string, track: ProMediaQueueTrack) => {
      updateEntityState(entityId, 'playing', {
        media_title: track.title,
        media_artist: track.artist,
        ...(track.album ? { media_album_name: track.album } : {}),
        ...(track.albumArt ? { media_image: track.albumArt } : {}),
        ...(track.durationSecs > 0 ? { media_duration: track.durationSecs } : {}),
        media_position: 0,
        media_position_updated_at: new Date().toISOString()
      });
    },
    [updateEntityState]
  );

  const handleMediaPlayPause = useCallback(
    (entityId: string) => {
      void safeCall('media_player', 'media_play_pause', {}, { entity_id: entityId });
    },
    [safeCall]
  );

  const handleMediaNext = useCallback(
    (entityId: string) => {
      const player = mediaModel.players.find((p) => p.entityId === entityId);
      if (isDemo && player && player.upNextQueue.length > 0) {
        applyDemoTrack(entityId, player.upNextQueue[0]);
      }
      void safeCall('media_player', 'media_next_track', {}, { entity_id: entityId });
    },
    [applyDemoTrack, isDemo, mediaModel.players, safeCall]
  );

  const handleMediaPrev = useCallback(
    (entityId: string) => {
      const player = mediaModel.players.find((p) => p.entityId === entityId);
      if (isDemo && player && player.upNextQueue.length > 0) {
        applyDemoTrack(entityId, player.upNextQueue[player.upNextQueue.length - 1]);
      }
      void safeCall('media_player', 'media_previous_track', {}, { entity_id: entityId });
    },
    [applyDemoTrack, isDemo, mediaModel.players, safeCall]
  );

  const handleMediaSeek = useCallback(
    (entityId: string, seconds: number) => {
      updateEntityState(entityId, undefined, {
        media_position: seconds,
        media_position_updated_at: new Date().toISOString()
      });
      void safeCall('media_player', 'media_seek', { seek_position: seconds }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaVolumeChange = useCallback(
    (entityId: string, volumePct: number) => {
      const level = Math.max(0, Math.min(1, volumePct / 100));
      updateEntityState(entityId, undefined, { volume_level: level });
      void safeCall('media_player', 'volume_set', { volume_level: level }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaToggleMute = useCallback(
    (entityId: string, nextMuted: boolean) => {
      updateEntityState(entityId, undefined, { is_volume_muted: nextMuted });
      void safeCall('media_player', 'volume_mute', { is_volume_muted: nextMuted }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaTogglePower = useCallback(
    (entityId: string) => {
      const player = mediaModel.players.find((p) => p.entityId === entityId);
      const isOff = player?.isOff ?? false;
      updateEntityState(entityId, isOff ? 'idle' : 'off');
      void safeCall('media_player', isOff ? 'turn_on' : 'turn_off', {}, { entity_id: entityId });
    },
    [mediaModel.players, safeCall, updateEntityState]
  );

  const handleMediaToggleShuffle = useCallback(
    (entityId: string, nextShuffle: boolean) => {
      updateEntityState(entityId, undefined, { shuffle: nextShuffle });
      void safeCall('media_player', 'shuffle_set', { shuffle: nextShuffle }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaCycleRepeat = useCallback(
    (entityId: string, currentRepeat: 'off' | 'all' | 'one') => {
      const nextRepeat =
        currentRepeat === 'off' ? 'all' : currentRepeat === 'all' ? 'one' : 'off';
      updateEntityState(entityId, undefined, { repeat: nextRepeat });
      void safeCall('media_player', 'repeat_set', { repeat: nextRepeat }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaSelectSource = useCallback(
    (entityId: string, source: string) => {
      updateEntityState(entityId, undefined, { source });
      void safeCall('media_player', 'select_source', { source }, { entity_id: entityId });
    },
    [safeCall, updateEntityState]
  );

  const handleMediaSelectSoundMode = useCallback(
    (entityId: string, soundMode: string) => {
      updateEntityState(entityId, undefined, { sound_mode: soundMode });
      void safeCall(
        'media_player',
        'select_sound_mode',
        { sound_mode: soundMode },
        { entity_id: entityId }
      );
    },
    [safeCall, updateEntityState]
  );

  const handlePlayQueueTrack = useCallback(
    (entityId: string, track: ProMediaQueueTrack) => {
      applyDemoTrack(entityId, track);
      if (track.mediaContentId) {
        void safeCall(
          'media_player',
          'play_media',
          {
            media_content_id: track.mediaContentId,
            media_content_type: track.mediaContentType || 'music'
          },
          { entity_id: entityId }
        );
      } else if (!isDemo) {
        void safeCall('media_player', 'media_next_track', {}, { entity_id: entityId });
      }
    },
    [applyDemoTrack, isDemo, safeCall]
  );

  // Security Alarm & Door Locks
  const handleExecuteAlarmMode = useCallback(
    async (entityId: string, mode: AlarmModeId, code?: string) => {
      const modeDef = alarmModel.modes.find((m) => m.id === mode);
      if (!modeDef) return;
      await callHAService('alarm_control_panel', modeDef.service, code ? { code } : {}, {
        entity_id: entityId
      });
      if (isDemo) {
        updateEntityState(entityId, mode, {
          changed_by: 'You',
          last_changed: new Date().toISOString()
        });
      }
    },
    [alarmModel.modes, callHAService, isDemo, updateEntityState]
  );

  const handleSetLockState = useCallback(
    async (entityId: string, service: 'lock' | 'unlock') => {
      await callHAService('lock', service, {}, { entity_id: entityId });
      if (isDemo) {
        updateEntityState(entityId, service === 'lock' ? 'locked' : 'unlocked');
      }
    },
    [callHAService, isDemo, updateEntityState]
  );

  const handleLockAll = useCallback(async () => {
    const unlockedIds = alarmModel.locks.filter((l) => l.isUnlocked).map((l) => l.entityId);
    if (unlockedIds.length === 0) return;
    await callHAService('lock', 'lock', {}, { entity_id: unlockedIds });
    if (isDemo) {
      for (const eid of unlockedIds) {
        updateEntityState(eid, 'locked');
      }
    }
  }, [alarmModel.locks, callHAService, isDemo, updateEntityState]);

  return {
    handleToggleControlItem,
    handleToggleControlBatch,
    handleChangeLightBrightness,
    handleToggleFan,
    handleToggleFanBatch,
    handleChangeFanSpeed,
    handleToggleFanOscillate,
    handleToggleFanDirection,
    handleSelectFanPreset,
    handleVacuumAction,
    handleChangeVacuumSuction,
    handleMediaPlayPause,
    handleMediaNext,
    handleMediaPrev,
    handleMediaSeek,
    handleMediaVolumeChange,
    handleMediaToggleMute,
    handleMediaTogglePower,
    handleMediaToggleShuffle,
    handleMediaCycleRepeat,
    handleMediaSelectSource,
    handleMediaSelectSoundMode,
    handlePlayQueueTrack,
    handleExecuteAlarmMode,
    handleSetLockState,
    handleLockAll
  };
}

export type ProOverviewActions = ReturnType<typeof useProOverviewActions>;
