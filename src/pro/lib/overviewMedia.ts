/**
 * Pure view-model, song-adaptive waveform generator, and Up Next track queue builder for the pro
 * Overview Media player widget and detail sheet (docs/pro-ui/DESIGN.md 7.6).
 */
import { formatMediaTime } from '@/hooks/useMediaPosition';
import {
  detectMediaPlayerType,
  MediaPlayerEntityFeature
} from '@/services/mediaPlayerClassification';
import type { HADevice, ResolvedEntity } from '@/types';
import { deriveShortName, resolveControlRoomName } from './overviewControls';
import type { PillTone } from './overviewPills';

export interface ProMediaQueueTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSecs: number;
  durationLabel: string;
  albumArt?: string;
  mediaContentId?: string;
  mediaContentType?: string;
}

export type ProMediaQueueSource = 'live' | 'demo' | 'unavailable';

export interface ProMediaPlayerItem {
  entityId: string;
  name: string;
  shortName: string;
  roomName: string;
  state: string;
  isPlaying: boolean;
  isPaused: boolean;
  isOff: boolean;
  title: string;
  artist: string;
  album: string | null;
  rawImage: string | null;
  volumePct: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  source: string | null;
  sourceList: string[];
  soundMode: string | null;
  soundModeList: string[];
  durationSecs: number;
  positionSecs: number;
  supportsPlayPause: boolean;
  supportsNextPrev: boolean;
  supportsVolume: boolean;
  supportsMute: boolean;
  supportsTurnOnOff: boolean;
  supportsShuffle: boolean;
  supportsRepeat: boolean;
  supportsSeek: boolean;
  deviceKindLabel: string;
  upNextQueue: ProMediaQueueTrack[];
  queueSource: ProMediaQueueSource;
}

