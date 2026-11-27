/**
 * Live Media (docs/pro-ui/MEDIA.md §0): Home Assistant's `media_player` entities as the
 * brand-neutral `MediaHome`, and the page's actions as `media_player` service calls. One reader
 * covers every integration because HA's media players share one shape; what an integration can do
 * comes from `supported_features`, never from its name, so Apple TV, HomePods, Music Assistant,
 * Spotify, Sonos, Cast and TVs all fit. Grouping is offered only between players of the same
 * integration that announce it (Sonos, Music Assistant, Cast…); HomePods through the Apple TV
 * integration can't group in HA, so they show where they play instead.
 */
import type { HAEntityRegistryEntry, ResolvedEntity } from '@/types';
import type { HaCall } from '../../areas/ha/haTileActions';
import type { MediaAction, MediaKind, NowPlaying, Player, PlayerKind, PlayerState, Repeat } from '../mediaHome';

/** HA's MediaPlayerEntityFeature bits. */
export const F = {
  PAUSE: 1,
  SEEK: 2,
  VOLUME_SET: 4,
  VOLUME_MUTE: 8,
  PREVIOUS: 16,
  NEXT: 32,
  TURN_ON: 128,
  TURN_OFF: 256,
  PLAY_MEDIA: 512,
  SELECT_SOURCE: 2048,
  PLAY: 16384,
  SHUFFLE_SET: 32768,
  BROWSE_MEDIA: 131072,
  REPEAT_SET: 262144,
  GROUPING: 524288
} as const;

const has = (features: number, bit: number) => (features & bit) === bit;

const TV_PLATFORMS = new Set(['webostv', 'samsungtv', 'androidtv', 'androidtv_remote', 'braviatv', 'roku', 'philips_js', 'vizio', 'panasonic_viera', 'hisense_aehw4a1']);

/** A TV (wide artwork, apps, no grouping) or a speaker. */
export function kindOf(e: ResolvedEntity, platform: string): PlayerKind {
  const model = `${e.device?.model ?? ''} ${e.device?.name ?? ''}`;
  if (/homepod/i.test(model)) return 'speaker';
  if (e.attributes.device_class === 'tv' || TV_PLATFORMS.has(platform) || /apple tv|\btv\b|chromecast|google tv|shield/i.test(model)) return 'tv';
  return 'speaker';
}

function stateOf(s: string): PlayerState {
  if (s === 'playing' || s === 'buffering') return 'playing';
  if (s === 'paused') return 'paused';
  if (s === 'off') return 'off';
  if (s === 'unavailable' || s === 'unknown') return 'unavailable';
  return 'idle';
}

