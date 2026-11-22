/**
 * Named Media states for the Widget Design Studio, built with the real model builder. The covers
 * are simple abstract SVGs made here (no real album art), so the colour-from-art idea is visible.
 */
import type { ResolvedEntity } from '@/types';
import { buildMediaOverviewModel, type ProMediaOverviewModel } from '../../../lib/overviewMedia';
import type { WidgetState } from '../../../studio/types';

const cover = (a: string, b: string, c: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="140" cy="62" r="38" fill="${c}" opacity="0.9"/><path d="M0 150 Q60 110 120 150 T200 140 V200 H0Z" fill="${c}" opacity="0.45"/></svg>`
  )}`;

const SUNSET = cover('#ff7a59', '#7b2ff7', '#ffd166');
const OCEAN = cover('#0f4c75', '#3fc1c9', '#f5f5f5');
const FOREST = cover('#1b4332', '#95d5b2', '#f4a261');

const player = (id: string, name: string, area: string, state: string, attrs: Record<string, unknown> = {}) =>
  ({
    entity_id: `media_player.${id}`,
    domain: 'media_player',
    name,
    state,
    area_name: area,
    attributes: { friendly_name: name, supported_features: 152463, volume_level: 0.4, media_position_updated_at: new Date().toISOString(), ...attrs }
  }) as unknown as ResolvedEntity;

const build = (entities: ResolvedEntity[]) => buildMediaOverviewModel({ mediaEntities: entities, isDemo: true });

const song = (title: string, artist: string, art: string, position = 64) => ({ media_title: title, media_artist: artist, media_duration: 212, media_position: position, entity_picture: art });

export const MEDIA_STATES: WidgetState<ProMediaOverviewModel>[] = [
  { id: 'playing', label: 'Playing', model: build([player('living', 'Living Room Speaker', 'Living Room', 'playing', song('Velvet Skyline', 'Klara Sol', SUNSET))]) },
  { id: 'paused', label: 'Paused', model: build([player('kitchen', 'Kitchen Speaker', 'Kitchen', 'paused', song('Tidal Rooms', 'The Harbour Set', OCEAN, 150))]) },
  {
    id: 'long',
    label: 'Long title',
    model: build([
      player('office', 'Office Speaker', 'Office', 'playing', song('A Very Long Song Title That Keeps Going (Extended Live Session)', 'Several Artists Featuring Many Others', FOREST, 20))
    ])
  },
  {
    id: 'noart',
    label: 'No cover',
    model: build([player('tv', 'Bedroom TV', 'Bedroom', 'playing', { media_title: 'Evening News', media_artist: 'Channel 4', media_duration: 1800, media_position: 600 })])
  },
  { id: 'idle', label: 'Nothing playing', model: build([player('living', 'Living Room Speaker', 'Living Room', 'idle'), player('tv', 'Bedroom TV', 'Bedroom', 'off')]) }
];