export interface ProMediaOverviewModel {
  players: ProMediaPlayerItem[];
  activePlayer: ProMediaPlayerItem | null;
  activeEntity: ResolvedEntity | null;
  playingCount: number;
  totalCount: number;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

const DEMO_MUSIC_QUEUE: Omit<ProMediaQueueTrack, 'durationLabel'>[] = [
  {
    id: 'demo-after-hours',
    title: 'After Hours (Lofi Ambient Cover)',
    artist: 'The Weekend Dreamer',
    album: 'Midnight Horizons EP',
    durationSecs: 234,
    albumArt:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-velvet-skyline',
    title: 'Velvet Skyline',
    artist: 'Klara Sol & Echoes',
    album: 'Nocturne Sessions',
    durationSecs: 212,
    albumArt:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-amber-static',
    title: 'Amber Static (Tape Dub)',
    artist: 'Nils Halvorsen',
    album: 'Warm Analogrooms',
    durationSecs: 198,
    albumArt:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-nordic-rain',
    title: 'Nordic Glass & Rain',
    artist: 'Hana Takahashi',
    album: 'Quiet Acoustics',
    durationSecs: 248,
    albumArt:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-synthwave-ride',
    title: 'Synthwave Night Ride',
    artist: 'Lofi Girl Live Stream',
    album: 'Late Night Study',
    durationSecs: 265,
    albumArt:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop'
  }
];

const DEMO_TV_QUEUE: Omit<ProMediaQueueTrack, 'durationLabel'>[] = [
  {
    id: 'demo-ted-lasso',
    title: 'Ted Lasso (Season 3)',
    artist: 'Apple TV+',
    album: 'Comedy Series',
    durationSecs: 2180,
    albumArt:
      'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-severance',
    title: 'Severance · S2 Finale',
    artist: 'Apple TV+',
    album: 'Thriller Series',
    durationSecs: 2940,
    albumArt:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-planet-earth',
    title: 'Our Planet · High Seas',
    artist: 'Netflix 4K',
    album: 'Documentary',
    durationSecs: 3010,
    albumArt:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-silo',
    title: 'Silo · Deep Shaft',
    artist: 'Apple TV+',
    album: 'Sci-Fi Drama',
    durationSecs: 2680,
    albumArt:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop'
  }
];

/**
 * Generates a deterministic, multi-harmonic audio waveform profile uniquely shaped by song title,
 * artist, and track duration so each track renders a distinct silhouette in 16..96% bar heights.
 */
export function generateSongWaveform(
  title: string = '',
  artist: string = '',
  duration: number = 0,
  barCount: number = 40
): number[] {
  const safeCount = Math.max(8, Math.min(96, Math.round(barCount)));
  const durBucket = Math.round(Math.max(0, duration));
  const seed = `${title.trim()}|${artist.trim()}|${durBucket}`;

  let h1 = 2166136261;
  let h2 = 374761393;
  for (let i = 0; i < seed.length; i++) {
    const code = seed.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 = Math.imul(h2 ^ (code * 31), 668265263);
  }

  const peak1 = 0.22 + (Math.abs(h1 % 1000) / 1000) * 0.25;
  const peak2 = 0.56 + (Math.abs(h2 % 1000) / 1000) * 0.26;
  const harmonicFreq = 8 + (Math.abs(h1 + h2) % 10);

  const heights: number[] = [];
  let prev = 38;

  for (let i = 0; i < safeCount; i++) {
    const t = i / Math.max(1, safeCount - 1);
    const intro = Math.sin(Math.min(1, t * 4.2) * (Math.PI / 2));
    const outro = Math.sin(Math.min(1, (1 - t) * 4.2) * (Math.PI / 2));
    const envelope = 0.55 + 0.45 * intro * outro;

    const chorusA = Math.exp(-Math.pow((t - peak1) * 7.5, 2)) * 28;
    const chorusB = Math.exp(-Math.pow((t - peak2) * 7.5, 2)) * 34;
    const wave = Math.sin(t * Math.PI * harmonicFreq + (h1 % 7)) * 11;

    const n1 = Math.abs(Math.sin(h1 * 0.0001 + i * 12.9898) * 43758.5453) % 1;
    const n2 = Math.abs(Math.cos(h2 * 0.0001 + i * 24.7131) * 19341.2317) % 1;
    const texture = n1 * 34 + n2 * 18;

    const raw = (20 + chorusA + chorusB + wave + texture) * envelope;
    const blended = prev * 0.3 + raw * 0.7;
    prev = blended;
    heights.push(Math.max(16, Math.min(96, Math.round(blended))));
  }

  return heights;
}

function normalizeLiveQueueEntry(raw: unknown, index: number): ProMediaQueueTrack | null {
  if (typeof raw === 'string' && raw.trim()) {
    const text = raw.trim();
    return {
      id: `live-str-${index}-${text}`,
      title: text,
      artist: 'Queued track',
      durationSecs: 0,
      durationLabel: '--:--'
    };
  }
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title =
    (typeof obj.media_title === 'string' && obj.media_title) ||
    (typeof obj.title === 'string' && obj.title) ||
    (typeof obj.name === 'string' && obj.name) ||
    '';
  if (!title.trim()) return null;

  const artist =
    (typeof obj.media_artist === 'string' && obj.media_artist) ||
    (typeof obj.artist === 'string' && obj.artist) ||
    (typeof obj.media_series_title === 'string' && obj.media_series_title) ||
    'Up next';

  const durationSecs = Number(obj.media_duration ?? obj.duration ?? 0) || 0;
  const albumArt =
    (typeof obj.media_image_url === 'string' && obj.media_image_url) ||
    (typeof obj.media_image === 'string' && obj.media_image) ||
    (typeof obj.entity_picture === 'string' && obj.entity_picture) ||
    (typeof obj.thumbnail === 'string' && obj.thumbnail) ||
    undefined;

  return {
    id: `live-${index}-${title}`,
    title: title.trim(),
    artist: artist.trim(),
    album:
      (typeof obj.media_album_name === 'string' && obj.media_album_name) ||
      (typeof obj.album === 'string' && obj.album) ||
      undefined,
    durationSecs,
    durationLabel: durationSecs > 0 ? formatMediaTime(durationSecs) : '--:--',
    albumArt,
    mediaContentId: typeof obj.media_content_id === 'string' ? obj.media_content_id : undefined,
    mediaContentType:
      typeof obj.media_content_type === 'string' ? obj.media_content_type : undefined
  };
}

export function buildMediaUpNextQueue(
  entity: ResolvedEntity | undefined,
  isDemo: boolean
): { tracks: ProMediaQueueTrack[]; source: ProMediaQueueSource } {
  if (!entity) return { tracks: [], source: 'unavailable' };
  const attrs = entity.attributes || {};

  const candidateLists = [
    attrs.queue,
    attrs.media_queue,
    attrs.upcoming_tracks,
    attrs.playlist_tracks
  ];

  for (const list of candidateLists) {
    if (Array.isArray(list) && list.length > 0) {
      const normalized = list
        .map((entry, idx) => normalizeLiveQueueEntry(entry, idx))
        .filter((item): item is ProMediaQueueTrack => item !== null);
      if (normalized.length > 0) {
        return { tracks: normalized, source: 'live' };
      }
    }
  }

  const nextTitle =
    (typeof attrs.next_track === 'string' && attrs.next_track) ||
    (typeof attrs.next_title === 'string' && attrs.next_title) ||
    '';
  if (nextTitle.trim()) {
    const nextArtist =
      (typeof attrs.next_artist === 'string' && attrs.next_artist) ||
      (typeof attrs.media_artist === 'string' && attrs.media_artist) ||
      'Up next';
    return {
      tracks: [
        {
          id: `live-next-${nextTitle}`,
          title: nextTitle.trim(),
          artist: nextArtist,
          durationSecs: 0,
          durationLabel: '--:--'
        }
      ],
      source: 'live'
    };
  }

  if (!isDemo) {
    return { tracks: [], source: 'unavailable' };
  }

  const isVideo =
    attrs.device_class === 'tv' ||
    String(attrs.app_name || '').toLowerCase().includes('tv') ||
    entity.entity_id.includes('apple_tv') ||
    entity.entity_id.includes('_tv');

  const pool = isVideo ? DEMO_TV_QUEUE : DEMO_MUSIC_QUEUE;
  const currentTitle = String(attrs.media_title || '').toLowerCase();
  const currentIndex = pool.findIndex((t) => t.title.toLowerCase() === currentTitle);

  const ordered =
    currentIndex >= 0
      ? [...pool.slice(currentIndex + 1), ...pool.slice(0, currentIndex)]
      : pool.slice(0, 4);

  return {
    tracks: ordered.slice(0, 4).map((t) => ({
      ...t,
      durationLabel: formatMediaTime(t.durationSecs)
    })),
    source: 'demo'
  };
}

function formatDeviceKindLabel(kind: string): string {
  if (kind === 'apple_tv') return 'Apple TV';
  if (kind === 'homepod') return 'HomePod';
  if (kind === 'sonos') return 'Sonos';
  if (kind === 'cast') return 'Cast';
  if (kind === 'smart_tv') return 'Smart TV';
  return 'Speaker';
}

export function buildMediaOverviewModel(params: {
  mediaEntities: ResolvedEntity[];
  selectedEntityId?: string | null;
  devices?: HADevice[];
  allEntities?: ResolvedEntity[];
  isDemo?: boolean;
}): ProMediaOverviewModel {
  const { mediaEntities, selectedEntityId, devices, allEntities, isDemo = false } = params;

  const mapped: ProMediaPlayerItem[] = mediaEntities.map((entity) => {
    const attrs = entity.attributes || {};
    const state = String(entity.state || 'idle').toLowerCase();
    const isPlaying = state === 'playing';
    const isPaused = state === 'paused';
    const isOff = state === 'off' || state === 'standby';

    const name = entity.name || attrs.friendly_name || entity.entity_id;
    const roomName = resolveControlRoomName(entity);
    const classified = detectMediaPlayerType(entity, devices, allEntities || mediaEntities);
    const feat = classified.supportedFeatures;
    const hasBit = (flag: number) => (feat & flag) !== 0;

    const rawVol = typeof attrs.volume_level === 'number' ? attrs.volume_level : 0.45;
    const volumePct = Math.max(0, Math.min(100, Math.round(rawVol * 100)));
    const repeatVal = String(attrs.repeat || 'off').toLowerCase();
    const repeat: 'off' | 'all' | 'one' =
      repeatVal === 'all' || repeatVal === 'one' ? repeatVal : 'off';

    const { tracks: upNextQueue, source: queueSource } = buildMediaUpNextQueue(entity, isDemo);

    const rawTitle = typeof attrs.media_title === 'string' && attrs.media_title.trim()
      ? attrs.media_title.trim()
      : isPlaying
        ? 'Active playback'
        : isPaused
          ? 'Playback paused'
          : isOff
            ? 'Standby'
            : 'Ready to play';

    const rawArtist = typeof attrs.media_artist === 'string' && attrs.media_artist.trim()
      ? attrs.media_artist.trim()
      : typeof attrs.app_name === 'string' && attrs.app_name.trim()
        ? attrs.app_name.trim()
        : name;

    return {
      entityId: entity.entity_id,
      name,
      shortName: deriveShortName(name, roomName),
      roomName,
      state,
      isPlaying,
      isPaused,
      isOff,
      title: rawTitle,
      artist: rawArtist,
      album: typeof attrs.media_album_name === 'string' ? attrs.media_album_name : null,
      rawImage:
        (typeof attrs.media_image === 'string' && attrs.media_image) ||
        (typeof attrs.entity_picture === 'string' && attrs.entity_picture) ||
        null,
      volumePct,
      isMuted: Boolean(attrs.is_volume_muted),
      shuffle: Boolean(attrs.shuffle),
      repeat,
      source:
        (typeof attrs.source === 'string' && attrs.source) ||
        (typeof attrs.app_name === 'string' && attrs.app_name) ||
        null,
      sourceList: Array.isArray(attrs.source_list)
        ? attrs.source_list.filter((s: unknown): s is string => typeof s === 'string')
        : [],
      soundMode: typeof attrs.sound_mode === 'string' ? attrs.sound_mode : null,
      soundModeList: Array.isArray(attrs.sound_mode_list)
        ? attrs.sound_mode_list.filter((s: unknown): s is string => typeof s === 'string')
        : [],
      durationSecs: Number(attrs.media_duration) || (isPlaying ? 234 : 0),
      positionSecs: Number(attrs.media_position) || 0,
      supportsPlayPause: classified.supportsPlayPause,
      supportsNextPrev: classified.supportsNextPrev,
      supportsVolume: classified.supportsVolume,
      supportsMute: classified.supportsMute,
      supportsTurnOnOff: classified.supportsTurnOn || classified.supportsTurnOff,
      supportsShuffle: hasBit(MediaPlayerEntityFeature.SHUFFLE_SET) || isDemo,
      supportsRepeat: hasBit(MediaPlayerEntityFeature.REPEAT_SET) || isDemo,
      supportsSeek: hasBit(MediaPlayerEntityFeature.SEEK) || isDemo,
      deviceKindLabel: formatDeviceKindLabel(classified.kind),
      upNextQueue,
      queueSource
    };
  });

  const players = [...mapped].sort(
    (a, b) =>
      Number(b.isPlaying) - Number(a.isPlaying) ||
      Number(Boolean(b.rawImage)) - Number(Boolean(a.rawImage)) ||
      Number(b.isPaused) - Number(a.isPaused) ||
      Number(!b.isOff) - Number(!a.isOff) ||
      a.name.localeCompare(b.name)
  );

  const activePlayer =
    (selectedEntityId ? players.find((p) => p.entityId === selectedEntityId) : undefined) ||
    players[0] ||
    null;

  const activeEntity = activePlayer
    ? mediaEntities.find((e) => e.entity_id === activePlayer.entityId) ?? null
    : null;

  const playingCount = players.filter((p) => p.isPlaying).length;
  const pausedCount = players.filter((p) => p.isPaused).length;
  const totalCount = players.length;

  let badgeTone: PillTone = 'default';
  let badgeText = 'Idle';
  if (playingCount > 0) {
    badgeTone = 'accent';
    badgeText = playingCount === 1 ? 'Playing' : `${playingCount} playing`;
  } else if (pausedCount > 0) {
    badgeTone = 'warning';
    badgeText = 'Paused';
  } else if (activePlayer?.isOff) {
    badgeText = 'Standby';
  }

  let subtitleText: string;
  if (!activePlayer) {
    subtitleText = 'No media players found';
  } else if (playingCount > 0) {
    subtitleText = `${activePlayer.title} · ${activePlayer.shortName}`;
  } else {
    subtitleText = `${totalCount} speakers ready`;
  }

  return {
    players,
    activePlayer,
    activeEntity,
    playingCount,
    totalCount,
    badgeText,
    badgeTone,
    subtitleText
  };
}