function mediaKindOf(type: string, kind: PlayerKind, a: Record<string, unknown>): MediaKind {
  const t = type.toLowerCase();
  if (t === 'podcast' || /podcast/i.test(String(a.app_name ?? ''))) return 'podcast';
  if (t === 'tvshow' || t === 'episode' || t === 'season') return 'tv';
  if (t === 'movie' || t === 'video') return 'movie';
  if (t === 'channel' || t === 'radio' || /radio/i.test(String(a.app_name ?? ''))) return 'radio';
  if (t === 'app' || (!t && kind === 'tv')) return 'app';
  if (t === 'music' || t === 'track' || t === 'album' || t === 'playlist') return 'music';
  return kind === 'tv' ? 'tv' : 'music';
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

export interface LiveContext {
  /** The `media_player` entities, resolved (area, device). */
  entities: ResolvedEntity[];
  registry: HAEntityRegistryEntry[];
  /** Turns an HA image path into something `<img>` loads (absolute, signed links kept). */
  image: (src: string | null) => string | null;
  /** The artwork's hue by image URL, once measured (null: unknown yet). */
  hueOf: (src: string | null) => number | null;
}

function nowPlaying(e: ResolvedEntity, kind: PlayerKind, ctx: LiveContext): NowPlaying | null {
  const a = e.attributes;
  // AirPlay to a HomePod often sends no title: name the app or source, else the player itself.
  const title = str(a.media_title) ?? str(a.app_name) ?? str(a.source) ?? (e.name || str(a.friendly_name) || e.entity_id);
  const src = ctx.image(str(a.entity_picture_local) ?? str(a.entity_picture));
  const mk = mediaKindOf(String(a.media_content_type ?? ''), kind, a);
  const duration = num(a.media_duration);
  const position = num(a.media_position);
  const at = str(a.media_position_updated_at);
  return {
    kind: mk,
    title,
    subtitle: str(a.media_artist) ?? str(a.media_album_artist) ?? str(a.media_series_title) ?? str(a.media_channel) ?? (mk === 'app' ? null : str(a.app_name)),
    album: str(a.media_album_name),
    art: { src, hue: ctx.hueOf(src) },
    app: kind === 'tv' ? str(a.app_name) ?? str(a.source) : null,
    duration: duration && duration > 0 ? duration : null,
    position: duration && duration > 0 && position !== null ? position : null,
    positionAt: at ? Date.parse(at) || null : null
  };
}

function repeatOf(v: unknown): Repeat | null {
  return v === 'off' || v === 'all' || v === 'one' ? v : null;
}

/** Every media player HA has (hidden and disabled ones left out), as the page's players. */
export function livePlayers(ctx: LiveContext): Player[] {
  const platformOf = new Map(ctx.registry.map((r) => [r.entity_id, r.platform]));
  const list = ctx.entities.filter((e) => e.domain === 'media_player' && !e.hidden && !e.disabled_by);
  const base = list.map((e) => {
    const a = e.attributes;
    const platform = platformOf.get(e.entity_id) ?? 'media_player';
    const features = num(a.supported_features) ?? 0;
    const kind = kindOf(e, platform);
    const state = stateOf(e.state);
    const members = Array.isArray(a.group_members) ? (a.group_members as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const volume = num(a.volume_level);
    const p: Player = {
      id: e.entity_id,
      name: e.name || str(a.friendly_name) || e.entity_id,
      room: e.area?.name ?? null,
      kind,
      platform,
      model: e.device?.model ?? null,
      state,
      media: state === 'playing' || state === 'paused' ? nowPlaying(e, kind, ctx) : null,
      volume: volume !== null && (has(features, F.VOLUME_SET) || has(features, F.VOLUME_MUTE)) ? Math.round(volume * 100) : null,
      muted: a.is_volume_muted === true,
      shuffle: has(features, F.SHUFFLE_SET) && typeof a.shuffle === 'boolean' ? a.shuffle : null,
      repeat: has(features, F.REPEAT_SET) ? repeatOf(a.repeat) : null,
      queue: [],
      // Leader first, as HA lists them; the model keeps the others.
      group: members.length > 1 ? members.filter((m) => m !== e.entity_id) : [],
      joinable: [],
      sources: Array.isArray(a.source_list) ? (a.source_list as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      source: str(a.source),
      can: {
        seek: has(features, F.SEEK),
        skip: has(features, F.NEXT) || has(features, F.PREVIOUS),
        volume: has(features, F.VOLUME_SET),
        shuffle: has(features, F.SHUFFLE_SET),
        repeat: has(features, F.REPEAT_SET),
        group: has(features, F.GROUPING),
        browse: has(features, F.BROWSE_MEDIA),
        power: has(features, F.TURN_ON) || has(features, F.TURN_OFF)
      }
    };
    return p;
  });
  // Grouping: the other players of the same integration that can group too.
  const ids = new Set(base.map((p) => p.id));
  return base.map((p) => ({
    ...p,
    group: p.group.filter((m) => ids.has(m)),
    joinable: p.can.group ? base.filter((x) => x.id !== p.id && x.can.group && x.platform === p.platform && x.state !== 'unavailable').map((x) => x.id) : []
  }));
}

/** The page's action on a player as HA service calls (with the state HA will report, shown at once). */
export function mediaCalls(list: Player[], id: string, a: MediaAction): HaCall[] {
  const p = list.find((x) => x.id === id);
  if (!p) return [];
  const call = (service: string, data: Record<string, unknown> = {}, optimistic?: HaCall['optimistic'], entityId = id): HaCall => ({ domain: 'media_player', service, data, entityId, optimistic });
  switch (a.type) {
    case 'play-pause':
      return [call(p.state === 'playing' ? 'media_pause' : 'media_play', {}, { state: p.state === 'playing' ? 'paused' : 'playing' })];
    case 'next':
      return [call('media_next_track')];
    case 'prev':
      return [call('media_previous_track')];
    case 'seek':
      return [call('media_seek', { seek_position: Math.max(0, Math.round(a.seconds)) }, { state: null, attributes: { media_position: Math.round(a.seconds), media_position_updated_at: new Date().toISOString() } })];
    case 'volume':
      return [call('volume_set', { volume_level: Math.max(0, Math.min(1, a.pct / 100)) }, { state: null, attributes: { volume_level: a.pct / 100 } })];
    case 'mute':
      return [call('volume_mute', { is_volume_muted: a.muted }, { state: null, attributes: { is_volume_muted: a.muted } })];
    case 'shuffle':
      return [call('shuffle_set', { shuffle: a.on }, { state: null, attributes: { shuffle: a.on } })];
    case 'repeat':
      return [call('repeat_set', { repeat: a.mode }, { state: null, attributes: { repeat: a.mode } })];
    case 'power':
      return [call(a.on ? 'turn_on' : 'turn_off', {}, { state: a.on ? 'on' : 'off' })];
    case 'source':
      return [call('select_source', { source: a.source }, { state: null, attributes: { source: a.source } })];
    case 'group': {
      const want = new Set(a.with.filter((x) => x !== id));
      const now = new Set(p.group);
      const out: HaCall[] = [];
      const add = [...want].filter((x) => !now.has(x));
      const drop = [...now].filter((x) => !want.has(x));
      if (add.length) out.push(call('join', { group_members: add }, { state: null, attributes: { group_members: [id, ...want] } }));
      for (const x of drop) out.push(call('unjoin', {}, { state: null, attributes: { group_members: [] } }, x));
      return out;
    }
    case 'play-item': {
      const it = a.item;
      if (!it.contentId) return [call('select_source', { source: it.title }, { state: null, attributes: { source: it.title } })];
      return [call('play_media', { media_content_id: it.contentId, media_content_type: it.contentType ?? 'music' }, { state: 'playing' })];
    }
    case 'play-track':
      return [];
  }
}
