import { describe, expect, it } from 'vitest';
import type { HAEntityRegistryEntry, ResolvedEntity } from '@/types';
import { F, livePlayers, mediaCalls } from '@/pro/lib/media/live';
import { appsShelf, foldersOf, noteRecent, recentShelf, shelfOf, type BrowseNode } from '@/pro/lib/media/library';

const ent = (id: string, state: string, attributes: Record<string, unknown>, extra: Partial<ResolvedEntity> = {}): ResolvedEntity =>
  ({ entity_id: id, domain: 'media_player', name: id.split('.')[1], state, attributes, area_id: null, device_id: null, floor_id: null, resolutionSource: 'entity', hidden: false, isDiagnostic: false, ...extra }) as ResolvedEntity;
const reg = (id: string, platform: string) => ({ entity_id: id, platform }) as HAEntityRegistryEntry;

const MUSIC = F.PAUSE | F.SEEK | F.VOLUME_SET | F.VOLUME_MUTE | F.NEXT | F.PREVIOUS | F.PLAY | F.SHUFFLE_SET | F.REPEAT_SET | F.PLAY_MEDIA | F.BROWSE_MEDIA;
const ctx = (entities: ResolvedEntity[], registry: HAEntityRegistryEntry[]) => ({ entities, registry, image: (s: string | null) => (s ? `https://ha.test${s}` : null), hueOf: () => null });

describe('live media players', () => {
  const homepod = ent(
    'media_player.living_homepod',
    'playing',
    { supported_features: MUSIC, media_title: 'Song', media_artist: 'Band', media_album_name: 'Album', media_content_type: 'music', media_duration: 200, media_position: 50, media_position_updated_at: '2026-11-27T10:00:00Z', volume_level: 0.42, shuffle: false, repeat: 'off', entity_picture: '/api/media_player_proxy/x?token=t' },
    { area: { area_id: 'living', name: 'Living room' } as ResolvedEntity['area'], device: { id: 'd1', name: 'HomePod', model: 'HomePod mini' } }
  );
  const tv = ent('media_player.den_tv', 'on', { supported_features: F.TURN_ON | F.TURN_OFF | F.SELECT_SOURCE, source_list: ['Netflix', 'YouTube'], source: 'Netflix' }, { device: { id: 'd2', name: 'Den', model: 'Apple TV 4K' } });
  const sonosA = ent('media_player.office', 'playing', { supported_features: MUSIC | F.GROUPING, group_members: ['media_player.office', 'media_player.kitchen'], media_title: 'Jazz' });
  const sonosB = ent('media_player.kitchen', 'playing', { supported_features: MUSIC | F.GROUPING, group_members: ['media_player.office', 'media_player.kitchen'], media_title: 'Jazz' });
  const registry = [reg(homepod.entity_id, 'apple_tv'), reg(tv.entity_id, 'apple_tv'), reg(sonosA.entity_id, 'sonos'), reg(sonosB.entity_id, 'sonos')];
  const players = livePlayers(ctx([homepod, tv, sonosA, sonosB], registry));
  const by = (id: string) => players.find((p) => p.id === id)!;

  it('reads what plays, the room and what the player can do', () => {
    const p = by('media_player.living_homepod');
    expect(p).toMatchObject({ kind: 'speaker', room: 'Living room', model: 'HomePod mini', state: 'playing', volume: 42, shuffle: false, repeat: 'off', platform: 'apple_tv' });
    expect(p.media).toMatchObject({ kind: 'music', title: 'Song', subtitle: 'Band', album: 'Album', duration: 200, position: 50 });
    expect(p.media?.art.src).toBe('https://ha.test/api/media_player_proxy/x?token=t');
    expect(p.can).toMatchObject({ seek: true, skip: true, volume: true, group: false, browse: true });
  });

  it('tells a TV from a speaker and lists its apps', () => {
    const p = by('media_player.den_tv');
    expect(p).toMatchObject({ kind: 'tv', state: 'idle', sources: ['Netflix', 'YouTube'], media: null });
    expect(appsShelf(p)?.items.map((i) => i.title)).toEqual(['Netflix', 'YouTube']);
  });

  it('groups only players of one integration that can group', () => {
    expect(by('media_player.office')).toMatchObject({ group: ['media_player.kitchen'], joinable: ['media_player.kitchen'] });
    expect(by('media_player.living_homepod').joinable).toEqual([]);
  });

  it('names what plays even when HA sends no title', () => {
    const [p] = livePlayers(ctx([ent('media_player.bedroom', 'playing', {}, { name: 'Bedroom' })], [reg('media_player.bedroom', 'apple_tv')]));
    expect(p.media?.title).toBe('Bedroom');
  });

  it('turns actions into media_player calls', () => {
    expect(mediaCalls(players, 'media_player.living_homepod', { type: 'play-pause' })[0]).toMatchObject({ service: 'media_pause', optimistic: { state: 'paused' } });
    expect(mediaCalls(players, 'media_player.living_homepod', { type: 'volume', pct: 30 })[0]).toMatchObject({ service: 'volume_set', data: { volume_level: 0.3 } });
    const regroup = mediaCalls(players, 'media_player.office', { type: 'group', with: ['media_player.office'] });
    expect(regroup).toEqual([expect.objectContaining({ service: 'unjoin', entityId: 'media_player.kitchen' })]);
    expect(mediaCalls(players, 'media_player.office', { type: 'group', with: ['media_player.office', 'media_player.kitchen', 'media_player.x'] })[0]).toMatchObject({ service: 'join', data: { group_members: ['media_player.x'] } });
    const item = { id: 'i', title: 'Mix', subtitle: null, art: { src: null, hue: null }, kind: 'playlist' as const, contentId: 'spotify:playlist:1', contentType: 'playlist', on: null };
    expect(mediaCalls(players, 'media_player.office', { type: 'play-item', item })[0]).toMatchObject({ service: 'play_media', data: { media_content_id: 'spotify:playlist:1', media_content_type: 'playlist' } });
    expect(mediaCalls(players, 'media_player.den_tv', { type: 'play-item', item: { ...item, kind: 'app', contentId: null, title: 'YouTube' } })[0]).toMatchObject({ service: 'select_source', data: { source: 'YouTube' } });
  });
});

describe('live library', () => {
  const art = (src: string | null) => ({ src, hue: null });
  const node = (title: string, extra: Partial<BrowseNode> = {}): BrowseNode => ({ title, media_content_id: title, media_content_type: 'x', ...extra });

  it('makes shelves of playable items and opens the likeliest folders first', () => {
    const root = node('Root', { children: [node('Artists', { can_expand: true }), node('Playlists', { can_expand: true }), node('Text-to-speech', { can_expand: true }), node('Song', { can_play: true })] });
    expect(foldersOf(root).map((n) => n.title)).toEqual(['Playlists', 'Artists']);
    expect(shelfOf(root, 'p', art)?.items.map((i) => i.title)).toEqual(['Song']);
    const lists = node('Playlists', { children: [node('Mix', { can_play: true, media_class: 'playlist' })] });
    expect(shelfOf(lists, 'p', art)).toMatchObject({ kind: 'playlists', items: [{ title: 'Mix', kind: 'playlist', on: ['p'] }] });
  });

  it('remembers what played if HA can start it again', () => {
    let list = noteRecent([], { state: 'playing', attributes: { media_content_id: 'a', media_title: 'A', media_content_type: 'music' } }, 'sonos', 1);
    list = noteRecent(list, { state: 'playing', attributes: { media_title: 'No id' } }, 'apple_tv', 2);
    list = noteRecent(list, { state: 'paused', attributes: { media_content_id: 'b', media_title: 'B' } }, 'sonos', 3);
    expect(list.map((r) => r.title)).toEqual(['A']);
    const players = livePlayers(ctx([ent('media_player.s', 'idle', {})], [reg('media_player.s', 'sonos')]));
    expect(recentShelf(list, players, art)?.items[0]).toMatchObject({ title: 'A', on: ['media_player.s'] });
  });
});
